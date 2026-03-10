import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ALL_CATEGORIES_LABEL, PRICE_OPTIONS } from '../constants';
import styles from '../styles';

/**
 * Filter selection bottom sheet for category, price, and stock availability.
 * @param {{
 *   categoryOptions: string[],
 *   draftCategories: string[],
 *   draftInStockOnly: boolean,
 *   draftPriceKey: string,
 *   onApply: () => void,
 *   onClose: () => void,
 *   onReset: () => void,
 *   onToggleCategory: (value: string) => void,
 *   onSelectPrice: (value: string) => void,
 *   onToggleInStock: (value: boolean) => void,
 *   visible: boolean,
 * }} props Component props.
 * @return {React.JSX.Element} Filter modal UI.
 */
export default function ProductListFilterModal({
  categoryOptions,
  draftCategories,
  draftInStockOnly,
  draftPriceKey,
  onApply,
  onClose,
  onReset,
  onToggleCategory,
  onSelectPrice,
  onToggleInStock,
  visible,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.filterSheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <View style={styles.filterSheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollBody}
          >
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterOptionsWrap}>
              {categoryOptions.map((option) => {
                const isAllCategoriesOption = option === ALL_CATEGORIES_LABEL;
                const isSelected = isAllCategoriesOption
                  ? draftCategories.length === 0
                  : draftCategories.includes(option);

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalFilterChip,
                      isSelected && styles.modalFilterChipSelected,
                    ]}
                    onPress={() => {
                      if (isAllCategoriesOption) {
                        onToggleCategory(ALL_CATEGORIES_LABEL);
                        return;
                      }
                      onToggleCategory(option);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalFilterChipText,
                        isSelected && styles.modalFilterChipTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterSectionTitle}>Price</Text>
            <View style={styles.filterOptionsWrap}>
              {PRICE_OPTIONS.map((option) => {
                const isSelected = draftPriceKey === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalFilterChip,
                      isSelected && styles.modalFilterChipSelected,
                    ]}
                    onPress={() => onSelectPrice(option.key)}
                  >
                    <Text
                      style={[
                        styles.modalFilterChipText,
                        isSelected && styles.modalFilterChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inStockRow}>
              <Text style={styles.inStockLabel}>In-stock only</Text>
              <Switch
                value={draftInStockOnly}
                onValueChange={onToggleInStock}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={draftInStockOnly ? '#1D4ED8' : '#FFFFFF'}
              />
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onReset}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onApply}>
              <Text style={styles.primaryButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
