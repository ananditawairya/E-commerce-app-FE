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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductHorizontalList from '../../components/ProductHorizontalList';
import theme from '../../theme/theme';

/**
 * Formats a numeric price as currency.
 * @param {number} value Price value.
 * @return {string} Formatted price.
 */
const formatCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Resolves the best description for a selected variant.
 * Falls back to product description when variant description is empty.
 * @param {object|null|undefined} variant Variant object.
 * @param {object} product Product object.
 * @return {string} Display description.
 */
const getVariantDisplayDescription = (variant, product) => {
  if (!variant || typeof variant !== 'object') {
    return typeof product?.description === 'string' ? product.description : '';
  }

  const candidate = [
    variant.effectiveDescription,
    variant.description,
    product?.description,
  ].find((value) => typeof value === 'string' && value.trim().length > 0);

  return candidate || '';
};

/**
 * Normalizes backend stock-validation messages for buyer-friendly alerts.
 * @param {string} message Raw backend message.
 * @return {string} Short display message.
 */
const toStockValidationMessage = (message) => {
  if (typeof message !== 'string' || !message.trim()) {
    return 'Stock is limited for this item. Please adjust quantity.';
  }

  const remainingMatch = message.match(/add up to\s*(\d+)\s*more/i);
  if (remainingMatch?.[1]) {
    const remaining = Number.parseInt(remainingMatch[1], 10);
    if (remaining === 0) {
      return 'This variant is already at maximum quantity in your cart.';
    }

    const unitLabel = remaining === 1 ? 'unit' : 'units';
    return `You can add only ${remaining} more ${unitLabel} for this variant.`;
  }

  const availableMatch = message.match(/available:\s*(\d+)/i);
  if (availableMatch?.[1]) {
    const available = Number.parseInt(availableMatch[1], 10);
    if (available === 0) {
      return 'This variant is currently out of stock.';
    }

    const unitLabel = available === 1 ? 'unit' : 'units';
    return `Only ${available} ${unitLabel} available right now.`;
  }

  return 'Stock is limited for this item. Please adjust quantity.';
};

/**
 * Product detail screen.
 * @param {{route: {params: {product: object}}, navigation: object}} props Screen props.
 * @return {React.JSX.Element} Product detail UI.
 */
