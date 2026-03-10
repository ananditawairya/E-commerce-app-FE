import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MY_CART } from '../../graphql/queries';
import { UPDATE_CART_ITEM, REMOVE_FROM_CART, TRACK_EVENT } from '../../graphql/mutations';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme/theme';

const ROUTES = {
  CHECKOUT: 'Checkout',
  PRODUCTS: 'Products',
};

/**
 * Parses available stock from backend error messages.
 * @param {string} message Error message.
 * @return {number|null} Parsed stock value.
 */
const extractAvailableStock = (message) => {
  if (typeof message !== 'string') {
    return null;
  }

  const match = message.match(/Available:\s*(\d+)/i);
  if (!match?.[1]) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Buyer cart screen.
 * @param {{navigation: object}} props Screen props.
 * @return {React.JSX.Element} Cart UI with checkout actions.
 */
const CartScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [userId, setUserId] = React.useState(null);

  React.useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    getUserId();
  }, []);

  const { data, loading, refetch } = useQuery(GET_MY_CART);

  const [updateCartItem] = useMutation(UPDATE_CART_ITEM, {
    refetchQueries: [{ query: GET_MY_CART }],
  });

  const [removeFromCart] = useMutation(REMOVE_FROM_CART, {
    refetchQueries: [{ query: GET_MY_CART }],
  });

  const [trackEvent] = useMutation(TRACK_EVENT);

  /**
   * Handles update quantity.
   * @param {{
   *   productId: string,
   *   variantId: string|null|undefined,
   *   newQuantity: number,
   *   currentQuantity: number,
   *   availableStock: number|null,
   *   productName: string,
   * }} params Quantity update payload.
   * @return {Promise<void>} Completion promise.
   */
  const handleUpdateQuantity = async ({
    productId,
    variantId,
    newQuantity,
    currentQuantity,
    availableStock,
    productName,
  }) => {
    if (newQuantity < 0) {
      return;
    }

    if (
      Number.isFinite(availableStock)
      && newQuantity > currentQuantity
      && newQuantity > availableStock
    ) {
      return;
    }

    if (newQuantity === 0) {
      handleRemoveItem(productId, variantId);
      return;
    }

    try {
      await updateCartItem({
        variables: { productId, variantId, quantity: newQuantity },
      });
    } catch (error) {
      const message = error?.message || 'Failed to update cart item';
      if (/insufficient stock/i.test(message)) {
        const parsedAvailable = extractAvailableStock(message);
        const isOutOfStock = parsedAvailable === 0;
        await refetch();
        Alert.alert(
          'Stock Updated',
          isOutOfStock
            ? `${productName || 'This item'} is out of stock. Please remove it from your cart.`
            : `${productName || 'This item'} now has limited stock.`
              + ` Available: ${Number.isFinite(parsedAvailable) ? parsedAvailable : 'latest quantity'}.`
              + ' Please reduce quantity.'
        );
        return;
      }

      Alert.alert('Error', message);
    }
  };

  /**
   * Handles remove item.
   * @param {string} productId Product identifier.
   * @param {string} variantId Variant identifier.
   * @return {void} No return value.
   */
  const handleRemoveItem = (productId, variantId) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFromCart({ variables: { productId, variantId } });

          // Track cart_remove event
          if (userId) {
            trackEvent({
              variables: {
                userId,
                productId,
                eventType: 'cart_remove',
                metadata: JSON.stringify({ variantId })
              }
            }).catch((trackingError) => {
              console.error('Tracking error (cart_remove):', trackingError);
            });
          }
        },
      },
    ]);
  };

  /**
   * Handles navigate to products.
   * @return {void} No return value.
   */
  const handleNavigateToProducts = () => {
    navigation.navigate(ROUTES.PRODUCTS);
  };

  /**
   * Handles navigate to checkout.
   * @return {void} No return value.
   */
  const handleNavigateToCheckout = () => {
    navigation.navigate(ROUTES.CHECKOUT);
  };

  /**
   * Renders cart item.
   * @param {object} params Callback parameters.
   * @return {React.JSX.Element} Rendered element.
   */
  const renderCartItem = ({ item }) => {
    const availableStock = Number.isFinite(item.availableStock)
      ? Math.max(0, item.availableStock)
      : null;
    const canIncrease = availableStock === null || item.quantity < availableStock;
    const quantityExceedsStock = availableStock !== null && item.quantity > availableStock;
    const stockWarningText = availableStock === 0
      ? 'Out of stock. Please remove this item from cart.'
      : `Stock changed. Reduce quantity to ${availableStock} or less.`;

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.productName}</Text>
          {item.variantId && (
            <Text style={styles.itemVariant}>Variant: {item.variantName}</Text>
          )}
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          {quantityExceedsStock && (
            <Text style={styles.stockWarning}>
              {stockWarningText}
            </Text>
          )}
        </View>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => {
              handleUpdateQuantity({
                productId: item.productId,
                variantId: item.variantId,
                newQuantity: item.quantity - 1,
                currentQuantity: item.quantity,
                availableStock,
                productName: item.productName,
              });
            }}
          >
            <MaterialIcons name="remove" size={18} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              !canIncrease && styles.quantityButtonDisabled,
            ]}
            onPress={() => {
              handleUpdateQuantity({
                productId: item.productId,
                variantId: item.variantId,
                newQuantity: item.quantity + 1,
                currentQuantity: item.quantity,
                availableStock,
                productName: item.productName,
              });
            }}
            disabled={!canIncrease}
          >
            <MaterialIcons
              name="add"
              size={18}
              color={!canIncrease ? '#94A3B8' : '#2563EB'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item.productId, item.variantId)}
          style={styles.removeButton}
        >
          <MaterialIcons name="delete" size={24} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const cart = data?.myCart;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="inventory-2" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your shopping cart is empty</Text>
          <Text style={styles.emptyText}>Add products to continue checkout.</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={handleNavigateToProducts}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => `${item.productId}-${item.variantId || 'default'}`}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: tabBarHeight + insets.bottom + 18 },
            ]}
            onRefresh={refetch}
            refreshing={loading}
          />

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 12) + 10 },
            ]}
          >
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${cart.totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleNavigateToCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 26,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
  },
  shopButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  stockWarning: {
    marginTop: 4,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  quantityButtonDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 5,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  checkoutButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CartScreen;
