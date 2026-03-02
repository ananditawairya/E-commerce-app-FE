import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useQuery } from '@apollo/client';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { GET_SELLER_ANALYTICS } from '../../graphql/queries';

const chartWidth = Dimensions.get('window').width - 40;

const rangeOptions = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

const formatCurrency = (value) => {
  return `$${value.toFixed(2)}`;
};

const AnalyticsScreen = () => {
  const [days, setDays] = useState(7);

  const { data, loading, error, refetch } = useQuery(GET_SELLER_ANALYTICS, {
    variables: { days },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    pollInterval: 5000,
    notifyOnNetworkStatusChange: true,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.rangeRow}>
          {rangeOptions.map((opt) => (
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

      {loading && !analytics ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
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
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: () => '#6B7280',
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
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: () => '#6B7280',
              }}
              style={styles.chart}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
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
    color: '#111827',
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  rangeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  rangeText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#fff',
  },
  loading: {
    marginTop: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorDetails: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
});

export default AnalyticsScreen;
