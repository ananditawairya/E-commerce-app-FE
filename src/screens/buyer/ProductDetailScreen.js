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
      console.error('Add to cart error:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
      
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
                  onPress: () => {
                    AsyncStorage.clear();
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
                await AsyncStorage.clear();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to add product to cart');
      }
    },
  });

  // CHANGE: Use effectivePrice from variant if available, otherwise calculate
  const calculatePrice = () => {
    if (!selectedVariant) return product.basePrice;
    
    // CHANGE: Use effectivePrice from backend if available
    if (selectedVariant.effectivePrice !== undefined) {
      return selectedVariant.effectivePrice;
    }
    
    // Fallback to manual calculation
    return product.basePrice + (selectedVariant.priceModifier || 0);
  };

  // CHANGE: Get effective images for display (variant images or product images)
  const getDisplayImages = () => {
    if (selectedVariant && selectedVariant.effectiveImages && selectedVariant.effectiveImages.length > 0) {
      return selectedVariant.effectiveImages;
    }
    
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    
    return product.images || [];
  };

  // CHANGE: Get effective description (variant description or product description)
  const getDisplayDescription = () => {
    if (selectedVariant && selectedVariant.effectiveDescription) {
      return selectedVariant.effectiveDescription;
    }
    
    if (selectedVariant && selectedVariant.description) {
      return selectedVariant.description;
    }
    
    // CHANGE: Use formattedDescription if available
    return product.formattedDescription || product.description;
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
      variantId: selectedVariant?.id ? String(selectedVariant.id) : null,
      quantity: parseInt(quantity, 10),
      price: parseFloat(price.toFixed(2)),
    };

    console.log('Adding to cart with variables:', variables);

    addToCart({ variables });
  };

  // CHANGE: Get display images and reset index when variant changes
  const displayImages = getDisplayImages();
  const displayDescription = getDisplayDescription();

  // CHANGE: Reset image index when variant changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedVariant?.id]);

  return (
    <ScrollView style={styles.container}>
      {displayImages && displayImages.length > 0 ? (
        <View>
          <Image
            source={{ uri: displayImages[currentImageIndex] }}
            style={styles.mainImage}
            // CHANGE: Add error handling for image loading
            onError={(error) => {
              console.error('Image load error:', error.nativeEvent.error);
            }}
          />
          {displayImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {displayImages.map((_, index) => (
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
        {/* CHANGE: Display formatted description with proper line breaks */}
        <Text style={styles.description}>{displayDescription}</Text>

        {product.variants && product.variants.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Variant</Text>
            {product.variants.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[
                  styles.variantCard,
                  selectedVariant?.id === variant.id && styles.variantCardActive,
                ]}
                onPress={() => setSelectedVariant(variant)}
              >
                <View style={styles.variantInfo}>
                  <Text style={styles.variantName}>{variant.name}</Text>
                  <Text style={styles.variantStock}>Stock: {variant.stock}</Text>
                  {/* CHANGE: Show variant-specific image count if available */}
                  {variant.images && variant.images.length > 0 && (
                    <Text style={styles.variantImageCount}>
                      {variant.images.length} image{variant.images.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <Text style={styles.variantPrice}>
                  {/* CHANGE: Use effectivePrice if available */}
                  ${(variant.effectivePrice !== undefined 
                    ? variant.effectivePrice 
                    : product.basePrice + (variant.priceModifier || 0)
                  ).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

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
              // CHANGE: Disable if exceeds stock
              disabled={selectedVariant && quantity >= selectedVariant.stock}
            >
              <MaterialIcons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={loading || (selectedVariant && selectedVariant.stock === 0)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>
              {selectedVariant && selectedVariant.stock === 0
                ? 'Out of Stock'
                : 'Add to Cart'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // CHANGE: Add header back button style
  headerBackButton: {
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 10,
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
  },
  variantCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
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
  variantStock: {
    fontSize: 12,
    color: '#666',
  },
  // CHANGE: Added style for variant image count display
  variantImageCount: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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
});

export default ProductDetailScreen;