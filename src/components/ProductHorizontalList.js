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
                <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />
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
        marginVertical: 15,
    },
    loadingContainer: {
        marginVertical: 15,
        paddingHorizontal: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    listContent: {
        paddingHorizontal: 10,
    },
    card: {
        width: 160,
        marginHorizontal: 5,
    },
});

export default ProductHorizontalList;
