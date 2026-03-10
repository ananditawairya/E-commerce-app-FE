import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles';

/**
 * Range selector for analytics timeline.
 * @param {{
 *   options: Array<{label: string, value: number}>,
 *   selectedValue: number,
 *   onSelect: (value: number) => void,
 * }} props Component props.
 * @return {React.JSX.Element} Range selector.
 */
export default function AnalyticsRangeSelector({
  options,
  selectedValue,
  onSelect,
}) {
  return (
    <View style={styles.rangeRow}>
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.rangeChip, isActive && styles.rangeChipActive]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.9}
          >
            <Text style={[styles.rangeText, isActive && styles.rangeTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
