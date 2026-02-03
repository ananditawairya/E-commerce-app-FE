import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADD_TO_CART } from '../../graphql/mutations';
import { GET_MY_CART } from '../../graphql/queries';
import { MaterialIcons } from '@expo/vector-icons';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // CHANGE: Set navigation header options with back button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Product Details',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          accessibilityLabel="Go back to products"
        >
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTitleStyle: {
        color: '#333',
        fontSize: 18,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  const [addToCart, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_MY_CART }],
    onCompleted: () => {
      Alert.alert('Success', 'Product added to cart!');
      navigation.goBack();
    },
    onError: async (error) => {
      console.error('Add to cart error:', error);
      
      if (error.message.includes('Authentication failed') || error.message.includes('Unauthorized')) {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          const userId = await AsyncStorage.getItem('userId');
          
          console.log('Auth error - Token check:', {
            hasToken: !!token,
            hasUserId: !!userId,
            tokenLength: token?.length || 0
          });
          
          if (!token || !userId) {
            Alert.alert(
              'Session Expired',
              'Please log in again to continue.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    // CHANGE: Clear storage and reset navigation properly
                    await AsyncStorage.clear();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  },
                },
              ]
            );
            return;
          }
        } catch (storageError) {
          console.error('Storage check error:', storageError);
        }
        
        Alert.alert(
          'Authentication Error',
          'There was a problem with your session. Please try logging out and back in.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout',
              onPress: async () => {
                // CHANGE: Properly clear storage and reset navigation to login
                try {
                  await AsyncStorage.clear();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                } catch (clearError) {
                  console.error('Error clearing storage:', clearError);
                  // CHANGE: Force navigation even if storage clear fails
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to add product to cart');
      }
    },
  });

  const calculatePrice = () => {
    if (!selectedVariant) return product.basePrice;
    return product.basePrice + selectedVariant.priceModifier;
  };

  // CHANGE: Check if selected variant or product is out of stock
  const isOutOfStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock === 0;
    }
    return false;
  };

  const handleAddToCart = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        Alert.alert(
          'Please Log In',
          'You need to be logged in to add items to cart.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
            },
          ]
        );
        return;
      }
      
      console.log('Add to cart - Auth check passed:', {
        hasToken: !!token,
        hasUserId: !!userId
      });
    } catch (error) {
      console.error('Auth verification error:', error);
      Alert.alert('Error', 'Failed to verify authentication');
      return;
    }

    if (!product || !product.id) {
      Alert.alert('Error', 'Invalid product data');
      return;
    }

    if (selectedVariant && selectedVariant.stock < quantity) {
      Alert.alert('Error', 'Not enough stock available');
      return;
    }

    const price = calculatePrice();
    
    const variables = {
      productId: String(product.id),
      productName: product.name,
      variantId: selectedVariant?.id ? String(selectedVariant.id) : null,
      variantName: selectedVariant?.name || null,
      quantity: parseInt(quantity, 10),
      price: parseFloat(price.toFixed(2)),
    };

    console.log('Adding to cart with variables:', variables);

    addToCart({ variables });
  };

  return (
    <ScrollView style={styles.container}>
      {product.images && product.images.length > 0 ? (
        <View>
          <Image
            source={{ uri: product.images[currentImageIndex] }}
            style={styles.mainImage}
          />
          {product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.indicatorActive,
                  ]}
                  onPress={() => setCurrentImageIndex(index)}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialIcons name="image" size={80} color="#ccc" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.price}>${calculatePrice().toFixed(2)}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>

        {product.variants && product.variants.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Variant</Text>
            {product.variants.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[
                  styles.variantCard,
                  selectedVariant?.id === variant.id && styles.variantCardActive,
                  variant.stock === 0 && styles.variantCardOutOfStock,
                ]}
                onPress={() => {
                  setSelectedVariant(variant);
                  setQuantity(1);
                }}
                disabled={variant.stock === 0}
              >
                <View style={styles.variantInfo}>
                  <Text style={[
                    styles.variantName,
                    variant.stock === 0 && styles.variantNameOutOfStock
                  ]}>
                    {variant.name}
                  </Text>
                  <Text style={[
                    styles.variantStock,
                    variant.stock === 0 && styles.outOfStockText
                  ]}>
                    {variant.stock === 0 ? 'Out of Stock' : `Stock: ${variant.stock}`}
                  </Text>
                </View>
                <Text style={[
                  styles.variantPrice,
                  variant.stock === 0 && styles.variantPriceOutOfStock
                ]}>
                  {variant.priceModifier >= 0 ? '+' : ''}
                  ${variant.priceModifier.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* CHANGE: Conditionally render quantity controls or out of stock message */}
        {isOutOfStock() ? (
          <View style={styles.outOfStockContainer}>
            <MaterialIcons name="inventory-2" size={48} color="#ff3b30" />
            <Text style={styles.outOfStockMessage}>This item is currently out of stock</Text>
            <Text style={styles.outOfStockSubtext}>Please check back later or select a different variant</Text>
          </View>
        ) : (
          <View style={styles.quantityContainer}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <MaterialIcons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialIcons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CHANGE: Show different button based on stock availability */}
        {isOutOfStock() ? (
          <View style={styles.outOfStockButton}>
            <MaterialIcons name="block" size={20} color="#fff" />
            <Text style={styles.outOfStockButtonText}>Out of Stock</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addToCartText}>Add to Cart</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  variantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  variantCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  // CHANGE: Add styling for out of stock variants
  variantCardOutOfStock: {
    borderColor: '#ffcccc',
    backgroundColor: '#fff5f5',
    opacity: 0.7,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  // CHANGE: Add styling for out of stock variant name
  variantNameOutOfStock: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  variantStock: {
    fontSize: 12,
    color: '#666',
  },
  // CHANGE: Add styling for out of stock text
  outOfStockText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  // CHANGE: Add styling for out of stock variant price
  variantPriceOutOfStock: {
    color: '#999',
  },
  quantityContainer: {
    marginTop: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  // CHANGE: Add out of stock container styling
  outOfStockContainer: {
    marginTop: 20,
    marginBottom: 10,
    padding: 30,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcccc',
    alignItems: 'center',
  },
  outOfStockMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
    marginTop: 15,
    textAlign: 'center',
  },
  outOfStockSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // CHANGE: Add out of stock button styling
  outOfStockButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
  },
  outOfStockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;