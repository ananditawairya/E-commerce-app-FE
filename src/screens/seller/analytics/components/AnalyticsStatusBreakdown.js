import React from 'react';
import { Text, View } from 'react-native';
import styles from '../styles';
import { formatPercent } from '../utils';

/**
 * Status distribution block.
 * @param {{
 *   statuses: Array<{key: string, label: string, count: number, percentage: number}>,
 * }} props Component props.
 * @return {React.JSX.Element|null} Status section.
 */
export default function AnalyticsStatusBreakdown({ statuses }) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return null;
  }

  return (
    <View style={styles.statusCard}>
      <Text style={styles.sectionTitle}>Order Status Mix</Text>
      <View style={styles.statusList}>
        {statuses.map((status) => (
          <View key={status.key} style={styles.statusRow}>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusLabel}>{status.label}</Text>
              <Text style={styles.statusCount}>{status.count}</Text>
            </View>
            <View style={styles.statusBarTrack}>
              <View
                style={[
                  styles.statusBarFill,
                  { width: `${Math.max(4, Math.min(100, status.percentage))}%` },
                ]}
              />
            </View>
            <Text style={styles.statusPercent}>
              {formatPercent(status.percentage)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
