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
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MY_CART } from '../../graphql/queries';
import { CHECKOUT, TRACK_EVENT } from '../../graphql/mutations';
// CHANGE: Import MaterialIcons for back button icon
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  validateStreet,
  validateCity,
  validateState,
  validateZipCode,
  validateCountry,
} from '../../utils/validators';

const CheckoutScreen = ({ navigation }) => {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [userId, setUserId] = useState(null);

  React.useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    getUserId();
  }, []);

  // CHANGE: Add validation error states
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

  const { data, loading: cartLoading } = useQuery(GET_MY_CART);

  const [trackEvent] = useMutation(TRACK_EVENT);

  const [checkout, { loading: checkoutLoading }] = useMutation(CHECKOUT, {
    onCompleted: (data) => {
      // CHANGE: Handle single order response (backend returns first order for compatibility)
      const order = data.checkout;

      // Track purchase events for each item in the cart
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

  // CHANGE: Configure navigation header with back button
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
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
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

  // CHANGE: Real-time validation handlers
  const handleStreetChange = (text) => {
    setStreet(text);
    if (touched.street) {
      const validation = validateStreet(text);
      setStreetError(validation.error);
    }
  };

  const handleCityChange = (text) => {
    setCity(text);
    if (touched.city) {
      const validation = validateCity(text);
      setCityError(validation.error);
    }
  };

  const handleStateChange = (text) => {
    setState(text);
    if (touched.state) {
      const validation = validateState(text);
      setStateError(validation.error);
    }
  };

  const handleZipCodeChange = (text) => {
    setZipCode(text);
    if (touched.zipCode) {
      const validation = validateZipCode(text);
      setZipCodeError(validation.error);
    }
  };

  const handleCountryChange = (text) => {
    setCountry(text);
    if (touched.country) {
      const validation = validateCountry(text);
      setCountryError(validation.error);
    }
  };

  // CHANGE: Blur handlers
  const handleStreetBlur = () => {
    setTouched(prev => ({ ...prev, street: true }));
    const validation = validateStreet(street);
    setStreetError(validation.error);
  };

  const handleCityBlur = () => {
    setTouched(prev => ({ ...prev, city: true }));
    const validation = validateCity(city);
    setCityError(validation.error);
  };

  const handleStateBlur = () => {
    setTouched(prev => ({ ...prev, state: true }));
    const validation = validateState(state);
    setStateError(validation.error);
  };

  const handleZipCodeBlur = () => {
    setTouched(prev => ({ ...prev, zipCode: true }));
    const validation = validateZipCode(zipCode);
    setZipCodeError(validation.error);
  };

  const handleCountryBlur = () => {
    setTouched(prev => ({ ...prev, country: true }));
    const validation = validateCountry(country);
    setCountryError(validation.error);
  };

  // CHANGE: Enhanced validation before submission
  const handleCheckout = () => {
    // CHANGE: Mark all fields as touched
    setTouched({
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
    });

    // CHANGE: Validate all fields
    const streetValidation = validateStreet(street);
    const cityValidation = validateCity(city);
    const stateValidation = validateState(state);
    const zipCodeValidation = validateZipCode(zipCode);
    const countryValidation = validateCountry(country);

    setStreetError(streetValidation.error);
    setCityError(cityValidation.error);
    setStateError(stateValidation.error);
    setZipCodeError(zipCodeValidation.error);
    setCountryError(countryValidation.error);

    // CHANGE: Stop if validation fails
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

  // CHANGE: Check if form is valid
  const isFormValid = () => {
    const streetValidation = validateStreet(street);
    const cityValidation = validateCity(city);
    const stateValidation = validateState(state);
    const zipCodeValidation = validateZipCode(zipCode);
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const cart = data?.myCart;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Shipping Address</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, streetError && touched.street && styles.inputError]}
          placeholder="Street Address"
          value={street}
          onChangeText={handleStreetChange}
          onBlur={handleStreetBlur}
        />
        {streetError && touched.street && (
          <Text style={styles.errorText}>{streetError}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, cityError && touched.city && styles.inputError]}
          placeholder="City"
          value={city}
          onChangeText={handleCityChange}
          onBlur={handleCityBlur}
        />
        {cityError && touched.city && (
          <Text style={styles.errorText}>{cityError}</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <TextInput
            style={[styles.input, stateError && touched.state && styles.inputError]}
            placeholder="State"
            value={state}
            onChangeText={handleStateChange}
            onBlur={handleStateBlur}
          />
          {stateError && touched.state && (
            <Text style={styles.errorText}>{stateError}</Text>
          )}
        </View>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <TextInput
            style={[styles.input, zipCodeError && touched.zipCode && styles.inputError]}
            placeholder="ZIP Code"
            value={zipCode}
            onChangeText={handleZipCodeChange}
            onBlur={handleZipCodeBlur}
          />
          {zipCodeError && touched.zipCode && (
            <Text style={styles.errorText}>{zipCodeError}</Text>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, countryError && touched.country && styles.inputError]}
          placeholder="Country"
          value={country}
          onChangeText={handleCountryChange}
          onBlur={handleCountryBlur}
        />
        {countryError && touched.country && (
          <Text style={styles.errorText}>{countryError}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // CHANGE: Add header back button styling
  headerBackButton: {
    marginLeft: 15,
    padding: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  // CHANGE: Add input container for error message spacing
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  // CHANGE: Add error state styling
  inputError: {
    borderColor: '#ff3b30',
    borderWidth: 2,
  },
  // CHANGE: Add error text styling
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  // CHANGE: Add disabled button styling
  placeOrderButtonDisabled: {
    backgroundColor: '#B0D4FF',
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;