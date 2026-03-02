import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from '@apollo/client';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { CREATE_PRODUCT, UPDATE_PRODUCT } from '../../graphql/mutations';
import { GET_SELLER_PRODUCTS } from '../../graphql/queries';
import ImagePickerGrid from './addProduct/components/ImagePickerGrid';
import VariantEditorCard from './addProduct/components/VariantEditorCard';
import styles from './addProduct/styles';

const DEFAULT_VARIANT = {
  name: '',
  description: '',
  priceModifier: 0,
  stock: 0,
  sku: '',
  images: [],
};

const IMAGE_DATA_PREFIX = 'data:image/';

/**
 * Seller product create/update screen.
 * @param {{
 *   route: {params?: {product?: object}},
 *   navigation: object,
 * }} props Screen props.
 * @return {React.JSX.Element} Product form UI.
 */
const AddProductScreen = ({ route, navigation }) => {
  const isEdit = !!route.params?.product;
  const product = route.params?.product;

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || '');
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || '');
  const [images, setImages] = useState(product?.images || []);

  const [variants, setVariants] = useState(
    product?.variants?.map((variant) => ({
      ...variant,
      priceModifier: variant.priceModifier || 0,
      stock: variant.stock || 0,
      images: variant.images || [],
      description: variant.description || '',
    })) || [{ ...DEFAULT_VARIANT }]
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

  /**
   * Checks whether valid base64 image.
   * @param {string} uri Image URI string.
   * @return {boolean} Whether the condition is met.
   */
  const isValidBase64Image = (uri) => uri && uri.startsWith(IMAGE_DATA_PREFIX);

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

  /**
   * Validates image uri.
   * @param {string} uri Image URI string.
   * @return {boolean} Whether the URI is valid.
   */
  const validateImageUri = (uri) => {
    if (!uri || typeof uri !== 'string') {
      return false;
    }

    const isDataUri = uri.startsWith('data:image/');
    const isFileUri = uri.startsWith('file:///');

    if (!isDataUri && !isFileUri) {
      return false;
    }

    if (isFileUri) {
      const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(uri);
      if (!hasExtension) {
        return false;
      }
    }

    if (isDataUri) {
      const parts = uri.split(',');
      if (parts.length !== 2 || !parts[1] || parts[1].length === 0) {
        return false;
      }
    }

    return true;
  };

  const convertAssetsToBase64 = async (assets) => {
    const validUris = assets.map((asset) => asset.uri).filter(validateImageUri);

    if (validUris.length === 0) {
      Alert.alert('Error', 'No valid images selected');
      return [];
    }

    if (validUris.length > 3) {
      Alert.alert('Processing', `Converting ${validUris.length} images...`);
    }

    const base64Images = await Promise.all(validUris.map(convertToBase64));
    return base64Images.filter(isValidBase64Image);
  };

  const handlePickProductImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets) {
        const validBase64Images = await convertAssetsToBase64(result.assets);

        if (validBase64Images.length === 0) {
          Alert.alert('Error', 'Failed to process images');
          return;
        }

        setImages((prev) => [...prev, ...validBase64Images]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', `Failed to pick images: ${error.message}`);
    }
  };

  /**
   * Handles remove product image.
   * @param {number} index Item index.
   * @return {void} No return value.
   */
  const handleRemoveProductImage = (index) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const handlePickVariantImages = async (variantIndex) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets) {
        const validBase64Images = await convertAssetsToBase64(result.assets);

        if (validBase64Images.length === 0) {
          Alert.alert('Error', 'Failed to process images');
          return;
        }

        setVariants((prev) => {
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

  /**
   * Handles remove variant image.
   * @param {number} variantIndex Variant index.
   * @param {number} imageIndex Image index.
   * @return {void} No return value.
   */
  const handleRemoveVariantImage = (variantIndex, imageIndex) => {
    setVariants((prev) => {
      const next = [...prev];
      next[variantIndex] = {
        ...next[variantIndex],
        images: next[variantIndex].images.filter(
          (_, currentIndex) => currentIndex !== imageIndex
        ),
      };
      return next;
    });
  };

  /**
   * Handles add variant.
   * @return {void} No return value.
   */
  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { ...DEFAULT_VARIANT }]);
  };

  /**
   * Handles remove variant.
   * @param {number} index Item index.
   * @return {void} No return value.
   */
  const handleRemoveVariant = (index) => {
    if (variants.length === 1) {
      Alert.alert(
        'Cannot Remove Variant',
        'At least one variant is required for stock management. You can edit this variant instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    setVariants((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  /**
   * Handles variant change.
   * @param {number} index Item index.
   * @param {string} field Field value.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  /**
   * Validates input.
   * @return {boolean} Whether the form input is valid.
   */
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

    const invalidImages = images.filter((image) => !isValidBase64Image(image));
    if (invalidImages.length > 0) {
      Alert.alert(
        'Validation Error',
        'Some images are invalid. Please remove and re-add them.'
      );
      return false;
    }

    if (!variants || variants.length === 0) {
      Alert.alert(
        'Validation Error',
        'At least one variant is required for stock management. Please add variant details.'
      );
      return false;
    }

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];

      if (!variant.name || variant.name.trim().length === 0) {
        Alert.alert('Validation Error', `Variant ${index + 1} name is required`);
        return false;
      }

      const stock = parseInt(variant.stock, 10);
      if (isNaN(stock) || stock < 0) {
        Alert.alert(
          'Validation Error',
          `Variant ${index + 1} stock must be a non-negative number`
        );
        return false;
      }

      const priceModifier = parseFloat(variant.priceModifier);
      if (isNaN(priceModifier)) {
        Alert.alert(
          'Validation Error',
          `Variant ${index + 1} price modifier must be a number`
        );
        return false;
      }

      if (variant.images && variant.images.length > 0) {
        const invalidVariantImages = variant.images.filter(
          (image) => !isValidBase64Image(image)
        );

        if (invalidVariantImages.length > 0) {
          Alert.alert(
            'Validation Error',
            `Variant ${index + 1} has invalid images. Please remove and re-add them.`
          );
          return false;
        }
      }
    }

    return true;
  };

  /**
   * Handles submit.
   * @return {void} No return value.
   */
  const handleSubmit = () => {
    if (!validateInput()) {
      return;
    }

    const timestamp = Date.now();
    const productSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 20);

    const input = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      basePrice: parseFloat(basePrice),
      images: images.filter(isValidBase64Image),
      variants: variants.map((variant, index) => ({
        name: variant.name.trim(),
        description: variant.description ? variant.description.trim() : '',
        priceModifier: parseFloat(variant.priceModifier) || 0,
        stock: parseInt(variant.stock, 10) || 0,
        sku:
          variant.sku && variant.sku.trim() !== ''
            ? variant.sku.trim()
            : `${productSlug}-${timestamp}-${index}`,
        images: (variant.images || []).filter(isValidBase64Image),
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
      variants: input.variants.map((variant) => ({
        name: variant.name,
        stock: variant.stock,
        priceModifier: variant.priceModifier,
        imageCount: variant.images.length,
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
      <ImagePickerGrid
        images={images}
        onRemoveImage={handleRemoveProductImage}
        onAddImage={handlePickProductImages}
        removeAccessibilityLabel={(index) => `Remove image ${index + 1}`}
        addLabel="Add images"
      />

      <Text style={styles.sectionTitle}>Variants (Required) *</Text>
      <Text style={styles.helperText}>
        At least one variant is required for stock management. Add variant-specific
        descriptions and images, or they will inherit from the product.
      </Text>
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color="#2563EB" />
        <Text style={styles.infoText}>
          Each variant tracks its own stock. You must have at least one variant to
          manage inventory.
        </Text>
      </View>

      {variants.map((variant, index) => (
        <VariantEditorCard
          key={`variant-${index}`}
          index={index}
          variant={variant}
          totalVariants={variants.length}
          onRemoveVariant={handleRemoveVariant}
          onVariantChange={handleVariantChange}
          onPickVariantImages={handlePickVariantImages}
          onRemoveVariantImage={handleRemoveVariantImage}
        />
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

export default AddProductScreen;
