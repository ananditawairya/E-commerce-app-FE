import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import ProductCard from './ProductCard';

/**
 * Renders a horizontal list of products.
 * @param {{
 *   title: string,
 *   products: Array<object>,
 *   onProductPress: (product: object) => void,
 *   loading: boolean,
 * }} props Component props.
 * @return {React.JSX.Element|null} List UI or null when no products.
 */
const ProductHorizontalList = ({ title, products, onProductPress, loading }) => {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.title}>{title}</Text>
                <ActivityIndicator
                    size="small"
                    color="#2563EB"
                    style={styles.loadingIndicator}
                />
            </View>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    /**
     * Renders item.
     * @param {object} params Callback parameters.
     * @return {React.JSX.Element} Rendered element.
     */
    const renderItem = useCallback(({ item }) => (
        <ProductCard
            product={item}
            onPress={onProductPress}
            style={styles.card}
        />
    ), [onProductPress]);

    const keyExtractor = useCallback((item) => item.id || item.productId, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews
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
    loadingIndicator: {
        marginTop: 10,
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
        paddingBottom: 10,
    },
    card: {
        width: 180,
        marginHorizontal: 8,
    },
});

export default React.memo(ProductHorizontalList);
