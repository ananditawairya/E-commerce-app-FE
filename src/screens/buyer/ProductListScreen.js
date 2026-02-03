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

  React.useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  const { data, loading, refetch } = useQuery(GET_PRODUCTS, {
    variables: { search, category: selectedCategory || null, limit: 100 },
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
      onPress={() => setSelectedCategory(selectedCategory === item ? '' : item)}
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
            <MaterialIcons name="logout" size={24} color="#007AFF" />
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
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={data?.products || []}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            onRefresh={refetch}
            refreshing={loading}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="shopping-bag" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No products found</Text>
              </View>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoriesList: {
    maxHeight: 60,
    marginBottom: 5,
  },
  categoriesContent: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  productsGrid: {
    padding: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    maxWidth: '48%',
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  mainProductCard: {
    flex: 1,
    margin: 5,
    maxWidth: '48%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default ProductListScreen;