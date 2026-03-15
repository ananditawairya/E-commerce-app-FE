import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NetworkStatus, useQuery, useMutation } from '@apollo/client';
import { useIsFocused } from '@react-navigation/native';
import { GET_SELLER_PRODUCTS } from '../../graphql/queries';
import { DELETE_PRODUCT } from '../../graphql/mutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme/theme';

/**
 * Seller product list screen.
 * @param {{
 *   navigation: object,
 *   onLogout?: () => Promise<void>,
 * }} props Screen props.
 * @return {React.JSX.Element} Seller product management UI.
 */
const SellerProductsScreen = ({ navigation, onLogout }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const wasFocusedRef = useRef(false);
  const hasSeenInitialFocusRef = useRef(false);
  const [hasSellerAccess, setHasSellerAccess] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadUserRole = async () => {
      try {
        const userRole = await AsyncStorage.getItem('userRole');
        if (isMounted) {
          setHasSellerAccess(userRole === 'seller');
        }
      } catch (error) {
        if (isMounted) {
          setHasSellerAccess(false);
        }
      }
    };

    loadUserRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus,
  } = useQuery(GET_SELLER_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'none',
    notifyOnNetworkStatusChange: true,
    skip: hasSellerAccess !== true,
  });

  const sellerProducts = useMemo(
    () => (Array.isArray(data?.sellerProducts) ? data.sellerProducts : []),
    [data?.sellerProducts]
  );
  const isInitialLoading = hasSellerAccess === null || (loading && sellerProducts.length === 0);
  const isRefreshing = hasSellerAccess === true
    && networkStatus === NetworkStatus.refetch;

  const handleRefresh = React.useCallback(async () => {
    if (hasSellerAccess !== true) {
      return;
    }

    try {
      await refetch();
    } catch (refreshError) {
      console.error('Failed to refresh seller products:', refreshError);
    }
  }, [hasSellerAccess, refetch]);

  useEffect(() => {
    if (!isFocused) {
      wasFocusedRef.current = false;
      return;
    }

    if (wasFocusedRef.current) {
      return;
    }

    wasFocusedRef.current = true;

    if (!hasSeenInitialFocusRef.current) {
      hasSeenInitialFocusRef.current = true;
      return;
    }

    if (hasSellerAccess === true) {
      handleRefresh();
    }
  }, [handleRefresh, hasSellerAccess, isFocused]);

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_SELLER_PRODUCTS }],
    onCompleted: () => {
      Alert.alert('Success', 'Product deleted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            if (onLogout) {
              await onLogout();
            } else {
              console.warn('No logout callback provided');
              await AsyncStorage.clear();
            }
          },
        },
      ]
    );
  };

  /**
   * Handles navigate to add product.
   * @return {void} No return value.
   */
  const handleNavigateToAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  /**
   * Handles navigate to edit product.
   * @param {object} product Product object.
   * @return {void} No return value.
   */
  const handleNavigateToEditProduct = (product) => {
    navigation.navigate('AddProduct', { product });
  };

  /**
   * Handles delete.
   * @param {string} id Entity identifier.
   * @param {string} name Display name.
   * @return {void} No return value.
   */
  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteProduct({ variables: { id } }),
      },
    ]);
  };

  /**
   * Renders product.
   * @param {object} params Callback parameters.
   * @return {React.JSX.Element} Rendered element.
   */
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>${item.basePrice.toFixed(2)}</Text>
          <Text style={styles.productStatus}>
            {item.isActive ? '✓ Active' : '✗ Inactive'}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleNavigateToEditProduct(item)}
          >
            <MaterialIcons name="edit" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <MaterialIcons name="delete" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
      {item.variants.length > 0 && (
        <Text style={styles.variantsText}>{item.variants.length} variant(s)</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity
          onPress={handleLogout}
          accessibilityLabel="Logout"
          accessibilityHint="Logout from the application"
        >
          <MaterialIcons name="logout" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : hasSellerAccess === false ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="lock-outline" size={50} color="#EF4444" />
          <Text style={styles.emptyText}>Seller access required</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={50} color="#EF4444" />
          <Text style={styles.emptyText}>Failed to load products</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sellerProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarHeight + insets.bottom + 20 },
          ]}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No products yet</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: tabBarHeight + insets.bottom + 14 },
        ]}
        onPress={handleNavigateToAddProduct}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  productStatus: {
    fontSize: 12,
    color: '#16A34A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    padding: 5,
  },
  variantsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default SellerProductsScreen;
