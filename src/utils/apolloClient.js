import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { fromPromise } from '@apollo/client/link/utils';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RetryLink } from '@apollo/client/link/retry';

const API_BASE_URL = 'http://65.0.242.12';

const httpLink = createHttpLink({
  uri: `${API_BASE_URL}/graphql`,
});

// Token refresh state — prevents multiple simultaneous refresh requests
let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

// Refresh the access token using the stored refresh token
const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Attempting token refresh...');

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Refresh failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.accessToken) {
      throw new Error('No access token in refresh response');
    }

    // Store the new tokens
    await AsyncStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    }

    console.log('✅ Token refreshed successfully');
    return data.accessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    // Clear all auth data — force re-login
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole', 'userId']);
    throw error;
  }
};

const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (token && typeof token === 'string' && token.trim().length > 0) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
      };
    } else {
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

// Retry link with exponential backoff for rate limit errors
const retryLink = new RetryLink({
  delay: {
    initial: 1000,
    max: 10000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, operation) => {
      const is429 = error?.statusCode === 429 ||
        error?.networkError?.statusCode === 429;
      const isNetworkError = !!error?.networkError && !error?.result;

      // Don't retry auth operations to avoid account lockout
      const isAuthOperation =
        operation.operationName === 'Login' ||
        operation.operationName === 'Register';

      if (isAuthOperation && is429) {
        console.warn('⚠️ Rate limit hit on auth operation - not retrying');
        return false;
      }

      return is429 || isNetworkError;
    },
  },
});

// Error link with automatic token refresh on 401/403
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
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

    if (networkError.statusCode === 429) {
      console.error('❌ Rate limit exceeded');
    }

    // Token expired or invalid — attempt refresh
    if (networkError.statusCode === 401 || networkError.statusCode === 403) {
      // Don't try to refresh for login/register operations
      const isAuthOperation =
        operation.operationName === 'Login' ||
        operation.operationName === 'Register';

      if (isAuthOperation) {
        return;
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return fromPromise(
          new Promise((resolve) => {
            pendingRequests.push(() => resolve());
          })
        ).flatMap(() => forward(operation));
      }

      isRefreshing = true;

      return fromPromise(
        refreshAccessToken()
          .then((newToken) => {
            // Update the operation's authorization header
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${newToken}`,
              },
            });

            resolvePendingRequests();
            return newToken;
          })
          .catch((error) => {
            pendingRequests = [];
            console.error('❌ Token refresh failed, user must re-login:', error.message);
            return null;
          })
          .finally(() => {
            isRefreshing = false;
          })
      )
        .filter((value) => Boolean(value))
        .flatMap(() => forward(operation));
    }
  }
});

const client = new ApolloClient({
  link: errorLink.concat(retryLink.concat(authLink.concat(httpLink))),
  cache: new InMemoryCache({
    typePolicies: {
      Product: {
        fields: {
          variants: {
            merge: false,
          },
        },
      },
      Variant: {
        fields: {
          stock: {
            merge: false,
          },
        },
      },
      Query: {
        fields: {
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
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;