const ProductDetailScreen = ({ route, navigation, isGuest, onSignIn }) => {
  const insets = useSafeAreaInsets();
  const { product } = route.params;
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userId, setUserId] = useState(null);
  const shouldFetchCart = !isGuest && Boolean(userId);

  /**
   * Navigates back when possible, otherwise routes to buyer products tab.
   * @return {void} No return value.
   */
  const navigateBackOrHome = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('BuyerHome', {
      screen: 'Products',
    });
  };

  const { data: allProductsData } = useQuery(GET_PRODUCTS, {
    variables: { limit: 100 },
  });

  const { data: similarData, loading: similarLoading } = useQuery(GET_SIMILAR_PRODUCTS, {
    variables: { productId: product.id, limit: 10 },
    skip: isGuest,
  });
  const { data: cartData } = useQuery(GET_MY_CART, {
    skip: !shouldFetchCart,
    fetchPolicy: 'cache-and-network',
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
      if (isGuest) {
        setUserId(null);
        return;
      }

      const [storedUserId, storedToken] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('accessToken'),
      ]);
      const hasToken = typeof storedToken === 'string' && storedToken.trim().length > 0;

      if (!storedUserId || !hasToken) {
        setUserId(null);
        return;
      }

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
  }, [isGuest, product.category, product.id, trackEvent]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [addToCart, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_MY_CART }],
    onCompleted: () => {
      Alert.alert('Success', 'Product added to cart!');
      navigateBackOrHome();
    },
    onError: async (error) => {
      const message = error?.message || 'Failed to add product to cart';
      const isStockValidationError = /insufficient stock|cannot add \d+ units|you already have \d+ in cart|you can add up to \d+ more units?/i.test(message);
      if (!isStockValidationError) {
        console.error('Add to cart error:', error);
      }

      if (message.includes('Authentication failed') || message.includes('Unauthorized')) {
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
      } else if (isStockValidationError) {
        Alert.alert('Stock Limit Reached', toStockValidationMessage(message));
      } else {
        Alert.alert('Error', message);
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

  const selectedDescription = getVariantDisplayDescription(selectedVariant, product);
  const selectedVariantStock = Number.isFinite(selectedVariant?.stock)
    ? Math.max(0, selectedVariant.stock)
    : null;
  const existingCartQuantity = React.useMemo(() => {
    const items = cartData?.myCart?.items;
    if (!Array.isArray(items) || !product?.id) {
      return 0;
    }

    const targetProductId = String(product.id);
    const targetVariantId = selectedVariant?.id ? String(selectedVariant.id) : null;

    return items.reduce((total, item) => {
      if (!item || String(item.productId) !== targetProductId) {
        return total;
      }

      const itemVariantId = item.variantId ? String(item.variantId) : null;
      if (itemVariantId !== targetVariantId) {
        return total;
      }

      const itemQuantity = Number.parseInt(item.quantity, 10);
      return total + (Number.isFinite(itemQuantity) ? Math.max(0, itemQuantity) : 0);
    }, 0);
  }, [cartData?.myCart?.items, product?.id, selectedVariant?.id]);
  const remainingAddableStock = Number.isFinite(selectedVariantStock)
    ? Math.max(0, selectedVariantStock - existingCartQuantity)
    : null;
  const isMaxedInCart = Number.isFinite(remainingAddableStock)
    && remainingAddableStock === 0
    && existingCartQuantity > 0;
  const canIncreaseQuantity = !Number.isFinite(remainingAddableStock)
    || quantity < remainingAddableStock;

  React.useEffect(() => {
    if (
      Number.isFinite(remainingAddableStock)
      && remainingAddableStock > 0
      && quantity > remainingAddableStock
    ) {
      setQuantity(remainingAddableStock);
    }
  }, [remainingAddableStock, quantity]);

  /**
   * Checks whether out of stock.
   * @return {boolean} Whether the condition is met.
   */
  const isOutOfStock = () => {
    if (selectedVariant && Number.isFinite(selectedVariantStock)) {
      return selectedVariantStock === 0;
    }
    return false;
  };

  const handleAddToCart = async () => {
    let resolvedUserId = userId;

    try {
      const rawToken = await AsyncStorage.getItem('accessToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      const hasToken = typeof rawToken === 'string' && rawToken.trim().length > 0;

      if (!hasToken || !storedUserId || isGuest) {
        Alert.alert(
          'Please Log In',
          'You need to be logged in to add items to cart.',
          [
            {
              text: 'OK',
              onPress: isGuest ? onSignIn : resetToLogin,
            },
          ]
        );
        return;
      }

      resolvedUserId = storedUserId;
      if (storedUserId !== userId) {
        setUserId(storedUserId);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      Alert.alert('Error', 'Failed to verify authentication');
      return;
    }

    if (!product || !product.id) {
      Alert.alert('Error', 'Invalid product data');
      return;
    }

    if (Number.isFinite(remainingAddableStock) && remainingAddableStock <= 0) {
      Alert.alert(
        'Stock Limit Reached',
        'All available stock for this variant is already in your cart.'
      );
      return;
    }

    if (Number.isFinite(remainingAddableStock) && quantity > remainingAddableStock) {
      const unitLabel = remainingAddableStock === 1 ? 'unit' : 'units';
      Alert.alert(
        'Stock Limit Reached',
        `You can add up to ${remainingAddableStock} more ${unitLabel} for this variant.`
      );
      if (remainingAddableStock > 0) {
        setQuantity(remainingAddableStock);
      }
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

    const addResult = await addToCart({ variables });
    if (addResult?.errors?.length) {
      return;
    }

    if (resolvedUserId) {
      trackEvent({
        variables: {
          userId: resolvedUserId,
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={navigateBackOrHome}
            style={styles.topBarBackButton}
            accessibilityLabel="Go back to products"
          >
            <MaterialIcons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.topBarTextBlock}>
            <Text style={styles.topBarTitle}>Product Details</Text>
            <Text style={styles.topBarSubtitle} numberOfLines={1}>
              {product.category || 'Catalog item'}
            </Text>
          </View>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.mediaCard}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[currentImageIndex] }}
              style={styles.mainImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="image" size={80} color="#ccc" />
            </View>
          )}
        </View>

        {product.images && product.images.length > 1 && (
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

        <View style={styles.content}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{product.category}</Text>
          </View>
          <Text
            style={styles.price}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {formatCurrency(calculatePrice())}
          </Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{selectedDescription}</Text>

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
                  style={[
                    styles.quantityButton,
                    !canIncreaseQuantity && styles.quantityButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!canIncreaseQuantity) {
                      return;
                    }

                    const nextQuantity = quantity + 1;
                    if (Number.isFinite(remainingAddableStock)) {
                      setQuantity(Math.min(remainingAddableStock, nextQuantity));
                      return;
                    }

                    setQuantity(nextQuantity);
                  }}
                  disabled={!canIncreaseQuantity}
                >
                  <MaterialIcons
                    name="add"
                    size={20}
                    color={!canIncreaseQuantity ? '#94A3B8' : '#2563EB'}
                  />
                </TouchableOpacity>
              </View>
              {Number.isFinite(remainingAddableStock) && existingCartQuantity > 0 && (
                <Text style={styles.stockHint}>
                  {isMaxedInCart
                    ? 'All available stock for this variant is already in your cart.'
                    : `In cart: ${existingCartQuantity}. You can add ${remainingAddableStock} more.`}
                </Text>
              )}
            </View>
          )}

          {isOutOfStock() ? (
            <View style={styles.outOfStockButton}>
              <MaterialIcons name="block" size={20} color="#fff" />
              <Text style={styles.outOfStockButtonText}>Out of Stock</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                (loading || isMaxedInCart) && styles.addToCartButtonDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={loading || isMaxedInCart}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addToCartText}>
                  {isGuest ? 'Sign In to Add to Cart' : (isMaxedInCart ? 'Max Quantity In Cart' : 'Add to Cart')}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {similarData?.getSimilarProducts && (
            <ProductHorizontalList
              title="Similar Products"
              products={similarData.getSimilarProducts.map(rec => {
                const enriched = allProductsData?.products?.find(p => p.id === rec.productId);
                if (!enriched) {
                  return null;
                }

                return {
                  ...enriched,
                  productId: rec.productId || enriched.id,
                  score: rec.score,
                  reason: rec.reason,
                  category: enriched.category || rec.category || null,
                };
              }).filter(p => p !== null)}
              onProductPress={(p) => navigation.push('ProductDetail', { product: p })}
              loading={similarLoading}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  topBarBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topBarTextBlock: {
    flex: 1,
    marginLeft: 10,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  topBarSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  topBarSpacer: {
    width: 44,
  },
  mediaCard: {
    marginHorizontal: 16,
    marginTop: 6,
    height: 330,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
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
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 18,
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
  variantDescription: {
    marginBottom: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  variantDescriptionOutOfStock: {
    color: '#9CA3AF',
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
  quantityButtonDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  stockHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#475569',
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
  addToCartButtonDisabled: {
    backgroundColor: '#94A3B8',
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
