import {
  DEFAULT_MAX_X_LABELS,
  LONG_RANGE_MAX_X_LABELS,
} from './constants';

/**
 * Coerces mixed numeric payloads into finite numbers.
 * Supports numbers, numeric strings, and Mongo decimal objects.
 * @param {unknown} value Numeric-like value.
 * @return {number} Finite numeric value.
 */
export function toFiniteNumber(value) {
  if (Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object') {
    if ('$numberDecimal' in value) {
      const parsed = Number(value.$numberDecimal);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const asString = typeof value.toString === 'function'
      ? value.toString()
      : '';
    const parsed = Number(asString);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

/**
 * Formats numeric value as USD.
 * @param {number} value Numeric value.
 * @return {string} Currency label.
 */
export function formatCurrency(value) {
  const safeValue = toFiniteNumber(value);
  return `$${safeValue.toFixed(2)}`;
}

/**
 * Formats percentage value with zero decimals.
 * @param {number} value Numeric value.
 * @return {string} Percent label.
 */
export function formatPercent(value) {
  const safeValue = toFiniteNumber(value);
  return `${Math.round(safeValue)}%`;
}

/**
 * Formats ISO date into MM-DD.
 * @param {string} value Date value.
 * @return {string} Formatted date label.
 */
export function formatShortDate(value) {
  if (typeof value !== 'string' || value.length < 10) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value.slice(5, 10);
  }

  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsedDate.getDate()}`.padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * Compresses x-axis labels to avoid overlap.
 * @param {string[]} labels Raw labels.
 * @param {number} maxVisibleLabels Maximum visible labels.
 * @return {string[]} Sparse label list.
 */
export function makeSparseLabels(labels, maxVisibleLabels) {
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }

  if (labels.length <= maxVisibleLabels) {
    return labels;
  }

  const step = Math.ceil((labels.length - 1) / (maxVisibleLabels - 1));
  return labels.map((label, index) => {
    if (index === 0 || index === labels.length - 1 || index % step === 0) {
      return label;
    }
    return '';
  });
}

/**
 * Builds trend vectors and sparse labels for chart rendering.
 * @param {Array<{date: string, revenue: number, orders: number}>} trend Trend payload.
 * @return {{
 *   labels: string[],
 *   revenue: number[],
 *   orders: number[],
 * }} Chart vectors.
 */
export function buildTrendData(trend) {
  const safeTrend = Array.isArray(trend) ? trend : [];
  const labels = safeTrend.map((point) => formatShortDate(point.date));
  const revenue = safeTrend.map((point) => toFiniteNumber(point.revenue));
  const orders = safeTrend.map((point) => toFiniteNumber(point.orders));
  const maxVisibleLabels = labels.length > 40
    ? LONG_RANGE_MAX_X_LABELS
    : DEFAULT_MAX_X_LABELS;

  return {
    labels: makeSparseLabels(labels, maxVisibleLabels),
    revenue,
    orders,
  };
}

/**
 * Creates normalized status entries.
 * @param {Array<{status: string, count: number}>} entries Raw status entries.
 * @param {number} totalOrders Total order count.
 * @return {Array<{key: string, label: string, count: number, percentage: number}>}
 *     Status list.
 */
export function buildStatusBreakdown(entries, totalOrders) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeTotal = Math.max(0, toFiniteNumber(totalOrders));

  return safeEntries
    .map((entry) => {
      const count = Math.max(0, toFiniteNumber(entry.count));
      const rawStatus = typeof entry.status === 'string' ? entry.status : 'unknown';
      const key = rawStatus.toLowerCase();

      return {
        key,
        label: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1),
        count,
        percentage: safeTotal > 0 ? (count / safeTotal) * 100 : 0,
      };
    })
    .sort((left, right) => right.count - left.count);
}

/**
 * Calculates delivered/completed ratio.
 * @param {Array<{status: string, count: number}>} entries Raw status entries.
 * @param {number} totalOrders Total orders.
 * @return {number} Completion percent.
 */
export function getCompletionRate(entries, totalOrders) {
  const safeTotal = Math.max(0, toFiniteNumber(totalOrders));
  if (!safeTotal) {
    return 0;
  }

  const completedCount = (Array.isArray(entries) ? entries : [])
    .filter((entry) => typeof entry.status === 'string')
    .filter((entry) => ['delivered', 'completed'].includes(entry.status.toLowerCase()))
    .reduce((sum, entry) => sum + toFiniteNumber(entry.count), 0);

  return (completedCount / safeTotal) * 100;
}
