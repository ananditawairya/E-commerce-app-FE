import React from 'react';
import { Text, View } from 'react-native';

import ProductHorizontalList from '../../../../components/ProductHorizontalList';
import styles from '../styles';

/**
 * Discovery header with recommended/trending rows and result count.
 * @param {{
 *   isDiscoveryMode: boolean,
 *   loading: boolean,
 *   onProductPress: (product: object) => void,
 *   productsCount: number,
 *   recLoading: boolean,
 *   recommendedProducts: Array<object>,
 *   trendingLoading: boolean,
 *   trendingProducts: Array<object>,
 * }} props Component props.
 * @return {React.JSX.Element} Discovery header UI.
 */
export default function ProductListDiscoveryHeader({
  isDiscoveryMode,
  loading,
  onProductPress,
  productsCount,
  recLoading,
  recommendedProducts,
  trendingLoading,
  trendingProducts,
}) {
  return (
    <View>
      {isDiscoveryMode && recommendedProducts.length > 0 && (
        <ProductHorizontalList
          title="Recommended for You"
          products={recommendedProducts}
          onProductPress={onProductPress}
          loading={recLoading}
        />
      )}

      {isDiscoveryMode && trendingProducts.length > 0 && (
        <ProductHorizontalList
          title="Trending Now"
          products={trendingProducts}
          onProductPress={onProductPress}
          loading={trendingLoading}
        />
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Explore Catalog</Text>
        <Text style={styles.resultsCount}>
          {loading && productsCount === 0
            ? 'Loading products...'
            : `${productsCount} items`}
        </Text>
      </View>
    </View>
  );
}
