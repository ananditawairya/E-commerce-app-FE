import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SELLER_ORDERS } from '../../graphql/queries';
import { UPDATE_ORDER_STATUS } from '../../graphql/mutations';
import { MaterialIcons } from '@expo/vector-icons';

const OrdersScreen = () => {
  const { data, loading, refetch } = useQuery(GET_SELLER_ORDERS);

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, {
    refetchQueries: [{ query: GET_SELLER_ORDERS }],
    onCompleted: () => {
      Alert.alert('Success', 'Order status updated');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleStatusChange = (orderId, currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered',
    };

    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) {
      Alert.alert('Info', 'This order is already in final status');
      return;
    }

    updateOrderStatus({ variables: { orderId, status: nextStatus } });
  };

  const renderOrder = ({ item }) => {
    const myItems = item.items.filter((i) => i.sellerId);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={[styles.status, styles[`status_${item.status}`]]}>
            {item.status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.orderDate}>
          {new Date(parseInt(item.createdAt)).toLocaleDateString()}
        </Text>

        {myItems.map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>{orderItem.productName}</Text>
            {orderItem.variantName && (
              <Text style={styles.itemVariant}>{orderItem.variantName}</Text>
            )}
            <Text style={styles.itemQuantity}>Qty: {orderItem.quantity}</Text>
          </View>
        ))}

        <View style={styles.orderFooter}>
          <Text style={styles.totalText}>
            Total: ${item.totalAmount.toFixed(2)}
          </Text>
          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => handleStatusChange(item.id, item.status)}
            >
              <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={data?.sellerOrders || []}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="list-alt" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No orders yet</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status_pending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  status_confirmed: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
  },
  status_shipped: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  status_delivered: {
    backgroundColor: '#c3e6cb',
    color: '#155724',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  orderItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemVariant: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default OrdersScreen;