import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import ProductCard from './ProductCard';

const ProductHorizontalList = ({ title, products, onProductPress, loading }) => {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.title}>{title}</Text>
                <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 10 }} />
            </View>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    const renderItem = ({ item }) => (
        <ProductCard
            product={item}
            onPress={onProductPress}
            style={styles.card}
        />
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item.id || item.productId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 18,
    },
    loadingContainer: {
        marginVertical: 18,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        paddingHorizontal: 20,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    listContent: {
        paddingHorizontal: 14,
        paddingBottom: 10, // Added padding for shadows
    },
    card: {
        width: 180,
        marginHorizontal: 8,
    },
});

export default ProductHorizontalList;
