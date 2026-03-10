import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LOGIN } from '../../graphql/mutations';
import { validateEmail, validateRequired } from '../../utils/validators';

const AUTH_ROUTES = {
  REGISTER: 'Register',
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  USER_ROLE: 'userRole',
};

const TOUCHED_INITIAL_STATE = {
  email: false,
  password: false,
};

const TOUCHED_SUBMITTED_STATE = {
  email: true,
  password: true,
};

const ICON_COLOR = '#6b7280';
const PLACEHOLDER_COLOR = '#9ca3af';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * Login screen for existing users.
 * @param {{
 *   navigation: object,
 *   onAuthSuccess?: () => void,
 * }} props Screen props.
 * @return {React.JSX.Element} Login screen UI.
 */
export function LoginScreen({ navigation, onAuthSuccess, onGuestLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState(TOUCHED_INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: async (data) => {
      try {
        const loginData = data?.login;
        const userData = loginData?.user;
        const accessToken = loginData?.accessToken;
        const refreshToken = loginData?.refreshToken;
        const userId = userData?.id;
        const userRole = userData?.role;

        if (!accessToken || !refreshToken || !userId || !userRole) {
          throw new Error('Invalid login response data');
        }

        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);

        onAuthSuccess?.();
      } catch (error) {
        console.error('Login storage error:', error);
        const message =
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        Alert.alert('Error', `Failed to save credentials: ${message}`);
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      Alert.alert('Login Failed', error.message);
    },
  });

  /**
   * Validates email field.
   * @param {string} value Field value.
   * @return {{isValid: boolean, error: string}} Validation result.
   */
  const validateEmailField = (value) => {
    const validation = validateEmail(value);
    setEmailError(validation.error);
    return validation;
  };

  /**
   * Validates password field.
   * @param {string} value Field value.
   * @return {{isValid: boolean, error: string}} Validation result.
   */
  const validatePasswordField = (value) => {
    const validation = validateRequired(value, 'Password');
    setPasswordError(validation.error);
    return validation;
  };

  /**
   * Handles email change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handleEmailChange = (text) => {
    setEmail(text);
    if (!touched.email) {
      return;
    }
    validateEmailField(text);
  };

  /**
   * Handles password change.
   * @param {string} text Input text.
   * @return {void} No return value.
   */
  const handlePasswordChange = (text) => {
    setPassword(text);
    if (!touched.password) {
      return;
    }
    validatePasswordField(text);
  };

  /**
   * Handles email blur.
   * @return {void} No return value.
   */
  const handleEmailBlur = () => {
    setTouched((prevState) => ({ ...prevState, email: true }));
    validateEmailField(email);
  };

  /**
   * Handles password blur.
   * @return {void} No return value.
   */
  const handlePasswordBlur = () => {
    setTouched((prevState) => ({ ...prevState, password: true }));
    validatePasswordField(password);
  };

  /**
   * Handles toggle password visibility.
   * @return {void} No return value.
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword((isVisible) => !isVisible);
  };

  /**
   * Handles navigate to register.
   * @return {void} No return value.
   */
  const handleNavigateToRegister = () => {
    navigation.navigate(AUTH_ROUTES.REGISTER);
  };

  /**
   * Handles login.
   * @return {void} No return value.
   */
  const handleLogin = () => {
    setTouched(TOUCHED_SUBMITTED_STATE);

    const emailValidation = validateEmailField(email);
    const passwordValidation = validatePasswordField(password);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    login({
      variables: { email: normalizedEmail, password },
    });
  };

  const isFormValid = validateEmail(email).isValid &&
    validateRequired(password, 'Password').isValid;
  const emailHasError = touched.email && Boolean(emailError);
  const passwordHasError = touched.password && Boolean(passwordError);
  const passwordVisibilityIconName = showPassword
    ? 'eye-off-outline'
    : 'eye-outline';

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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      emailHasError ? styles.inputErrorContainer : null,
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
                      placeholder="Enter your email"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={handleEmailBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>
                  {emailHasError && (
                    <Text style={styles.errorText}>{emailError}</Text>
                  )}
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      passwordHasError ? styles.inputErrorContainer : null,
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
                      placeholder="Enter your password"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={handleTogglePasswordVisibility}
                    >
                      <Ionicons
                        name={passwordVisibilityIconName}
                        size={20}
                        color={ICON_COLOR}
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordHasError && (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    !isFormValid || loading ? styles.buttonDisabled : null,
                  ]}
                  onPress={handleLogin}
                  disabled={loading || !isFormValid}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNavigateToRegister}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>
                    Don't have an account?{' '}
                    <Text style={styles.linkTextBold}>Create Account</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onGuestLogin}
                  style={styles.guestButton}
                >
                  <Text style={styles.guestButtonText}>Browse as Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
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
    marginBottom: 20,
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
    height: 56,
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
  button: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  guestButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
});
