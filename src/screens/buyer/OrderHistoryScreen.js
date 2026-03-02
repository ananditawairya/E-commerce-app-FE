import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { MaterialIcons } from '@expo/vector-icons';
import { GET_MY_ORDERS } from '../../graphql/queries';

const OrderHistoryScreen = ({ navigation }) => {
    const { data, loading, error, refetch } = useQuery(GET_MY_ORDERS, {
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        pollInterval: 5000,
    });

    const orders = data?.myOrders || [];

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return '#059669';
            case 'cancelled':
                return '#DC2626';
            case 'shipped':
                return '#2563EB';
            case 'confirmed':
                return '#D97706';
            default:
                return '#6B7280';
        }
    };

    const renderOrderItem = ({ item }) => {
        const createdAtNumeric = Number(item.createdAt);
        const createdAt = Number.isNaN(createdAtNumeric)
            ? new Date(item.createdAt)
            : new Date(createdAtNumeric);
        const createdAtLabel = Number.isNaN(createdAt.getTime())
            ? 'Date unavailable'
            : createdAt.toLocaleDateString();

        return (
            <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>Order #{item.orderId.substring(0, 8)}</Text>
                    <Text style={styles.orderDate}>
                        {createdAtLabel}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemsList}>
                {item.items.map((orderItem, index) => (
                    <View key={index} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {orderItem.productName}
                                {orderItem.variantName ? ` (${orderItem.variantName})` : ''}
                            </Text>
                            <Text style={styles.itemDetail}>
                                Qty: {orderItem.quantity} × ${orderItem.price.toFixed(2)}
                            </Text>
                        </View>
                        <Text style={styles.itemTotal}>
                            ${(orderItem.quantity * orderItem.price).toFixed(2)}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
                <View style={styles.totalInfo}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>${item.totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {/* Navigation to detailed order view if needed */ }}
                >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && orders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>Failed to load orders</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="shopping-bag" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptySubtitle}>When you buy something, it will appear here.</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Products')}
                    >
                        <Text style={styles.shopButtonText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    onRefresh={refetch}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    orderDate: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    itemsList: {
        marginBottom: 4,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    itemDetail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalInfo: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    detailsButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    detailsButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    errorText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 15,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginVertical: 8,
    },
    shopButton: {
        marginTop: 24,
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default OrderHistoryScreen;
