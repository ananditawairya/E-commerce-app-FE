import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Buyer Screens
import ProductListScreen from '../screens/buyer/ProductListScreen';
import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import CartScreen from '../screens/buyer/CartScreen';
import CheckoutScreen from '../screens/buyer/CheckoutScreen';
import ProfileScreen from '../screens/buyer/ProfileScreen';
import OrderHistoryScreen from '../screens/buyer/OrderHistoryScreen';

// Seller Screens
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import OrdersScreen from '../screens/seller/OrdersScreen';
import AnalyticsScreen from '../screens/seller/AnalyticsScreen';
import { API_BASE_URL } from '../config/api';
import apolloClient from '../utils/apolloClient';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// CHANGE: Pass logout callback to buyer tabs
const BuyerTabs = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Products') iconName = 'home';
          else if (route.name === 'Cart') iconName = 'shopping-cart';
          else if (route.name==='Profile') iconName='person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E6E8EB',
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Products">
        {/* CHANGE: Pass onLogout callback to ProductListScreen */}
        {(props) => <ProductListScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

// CHANGE: Pass logout callback to seller tabs
const SellerTabs = ({ onLogout }) => {
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
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E6E8EB',
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="MyProducts">
        {/* CHANGE: Pass onLogout callback to SellerProductsScreen */}
        {(props) => <SellerProductsScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const resolveRoleFromToken = async (token) => {
    const response = await fetch(`${API_BASE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `query MeFromToken($token: String!) { me(token: $token) { id role } }`,
        variables: { token },
      }),
    });

    const result = await response.json();
    if (result.errors || !result.data?.me?.role) {
      throw new Error(result.errors?.[0]?.message || 'Unable to resolve role');
    }

    return result.data.me.role;
  };

  // Attempt to refresh the access token using the stored refresh token
  const tryRefreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      console.log('🔄 Attempting token refresh on startup...');

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (!data.accessToken) return false;

      await AsyncStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }

      console.log('✅ Token refreshed on startup');
      return true;
    } catch (error) {
      console.log('❌ Token refresh failed on startup:', error.message);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const storedRole = await AsyncStorage.getItem('userRole');

      if (token && storedRole) {
        // Validate token before setting authenticated state
        try {
          const resolvedRole = await resolveRoleFromToken(token);
          await AsyncStorage.setItem('userRole', resolvedRole);
          setIsAuthenticated(true);
          setUserRole(resolvedRole);
        } catch (firstError) {
          // Token invalid — attempt refresh before logging out
          console.log('⚠️ Access token expired or invalid, attempting refresh...');
          const refreshed = await tryRefreshToken();
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
              await AsyncStorage.clear();
              console.log('⚠️ Role resolution failed after refresh:', refreshResolveError.message);
            }
          } else {
            await AsyncStorage.clear();
            console.log('⚠️ Refresh failed — user must re-login');
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
          await AsyncStorage.clear();
          console.log('⚠️ Failed to recover role from token:', error.message);
        }
      }
    } catch (error) {
      console.log('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // CHANGE: Add authentication success handler to update state
  const handleAuthSuccess = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

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

  // CHANGE: Add logout handler to clear authentication state
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      await apolloClient.clearStore();
      setIsAuthenticated(false);
      setUserRole(null);
      // CHANGE: Don't use navigation.reset here - let state change trigger re-render
      console.log('✅ Logout successful - state cleared');
    } catch (error) {
      console.log('Logout error:', error);
      // CHANGE: Force state reset even if storage clear fails
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {/* CHANGE: Pass onAuthSuccess callback to LoginScreen */}
              {(props) => <LoginScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {/* CHANGE: Pass onAuthSuccess callback to RegisterScreen */}
              {(props) => <RegisterScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          </>
        ) : userRole === 'buyer' ? (
          <>
            <Stack.Screen name="BuyerHome">
              {/* CHANGE: Pass onLogout callback to BuyerTabs */}
              {(props) => <BuyerTabs {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                // CHANGE: Remove title and headerShown from here since ProductDetailScreen handles it
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
          </>
        ) : (
          <>
            <Stack.Screen name="SellerHome">
              {/* CHANGE: Pass onLogout callback to SellerTabs */}
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

export default AppNavigator;
