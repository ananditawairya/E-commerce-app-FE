import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Buyer Screens
import ProductListScreen from '../screens/buyer/ProductListScreen';
import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import CartScreen from '../screens/buyer/CartScreen';
import CheckoutScreen from '../screens/buyer/CheckoutScreen';
import ProfileScreen from '../screens/buyer/ProfileScreen';
import OrderHistoryScreen from '../screens/buyer/OrderHistoryScreen';
import OrderDetailScreen from '../screens/buyer/OrderDetailScreen';

// Seller Screens
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import OrdersScreen from '../screens/seller/OrdersScreen';
import AnalyticsScreen from '../screens/seller/AnalyticsScreen';
import { API_BASE_URL } from '../config/api';
import apolloClient from '../utils/apolloClient';
import theme from '../theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const AUTH_STORAGE_KEYS = ['accessToken', 'refreshToken', 'userRole', 'userId'];
const AUTH_BOOTSTRAP_ERROR_MESSAGE =
  'Cannot connect to server right now. Check backend and network, then retry.';

/**
 * Determines whether an error came from timeout/network connectivity.
 * @param {unknown} error Request error object.
 * @return {boolean} True if the request failed due to network/timeout.
 */
const isNetworkLikeError = (error) => {
  const errorName = typeof error?.name === 'string' ? error.name : '';
  const message = typeof error?.message === 'string' ? error.message : '';
  const normalized = message.toLowerCase();

  if (errorName === 'AbortError' || errorName === 'RequestTimeoutError') {
    return true;
  }

  return normalized.includes('network request failed') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('timed out');
};

/**
 * Executes a JSON request with timeout.
 * @param {string} url Endpoint URL.
 * @param {RequestInit} options Fetch options.
 * @param {number} [timeoutMs=AUTH_REQUEST_TIMEOUT_MS] Timeout in milliseconds.
 * @return {Promise<{response: Response, data: object}>} HTTP response and parsed JSON.
 */
const fetchJsonWithTimeout = async (url, options, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) => {
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: abortController.signal,
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutError.name = 'RequestTimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

/**
 * Buyer bottom tab navigator.
 * @param {{onLogout: () => Promise<void>}} props Component props.
 * @return {React.JSX.Element} Buyer tab navigation.
 */
const BuyerTabs = ({ onLogout }) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Products') iconName = 'home';
          else if (route.name === 'Cart') iconName = 'shopping-cart';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Products">
        {(props) => <ProductListScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

/**
 * Guest buyer bottom tab navigator (no Cart or Profile).
 * @param {{onSignIn: () => void}} props Component props.
 * @return {React.JSX.Element} Guest tab navigation.
 */
const GuestBuyerTabs = ({ onSignIn }) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Products') iconName = 'home';
          else if (route.name === 'SignIn') iconName = 'login';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Products">
        {(props) => <ProductListScreen {...props} isGuest onSignIn={onSignIn} />}
      </Tab.Screen>
      <Tab.Screen
        name="SignIn"
        options={{ tabBarLabel: 'Sign In' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            onSignIn();
          },
        }}
      >
        {() => null}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

/**
 * Seller bottom tab navigator.
 * @param {{onLogout: () => Promise<void>}} props Component props.
 * @return {React.JSX.Element} Seller tab navigation.
 */
const SellerTabs = ({ onLogout }) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'MyProducts') iconName = 'inventory';
          else if (route.name === 'Orders') iconName = 'list-alt';
          else if (route.name === 'Analytics') iconName = 'insights';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="MyProducts">
        {(props) => <SellerProductsScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
    </Tab.Navigator>
  );
};

/**
 * Root app navigator handling auth and role-based routes.
 * @return {React.JSX.Element} Navigation or startup state UI.
 */
