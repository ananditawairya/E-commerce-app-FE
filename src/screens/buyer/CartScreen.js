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

const ROUTES = {
  CHECKOUT: 'Checkout',
  PRODUCTS: 'Products',
};

/**
 * Buyer cart screen.
 * @param {{navigation: object}} props Screen props.
 * @return {React.JSX.Element} Cart UI with checkout actions.
 */
const CartScreen = ({ navigation }) => {
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
   * @param {string} productId Product identifier.
   * @param {string} variantId Variant identifier.
   * @param {number} newQuantity New quantity value.
   * @return {void} No return value.
   */
  const handleUpdateQuantity = (productId, variantId, newQuantity) => {
    if (newQuantity === 0) {
      handleRemoveItem(productId, variantId);
      return;
    }

    updateCartItem({
      variables: { productId, variantId, quantity: newQuantity },
    });
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
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.productName}</Text>
        {item.variantId && (
          <Text style={styles.itemVariant}>Variant: {item.variantName}</Text>
        )}
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)
          }
        >
          <MaterialIcons name="remove" size={18} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)
          }
        >
          <MaterialIcons name="add" size={18} color="#2563EB" />
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const cart = data?.myCart;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
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
            contentContainerStyle={styles.list}
            onRefresh={refetch}
            refreshing={loading}
          />

          <View style={styles.footer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
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
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
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
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#fff',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EB',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  checkoutButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;
