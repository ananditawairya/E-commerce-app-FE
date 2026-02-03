import React, { useState, useEffect } from 'react';
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
import { GET_PRODUCTS, GET_CATEGORIES } from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

const ProductListScreen = ({ navigation, onLogout }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [semanticResults, setSemanticResults] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PRODUCTS, {
    variables: { search, category: selectedCategory || null, limit: 20 },
    skip: useSemanticSearch && search.length > 0,
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  // CHANGE: Debounced semantic search
  useEffect(() => {
    if (useSemanticSearch && search.length > 0) {
      const debounce = setTimeout(() => {
        handleSemanticSearch();
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setSemanticResults(null);
    }
  }, [search, useSemanticSearch]);

  const handleSemanticSearch = async () => {
    if (!search || search.trim().length === 0) {
      setSemanticResults(null);
      return;
    }

    setSemanticLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/ai/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: search,
          limit: 20,
          threshold: 0.3,
        }),
      });

      const data = await response.json();
      setSemanticResults(data.results || []);
    } catch (error) {
      console.error('Semantic search error:', error);
      Alert.alert('Error', 'Semantic search failed. Using regular search.');
      setUseSemanticSearch(false);
    } finally {
      setSemanticLoading(false);
    }
  };

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

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      {item.images && item.images.length > 0 ? (
        <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialIcons name="image" size={50} color="#ccc" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>${item.basePrice.toFixed(2)}</Text>
        {useSemanticSearch && item.score && (
          <Text style={styles.scoreText}>Match: {(item.score * 100).toFixed(0)}%</Text>
        )}
      </View>
    </TouchableOpacity>
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

  const displayData = useSemanticSearch && semanticResults
    ? semanticResults
    : data?.products || [];

  const isLoading = useSemanticSearch ? semanticLoading : loading;

  return (
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
          placeholder={useSemanticSearch ? "Try: 'red summer dress'" : "Search products..."}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setUseSemanticSearch(!useSemanticSearch)}
          style={styles.aiToggle}
        >
          <Ionicons
            name={useSemanticSearch ? "sparkles" : "sparkles-outline"}
            size={20}
            color={useSemanticSearch ? "#007AFF" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {useSemanticSearch && (
        <View style={styles.semanticIndicator}>
          <Ionicons name="sparkles" size={14} color="#007AFF" />
          <Text style={styles.semanticText}>AI-powered search active</Text>
        </View>
      )}

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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id || item.productId}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          onRefresh={refetch}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="shopping-bag" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {useSemanticSearch ? 'No matching products found' : 'No products found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  aiToggle: {
    marginLeft: 10,
    padding: 5,
  },
  semanticIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  semanticText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  categoriesList: {
    maxHeight: 50,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
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
  scoreText: {
    fontSize: 11,
    color: '#28a745',
    marginTop: 4,
    fontWeight: '500',
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