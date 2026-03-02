import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { GET_SELLER_ANALYTICS } from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme/theme';

const chartWidth = Dimensions.get('window').width - 40;

const RANGE_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

/**
 * Formats a numeric value as currency.
 * @param {number} value Numeric amount.
 * @return {string} Formatted currency string.
 */
const formatCurrency = (value) => `$${value.toFixed(2)}`;

/**
 * Seller analytics screen.
 * @return {React.JSX.Element} Analytics charts and summary stats.
 */
const AnalyticsScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [days, setDays] = useState(7);
  const [hasSellerAccess, setHasSellerAccess] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadUserRole = async () => {
      try {
        const userRole = await AsyncStorage.getItem('userRole');
        if (isMounted) {
          setHasSellerAccess(userRole === 'seller');
        }
      } catch (error) {
        if (isMounted) {
          setHasSellerAccess(false);
        }
      }
    };

    loadUserRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const { data, loading, error, refetch } = useQuery(GET_SELLER_ANALYTICS, {
    variables: { days },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    pollInterval: 5000,
    notifyOnNetworkStatusChange: true,
    skip: hasSellerAccess !== true,
  });

  const analytics = data?.sellerAnalytics;

  const chartData = useMemo(() => {
    const trend = analytics?.trend || [];
    const labels = trend.map((t) => t.date.slice(5));
    const revenue = trend.map((t) => t.revenue);
    const orders = trend.map((t) => t.orders);
    return { labels, revenue, orders };
  }, [analytics]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + insets.bottom + 20 },
        ]}
      >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.rangeChip, days === opt.value && styles.rangeChipActive]}
              onPress={() => {
                setDays(opt.value);
                refetch({ days: opt.value });
              }}
            >
              <Text style={[styles.rangeText, days === opt.value && styles.rangeTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {hasSellerAccess === null || (loading && !analytics) ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : hasSellerAccess === false ? (
        <View style={styles.loading}>
          <Text style={styles.errorText}>Seller access required</Text>
        </View>
      ) : error ? (
        <View style={styles.loading}>
          <Text style={styles.errorText}>Failed to load analytics</Text>
          <Text style={styles.errorDetails}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch({ days })}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>{formatCurrency(analytics?.totalRevenue || 0)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{analytics?.totalOrders || 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Order</Text>
              <Text style={styles.statValue}>{formatCurrency(analytics?.averageOrderValue || 0)}</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.revenue }],
              }}
              width={chartWidth}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 69, 211, ${opacity})`,
                labelColor: () => theme.colors.textSecondary,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#2563EB',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Orders Trend</Text>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.orders }],
              }}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 69, 211, ${opacity})`,
                labelColor: () => theme.colors.textSecondary,
              }}
              style={styles.chart}
            />
          </View>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rangeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rangeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  rangeTextActive: {
    color: theme.colors.surface,
  },
  loading: {
    marginTop: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  errorDetails: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
});

export default AnalyticsScreen;
