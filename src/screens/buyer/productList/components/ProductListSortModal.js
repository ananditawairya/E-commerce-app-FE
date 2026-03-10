import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SORT_OPTIONS } from '../constants';
import styles from '../styles';

/**
 * Sort selection bottom sheet.
 * @param {{
 *   debouncedSearch: string,
 *   onClose: () => void,
 *   onSelectSort: (value: string) => void,
 *   selectedSort: string,
 *   visible: boolean,
 * }} props Component props.
 * @return {React.JSX.Element} Sort modal UI.
 */
export default function ProductListSortModal({
  debouncedSearch,
  onClose,
  onSelectSort,
  selectedSort,
  visible,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.sortSheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sort by</Text>
          {SORT_OPTIONS.map((option) => {
            const isDisabled = option.value === 'RELEVANCE' && !debouncedSearch;
            const isSelected = selectedSort === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sheetOptionRow,
                  isDisabled && styles.sheetOptionDisabled,
                ]}
                onPress={() => {
                  if (isDisabled) {
                    return;
                  }
                  onSelectSort(option.value);
                }}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.sheetOptionLabel,
                    isDisabled && styles.sheetOptionLabelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <MaterialIcons name="check" size={20} color="#1D4ED8" />
                )}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
