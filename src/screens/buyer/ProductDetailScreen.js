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
import { useMutation, useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADD_TO_CART, TRACK_EVENT } from '../../graphql/mutations';
import { GET_MY_CART, GET_SIMILAR_PRODUCTS, GET_PRODUCTS } from '../../graphql/queries';
import { MaterialIcons } from '@expo/vector-icons';
import ProductHorizontalList from '../../components/ProductHorizontalList';

/**
 * Product detail screen.
 * @param {{route: {params: {product: object}}, navigation: object}} props Screen props.
 * @return {React.JSX.Element} Product detail UI.
 */
const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userId, setUserId] = useState(null);

  const { data: allProductsData } = useQuery(GET_PRODUCTS, {
    variables: { limit: 100 },
  });

  const { data: similarData, loading: similarLoading } = useQuery(GET_SIMILAR_PRODUCTS, {
    variables: { productId: product.id, limit: 10 },
  });

  const [trackEvent] = useMutation(TRACK_EVENT);
  /**
   * Resets to login.
   * @return {void} No return value.
   */
  const resetToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  React.useEffect(() => {
    const init = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);

      if (storedUserId) {
        trackEvent({
          variables: {
            userId: storedUserId,
            productId: product.id,
            eventType: 'view',
            category: product.category,
          }
        }).catch((trackingError) => {
          console.error('Tracking error:', trackingError);
        });
      }
    };
    init();
  }, [product.id]);

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
          <MaterialIcons name="arrow-back" size={24} color="#2563EB" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#F7F7F8',
      },
      headerTitleStyle: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
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
                    await AsyncStorage.clear();
                    resetToLogin();
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
                try {
                  await AsyncStorage.clear();
                  resetToLogin();
                } catch (clearError) {
                  console.error('Error clearing storage:', clearError);
                  resetToLogin();
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

  /**
   * Handles calculate price.
   * @return {number} Computed numeric value.
   */
  const calculatePrice = () => {
    if (!selectedVariant) return product.basePrice;
    return product.basePrice + selectedVariant.priceModifier;
  };

  /**
   * Checks whether out of stock.
   * @return {boolean} Whether the condition is met.
   */
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
              onPress: resetToLogin,
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

    if (userId) {
      trackEvent({
        variables: {
          userId,
          productId: product.id,
          eventType: 'cart_add',
          category: product.category,
          metadata: JSON.stringify({ variantId: selectedVariant?.id, quantity })
        }
      }).catch((trackingError) => {
        console.error('Tracking error (cart_add):', trackingError);
      });
    }
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
                <MaterialIcons name="remove" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialIcons name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {similarData?.getSimilarProducts && (
          <ProductHorizontalList
            title="Similar Products"
            products={similarData.getSimilarProducts.map(rec => {
              const enriched = allProductsData?.products?.find(p => p.id === rec.productId);
              return enriched ? { ...enriched, ...rec } : null;
            }).filter(p => p !== null)}
            onProductPress={(p) => navigation.push('ProductDetail', { product: p })}
            loading={similarLoading}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  headerBackButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
    borderRadius: 18,
    marginTop: 12,
    marginHorizontal: 16,
  },
  placeholderImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginTop: 12,
    marginHorizontal: 16,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#2563EB',
  },
  content: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  variantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  variantCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
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
    color: '#111827',
    marginBottom: 4,
  },
  variantNameOutOfStock: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  variantStock: {
    fontSize: 12,
    color: '#6B7280',
  },
  outOfStockText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
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
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  outOfStockContainer: {
    marginTop: 20,
    marginBottom: 10,
    padding: 30,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  outOfStockMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 15,
    textAlign: 'center',
  },
  outOfStockSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
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
  outOfStockButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
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
