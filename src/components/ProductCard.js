import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ProductCard = ({ product, onPress, style }) => {
    return (
        <TouchableOpacity
            style={[styles.productCard, style]}
            onPress={() => onPress(product)}
        >
            {product.images && product.images.length > 0 ? (
                <Image source={{ uri: product.images[0] }} style={styles.productImage} />
            ) : (
                <View style={styles.placeholderImage}>
                    <MaterialIcons name="image" size={50} color="#ccc" />
                </View>
            )}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productPrice}>${product.basePrice?.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    productImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
});

export default ProductCard;
