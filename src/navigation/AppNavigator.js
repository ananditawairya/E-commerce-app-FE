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

// Seller Screens
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import OrdersScreen from '../screens/seller/OrdersScreen';

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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Products">
        {/* CHANGE: Pass onLogout callback to ProductListScreen */}
        {(props) => <ProductListScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Cart" component={CartScreen} />
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
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="MyProducts">
        {/* CHANGE: Pass onLogout callback to SellerProductsScreen */}
        {(props) => <SellerProductsScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
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
        setIsAuthenticated(true);
        setUserRole(role);
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
    } catch (error) {
      console.log('Logout error:', error);
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
              options={{ title: 'Checkout' }}
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