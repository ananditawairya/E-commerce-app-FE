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

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const role = await AsyncStorage.getItem('userRole');

      if (token && role) {
        // CHANGE: Validate token before setting authenticated state
        try {
          const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: `query { me(token: "${token}") { id } }`,
            }),
          });

          const result = await response.json();

          if (result.errors || !result.data?.me) {
            // CHANGE: Token invalid - clear storage and stay logged out
            await AsyncStorage.clear();
            console.log('⚠️ Invalid token cleared on startup');
            return;
          }

          // CHANGE: Token valid - proceed with authenticated state
          setIsAuthenticated(true);
          setUserRole(role);
        } catch (validationError) {
          // CHANGE: Validation failed - clear storage
          console.log('Token validation error:', validationError);
          await AsyncStorage.clear();
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
      const role = await AsyncStorage.getItem('userRole');

      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
      }
    } catch (error) {
      console.log('Auth success error:', error);
    }
  };

  // CHANGE: Add logout handler to clear authentication state
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
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
