import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REGISTER } from '../../graphql/mutations';
import { validateEmail, validatePassword, validateName, validatePasswordMatch } from '../../utils/validators';

const RegisterScreen = ({ navigation, onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');

  // CHANGE: Add validation error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [register, { loading }] = useMutation(REGISTER, {
    onCompleted: async (data) => {
      try {
        await AsyncStorage.setItem('accessToken', data.register.accessToken);
        await AsyncStorage.setItem('refreshToken', data.register.refreshToken);
        await AsyncStorage.setItem('userRole', data.register.user.role);
        await AsyncStorage.setItem('userId', data.register.user.id);
        
        Alert.alert('Success', 'Account created successfully!');
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to save credentials');
      }
    },
    onError: (error) => {
      Alert.alert('Registration Failed', error.message);
    },
  });

  // CHANGE: Real-time validation handlers
  const handleNameChange = (text) => {
    setName(text);
    if (touched.name) {
      const validation = validateName(text);
      setNameError(validation.error);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (touched.email) {
      const validation = validateEmail(text);
      setEmailError(validation.error);
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (touched.password) {
      const validation = validatePassword(text);
      setPasswordError(validation.error);
    }
    // CHANGE: Re-validate confirm password if it's been touched
    if (touched.confirmPassword && confirmPassword) {
      const matchValidation = validatePasswordMatch(text, confirmPassword);
      setConfirmPasswordError(matchValidation.error);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (touched.confirmPassword) {
      const validation = validatePasswordMatch(password, text);
      setConfirmPasswordError(validation.error);
    }
  };

  // CHANGE: Blur handlers
  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    const validation = validateName(name);
    setNameError(validation.error);
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const validation = validateEmail(email);
    setEmailError(validation.error);
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const validation = validatePassword(password);
    setPasswordError(validation.error);
  };

  const handleConfirmPasswordBlur = () => {
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    const validation = validatePasswordMatch(password, confirmPassword);
    setConfirmPasswordError(validation.error);
  };

  // CHANGE: Enhanced validation before submission
  const handleRegister = () => {
    // CHANGE: Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // CHANGE: Validate all fields
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validatePasswordMatch(password, confirmPassword);

    setNameError(nameValidation.error);
    setEmailError(emailValidation.error);
    setPasswordError(passwordValidation.error);
    setConfirmPasswordError(confirmPasswordValidation.error);

    // CHANGE: Stop if validation fails
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

  // CHANGE: Check if form is valid
  const isFormValid = () => {
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validatePasswordMatch(password, confirmPassword);

    return (
      nameValidation.isValid &&
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, nameError && touched.name && styles.inputError]}
            placeholder="Full Name"
            value={name}
            onChangeText={handleNameChange}
            onBlur={handleNameBlur}
          />
          {nameError && touched.name && (
            <Text style={styles.errorText}>{nameError}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, emailError && touched.email && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError && touched.email && (
            <Text style={styles.errorText}>{emailError}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, passwordError && touched.password && styles.inputError]}
            placeholder="Password"
            value={password}
            onChangeText={handlePasswordChange}
            onBlur={handlePasswordBlur}
            secureTextEntry
          />
          {passwordError && touched.password && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, confirmPasswordError && touched.confirmPassword && styles.inputError]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            onBlur={handleConfirmPasswordBlur}
            secureTextEntry
          />
          {confirmPasswordError && touched.confirmPassword && (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          )}
        </View>

        <Text style={styles.label}>I want to:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
            onPress={() => setRole('buyer')}
          >
            <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>
              Buy Products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, role === 'seller' && styles.roleButtonActive]}
            onPress={() => setRole('seller')}
          >
            <Text style={[styles.roleText, role === 'seller' && styles.roleTextActive]}>
              Sell Products
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !isFormValid() && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading || !isFormValid()}
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
            Already have an account? <Text style={styles.linkTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 24,
    color: '#111827',
  },
  // CHANGE: Add input container for error message spacing
  inputContainer: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  // CHANGE: Add error state styling
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  // CHANGE: Add error text styling
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 5,
    color: '#111827',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#E8F0FF',
  },
  roleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#1D4ED8',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  // CHANGE: Add disabled button styling
  buttonDisabled: {
    backgroundColor: '#AFC7FF',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkTextBold: {
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default RegisterScreen;
