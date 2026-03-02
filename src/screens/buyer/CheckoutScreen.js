import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

import CustomDropdown from '../../atoms/CustomDropdown';
import { CHECKOUT, TRACK_EVENT, ADD_ADDRESS } from '../../graphql/mutations';
import { GET_MY_CART, ME } from '../../graphql/queries';
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
import SaveAddressModal from './checkout/components/SaveAddressModal';
import styles from './checkout/styles';

const BUYER_HOME_ROUTE = 'BuyerHome';

const TOUCHED_INITIAL_STATE = {
  street: false,
  city: false,
  state: false,
  zipCode: false,
  country: false,
};

const TOUCHED_SUBMITTED_STATE = {
  street: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
};

const COUNTRY_ITEMS = [
  { label: 'India', value: 'India' },
  { label: 'United States', value: 'United States' },
];

/**
 * Checkout screen for shipping and order placement.
 * @param {{navigation: object}} props Screen props.
 * @return {React.JSX.Element} Checkout UI.
 */
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

  const [streetError, setStreetError] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateError, setStateError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [touched, setTouched] = useState(TOUCHED_INITIAL_STATE);

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

  const { data: userData } = useQuery(ME, {
    variables: { token },
    skip: !token,
  });

  /**
   * Selects address.
   * @param {object} address Address value.
   * @return {void} No return value.
   */
  const selectAddress = (address) => {
    setSelectedAddressId(address.id);
    setStreet(address.street);
    setCountry(address.country);
    setState(address.state);
    setCity(address.city);
    setZipCode(address.zipCode);

    setStreetError('');
    setCityError('');
    setStateError('');
    setZipCodeError('');
    setCountryError('');
  };

  React.useEffect(() => {
    const defaultAddress = userData?.me?.addresses?.find((address) => address.isDefault);
    if (defaultAddress) {
      selectAddress(defaultAddress);
    }
  }, [userData?.me?.addresses]);

  const { data, loading: cartLoading } = useQuery(GET_MY_CART);

  const [trackEvent] = useMutation(TRACK_EVENT);

  const [addAddress] = useMutation(ADD_ADDRESS, {
    refetchQueries: [{ query: ME, variables: { token } }],
  });

  const [checkout, { loading: checkoutLoading }] = useMutation(CHECKOUT, {
    onCompleted: (checkoutData) => {
      const order = checkoutData.checkout;

      if (userId && checkoutData?.myCart?.items) {
        checkoutData.myCart.items.forEach((item) => {
          trackEvent({
            variables: {
              userId,
              productId: item.productId,
              eventType: 'purchase',
              metadata: JSON.stringify({
                variantId: item.variantId,
                orderId: order.orderId,
              }),
            },
          }).catch((trackingError) => {
            console.error('Tracking error (purchase):', trackingError);
          });
        });
      }

      Alert.alert('Success', `Order placed successfully! Order ID: ${order.orderId}`, [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: BUYER_HOME_ROUTE }],
            });
          },
        },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  /**
   * Handles go back.
   * @return {void} No return value.
   */
  const handleGoBack = () => {
    navigation.goBack();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Checkout',
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleGoBack}
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

  /**
   * Handles street change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleStreetChange = (text) => {
    setStreet(text);
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
    setCountry(value);
    setState('');
    setCity('');
    setZipCode('');

    if (touched.country) {
      const validation = validateCountry(value);
      setCountryError(validation.error);
    }

    setTouched((prevState) => ({ ...prevState, country: true }));
  };

  /**
   * Handles state change.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleStateChange = (value) => {
    setState(value);
    setCity('');
    setZipCode('');

    if (touched.state) {
      const validation = validateState(value);
      setStateError(validation.error);
    }

    setTouched((prevState) => ({ ...prevState, state: true }));
  };

  /**
   * Handles city change.
   * @param {string} value Field value.
   * @return {void} No return value.
   */
  const handleCityChange = (value) => {
    setCity(value);

    if (touched.city) {
      const validation = validateCity(value);
      setCityError(validation.error);
    }

    setTouched((prevState) => ({ ...prevState, city: true }));
  };

  /**
   * Handles zip code change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleZipCodeChange = (text) => {
    setZipCode(text);
    if (touched.zipCode) {
      const validation = validateZipCode(text, country, state);
      setZipCodeError(validation.error);
    }
  };

  /**
   * Handles street blur.
   * @return {void} No return value.
   */
  const handleStreetBlur = () => {
    setTouched((prevState) => ({ ...prevState, street: true }));
    const validation = validateStreet(street);
    setStreetError(validation.error);
  };

  /**
   * Handles zip code blur.
   * @return {void} No return value.
   */
  const handleZipCodeBlur = () => {
    setTouched((prevState) => ({ ...prevState, zipCode: true }));
    const validation = validateZipCode(zipCode, country, state);
    setZipCodeError(validation.error);
  };

  /**
   * Checks whether address already saved.
   * @return {boolean} Whether the condition is met.
   */
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

    return userData.me.addresses.some(
      (address) =>
        address.street.trim().toLowerCase() === enteredAddress.street &&
        address.city.trim().toLowerCase() === enteredAddress.city &&
        address.state.trim().toLowerCase() === enteredAddress.state &&
        address.zipCode.trim().toLowerCase() === enteredAddress.zipCode &&
        address.country.trim().toLowerCase() === enteredAddress.country
    );
  };

  /**
   * Proceeds to checkout.
   * @return {void} No return value.
   */
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

  /**
   * Handles checkout.
   * @return {void} No return value.
   */
  const handleCheckout = () => {
    setTouched(TOUCHED_SUBMITTED_STATE);

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

    if (!isAddressAlreadySaved()) {
      setShowSaveAddressModal(true);
      return;
    }

    proceedToCheckout();
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
      proceedToCheckout();
    } catch (error) {
      Alert.alert('Error', `Failed to save address: ${error.message}`);
      setShowSaveAddressModal(false);
    }
  };

  /**
   * Runs checkout without saving.
   * @return {void} No return value.
   */
  const checkoutWithoutSaving = () => {
    setShowSaveAddressModal(false);
    proceedToCheckout();
  };

  /**
   * Checks whether form valid.
   * @return {boolean} Whether the condition is met.
   */
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
  const stateItems = availableStates.map((stateName) => ({
    label: stateName,
    value: stateName,
  }));
  const cityItems = availableCities.map((cityName) => ({
    label: cityName,
    value: cityName,
  }));
  const isCheckoutDisabled = checkoutLoading || !isFormValid();

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
                    name={
                      selectedAddressId === address.id
                        ? 'check-circle'
                        : 'radio-button-unchecked'
                    }
                    size={20}
                    color={selectedAddressId === address.id ? '#2563EB' : '#9CA3AF'}
                  />
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressStreet} numberOfLines={1}>
                  {address.street}
                </Text>
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
        items={COUNTRY_ITEMS}
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
        placeholder={availableStates.length > 0 ? 'Select State' : 'Select Country First'}
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
        placeholder={availableCities.length > 0 ? 'Select City' : 'Select State First'}
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
          <Text style={styles.totalValue}>${cart?.totalAmount.toFixed(2) || '0.00'}</Text>
        </View>
      </View>

      <Text style={styles.paymentNote}>Payment Method: Mock Payment (Demo)</Text>

      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          isCheckoutDisabled && styles.placeOrderButtonDisabled,
        ]}
        onPress={handleCheckout}
        disabled={isCheckoutDisabled}
      >
        {checkoutLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order</Text>
        )}
      </TouchableOpacity>

      <SaveAddressModal
        visible={showSaveAddressModal}
        onClose={() => setShowSaveAddressModal(false)}
        checkoutLoading={checkoutLoading}
        onPlaceWithoutSaving={checkoutWithoutSaving}
        onSaveAndPlace={saveAddressAndCheckout}
        street={street}
        city={city}
        state={state}
        zipCode={zipCode}
        country={country}
      />
    </ScrollView>
  );
};

export default CheckoutScreen;
