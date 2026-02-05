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
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    productImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 14,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        lineHeight: 20,
    },
    productCategory: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
});

export default ProductCard;
