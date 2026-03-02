import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Formats a price value as USD currency.
 * @param {number} value Numeric price value.
 * @return {string} Formatted currency string.
 */
const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00';
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Builds inventory badge text and color styles from variant stock.
 * @param {object} product Product object with optional variants.
 * @return {{label: string, textColor: string, backgroundColor: string}} Badge metadata.
 */
const getInventoryBadge = (product) => {
  const totalStock = (product?.variants || []).reduce((sum, variant) => {
    return sum + (typeof variant.stock === 'number' ? variant.stock : 0);
  }, 0);

  if (totalStock <= 0) {
    return {
      label: 'Out of stock',
      textColor: '#B91C1C',
      backgroundColor: '#FEE2E2',
    };
  }

  if (totalStock <= 5) {
    return {
      label: `Only ${totalStock} left`,
      textColor: '#B45309',
      backgroundColor: '#FEF3C7',
    };
  }

  return {
    label: 'In stock',
    textColor: '#166534',
    backgroundColor: '#DCFCE7',
  };
};

/**
 * Displays product summary card.
 * @param {{
 *   product: object,
 *   onPress: (product: object) => void,
 *   style?: object|Array<object>,
 * }} props Component props.
 * @return {React.JSX.Element} Product card UI.
 */
const ProductCard = ({ product, onPress, style }) => {
  const [imageError, setImageError] = useState(false);
  const inventoryBadge = getInventoryBadge(product);

  return (
    <TouchableOpacity
      style={[styles.productCard, style]}
      onPress={() => onPress(product)}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        {product.images && product.images.length > 0 && !imageError ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={44} color="#D1D5DB" />
          </View>
        )}
        <View style={[styles.stockBadge, { backgroundColor: inventoryBadge.backgroundColor }]}>
          <Text style={[styles.stockBadgeText, { color: inventoryBadge.textColor }]}>
            {inventoryBadge.label}
          </Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productCategory}>{product.category}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.productPrice}>{formatCurrency(product.basePrice)}</Text>
          <View style={styles.detailsPill}>
            <Text style={styles.detailsText}>Details</Text>
            <MaterialIcons name="arrow-forward" size={14} color="#1D4ED8" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bottomRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  detailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  detailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    marginRight: 2,
  },
});

export default ProductCard;
