import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { REGISTER } from '../../graphql/mutations';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '../../utils/validators';

const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  USER_ROLE: 'userRole',
};

const TOUCHED_INITIAL_STATE = {
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const TOUCHED_SUBMITTED_STATE = {
  name: true,
  email: true,
  password: true,
  confirmPassword: true,
};

const ICON_COLOR = '#6b7280';
const PLACEHOLDER_COLOR = '#9ca3af';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * User registration screen.
 * @param {{
 *   navigation: object,
 *   onAuthSuccess?: () => void,
 * }} props Screen props.
 * @return {React.JSX.Element} Register screen UI.
 */
export function RegisterScreen({ navigation, onAuthSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLES.BUYER);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [touched, setTouched] = useState(TOUCHED_INITIAL_STATE);

  const [register, { loading }] = useMutation(REGISTER, {
    onCompleted: async (data) => {
      try {
        const registerData = data?.register;
        const userData = registerData?.user;
        const accessToken = registerData?.accessToken;
        const refreshToken = registerData?.refreshToken;
        const userRole = userData?.role;
        const userId = userData?.id;

        if (!accessToken || !refreshToken || !userRole || !userId) {
          throw new Error('Invalid registration response data');
        }

        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);

        onAuthSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        Alert.alert('Error', `Failed to save credentials: ${message}`);
      }
    },
    onError: (error) => {
      Alert.alert('Registration Failed', error.message);
    },
  });

  /**
   * Handles name change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleNameChange = (text) => {
    setName(text);
    if (touched.name) {
      const validation = validateName(text);
      setNameError(validation.error);
    }
  };

  /**
   * Handles email change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleEmailChange = (text) => {
    setEmail(text);
    if (touched.email) {
      const validation = validateEmail(text);
      setEmailError(validation.error);
    }
  };

  /**
   * Handles password change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handlePasswordChange = (text) => {
    setPassword(text);
    if (touched.password) {
      const validation = validatePassword(text);
      setPasswordError(validation.error);
    }
    if (touched.confirmPassword && confirmPassword) {
      const matchValidation = validatePasswordMatch(text, confirmPassword);
      setConfirmPasswordError(matchValidation.error);
    }
  };

  /**
   * Handles confirm password change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (touched.confirmPassword) {
      const validation = validatePasswordMatch(password, text);
      setConfirmPasswordError(validation.error);
    }
  };

  /**
   * Handles name blur.
   * @return {void} No return value.
   */
  const handleNameBlur = () => {
    setTouched((prevState) => ({ ...prevState, name: true }));
    const validation = validateName(name);
    setNameError(validation.error);
  };

  /**
   * Handles email blur.
   * @return {void} No return value.
   */
  const handleEmailBlur = () => {
    setTouched((prevState) => ({ ...prevState, email: true }));
    const validation = validateEmail(email);
    setEmailError(validation.error);
  };

  /**
   * Handles password blur.
   * @return {void} No return value.
   */
  const handlePasswordBlur = () => {
    setTouched((prevState) => ({ ...prevState, password: true }));
    const validation = validatePassword(password);
    setPasswordError(validation.error);
  };

  /**
   * Handles confirm password blur.
   * @return {void} No return value.
   */
  const handleConfirmPasswordBlur = () => {
    setTouched((prevState) => ({ ...prevState, confirmPassword: true }));
    const validation = validatePasswordMatch(password, confirmPassword);
    setConfirmPasswordError(validation.error);
  };

  /**
   * Handles toggle password visibility.
   * @return {void} No return value.
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword((isVisible) => !isVisible);
  };

  /**
   * Handles toggle confirm password visibility.
   * @return {void} No return value.
   */
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((isVisible) => !isVisible);
  };

  /**
   * Handles register.
   * @return {void} No return value.
   */
  const handleRegister = () => {
    setTouched(TOUCHED_SUBMITTED_STATE);

    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validatePasswordMatch(
      password,
      confirmPassword,
    );

    setNameError(nameValidation.error);
    setEmailError(emailValidation.error);
    setPasswordError(passwordValidation.error);
    setConfirmPasswordError(confirmPasswordValidation.error);

    if (
      !nameValidation.isValid ||
      !emailValidation.isValid ||
      !passwordValidation.isValid ||
      !confirmPasswordValidation.isValid
    ) {
      return;
    }

    register({
      variables: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
      },
    });
  };

  /**
   * Gets is form valid.
   * @return {boolean} Whether the condition is met.
   */
  const getIsFormValid = () => {
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validatePasswordMatch(
      password,
      confirmPassword,
    );

    return (
      nameValidation.isValid &&
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid
    );
  };

  const formIsValid = getIsFormValid();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#e0e7ff', '#f9fafb', '#fff']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Fill in your details to get started
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    touched.name && nameError
                      ? styles.inputErrorContainer
                      : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={ICON_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={name}
                    onChangeText={handleNameChange}
                    onBlur={handleNameBlur}
                  />
                </View>
                {touched.name && nameError && (
                  <Text style={styles.errorText}>{nameError}</Text>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View
                  style={[
                    styles.inputContainer,
                    touched.email && emailError
                      ? styles.inputErrorContainer
                      : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={ICON_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={handleEmailBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {touched.email && emailError && (
                  <Text style={styles.errorText}>{emailError}</Text>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    touched.password && passwordError
                      ? styles.inputErrorContainer
                      : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={ICON_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={password}
                    onChangeText={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={handleTogglePasswordVisibility}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                </View>
                {touched.password && passwordError && (
                  <Text style={styles.errorText}>{passwordError}</Text>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    touched.confirmPassword && confirmPasswordError
                      ? styles.inputErrorContainer
                      : null,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={ICON_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={handleToggleConfirmPasswordVisibility}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={20}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                </View>
                {touched.confirmPassword && confirmPasswordError && (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                )}
              </View>

              <Text style={styles.roleLabel}>I want to:</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === ROLES.BUYER ? styles.roleButtonActive : null,
                  ]}
                  onPress={() => setRole(ROLES.BUYER)}
                >
                  <Ionicons
                    name="cart-outline"
                    size={20}
                    color={role === ROLES.BUYER ? '#1d4ed8' : ICON_COLOR}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      role === ROLES.BUYER ? styles.roleTextActive : null,
                    ]}
                  >
                    Buy Products
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === ROLES.SELLER ? styles.roleButtonActive : null,
                  ]}
                  onPress={() => setRole(ROLES.SELLER)}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={20}
                    color={role === ROLES.SELLER ? '#1d4ed8' : ICON_COLOR}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      role === ROLES.SELLER ? styles.roleTextActive : null,
                    ]}
                  >
                    Sell Products
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  !formIsValid || loading ? styles.buttonDisabled : null,
                ]}
                onPress={handleRegister}
                disabled={loading || !formIsValid}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  Already have an account?{' '}
                  <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e0e7ff',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  inputErrorContainer: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 12,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  roleButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  roleIcon: {
    marginBottom: 4,
  },
  roleText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#1d4ed8',
  },
  button: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  linkTextBold: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
