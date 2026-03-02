import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './src/utils/apolloClient';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Root application component.
 * @return {React.JSX.Element} App provider and navigation tree.
 */
const App = () => {
  return (
    <ApolloProvider client={client}>
      <AppNavigator />
    </ApolloProvider>
  );
};

export default App;