const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authBootstrapError, setAuthBootstrapError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Resolves user role from access token.
   * @param {string} token Access token.
   * @return {Promise<string>} Resolved user role.
   */
  const resolveRoleFromToken = async (token) => {
    const normalizedToken = typeof token === 'string' ? token.trim() : '';
    if (!normalizedToken) {
      throw new Error('Missing access token');
    }

    const { response, data: result } = await fetchJsonWithTimeout(
      `${API_BASE_URL}/graphql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${normalizedToken}`,
        },
        body: JSON.stringify({
          query: `query MeFromToken($token: String!) { me(token: $token) { id role } }`,
          variables: { token: normalizedToken },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(result?.error || `Token validation failed with status ${response.status}`);
    }

    if (result.errors || !result.data?.me?.role) {
      throw new Error(result.errors?.[0]?.message || 'Unable to resolve role');
    }

    return result.data.me.role;
  };

  /**
   * Attempts to refresh an expired access token.
   * @return {Promise<boolean>} True if refresh succeeds.
   */
  const tryRefreshToken = async () => {
    try {
      const rawRefreshToken = await AsyncStorage.getItem('refreshToken');
      const refreshToken = typeof rawRefreshToken === 'string'
        ? rawRefreshToken.trim()
        : '';
      if (!refreshToken) return false;

      console.log('🔄 Attempting token refresh on startup...');

      const { response, data } = await fetchJsonWithTimeout(
        `${API_BASE_URL}/api/auth/refresh-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) return false;

      if (!data.accessToken) return false;

      await AsyncStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }

      console.log('✅ Token refreshed on startup');
      return true;
    } catch (error) {
      if (isNetworkLikeError(error)) {
        throw error;
      }
      console.log('❌ Token refresh failed on startup:', error.message);
      return false;
    }
  };

  /**
   * Checks persisted auth state and restores navigation session.
   * @return {Promise<void>} Completion promise.
   */
  const checkAuth = async () => {
    setAuthBootstrapError(null);

    try {
      const rawToken = await AsyncStorage.getItem('accessToken');
      const token = typeof rawToken === 'string' ? rawToken.trim() : '';
      const rawRole = await AsyncStorage.getItem('userRole');
      const storedRole = typeof rawRole === 'string' ? rawRole.trim() : '';

      if (token && storedRole) {
        // Validate token before setting authenticated state
        try {
          const resolvedRole = await resolveRoleFromToken(token);
          await AsyncStorage.setItem('userRole', resolvedRole);
          setIsAuthenticated(true);
          setUserRole(resolvedRole);
        } catch (firstError) {
          if (isNetworkLikeError(firstError)) {
            setIsAuthenticated(false);
            setUserRole(null);
            setAuthBootstrapError(AUTH_BOOTSTRAP_ERROR_MESSAGE);
            return;
          }

          // Token invalid — attempt refresh before logging out
          console.log('⚠️ Access token expired or invalid, attempting refresh...');
          let refreshed = false;

          try {
            refreshed = await tryRefreshToken();
          } catch (refreshNetworkError) {
            if (isNetworkLikeError(refreshNetworkError)) {
              setIsAuthenticated(false);
              setUserRole(null);
              setAuthBootstrapError(AUTH_BOOTSTRAP_ERROR_MESSAGE);
              return;
            }
            refreshed = false;
          }

          if (refreshed) {
            try {
              const newToken = await AsyncStorage.getItem('accessToken');
              if (!newToken) {
                throw new Error('Missing access token after refresh');
              }
              const refreshedRole = await resolveRoleFromToken(newToken);
              await AsyncStorage.setItem('userRole', refreshedRole);
              setIsAuthenticated(true);
              setUserRole(refreshedRole);
            } catch (refreshResolveError) {
              if (isNetworkLikeError(refreshResolveError)) {
                setIsAuthenticated(false);
                setUserRole(null);
                setAuthBootstrapError(AUTH_BOOTSTRAP_ERROR_MESSAGE);
                return;
              }
              await AsyncStorage.clear();
              console.log('⚠️ Role resolution failed after refresh:', refreshResolveError.message);
            }
          } else {
            await AsyncStorage.clear();
            console.log('Refresh failed. User must log in again.');
            setIsAuthenticated(false);
            setUserRole(null);
            setAuthBootstrapError(null);
            return;
          }
        }
      } else if (token) {
        // Role missing in storage, recover from token.
        try {
          const resolvedRole = await resolveRoleFromToken(token);
          await AsyncStorage.setItem('userRole', resolvedRole);
          setIsAuthenticated(true);
          setUserRole(resolvedRole);
        } catch (error) {
          if (isNetworkLikeError(error)) {
            setIsAuthenticated(false);
            setUserRole(null);
            setAuthBootstrapError(AUTH_BOOTSTRAP_ERROR_MESSAGE);
            return;
          }
          await AsyncStorage.clear();
          console.log('⚠️ Failed to recover role from token:', error.message);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    } catch (error) {
      console.log('Auth check error:', error);
      if (isNetworkLikeError(error)) {
        setAuthBootstrapError(AUTH_BOOTSTRAP_ERROR_MESSAGE);
      }
      setIsAuthenticated(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles post-login auth state setup.
   * @return {Promise<void>} Completion promise.
   */
  const handleAuthSuccess = async () => {
    try {
      const rawToken = await AsyncStorage.getItem('accessToken');
      const token = typeof rawToken === 'string' ? rawToken.trim() : '';

      if (token) {
        const resolvedRole = await resolveRoleFromToken(token);
        await AsyncStorage.setItem('userRole', resolvedRole);
        await apolloClient.clearStore();
        setIsAuthenticated(true);
        setUserRole(resolvedRole);
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.log('Auth success error:', error);
      try {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          const newToken = await AsyncStorage.getItem('accessToken');
          if (!newToken) {
            throw new Error('Missing refreshed token');
          }
          const resolvedRole = await resolveRoleFromToken(newToken);
          await AsyncStorage.setItem('userRole', resolvedRole);
          await apolloClient.clearStore();
          setIsAuthenticated(true);
          setUserRole(resolvedRole);
          return;
        }
      } catch (refreshError) {
        console.log('Auth success recovery failed:', refreshError.message);
      }
      await AsyncStorage.clear();
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  /**
   * Clears auth state and logs out the current user.
   * @return {Promise<void>} Completion promise.
   */
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      await apolloClient.clearStore();
      setIsAuthenticated(false);
      setIsGuest(false);
      setUserRole(null);

      console.log('✅ Logout successful - state cleared');
    } catch (error) {
      console.log('Logout error:', error);

      setIsAuthenticated(false);
      setIsGuest(false);
      setUserRole(null);
    }
  };

  /**
   * Enters guest browsing mode.
   * @return {Promise<void>} Completion promise.
   */
  const handleGuestLogin = async () => {
    try {
      await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
      await apolloClient.clearStore();
    } catch (error) {
      console.log('Guest login cleanup error:', error);
    } finally {
      setIsAuthenticated(false);
      setUserRole(null);
      setIsGuest(true);
    }
  };

  /**
   * Exits guest mode so the user sees Login/Register.
   * @return {void}
   */
  const handleGuestToAuth = () => {
    setIsGuest(false);
  };

  /**
   * Retries startup auth checks.
   * @return {void}
   */
  const handleRetryBootstrap = () => {
    setLoading(true);
    checkAuth();
  };

  if (loading) {
    return (
      <View style={styles.bootstrapContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.bootstrapTitle}>Checking your session...</Text>
        <Text style={styles.bootstrapSubtitle}>Connecting to services and restoring account state.</Text>
      </View>
    );
  }

  if (authBootstrapError) {
    return (
      <View style={styles.bootstrapContainer}>
        <MaterialIcons name="cloud-off" size={36} color={theme.colors.textSecondary} />
        <Text style={styles.bootstrapTitle}>Server Unreachable</Text>
        <Text style={styles.bootstrapErrorText}>{authBootstrapError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetryBootstrap} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated && !isGuest ? (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onAuthSuccess={handleAuthSuccess}
                  onGuestLogin={handleGuestLogin}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => <RegisterScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          </>
        ) : !isAuthenticated && isGuest ? (
          <>
            <Stack.Screen name="GuestHome">
              {(props) => <GuestBuyerTabs {...props} onSignIn={handleGuestToAuth} />}
            </Stack.Screen>
            <Stack.Screen name="ProductDetail">
              {(props) => (
                <ProductDetailScreen
                  {...props}
                  isGuest
                  onSignIn={handleGuestToAuth}
                />
              )}
            </Stack.Screen>
          </>
        ) : userRole === 'buyer' ? (
          <>
            <Stack.Screen name="BuyerHome">
              {(props) => <BuyerTabs {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="OrderHistory"
              component={OrderHistoryScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="SellerHome">
              {(props) => <SellerTabs {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{
                headerShown: true,
                headerBackTitleVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  bootstrapContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bootstrapTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  bootstrapSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bootstrapErrorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    minWidth: 132,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AppNavigator;
