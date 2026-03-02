import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import styles from '../styles';

/**
 * Reusable image grid with add/remove actions.
 * @param {{
 *   addButtonSmall?: boolean,
 *   addLabel: string,
 *   images: string[],
 *   onAddImage: () => void,
 *   onRemoveImage: (index: number) => void,
 *   removeAccessibilityLabel: (index: number) => string,
 * }} props Component props.
 * @return {React.JSX.Element} Image picker grid UI.
 */
export default function ImagePickerGrid({
  addButtonSmall = false,
  addLabel,
  images,
  onAddImage,
  onRemoveImage,
  removeAccessibilityLabel,
}) {
  return (
    <View style={styles.imagesContainer}>
      {images.map((uri, index) => (
        <View key={`${uri.substring(0, 20)}-${index}`} style={styles.imageWrapper}>
          <Image source={{ uri }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => onRemoveImage(index)}
            accessibilityRole="button"
            accessibilityLabel={removeAccessibilityLabel(index)}
          >
            <MaterialIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={addButtonSmall ? styles.addImageButtonSmall : styles.addImageButton}
        onPress={onAddImage}
        accessibilityRole="button"
        accessibilityLabel={addLabel}
      >
        <MaterialIcons
          name="add-photo-alternate"
          size={addButtonSmall ? 30 : 40}
          color="#2563EB"
        />
        {!addButtonSmall && <Text style={styles.addImageText}>Add Images</Text>}
      </TouchableOpacity>
    </View>
  );
}
