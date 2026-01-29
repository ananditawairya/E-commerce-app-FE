import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGIN } from '../../graphql/mutations';
import { validateEmail, validatePassword } from '../../utils/validators';

const LoginScreen = ({ navigation, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // CHANGE: Add validation error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: async (data) => {
      try {
        const { accessToken, refreshToken } = data.login;
        const { id, role } = data.login.user;

        if (!accessToken || !refreshToken || !id || !role) {
          throw new Error('Invalid login response data');
        }

        console.log('Login Success - Storing tokens and user data');
        
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('userRole', role);
        await AsyncStorage.setItem('userId', id);
        
        const storedToken = await AsyncStorage.getItem('accessToken');
        const storedRole = await AsyncStorage.getItem('userRole');
        
        console.log('Login Success - Verification:', {
          tokenStored: !!storedToken,
          roleStored: !!storedRole,
          tokenLength: storedToken?.length || 0
        });
        
        if (!storedToken || !storedRole) {
          throw new Error('Failed to verify stored credentials');
        }
        
        Alert.alert('Success', 'Login successful!');
        
        if (onAuthSuccess) {
          setTimeout(() => {
            onAuthSuccess();
          }, 100);
        }
      } catch (error) {
        console.error('Login storage error:', error);
        Alert.alert('Error', 'Failed to save credentials: ' + error.message);
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      Alert.alert('Login Failed', error.message);
    },
  });

  // CHANGE: Real-time email validation
  const handleEmailChange = (text) => {
    setEmail(text);
    if (touched.email) {
      const validation = validateEmail(text);
      setEmailError(validation.error);
    }
  };

  // CHANGE: Real-time password validation
  const handlePasswordChange = (text) => {
    setPassword(text);
    if (touched.password) {
      const validation = validatePassword(text);
      setPasswordError(validation.error);
    }
  };

  // CHANGE: Validate on blur
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

  // CHANGE: Enhanced validation before submission
  const handleLogin = () => {
    // CHANGE: Mark all fields as touched
    setTouched({ email: true, password: true });

    // CHANGE: Validate all fields
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation.error);
    setPasswordError(passwordValidation.error);

    // CHANGE: Stop if validation fails
    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    console.log('Attempting login for:', email);
    
    login({
      variables: { email: email.toLowerCase().trim(), password },
    });
  };

  // CHANGE: Disable login button if validation fails
  const isFormValid = () => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    return emailValidation.isValid && passwordValidation.isValid;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, emailError && touched.email && styles.inputError]}
          placeholder="Email"
          value={email}
          onChangeText={handleEmailChange}
          onBlur={handleEmailBlur}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
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
          autoComplete="password"
        />
        {passwordError && touched.password && (
          <Text style={styles.errorText}>{passwordError}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, !isFormValid() && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading || !isFormValid()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  // CHANGE: Add input container for error message spacing
  inputContainer: {
    marginBottom: 15,
  },
  input: {
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  // CHANGE: Add disabled button styling
  buttonDisabled: {
    backgroundColor: '#B0D4FF',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default LoginScreen;