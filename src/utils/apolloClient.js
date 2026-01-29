import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    console.log('Apollo Auth Link - Token retrieved:', token ? 'Token exists' : 'No token found');
    
    if (token && typeof token === 'string' && token.trim().length > 0) {
      console.log('Apollo Auth Link - Adding authorization header');
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
      };
    } else {
      console.log('Apollo Auth Link - No valid token, proceeding without auth header');
      return {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      };
    }
  } catch (error) {
    console.error('Apollo Auth Link - Error retrieving token:', error);
    return {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    };
  }
});

// CHANGE: Add error link to capture and log GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    // CHANGE: Log more details about network errors
    if (networkError.statusCode) {
      console.error(`Status Code: ${networkError.statusCode}`);
    }
    if (networkError.result) {
      console.error(`Network Error Result:`, networkError.result);
    }
  }
});

const client = new ApolloClient({
  // CHANGE: Add error link to the chain
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;