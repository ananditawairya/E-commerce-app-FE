import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import theme from '../../../../theme/theme';
import styles from '../styles';

/**
 * Responsive trend chart card.
 * @param {{
 *   asBar?: boolean,
 *   data: number[],
 *   labels: string[],
 *   title: string,
 *   yAxisLabel?: string,
 * }} props Component props.
 * @return {React.JSX.Element} Trend card.
 */
export default function AnalyticsTrendChartCard({
  asBar = false,
  data,
  labels,
  title,
  yAxisLabel = '',
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const chartConfig = useMemo(() => ({
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 69, 211, ${opacity})`,
    labelColor: () => theme.colors.textSecondary,
    propsForBackgroundLines: {
      strokeDasharray: '4 6',
      stroke: '#D9E2FF',
      strokeWidth: 1,
    },
    propsForDots: {
      r: data.length > 18 ? '0' : '3.5',
      strokeWidth: '1.5',
      stroke: theme.colors.primary,
    },
    barPercentage: data.length > 18 ? 0.45 : 0.65,
  }), [data.length]);

  const safeData = Array.isArray(data) && data.length > 0 ? data : [0];
  const safeLabels = Array.isArray(labels) && labels.length > 0 ? labels : [''];
  const hasData = safeData.some((value) => Number(value) > 0);
  const isChartReady = chartWidth > 0;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        {!hasData && <Text style={styles.chartHint}>No activity yet</Text>}
      </View>
      <View
        style={styles.chartContainer}
        onLayout={(event) => {
          const nextWidth = Math.max(0, Math.floor(event.nativeEvent.layout.width));
          setChartWidth(nextWidth);
        }}
      >
        {isChartReady ? (
          asBar ? (
            <BarChart
              data={{
                labels: safeLabels,
                datasets: [{ data: safeData }],
              }}
              width={chartWidth}
              height={220}
              fromZero
              yAxisLabel={yAxisLabel}
              withInnerLines
              showValuesOnTopOfBars={false}
              withHorizontalLabels
              withVerticalLabels
              chartConfig={chartConfig}
              style={styles.chart}
            />
          ) : (
            <LineChart
              data={{
                labels: safeLabels,
                datasets: [{ data: safeData }],
              }}
              width={chartWidth}
              height={220}
              fromZero
              yAxisLabel={yAxisLabel}
              withInnerLines
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines
              withDots={safeData.length <= 18}
              withShadow={false}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          )
        ) : null}
      </View>
    </View>
  );
}
