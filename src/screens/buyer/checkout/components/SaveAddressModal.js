import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import styles from '../styles';

/**
 * Confirmation modal to optionally save shipping address before checkout.
 * @param {{
 *   checkoutLoading: boolean,
 *   city: string,
 *   country: string,
 *   onClose: () => void,
 *   onPlaceWithoutSaving: () => void,
 *   onSaveAndPlace: () => void,
 *   state: string,
 *   street: string,
 *   visible: boolean,
 *   zipCode: string,
 * }} props Component props.
 * @return {React.JSX.Element} Save-address modal UI.
 */
export default function SaveAddressModal({
  checkoutLoading,
  city,
  country,
  onClose,
  onPlaceWithoutSaving,
  onSaveAndPlace,
  state,
  street,
  visible,
  zipCode,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
              onPress={onPlaceWithoutSaving}
              disabled={checkoutLoading}
            >
              <Text style={styles.modalButtonSecondaryText}>
                No, Just Place Order
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={onSaveAndPlace}
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
  );
}
