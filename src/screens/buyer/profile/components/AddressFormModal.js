import React from 'react';
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import CustomDropdown from '../../../../atoms/CustomDropdown';
import styles from '../styles';

/**
 * Address create/edit modal form.
 * @param {{
 *   addressForm: object,
 *   availableCities: string[],
 *   availableStates: string[],
 *   cityError: string,
 *   countryError: string,
 *   countryItems: Array<{label: string, value: string}>,
 *   editingAddress: object|null,
 *   isSaveDisabled: boolean,
 *   onCityChange: (value: string) => void,
 *   onClose: () => void,
 *   onCountryChange: (value: string) => void,
 *   onIsDefaultChange: (value: boolean) => void,
 *   onSave: () => void,
 *   onStateChange: (value: string) => void,
 *   onStreetBlur: () => void,
 *   onStreetChange: (value: string) => void,
 *   onZipCodeBlur: () => void,
 *   onZipCodeChange: (value: string) => void,
 *   stateError: string,
 *   streetError: string,
 *   touched: Record<string, boolean>,
 *   visible: boolean,
 *   zipCodeError: string,
 * }} props Component props.
 * @return {React.JSX.Element} Address form modal UI.
 */
export default function AddressFormModal({
  addressForm,
  availableCities,
  availableStates,
  cityError,
  countryError,
  countryItems,
  editingAddress,
  isSaveDisabled,
  onCityChange,
  onClose,
  onCountryChange,
  onIsDefaultChange,
  onSave,
  onStateChange,
  onStreetBlur,
  onStreetChange,
  onZipCodeBlur,
  onZipCodeChange,
  stateError,
  streetError,
  touched,
  visible,
  zipCodeError,
}) {
  const zipCodeLabel = addressForm.country === 'India' ? 'PIN Code' : 'ZIP Code';
  const zipCodePlaceholder = addressForm.country === 'India' ? '110001' : '10001';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <CustomDropdown
              label="Country"
              value={addressForm.country}
              onValueChange={onCountryChange}
              items={countryItems}
              placeholder="Select Country"
              error={countryError}
              touched={touched.country}
              icon="public"
            />
            {countryError && touched.country && (
              <Text style={styles.errorText}>{countryError}</Text>
            )}

            <CustomDropdown
              label="State"
              value={addressForm.state}
              onValueChange={onStateChange}
              items={availableStates.map((stateName) => ({
                label: stateName,
                value: stateName,
              }))}
              placeholder={
                availableStates.length > 0
                  ? 'Select State'
                  : 'Select Country First'
              }
              error={stateError}
              touched={touched.state}
              enabled={availableStates.length > 0}
              icon="location-city"
            />
            {stateError && touched.state && (
              <Text style={styles.errorText}>{stateError}</Text>
            )}

            <CustomDropdown
              label="City"
              value={addressForm.city}
              onValueChange={onCityChange}
              items={availableCities.map((cityName) => ({
                label: cityName,
                value: cityName,
              }))}
              placeholder={
                availableCities.length > 0
                  ? 'Select City'
                  : 'Select State First'
              }
              error={cityError}
              touched={touched.city}
              enabled={availableCities.length > 0}
              icon="location-on"
            />
            {cityError && touched.city && (
              <Text style={styles.errorText}>{cityError}</Text>
            )}

            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[
                styles.input,
                streetError && touched.street ? styles.inputError : null,
              ]}
              value={addressForm.street}
              onChangeText={onStreetChange}
              onBlur={onStreetBlur}
              placeholder="123 Main St"
            />
            {streetError && touched.street && (
              <Text style={styles.errorText}>{streetError}</Text>
            )}

            <Text style={styles.label}>{zipCodeLabel}</Text>
            <TextInput
              style={[
                styles.input,
                zipCodeError && touched.zipCode ? styles.inputError : null,
              ]}
              value={addressForm.zipCode}
              onChangeText={onZipCodeChange}
              onBlur={onZipCodeBlur}
              placeholder={zipCodePlaceholder}
              keyboardType="default"
            />
            {zipCodeError && touched.zipCode && (
              <Text style={styles.errorText}>{zipCodeError}</Text>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.label}>Set as default address</Text>
              <Switch
                value={addressForm.isDefault}
                onValueChange={onIsDefaultChange}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={addressForm.isDefault ? '#2563EB' : '#F3F4F6'}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaveDisabled ? styles.saveButtonDisabled : null,
              ]}
              onPress={onSave}
              disabled={isSaveDisabled}
            >
              <Text style={styles.saveButtonText}>Save Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
