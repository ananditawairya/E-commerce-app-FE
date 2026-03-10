import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme/theme';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

/**
 * Resolves the current step index for a given order status.
 * @param {string} status Current order status.
 * @return {number} Current status index.
 */
function getStatusIndex(status) {
  const normalizedStatus = (status || '').toLowerCase();
  const index = STATUS_STEPS.indexOf(normalizedStatus);
  return index >= 0 ? index : 0;
}

/**
 * Buyer order detail screen.
 * @param {{
 *   navigation: object,
 *   route: {params?: {order?: object}},
 * }} props Screen props.
 * @return {React.JSX.Element} Order detail UI.
 */
export default function OrderDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order;

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}>
          <MaterialIcons name="receipt-long" size={56} color={theme.colors.textMuted} />
          <Text style={styles.centerTitle}>Order details unavailable</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusIndex = getStatusIndex(order.status);
  const shippingAddress = order.shippingAddress || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order #{String(order.orderId).slice(0, 8)}</Text>
        </View>

        <View style={styles.progressRow}>
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= statusIndex;
            const isLast = index === STATUS_STEPS.length - 1;
            return (
              <React.Fragment key={step}>
                <View style={[styles.progressNode, isCompleted && styles.progressNodeActive]}>
                  <Text style={[styles.progressNodeText, isCompleted && styles.progressNodeTextActive]}>
                    {index + 1}
                  </Text>
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.progressConnector,
                      index < statusIndex && styles.progressConnectorActive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Placed</Text>
          <Text style={styles.progressLabel}>Confirm</Text>
          <Text style={styles.progressLabel}>Shipped</Text>
          <Text style={styles.progressLabel}>Delivered</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="place" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Address</Text>
          </View>
          <Text style={styles.sectionText}>{shippingAddress.street}</Text>
          <Text style={styles.sectionText}>
            {shippingAddress.city}, {shippingAddress.state}
          </Text>
          <Text style={styles.sectionText}>
            {shippingAddress.country} {shippingAddress.zipCode}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="inventory-2" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Products</Text>
          </View>
          {(order.items || []).map((item, index) => (
            <View key={`${item.productId}-${index}`} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.variantName ? (
                  <Text style={styles.itemMeta}>{item.variantName}</Text>
                ) : null}
                <Text style={styles.itemMeta}>
                  Qty: {item.quantity} x ${Number(item.price).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${Number(order.totalAmount).toFixed(2)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  centerTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.typography.h3,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressNode: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressNodeActive: {
    backgroundColor: '#FACC15',
    borderColor: '#FACC15',
  },
  progressNodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  progressNodeTextActive: {
    color: '#6B4F00',
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  progressConnectorActive: {
    backgroundColor: '#FACC15',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: 6,
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 22,
  },
  sectionText: {
    ...theme.typography.body,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemMeta: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  totalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
});
