import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RetryLink } from '@apollo/client/link/retry'; // CHANGE: Add retry link
const httpLink = createHttpLink({
  uri: 'http://65.0.242.12/graphql',
  //   uri: 'http://localhost:4000/graphql', older line
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

// CHANGE: Add retry link with exponential backoff for rate limit errors
const retryLink = new RetryLink({
  delay: {
    initial: 1000, // Start with 1 second delay
    max: 10000, // Max 10 seconds
    jitter: true, // Add randomization to prevent thundering herd
  },
  attempts: {
    max: 3, // Retry up to 3 times
    retryIf: (error, operation) => {
      // CHANGE: Retry only on rate limit (429) and network errors
      const is429 = error?.statusCode === 429 ||
        error?.networkError?.statusCode === 429;
      const isNetworkError = !!error?.networkError && !error?.result;

      // CHANGE: Don't retry auth operations to avoid account lockout
      const isAuthOperation =
        operation.operationName === 'Login' ||
        operation.operationName === 'Register';

      if (isAuthOperation && is429) {
        console.warn('⚠️ Rate limit hit on auth operation - not retrying to avoid lockout');
        return false;
      }

      return is429 || isNetworkError;
    },
  },
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      // CHANGE: Log extension details for debugging
      if (extensions) {
        console.error('Error extensions:', extensions);
      }
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    if (networkError.statusCode) {
      console.error(`Status Code: ${networkError.statusCode}`);
    }
    if (networkError.result) {
      console.error(`Network Error Result:`, networkError.result);
    }
    // CHANGE: Enhanced logging for rate limit errors
    if (networkError.statusCode === 429) {
      console.error('❌ Rate limit exceeded - request will be retried with backoff');
    }
    // CHANGE: Handle 401/403 specifically
    if (networkError.statusCode === 401 || networkError.statusCode === 403) {
      console.error('❌ Authentication failed - token may be invalid or expired');
    }
  }
});

const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    // CHANGE: Configure cache policies for better real-time updates
    typePolicies: {
      Product: {
        fields: {
          variants: {
            merge: false, // CHANGE: Replace variants array completely on updates
          },
        },
      },
      Variant: {
        fields: {
          stock: {
            merge: false, // CHANGE: Replace stock value completely on updates
          },
        },
      },
      Query: {
        fields: {
          // CHANGE: Disable caching for seller products to ensure fresh stock data
          sellerProducts: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only', // CHANGE: Always fetch fresh data for queries
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;