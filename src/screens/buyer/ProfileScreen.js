import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ME } from '../../graphql/queries';
import {
  ADD_ADDRESS,
  REMOVE_ADDRESS,
  SET_DEFAULT_ADDRESS,
  UPDATE_ADDRESS,
} from '../../graphql/mutations';
import {
  validateCity,
  validateCountry,
  validateState,
  validateStreet,
  validateZipCode,
} from '../../utils/validators';
import {
  getCitiesForState,
  getStatesForCountry,
} from '../../utils/locationData';
import AddressFormModal from './profile/components/AddressFormModal';
import styles from './profile/styles';

const INITIAL_ADDRESS_FORM = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  isDefault: false,
};

const INITIAL_TOUCHED_STATE = {
  street: false,
  city: false,
  state: false,
  zipCode: false,
  country: false,
};

const COUNTRY_ITEMS = [
  { label: 'India', value: 'India' },
  { label: 'United States', value: 'United States' },
];

/**
 * Buyer profile screen with address management.
 * @param {{
 *   navigation: object,
 *   onLogout?: () => Promise<void>,
 * }} props Screen props.
 * @return {React.JSX.Element} Profile UI.
 */
const ProfileScreen = ({ navigation, onLogout }) => {
  const [token, setToken] = useState(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ ...INITIAL_ADDRESS_FORM });

  const [streetError, setStreetError] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateError, setStateError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [touched, setTouched] = useState({ ...INITIAL_TOUCHED_STATE });

  const availableStates = addressForm.country
    ? getStatesForCountry(addressForm.country)
    : [];
  const availableCities = addressForm.country && addressForm.state
    ? getCitiesForState(addressForm.country, addressForm.state)
    : [];

  React.useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('accessToken');
      setToken(storedToken);
    };

    getToken();
  }, []);

  const { data, loading, refetch } = useQuery(ME, {
    variables: { token },
    skip: !token,
  });

  const [addAddress] = useMutation(ADD_ADDRESS);
  const [updateAddress] = useMutation(UPDATE_ADDRESS);
  const [removeAddress] = useMutation(REMOVE_ADDRESS);
  const [setDefaultAddress] = useMutation(SET_DEFAULT_ADDRESS);

  const user = data?.me;

  /**
   * Clears validation errors.
   * @return {void} No return value.
   */
  const clearValidationErrors = () => {
    setStreetError('');
    setCityError('');
    setStateError('');
    setZipCodeError('');
    setCountryError('');
  };

  /**
   * Resets address form state.
   * @return {void} No return value.
   */
  const resetAddressFormState = () => {
    setAddressForm({ ...INITIAL_ADDRESS_FORM });
    setTouched({ ...INITIAL_TOUCHED_STATE });
    clearValidationErrors();
  };

  /**
   * Opens add address modal.
   * @return {void} No return value.
   */
  const openAddAddressModal = () => {
    setEditingAddress(null);
    resetAddressFormState();
    setIsAddressModalVisible(true);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (onLogout) {
            await onLogout();
          } else {
            await AsyncStorage.clear();
          }
        },
      },
    ]);
  };

  /**
   * Handles street change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleStreetChange = (text) => {
    setAddressForm({ ...addressForm, street: text });
    if (touched.street) {
      const validation = validateStreet(text);
      setStreetError(validation.error);
    }
  };

  /**
   * Handles country change.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleCountryChange = (value) => {
    setAddressForm({
      ...addressForm,
      country: value,
      state: '',
      city: '',
      zipCode: '',
    });

    if (touched.country) {
      const validation = validateCountry(value);
      setCountryError(validation.error);
    }
  };

  /**
   * Handles state change.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleStateChange = (value) => {
    setAddressForm({ ...addressForm, state: value, city: '', zipCode: '' });
    if (touched.state) {
      const validation = validateState(value);
      setStateError(validation.error);
    }
  };

  /**
   * Handles city change.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleCityChange = (value) => {
    setAddressForm({ ...addressForm, city: value });
    if (touched.city) {
      const validation = validateCity(value);
      setCityError(validation.error);
    }
  };

  /**
   * Handles zip code change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleZipCodeChange = (text) => {
    setAddressForm({ ...addressForm, zipCode: text });
    if (touched.zipCode) {
      const validation = validateZipCode(
        text,
        addressForm.country,
        addressForm.state
      );
      setZipCodeError(validation.error);
    }
  };

  /**
   * Handles street blur.
   * @return {void} No return value.
   */
  const handleStreetBlur = () => {
    setTouched((prev) => ({ ...prev, street: true }));
    const validation = validateStreet(addressForm.street);
    setStreetError(validation.error);
  };

  /**
   * Handles zip code blur.
   * @return {void} No return value.
   */
  const handleZipCodeBlur = () => {
    setTouched((prev) => ({ ...prev, zipCode: true }));
    const validation = validateZipCode(
      addressForm.zipCode,
      addressForm.country,
      addressForm.state
    );
    setZipCodeError(validation.error);
  };

  /**
   * Handles address default change.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleAddressDefaultChange = (value) => {
    setAddressForm({ ...addressForm, isDefault: value });
  };

  const handleSaveAddress = async () => {
    setTouched({
      ...INITIAL_TOUCHED_STATE,
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
    });

    const streetValidation = validateStreet(addressForm.street);
    const cityValidation = validateCity(addressForm.city);
    const stateValidation = validateState(addressForm.state);
    const zipCodeValidation = validateZipCode(
      addressForm.zipCode,
      addressForm.country,
      addressForm.state
    );
    const countryValidation = validateCountry(addressForm.country);

    setStreetError(streetValidation.error);
    setCityError(cityValidation.error);
    setStateError(stateValidation.error);
    setZipCodeError(zipCodeValidation.error);
    setCountryError(countryValidation.error);

    if (
      !streetValidation.isValid ||
      !cityValidation.isValid ||
      !stateValidation.isValid ||
      !zipCodeValidation.isValid ||
      !countryValidation.isValid
    ) {
      Alert.alert('Validation Error', 'Please fix all errors before saving');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress({
          variables: {
            id: editingAddress.id,
            address: addressForm,
          },
        });
      } else {
        await addAddress({
          variables: {
            address: addressForm,
          },
        });
      }

      setIsAddressModalVisible(false);
      setEditingAddress(null);
      resetAddressFormState();
      refetch();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  /**
   * Handles edit address.
   * @param {object} address Address value.
   * @return {void} No return value.
   */
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setTouched({ ...INITIAL_TOUCHED_STATE });
    clearValidationErrors();
    setIsAddressModalVisible(true);
  };

  /**
   * Handles delete address.
   * @param {string} id Entity identifier.
   * @return {void} No return value.
   */
  const handleDeleteAddress = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAddress({ variables: { id } });
            refetch();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress({ variables: { id } });
      refetch();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  /**
   * Checks whether address form valid.
   * @return {boolean} Whether the condition is met.
   */
  const isAddressFormValid = () => {
    const streetValidation = validateStreet(addressForm.street);
    const cityValidation = validateCity(addressForm.city);
    const stateValidation = validateState(addressForm.state);
    const zipCodeValidation = validateZipCode(
      addressForm.zipCode,
      addressForm.country,
      addressForm.state
    );
    const countryValidation = validateCountry(addressForm.country);

    return (
      streetValidation.isValid &&
      cityValidation.isValid &&
      stateValidation.isValid &&
      zipCodeValidation.isValid &&
      countryValidation.isValid
    );
  };

  if (loading && !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={40} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddAddressModal}>
            <MaterialIcons name="add" size={20} color="#2563EB" />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {user?.addresses?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No saved addresses yet</Text>
          </View>
        ) : (
          user?.addresses?.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressInfo}>
                <View style={styles.addressMain}>
                  <Text style={styles.street}>{address.street}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cityState}>
                  {address.city}, {address.state} {address.zipCode}
                </Text>
                <Text style={styles.country}>{address.country}</Text>
              </View>
              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(address.id)}
                  >
                    <MaterialIcons
                      name="check-circle-outline"
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditAddress(address)}
                >
                  <MaterialIcons name="edit" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteAddress(address.id)}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Management</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="shopping-bag" size={24} color="#4B5563" />
            <Text style={styles.menuItemText}>Order History</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="shopping-cart" size={24} color="#4B5563" />
            <Text style={styles.menuItemText}>My Cart</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <AddressFormModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        editingAddress={editingAddress}
        addressForm={addressForm}
        touched={touched}
        countryItems={COUNTRY_ITEMS}
        availableStates={availableStates}
        availableCities={availableCities}
        countryError={countryError}
        stateError={stateError}
        cityError={cityError}
        streetError={streetError}
        zipCodeError={zipCodeError}
        onCountryChange={handleCountryChange}
        onStateChange={handleStateChange}
        onCityChange={handleCityChange}
        onStreetChange={handleStreetChange}
        onStreetBlur={handleStreetBlur}
        onZipCodeChange={handleZipCodeChange}
        onZipCodeBlur={handleZipCodeBlur}
        onIsDefaultChange={handleAddressDefaultChange}
        onSave={handleSaveAddress}
        isSaveDisabled={!isAddressFormValid()}
      />
    </ScrollView>
  );
};

export default ProfileScreen;
