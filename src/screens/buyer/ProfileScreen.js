import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomDropdown from '../../atoms/CustomDropdown';
import { ME } from '../../graphql/queries';
import {
    ADD_ADDRESS,
    UPDATE_ADDRESS,
    REMOVE_ADDRESS,
    SET_DEFAULT_ADDRESS,
} from '../../graphql/mutations';
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

const ProfileScreen = ({ navigation, onLogout }) => {
    const [token, setToken] = useState(null);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false,
    });

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

    const availableStates = addressForm.country ? getStatesForCountry(addressForm.country) : [];
    const availableCities = addressForm.country && addressForm.state ? getCitiesForState(addressForm.country, addressForm.state) : [];

    React.useEffect(() => {
        const getToken = async () => {
            const storedToken = await AsyncStorage.getItem('accessToken');
            setToken(storedToken);
        };
        getToken();
    }, []);

    const { data, loading, error, refetch } = useQuery(ME, {
        variables: { token },
        skip: !token,
    });

    const [addAddress] = useMutation(ADD_ADDRESS);
    const [updateAddress] = useMutation(UPDATE_ADDRESS);
    const [removeAddress] = useMutation(REMOVE_ADDRESS);
    const [setDefaultAddress] = useMutation(SET_DEFAULT_ADDRESS);

    const user = data?.me;

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

    const handleStreetChange = (text) => {
        setAddressForm({ ...addressForm, street: text });
        if (touched.street) {
            const validation = validateStreet(text);
            setStreetError(validation.error);
        }
    };

    const handleCountryChange = (value) => {
        setAddressForm({ ...addressForm, country: value, state: '', city: '', zipCode: '' });
        if (touched.country) {
            const validation = validateCountry(value);
            setCountryError(validation.error);
        }
    };

    const handleStateChange = (value) => {
        setAddressForm({ ...addressForm, state: value, city: '', zipCode: '' });
        if (touched.state) {
            const validation = validateState(value);
            setStateError(validation.error);
        }
    };

    const handleCityChange = (value) => {
        setAddressForm({ ...addressForm, city: value });
        if (touched.city) {
            const validation = validateCity(value);
            setCityError(validation.error);
        }
    };

    const handleZipCodeChange = (text) => {
        setAddressForm({ ...addressForm, zipCode: text });
        if (touched.zipCode) {
            const validation = validateZipCode(text, addressForm.country, addressForm.state);
            setZipCodeError(validation.error);
        }
    };

    const handleStreetBlur = () => {
        setTouched(prev => ({ ...prev, street: true }));
        const validation = validateStreet(addressForm.street);
        setStreetError(validation.error);
    };

    const handleZipCodeBlur = () => {
        setTouched(prev => ({ ...prev, zipCode: true }));
        const validation = validateZipCode(addressForm.zipCode, addressForm.country, addressForm.state);
        setZipCodeError(validation.error);
    };

    const handleSaveAddress = async () => {
        setTouched({
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
        });

        const streetValidation = validateStreet(addressForm.street);
        const cityValidation = validateCity(addressForm.city);
        const stateValidation = validateState(addressForm.state);
        const zipCodeValidation = validateZipCode(addressForm.zipCode, addressForm.country, addressForm.state);
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
            setAddressForm({
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                isDefault: false,
            });
            setTouched({
                street: false,
                city: false,
                state: false,
                zipCode: false,
                country: false,
            });
            setStreetError('');
            setCityError('');
            setStateError('');
            setZipCodeError('');
            setCountryError('');
            refetch();
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

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
        setTouched({
            street: false,
            city: false,
            state: false,
            zipCode: false,
            country: false,
        });
        setStreetError('');
        setCityError('');
        setStateError('');
        setZipCodeError('');
        setCountryError('');
        setIsAddressModalVisible(true);
    };

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
                    } catch (err) {
                        Alert.alert('Error', err.message);
                    }
                },
            },
        ]);
    };

    const handleSetDefault = async (id) => {
        try {
            await setDefaultAddress({ variables: { id } });
            refetch();
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    const isAddressFormValid = () => {
        const streetValidation = validateStreet(addressForm.street);
        const cityValidation = validateCity(addressForm.city);
        const stateValidation = validateState(addressForm.state);
        const zipCodeValidation = validateZipCode(addressForm.zipCode, addressForm.country, addressForm.state);
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
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            setEditingAddress(null);
                            setAddressForm({
                                street: '',
                                city: '',
                                state: '',
                                zipCode: '',
                                country: '',
                                isDefault: false,
                            });
                            setTouched({
                                street: false,
                                city: false,
                                state: false,
                                zipCode: false,
                                country: false,
                            });
                            setStreetError('');
                            setCityError('');
                            setStateError('');
                            setZipCodeError('');
                            setCountryError('');
                            setIsAddressModalVisible(true);
                        }}
                    >
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
                                        <MaterialIcons name="check-circle-outline" size={20} color="#6B7280" />
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
                                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
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

            <Modal
                visible={isAddressModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsAddressModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <CustomDropdown
                                label="Country"
                                value={addressForm.country}
                                onValueChange={handleCountryChange}
                                items={[
                                    { label: 'India', value: 'India' },
                                    { label: 'United States', value: 'United States' },
                                ]}
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
                                onValueChange={handleStateChange}
                                items={availableStates.map(s => ({ label: s, value: s }))}
                                placeholder={availableStates.length > 0 ? "Select State" : "Select Country First"}
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
                                onValueChange={handleCityChange}
                                items={availableCities.map(c => ({ label: c, value: c }))}
                                placeholder={availableCities.length > 0 ? "Select City" : "Select State First"}
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
                                style={[styles.input, streetError && touched.street && styles.inputError]}
                                value={addressForm.street}
                                onChangeText={handleStreetChange}
                                onBlur={handleStreetBlur}
                                placeholder="123 Main St"
                            />
                            {streetError && touched.street && (
                                <Text style={styles.errorText}>{streetError}</Text>
                            )}

                            <Text style={styles.label}>{addressForm.country === 'India' ? 'PIN Code' : 'ZIP Code'}</Text>
                            <TextInput
                                style={[styles.input, zipCodeError && touched.zipCode && styles.inputError]}
                                value={addressForm.zipCode}
                                onChangeText={handleZipCodeChange}
                                onBlur={handleZipCodeBlur}
                                placeholder={addressForm.country === 'India' ? '110001' : '10001'}
                                keyboardType="default"
                            />
                            {zipCodeError && touched.zipCode && (
                                <Text style={styles.errorText}>{zipCodeError}</Text>
                            )}

                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Set as default address</Text>
                                <Switch
                                    value={addressForm.isDefault}
                                    onValueChange={(value) => setAddressForm({ ...addressForm, isDefault: value })}
                                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                                    thumbColor={addressForm.isDefault ? '#2563EB' : '#F3F4F6'}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.saveButton, !isAddressFormValid() && styles.saveButtonDisabled]} 
                                onPress={handleSaveAddress}
                                disabled={!isAddressFormValid()}
                            >
                                <Text style={styles.saveButtonText}>Save Address</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
    },
    section: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        marginTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
        marginLeft: 4,
    },
    addressCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
    },
    addressMain: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    street: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginRight: 8,
    },
    defaultBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    defaultText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    cityState: {
        fontSize: 14,
        color: '#6B7280',
    },
    country: {
        fontSize: 14,
        color: '#6B7280',
    },
    addressActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginLeft: 12,
        padding: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        marginTop: 8,
        color: '#9CA3AF',
        fontSize: 14,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    modalForm: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        marginBottom: 16,
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 12,
        marginLeft: 4,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#2563EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#AFC7FF',
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;