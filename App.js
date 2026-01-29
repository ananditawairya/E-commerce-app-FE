import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './src/utils/apolloClient';
import AppNavigator from './src/navigation/AppNavigator';


const App = () => {
  return (
    <ApolloProvider client={client}>
      <AppNavigator />
    </ApolloProvider>
  );
};

export default App;