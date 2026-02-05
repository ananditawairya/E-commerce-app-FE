import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useMutation } from '@apollo/client';
import { CREATE_PRODUCT, UPDATE_PRODUCT } from '../../graphql/mutations';
import { GET_SELLER_PRODUCTS } from '../../graphql/queries';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const AddProductScreen = ({ route, navigation }) => {
  const isEdit = !!route.params?.product;
  const product = route.params?.product;

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || '');
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || '');
  const [images, setImages] = useState(product?.images || []);
  
  // CHANGE: Initialize with at least one variant for new products
  const [variants, setVariants] = useState(
    product?.variants?.map(v => ({
      ...v,
      priceModifier: v.priceModifier || 0,
      stock: v.stock || 0,
      images: v.images || [],
      description: v.description || '',
    })) || [
      // CHANGE: Default variant for new products
      { name: '', description: '', priceModifier: 0, stock: 0, sku: '', images: [] }
    ]
  );

  const [createProduct, { loading: createLoading }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_SELLER_PRODUCTS }],
    onCompleted: () => {
      Alert.alert('Success', 'Product created successfully');
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Create Product Error:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
      Alert.alert('Error', error.message || 'Failed to create product');
    },
  });

  const [updateProduct, { loading: updateLoading }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_SELLER_PRODUCTS }],
    onCompleted: () => {
      Alert.alert('Success', 'Product updated successfully');
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Update Product Error:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
      Alert.alert('Error', error.message || 'Failed to update product');
    },
  });

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Update Product' : 'Add Product',
    });
  }, [navigation, isEdit]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select images.'
        );
      }
    })();
  }, []);

  const pickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  };

  const convertToBase64 = async (fileUri) => {
    try {
      if (!fileUri || typeof fileUri !== 'string') {
        throw new Error('Invalid file URI');
      }

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64 || base64.length === 0) {
        throw new Error('Failed to read file content');
      }

      const extension = fileUri.split('.').pop().toLowerCase();
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  };

  const validateImageUri = (uri) => {
    if (!uri || typeof uri !== 'string') return false;
    
    const isDataUri = uri.startsWith('data:image/');
    const isFileUri = uri.startsWith('file:///');
    
    if (!isDataUri && !isFileUri) return false;
    
    if (isFileUri) {
      const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(uri);
      if (!hasExtension) return false;
    }
    
    if (isDataUri) {
      const parts = uri.split(',');
      if (parts.length !== 2 || !parts[1] || parts[1].length === 0) return false;
    }
    
    return true;
  };

  const handlePickProductImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets) {
        const validUris = result.assets
          .map(a => a.uri)
          .filter(uri => validateImageUri(uri));

        if (validUris.length === 0) {
          Alert.alert('Error', 'No valid images selected');
          return;
        }

        if (validUris.length > 3) {
          Alert.alert('Processing', `Converting ${validUris.length} images...`);
        }

        const base64Images = await Promise.all(
          validUris.map(uri => convertToBase64(uri))
        );

        const validBase64Images = base64Images.filter(img => 
          img && img.startsWith('data:image/')
        );

        if (validBase64Images.length === 0) {
          Alert.alert('Error', 'Failed to process images');
          return;
        }

        setImages(prev => [...prev, ...validBase64Images]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', `Failed to pick images: ${error.message}`);
    }
  };

  const handleRemoveProductImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePickVariantImages = async (variantIndex) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets) {
        const validUris = result.assets
          .map(a => a.uri)
          .filter(uri => validateImageUri(uri));

        if (validUris.length === 0) {
          Alert.alert('Error', 'No valid images selected');
          return;
        }

        const base64Images = await Promise.all(
          validUris.map(uri => convertToBase64(uri))
        );

        const validBase64Images = base64Images.filter(img => 
          img && img.startsWith('data:image/')
        );

        if (validBase64Images.length === 0) {
          Alert.alert('Error', 'Failed to process images');
          return;
        }

        setVariants(prev => {
          const next = [...prev];
          next[variantIndex] = {
            ...next[variantIndex],
            images: [...(next[variantIndex].images || []), ...validBase64Images],
          };
          return next;
        });
      }
    } catch (error) {
      console.error('Variant image picker error:', error);
      Alert.alert('Error', `Failed to pick variant images: ${error.message}`);
    }
  };

  const handleRemoveVariantImage = (variantIndex, imageIndex) => {
    setVariants(prev => {
      const next = [...prev];
      next[variantIndex] = {
        ...next[variantIndex],
        images: next[variantIndex].images.filter((_, i) => i !== imageIndex),
      };
      return next;
    });
  };

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      { name: '', description: '', priceModifier: 0, stock: 0, sku: '', images: [] },
    ]);
  };

  const handleRemoveVariant = (index) => {
    // CHANGE: Prevent removing the last variant
    if (variants.length === 1) {
      Alert.alert(
        'Cannot Remove Variant',
        'At least one variant is required for stock management. You can edit this variant instead.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateInput = () => {
    if (!name || name.trim().length === 0) {
      Alert.alert('Validation Error', 'Product name is required');
      return false;
    }

    if (!description || description.trim().length === 0) {
      Alert.alert('Validation Error', 'Product description is required');
      return false;
    }

    if (!category || category.trim().length === 0) {
      Alert.alert('Validation Error', 'Product category is required');
      return false;
    }

    const price = parseFloat(basePrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation Error', 'Base price must be a positive number');
      return false;
    }

    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one product image');
      return false;
    }

    const invalidImages = images.filter(img => !img.startsWith('data:image/'));
    if (invalidImages.length > 0) {
      Alert.alert('Validation Error', 'Some images are invalid. Please remove and re-add them.');
      return false;
    }

    // CHANGE: Enhanced variant validation with mandatory check
    if (!variants || variants.length === 0) {
      Alert.alert(
        'Validation Error',
        'At least one variant is required for stock management. Please add variant details.'
      );
      return false;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      if (!variant.name || variant.name.trim().length === 0) {
        Alert.alert('Validation Error', `Variant ${i + 1} name is required`);
        return false;
      }

      const stock = parseInt(variant.stock);
      if (isNaN(stock) || stock < 0) {
        Alert.alert('Validation Error', `Variant ${i + 1} stock must be a non-negative number`);
        return false;
      }

      const priceModifier = parseFloat(variant.priceModifier);
      if (isNaN(priceModifier)) {
        Alert.alert('Validation Error', `Variant ${i + 1} price modifier must be a number`);
        return false;
      }

      if (variant.images && variant.images.length > 0) {
        const invalidVariantImages = variant.images.filter(img => !img.startsWith('data:image/'));
        if (invalidVariantImages.length > 0) {
          Alert.alert('Validation Error', `Variant ${i + 1} has invalid images. Please remove and re-add them.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateInput()) {
      return;
    }

    const timestamp = Date.now();
    const productSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);

    const input = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      basePrice: parseFloat(basePrice),
      images: images.filter(img => img && img.startsWith('data:image/')),
      variants: variants.map((v, index) => ({
        name: v.name.trim(),
        description: v.description ? v.description.trim() : '',
        priceModifier: parseFloat(v.priceModifier) || 0,
        stock: parseInt(v.stock) || 0,
        sku: v.sku && v.sku.trim() !== ''
          ? v.sku.trim()
          : `${productSlug}-${timestamp}-${index}`,
        images: (v.images || []).filter(img => img && img.startsWith('data:image/')),
      })),
    };

    console.log('=== PRODUCT SUBMISSION REQUEST ===');
    console.log('Operation:', isEdit ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT');
    console.log('Input Summary:', {
      name: input.name,
      category: input.category,
      basePrice: input.basePrice,
      imageCount: input.images.length,
      variantCount: input.variants.length,
      variants: input.variants.map(v => ({
        name: v.name,
        stock: v.stock,
        priceModifier: v.priceModifier,
        imageCount: v.images.length,
      })),
    });

    if (isEdit) {
      const updateVariables = { id: product.id, input };
      console.log('Update Variables (summary):', {
        id: updateVariables.id,
        inputSummary: {
          name: input.name,
          variantCount: input.variants.length,
        },
      });
      updateProduct({ variables: updateVariables });
    } else {
      const createVariables = { input };
      console.log('Create Variables (summary):', {
        inputSummary: {
          name: input.name,
          variantCount: input.variants.length,
        },
      });
      createProduct({ variables: createVariables });
    }

    console.log('=== END REQUEST ===');
  };

  const loading = createLoading || updateLoading;

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Product Name *"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description *"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TextInput
        style={styles.input}
        placeholder="Category *"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={styles.input}
        placeholder="Base Price *"
        value={basePrice}
        onChangeText={setBasePrice}
        keyboardType="decimal-pad"
      />

      <Text style={styles.sectionTitle}>Product Images *</Text>
      <View style={styles.imagesContainer}>
        {images.map((uri, index) => (
          <View key={`${uri.substring(0, 20)}-${index}`} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => handleRemoveProductImage(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove image ${index + 1}`}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={handlePickProductImages}
          accessibilityRole="button"
          accessibilityLabel="Add images"
        >
        <MaterialIcons name="add-photo-alternate" size={40} color="#2563EB" />
          <Text style={styles.addImageText}>Add Images</Text>
        </TouchableOpacity>
      </View>

      {/* CHANGE: Updated section title and helper text to indicate variants are mandatory */}
      <Text style={styles.sectionTitle}>Variants (Required) *</Text>
      <Text style={styles.helperText}>
        At least one variant is required for stock management. Add variant-specific descriptions and images, or they will inherit from the product.
      </Text>
      {/* CHANGE: Added info box to emphasize mandatory variants */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color="#2563EB" />
        <Text style={styles.infoText}>
          Each variant tracks its own stock. You must have at least one variant to manage inventory.
        </Text>
      </View>

      {variants.map((variant, index) => (
        <View key={index} style={styles.variantCard}>
          <View style={styles.variantHeader}>
            <Text style={styles.variantTitle}>Variant {index + 1}</Text>
            {/* CHANGE: Show remove button only if more than one variant exists */}
            {variants.length > 1 && (
              <TouchableOpacity 
                onPress={() => handleRemoveVariant(index)} 
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
            onChangeText={(text) => handleVariantChange(index, 'name', text)}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Variant Description (optional - inherits product description if empty)"
            value={variant.description}
            onChangeText={(text) => handleVariantChange(index, 'description', text)}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="Price Modifier (default: 0)"
            value={variant.priceModifier?.toString()}
            onChangeText={(text) => handleVariantChange(index, 'priceModifier', text)}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Stock (default: 0) *"
            value={variant.stock?.toString()}
            onChangeText={(text) => handleVariantChange(index, 'stock', text)}
            keyboardType="number-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="SKU (optional - auto-generated if empty)"
            value={variant.sku}
            onChangeText={(text) => handleVariantChange(index, 'sku', text)}
          />

          <Text style={styles.variantImageLabel}>
            Variant Images (optional - inherits product images if empty)
          </Text>
          <View style={styles.imagesContainer}>
            {(variant.images || []).map((uri, imgIndex) => (
              <View key={`${uri.substring(0, 20)}-${imgIndex}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveVariantImage(index, imgIndex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove variant image ${imgIndex + 1}`}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addImageButtonSmall}
              onPress={() => handlePickVariantImages(index)}
              accessibilityRole="button"
              accessibilityLabel={`Add images to variant ${index + 1}`}
            >
              <MaterialIcons name="add-photo-alternate" size={30} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addVariantButton}
        onPress={handleAddVariant}
        accessibilityRole="button"
        accessibilityLabel="Add variant"
      >
        <MaterialIcons name="add-circle-outline" size={20} color="#2563EB" />
        <Text style={styles.addVariantText}>Add Another Variant</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Update Product' : 'Create Product'}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 20 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E8EB', borderRadius: 14,
    padding: 14, fontSize: 15, marginBottom: 15, color: '#111827',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 10, marginBottom: 15 },
  helperText: { fontSize: 13, color: '#6B7280', marginBottom: 10, fontStyle: 'italic' },
  // CHANGE: Add info box styling for mandatory variant notice
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    marginLeft: 10,
    lineHeight: 18,
  },
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 10 },
  imageWrapper: { position: 'relative', width: 100, height: 100 },
  imagePreview: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F3F4F6' },
  removeImageButton: {
    position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  addImageButton: {
    width: 100, height: 100, borderWidth: 2, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addImageButtonSmall: {
    width: 100, height: 100, borderWidth: 1, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addImageText: { color: '#2563EB', fontSize: 12, marginTop: 5 },
  variantCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#2563EB', borderWidth: 1, borderColor: '#E6E8EB' },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  variantTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  variantImageLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 8 },
  addVariantButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15,
    borderWidth: 1, borderColor: '#2563EB', borderRadius: 14, borderStyle: 'dashed', marginBottom: 20,
  },
  addVariantText: { color: '#2563EB', fontSize: 16, fontWeight: '600', marginLeft: 5 },
  submitButton: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 30 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AddProductScreen;
