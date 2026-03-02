import { StyleSheet } from 'react-native';
import theme from '../../../theme/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 48 / 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  rangeRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rangeChip: {
    minWidth: 74,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  rangeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rangeText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  statusList: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextWrap: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statusCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statusBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E7EDFF',
    overflow: 'hidden',
    marginRight: 10,
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  statusPercent: {
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  chartHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  chartContainer: {
    width: '100%',
    minHeight: 224,
  },
  chart: {
    borderRadius: theme.radius.md,
  },
});

export default styles;
