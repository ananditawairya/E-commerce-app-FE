import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import client from './src/utils/apolloClient';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Root application component.
 * @return {React.JSX.Element} App provider and navigation tree.
 */
const App = () => {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <AppNavigator />
      </ApolloProvider>
    </SafeAreaProvider>
  );
};

export default App;
