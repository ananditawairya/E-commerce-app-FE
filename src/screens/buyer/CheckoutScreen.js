import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MY_CART, ME } from '../../graphql/queries';
import { CHECKOUT, TRACK_EVENT, ADD_ADDRESS } from '../../graphql/mutations';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomDropdown from '../../atoms/CustomDropdown';
import {
  validateStreet,
  validateCity,
  validateState,
  validateZipCode,
  validateCountry,
} from '../../utils/validators';
import {
  getStatesForCountry,
  getCitiesForState,
} from '../../utils/locationData';

const CheckoutScreen = ({ navigation }) => {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [showSaveAddressModal, setShowSaveAddressModal] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const [streetError, setStreetError] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateError, setStateError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [touched, setTouched] = useState({
    street: false,
    city: false,
    state: false,
    zipCode: false,
    country: false,
  });

  const availableStates = country ? getStatesForCountry(country) : [];
  const availableCities = country && state ? getCitiesForState(country, state) : [];

  React.useEffect(() => {
    const getData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('accessToken');
      setUserId(id);
      setToken(storedToken);
    };
    getData();
  }, []);

  const { data: userData, loading: userLoading } = useQuery(ME, {
    variables: { token },
    skip: !token,
    onCompleted: (data) => {
      const defaultAddr = data?.me?.addresses?.find(a => a.isDefault);
      if (defaultAddr) {
        selectAddress(defaultAddr);
      }
    },
  });

  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setStreet(addr.street);
    setCountry(addr.country);
    setState(addr.state);
    setCity(addr.city);
    setZipCode(addr.zipCode);

    setStreetError('');
    setCityError('');
    setStateError('');
    setZipCodeError('');
    setCountryError('');
  };

  const { data, loading: cartLoading } = useQuery(GET_MY_CART);

  const [trackEvent] = useMutation(TRACK_EVENT);

  const [addAddress] = useMutation(ADD_ADDRESS, {
    refetchQueries: [{ query: ME, variables: { token } }],
  });

  const [checkout, { loading: checkoutLoading }] = useMutation(CHECKOUT, {
    onCompleted: (data) => {
      const order = data.checkout;

      if (userId && data?.myCart?.items) {
        data.myCart.items.forEach(item => {
          trackEvent({
            variables: {
              userId,
              productId: item.productId,
              eventType: 'purchase',
              metadata: JSON.stringify({ variantId: item.variantId, orderId: order.orderId })
            }
          }).catch(err => console.error('Tracking error (purchase):', err));
        });
      }

      Alert.alert(
        'Success',
        `Order placed successfully! Order ID: ${order.orderId}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'BuyerHome' }],
              });
            },
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Checkout',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          accessibilityLabel="Go back to cart"
          accessibilityHint="Navigate back to shopping cart"
        >
          <MaterialIcons name="arrow-back" size={24} color="#2563EB" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTitleStyle: {
        color: '#333',
        fontSize: 18,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  const handleStreetChange = (text) => {
    setStreet(text);
    if (touched.street) {
      const validation = validateStreet(text);
      setStreetError(validation.error);
    }
  };

  const handleCountryChange = (value) => {
    setCountry(value);
    setState('');
    setCity('');
    setZipCode('');
    if (touched.country) {
      const validation = validateCountry(value);
      setCountryError(validation.error);
    }
    setTouched(prev => ({ ...prev, country: true }));
  };

  const handleStateChange = (value) => {
    setState(value);
    setCity('');
    setZipCode('');
    if (touched.state) {
      const validation = validateState(value);
      setStateError(validation.error);
    }
    setTouched(prev => ({ ...prev, state: true }));
  };

  const handleCityChange = (value) => {
    setCity(value);
    if (touched.city) {
      const validation = validateCity(value);
      setCityError(validation.error);
    }
    setTouched(prev => ({ ...prev, city: true }));
  };

  const handleZipCodeChange = (text) => {
    setZipCode(text);
    if (touched.zipCode) {
      const validation = validateZipCode(text, country, state);
      setZipCodeError(validation.error);
    }
  };

  const handleStreetBlur = () => {
    setTouched(prev => ({ ...prev, street: true }));
    const validation = validateStreet(street);
    setStreetError(validation.error);
  };

  const handleZipCodeBlur = () => {
    setTouched(prev => ({ ...prev, zipCode: true }));
    const validation = validateZipCode(zipCode, country, state);
    setZipCodeError(validation.error);
  };

  const isAddressAlreadySaved = () => {
    if (!userData?.me?.addresses || userData.me.addresses.length === 0) {
      return false;
    }

    const enteredAddress = {
      street: street.trim().toLowerCase(),
      city: city.trim().toLowerCase(),
      state: state.trim().toLowerCase(),
      zipCode: zipCode.trim().toLowerCase(),
      country: country.trim().toLowerCase(),
    };

    return userData.me.addresses.some(addr => 
      addr.street.trim().toLowerCase() === enteredAddress.street &&
      addr.city.trim().toLowerCase() === enteredAddress.city &&
      addr.state.trim().toLowerCase() === enteredAddress.state &&
      addr.zipCode.trim().toLowerCase() === enteredAddress.zipCode &&
      addr.country.trim().toLowerCase() === enteredAddress.country
    );
  };

  const handleCheckout = () => {
    setTouched({
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
    });

    const streetValidation = validateStreet(street);
    const cityValidation = validateCity(city);
    const stateValidation = validateState(state);
    const zipCodeValidation = validateZipCode(zipCode, country, state);
    const countryValidation = validateCountry(country);

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
      Alert.alert('Validation Error', 'Please fix all errors before proceeding');
      return;
    }

    const isNewAddress = !isAddressAlreadySaved();

    if (isNewAddress) {
      setShowSaveAddressModal(true);
      setPendingCheckout(true);
    } else {
      proceedToCheckout();
    }
  };

  const proceedToCheckout = () => {
    checkout({
      variables: {
        shippingAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          country: country.trim(),
        },
      },
    });
  };

  const saveAddressAndCheckout = async () => {
    try {
      await addAddress({
        variables: {
          address: {
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            country: country.trim(),
            isDefault: false,
          },
        },
      });

      setShowSaveAddressModal(false);
      setPendingCheckout(false);
      proceedToCheckout();
    } catch (error) {
      Alert.alert('Error', `Failed to save address: ${error.message}`);
      setShowSaveAddressModal(false);
      setPendingCheckout(false);
    }
  };

  const checkoutWithoutSaving = () => {
    setShowSaveAddressModal(false);
    setPendingCheckout(false);
    proceedToCheckout();
  };

  const isFormValid = () => {
    const streetValidation = validateStreet(street);
    const cityValidation = validateCity(city);
    const stateValidation = validateState(state);
    const zipCodeValidation = validateZipCode(zipCode, country, state);
    const countryValidation = validateCountry(country);

    return (
      streetValidation.isValid &&
      cityValidation.isValid &&
      stateValidation.isValid &&
      zipCodeValidation.isValid &&
      countryValidation.isValid
    );
  };

  if (cartLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const cart = data?.myCart;

  const countryItems = [
    { label: 'India', value: 'India' },
    { label: 'United States', value: 'United States' },
  ];

  const stateItems = availableStates.map(stateName => ({
    label: stateName,
    value: stateName,
  }));

  const cityItems = availableCities.map(cityName => ({
    label: cityName,
    value: cityName,
  }));

  return (
    <ScrollView style={styles.container}>
      {userData?.me?.addresses?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Select Saved Address</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.addressList}
          >
            {userData.me.addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressCard,
                  selectedAddressId === address.id && styles.selectedAddressCard,
                ]}
                onPress={() => selectAddress(address)}
              >
                <View style={styles.addressCardHeader}>
                  <MaterialIcons
                    name={selectedAddressId === address.id ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={selectedAddressId === address.id ? '#2563EB' : '#9CA3AF'}
                  />
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressStreet} numberOfLines={1}>{address.street}</Text>
                <Text style={styles.addressCity} numberOfLines={1}>
                  {address.city}, {address.state}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionTitle}>Shipping Address</Text>

      <CustomDropdown
        label="Country"
        value={country}
        onValueChange={handleCountryChange}
        items={countryItems}
        placeholder="Select Country"
        error={countryError}
        touched={touched.country}
        icon="public"
      />

      <CustomDropdown
        label="State"
        value={state}
        onValueChange={handleStateChange}
        items={stateItems}
        placeholder={availableStates.length > 0 ? "Select State" : "Select Country First"}
        error={stateError}
        touched={touched.state}
        enabled={availableStates.length > 0}
        icon="location-city"
      />

      <CustomDropdown
        label="City"
        value={city}
        onValueChange={handleCityChange}
        items={cityItems}
        placeholder={availableCities.length > 0 ? "Select City" : "Select State First"}
        error={cityError}
        touched={touched.city}
        enabled={availableCities.length > 0}
        icon="location-on"
      />

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={[styles.input, streetError && touched.street && styles.inputError]}
          placeholder="Enter your street address"
          value={street}
          onChangeText={handleStreetChange}
          onBlur={handleStreetBlur}
        />
        {streetError && touched.street && (
          <Text style={styles.errorText}>{streetError}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{country === 'India' ? 'PIN Code' : 'ZIP Code'}</Text>
        <TextInput
          style={[styles.input, zipCodeError && touched.zipCode && styles.inputError]}
          placeholder={country === 'India' ? 'Enter PIN Code' : 'Enter ZIP Code'}
          value={zipCode}
          onChangeText={handleZipCodeChange}
          onBlur={handleZipCodeBlur}
          keyboardType="default"
        />
        {zipCodeError && touched.zipCode && (
          <Text style={styles.errorText}>{zipCodeError}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Order Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>{cart?.items.length || 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ${cart?.totalAmount.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <Text style={styles.paymentNote}>
        Payment Method: Mock Payment (Demo)
      </Text>

      <TouchableOpacity
        style={[styles.placeOrderButton, !isFormValid() && styles.placeOrderButtonDisabled]}
        onPress={handleCheckout}
        disabled={checkoutLoading || !isFormValid()}
      >
        {checkoutLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showSaveAddressModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSaveAddressModal(false);
          setPendingCheckout(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="location-on" size={32} color="#2563EB" />
              <Text style={styles.modalTitle}>Save This Address?</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Would you like to save this address for future orders?
            </Text>

            <View style={styles.addressPreview}>
              <Text style={styles.previewText}>{street}</Text>
              <Text style={styles.previewText}>
                {city}, {state} {zipCode}
              </Text>
              <Text style={styles.previewText}>{country}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={checkoutWithoutSaving}
                disabled={checkoutLoading}
              >
                <Text style={styles.modalButtonSecondaryText}>
                  No, Just Place Order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={saveAddressAndCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>
                    Yes, Save & Place Order
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButton: {
    marginLeft: 15,
    padding: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 15,
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  paymentNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeOrderButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#AFC7FF',
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressList: {
    marginBottom: 20,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 14,
    padding: 16,
    width: 200,
    marginRight: 12,
  },
  selectedAddressCard: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  defaultBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  addressStreet: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  addressCity: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  addressPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  modalButtons: {
    gap: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;