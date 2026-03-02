import React from 'react';
import { Text, View } from 'react-native';
import styles from '../styles';

/**
 * KPI card grid for analytics.
 * @param {{
 *   items: Array<{label: string, value: string}>,
 * }} props Component props.
 * @return {React.JSX.Element} KPI cards.
 */
export default function AnalyticsMetricCards({ items }) {
  return (
    <View style={styles.statGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
