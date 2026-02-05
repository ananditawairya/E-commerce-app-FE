import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@apollo/client';
import {
  GET_PRODUCTS,
  GET_CATEGORIES,
  GET_RECOMMENDATIONS,
  GET_TRENDING_PRODUCTS
} from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import ProductHorizontalList from '../../components/ProductHorizontalList';
import ProductCard from '../../components/ProductCard';
import ChatBot from '../../components/ChatBot';

// CHANGE: Accept onLogout prop from parent component
const ProductListScreen = ({ navigation, onLogout }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userId, setUserId] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  React.useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  const { data, loading, fetchMore, refetch } = useQuery(GET_PRODUCTS, {
    variables: { search, category: selectedCategory || null, limit: LIMIT, offset: 0 },
    onCompleted: (data) => {
      if (data?.products.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
  });

  const { data: recData, loading: recLoading } = useQuery(GET_RECOMMENDATIONS, {
    variables: { userId, limit: 10 },
    skip: !userId,
  });

  const { data: trendingData, loading: trendingLoading } = useQuery(GET_TRENDING_PRODUCTS, {
    variables: { limit: 10 },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  // CHANGE: Updated logout handler to use callback instead of navigation reset
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
            // CHANGE: Use onLogout callback to trigger authentication state change
            if (onLogout) {
              await onLogout();
            } else {
              // Fallback for cases where callback is not provided
              console.warn('No logout callback provided');
              await AsyncStorage.clear();
            }
          },
        },
      ]
    );
  };

  const getEnrichedProducts = (recommendations) => {
    if (!recommendations || !data?.products) return [];
    return recommendations.map(rec => {
      const product = data.products.find(p => p.id === rec.productId);
      if (product) {
        return { ...product, ...rec };
      }
      return null;
    }).filter(p => p !== null);
  };

  const recommendedProducts = getEnrichedProducts(recData?.getRecommendations);
  const trendingProducts = getEnrichedProducts(trendingData?.getTrendingProducts);

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
      style={styles.mainProductCard}
    />
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item && styles.categoryChipActive,
      ]}
      onPress={() => {
        setSelectedCategory(selectedCategory === item ? '' : item);
        setOffset(0);
        setHasMore(true);
      }}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.categoryTextActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const loadMore = () => {
    if (!hasMore || loading) return;

    const newOffset = offset + LIMIT;
    fetchMore({
      variables: {
        offset: newOffset,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult || fetchMoreResult.products.length === 0) {
          setHasMore(false);
          return prev;
        }
        if (fetchMoreResult.products.length < LIMIT) {
          setHasMore(false);
        }
        return {
          products: [...prev.products, ...fetchMoreResult.products],
        };
      },
    });
    setOffset(newOffset);
  };

  const renderHeader = () => (
    <View>
      {recommendedProducts.length > 0 && !search && (
        <ProductHorizontalList
          title="Recommended for You"
          products={recommendedProducts}
          onProductPress={(p) => navigation.navigate('ProductDetail', { product: p })}
          loading={recLoading}
        />
      )}

      {trendingProducts.length > 0 && !search && (
        <ProductHorizontalList
          title="Trending Now"
          products={trendingProducts}
          onProductPress={(p) => navigation.navigate('ProductDetail', { product: p })}
          loading={trendingLoading}
        />
      )}

      <Text style={styles.sectionTitle}>
        {search ? `Search results for "${search}"` : 'All Products'}
      </Text>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity
            onPress={handleLogout}
            accessibilityLabel="Logout"
            accessibilityHint="Logout from the application"
          >
            <MaterialIcons name="logout" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {categoriesData && categoriesData.categories.length > 0 && (
          <FlatList
            data={categoriesData.categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
            contentContainerStyle={styles.categoriesContent}
            ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={data?.products || []}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            onRefresh={() => {
              setOffset(0);
              setHasMore(true);
              refetch();
            }}
            refreshing={loading && offset === 0}
            ListHeaderComponent={renderHeader}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              loading && offset > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#2563EB" />
                </View>
              ) : null
            )}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="shopping-bag" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No products found</Text>
                </View>
              )
            }
          />
        )}
      </View>

      {/* AI Shopping Assistant */}
      <ChatBot navigation={navigation} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Adjusted for notch
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  categoriesList: {
    maxHeight: 72,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categorySeparator: {
    width: 8,
  },
  productsGrid: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: '48%',
  },
  productImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  mainProductCard: {
    flex: 1,
    margin: 6,
    maxWidth: '48%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 16,
  },
});

export default ProductListScreen;
