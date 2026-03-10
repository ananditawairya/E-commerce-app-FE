import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GET_SELLER_ANALYTICS } from '../../graphql/queries';
import theme from '../../theme/theme';
import { RANGE_OPTIONS } from './analytics/constants';
import AnalyticsMetricCards from './analytics/components/AnalyticsMetricCards';
import AnalyticsRangeSelector from './analytics/components/AnalyticsRangeSelector';
import AnalyticsStatusBreakdown from './analytics/components/AnalyticsStatusBreakdown';
import AnalyticsTrendChartCard from './analytics/components/AnalyticsTrendChartCard';
import styles from './analytics/styles';
import {
  buildStatusBreakdown,
  buildTrendData,
  formatCurrency,
  formatPercent,
  getCompletionRate,
} from './analytics/utils';

/**
 * Seller analytics screen.
 * @return {React.JSX.Element} Analytics dashboard.
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
    notifyOnNetworkStatusChange: true,
    skip: hasSellerAccess !== true,
  });

  const analytics = data?.sellerAnalytics || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    ordersByStatus: [],
    trend: [],
  };

  const trendData = useMemo(
    () => buildTrendData(analytics.trend),
    [analytics.trend]
  );

  const statusBreakdown = useMemo(
    () => buildStatusBreakdown(analytics.ordersByStatus, analytics.totalOrders),
    [analytics.ordersByStatus, analytics.totalOrders]
  );

  const completionRate = useMemo(
    () => getCompletionRate(analytics.ordersByStatus, analytics.totalOrders),
    [analytics.ordersByStatus, analytics.totalOrders]
  );

  const metricItems = useMemo(() => ([
    { label: 'Revenue', value: formatCurrency(analytics.totalRevenue) },
    { label: 'Orders', value: String(analytics.totalOrders || 0) },
    { label: 'Avg Order', value: formatCurrency(analytics.averageOrderValue) },
    { label: 'Completion', value: formatPercent(completionRate) },
  ]), [
    analytics.totalRevenue,
    analytics.totalOrders,
    analytics.averageOrderValue,
    completionRate,
  ]);

  useEffect(() => {
    if (!__DEV__ || !data?.sellerAnalytics) {
      return;
    }

    const sample = Array.isArray(data.sellerAnalytics.trend)
      ? data.sellerAnalytics.trend.slice(-4)
      : [];
    console.log('📈 sellerAnalytics payload', {
      days,
      totalRevenue: data.sellerAnalytics.totalRevenue,
      totalOrders: data.sellerAnalytics.totalOrders,
      trendTail: sample,
    });
  }, [data, days]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + insets.bottom + 18 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>
            Revenue and order trends for your selected range
          </Text>
          <AnalyticsRangeSelector
            options={RANGE_OPTIONS}
            selectedValue={days}
            onSelect={setDays}
          />
        </View>

        {hasSellerAccess === null || (loading && !data?.sellerAnalytics) ? (
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
            <AnalyticsMetricCards items={metricItems} />
            <AnalyticsStatusBreakdown statuses={statusBreakdown} />

            <AnalyticsTrendChartCard
              title="Revenue Trend"
              labels={trendData.labels}
              data={trendData.revenue}
              yAxisLabel="$"
            />

            <AnalyticsTrendChartCard
              title="Orders Trend"
              labels={trendData.labels}
              data={trendData.orders}
              asBar={days === 7}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
