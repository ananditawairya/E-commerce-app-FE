import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomDropdown = ({
  value,
  onValueChange,
  items,
  placeholder,
  label,
  error,
  touched,
  enabled = true,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedItem = items.find(item => item.value === value);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const openModal = () => {
    if (!enabled) return;
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      setSearchText('');
    });
  };

  const handleSelect = (itemValue) => {
    onValueChange(itemValue);
    closeModal();
  };

  const renderItem = ({ item }) => {
    const isSelected = item.value === value;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {item.label}
        </Text>
        {isSelected && (
          <MaterialIcons name="check" size={22} color="#2563EB" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          !enabled && styles.disabledButton,
          error && touched && styles.errorButton,
        ]}
        onPress={openModal}
        activeOpacity={enabled ? 0.7 : 1}
      >
        <View style={styles.buttonContent}>
          {icon && (
            <MaterialIcons
              name={icon}
              size={20}
              color={value ? '#374151' : '#9CA3AF'}
              style={styles.leftIcon}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              !value && styles.placeholderText,
              !enabled && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <MaterialIcons
            name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color={enabled ? '#6B7280' : '#D1D5DB'}
          />
        </View>
      </TouchableOpacity>
      {error && touched && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    marginBottom: 4,
  },
  disabledButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  errorButton: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 12,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectedItem: {
    backgroundColor: '#F0F9FF',
  },
  itemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedItemText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
});

export default CustomDropdown;