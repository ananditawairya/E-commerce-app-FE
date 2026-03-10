import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import ImagePickerGrid from './ImagePickerGrid';
import styles from '../styles';

/**
 * Variant editor card for add/edit product form.
 * @param {{
 *   index: number,
 *   onPickVariantImages: (index: number) => void,
 *   onRemoveVariant: (index: number) => void,
 *   onRemoveVariantImage: (variantIndex: number, imageIndex: number) => void,
 *   onVariantChange: (index: number, field: string, value: string) => void,
 *   totalVariants: number,
 *   variant: object,
 * }} props Component props.
 * @return {React.JSX.Element} Variant editor UI.
 */
export default function VariantEditorCard({
  index,
  onPickVariantImages,
  onRemoveVariant,
  onRemoveVariantImage,
  onVariantChange,
  totalVariants,
  variant,
}) {
  return (
    <View style={styles.variantCard}>
      <View style={styles.variantHeader}>
        <Text style={styles.variantTitle}>Variant {index + 1}</Text>
        {totalVariants > 1 && (
          <TouchableOpacity
            onPress={() => onRemoveVariant(index)}
            accessibilityRole="button"
            accessibilityLabel={`Remove variant ${index + 1}`}
          >
            <MaterialIcons name="close" size={24} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Variant Name (e.g., Size: L) *"
        value={variant.name}
        onChangeText={(text) => onVariantChange(index, 'name', text)}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Variant Description (optional - inherits product description if empty)"
        value={variant.description}
        onChangeText={(text) => onVariantChange(index, 'description', text)}
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={styles.input}
        placeholder="Price Modifier (default: 0)"
        value={variant.priceModifier?.toString()}
        onChangeText={(text) => onVariantChange(index, 'priceModifier', text)}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Stock (default: 0) *"
        value={variant.stock?.toString()}
        onChangeText={(text) => onVariantChange(index, 'stock', text)}
        keyboardType="number-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="SKU (optional - auto-generated if empty)"
        value={variant.sku}
        onChangeText={(text) => onVariantChange(index, 'sku', text)}
      />

      <Text style={styles.variantImageLabel}>
        Variant Images (optional - inherits product images if empty)
      </Text>

      <ImagePickerGrid
        images={variant.images || []}
        onRemoveImage={(imageIndex) => onRemoveVariantImage(index, imageIndex)}
        onAddImage={() => onPickVariantImages(index)}
        removeAccessibilityLabel={(imageIndex) => `Remove variant image ${imageIndex + 1}`}
        addLabel={`Add images to variant ${index + 1}`}
        addButtonSmall
      />
    </View>
  );
}
