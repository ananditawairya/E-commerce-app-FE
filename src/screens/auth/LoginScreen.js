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

const LoginScreen = ({ navigation, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: async (data) => {
      try {
        // CHANGE: Enhanced token storage with validation and error handling
        const { accessToken, refreshToken } = data.login;
        const { id, role } = data.login.user;

        // CHANGE: Validate tokens before storing
        if (!accessToken || !refreshToken || !id || !role) {
          throw new Error('Invalid login response data');
        }

        console.log('Login Success - Storing tokens and user data');
        
        // CHANGE: Store tokens and user data with error handling for each operation
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('userRole', role);
        await AsyncStorage.setItem('userId', id);
        
        // CHANGE: Verify storage by reading back the values
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
        
        // CHANGE: Use callback with slight delay to ensure storage completion
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

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // CHANGE: Add input validation
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    console.log('Attempting login for:', email);
    
    login({
      variables: { email: email.toLowerCase().trim(), password },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
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