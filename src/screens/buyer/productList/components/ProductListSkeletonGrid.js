import React from 'react';
import { View } from 'react-native';

import styles from '../styles';

/**
 * Grid placeholder for product loading state.
 * @return {React.JSX.Element} Skeleton cards.
 */
export default function ProductListSkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineMedium} />
        </View>
      ))}
    </View>
  );
}
