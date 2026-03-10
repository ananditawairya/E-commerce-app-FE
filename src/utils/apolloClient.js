import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { fromPromise } from '@apollo/client/link/utils';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RetryLink } from '@apollo/client/link/retry';
import { API_BASE_URL } from '../config/api';

const httpLink = createHttpLink({
  uri: `${API_BASE_URL}/graphql`,
});

let isRefreshing = false;
let pendingRequests = [];
const GRAPHQL_WARNING_THROTTLE_MS = 15_000;
const SUPPRESSED_GRAPHQL_MESSAGES = new Set([
  'Invalid credentials',
  'Seller access required',
]);
const STOCK_VALIDATION_OPERATION_NAMES = new Set([
  'AddToCart',
  'UpdateCartItem',
  'Checkout',
]);
const STOCK_VALIDATION_SUPPRESSED_PATTERNS = [
  /insufficient stock/i,
  /cannot add \d+ units/i,
  /you already have \d+ in cart/i,
  /you can add up to \d+ more units?/i,
];
const NO_REFRESH_OPERATION_NAMES = new Set([
  'Login',
  'Register',
  'GetProducts',
  'GetProduct',
  'GetCategories',
  'GetSearchSuggestions',
  'GetTrendingProducts',
  'GetSimilarProducts',
  'SendChatMessage',
]);
const graphqlWarningLogTimestamps = new Map();

/**
 * Determines whether a GraphQL error should be logged.
 * @param {{
 *   message?: string,
 *   operationName?: string,
 *   path?: Array<string>|string,
 * }} params Error metadata.
 * @return {boolean} Whether to emit a warning log.
 */
const shouldLogGraphQLError = ({ message, operationName, path }) => {
  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  if (SUPPRESSED_GRAPHQL_MESSAGES.has(normalizedMessage)) {
    return false;
  }
  if (
    STOCK_VALIDATION_OPERATION_NAMES.has(operationName || '')
    && STOCK_VALIDATION_SUPPRESSED_PATTERNS.some((pattern) => pattern.test(normalizedMessage))
  ) {
    return false;
  }

  const normalizedPath = Array.isArray(path)
    ? path.join('.')
    : (path || 'unknown');
  const operationKey = operationName || 'anonymous';
  const warningKey = `${operationKey}:${normalizedPath}:${normalizedMessage}`;
  const now = Date.now();
  const lastLoggedAt = graphqlWarningLogTimestamps.get(warningKey) || 0;

  if (now - lastLoggedAt < GRAPHQL_WARNING_THROTTLE_MS) {
    return false;
  }

  graphqlWarningLogTimestamps.set(warningKey, now);
  return true;
};

/**
 * Resolves all queued requests waiting for token refresh.
 * @return {void}
 */
const resolvePendingRequests = () => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

/**
 * Refreshes the access token using the refresh token.
 * @param {string=} refreshTokenOverride Refresh token value when already loaded.
 * @return {Promise<string>} New access token.
 */
const refreshAccessToken = async (refreshTokenOverride) => {
  try {
    const rawRefreshToken = typeof refreshTokenOverride === 'string'
      ? refreshTokenOverride
      : await AsyncStorage.getItem('refreshToken');
    const refreshToken = typeof rawRefreshToken === 'string'
      ? rawRefreshToken.trim()
      : '';

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

    await AsyncStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    }

    console.log('✅ Token refreshed successfully');
    return data.accessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
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

      if (is429) {
        return false;
      }

      return isNetworkError;
    },
  },
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      if (!shouldLogGraphQLError({
        message,
        path,
        operationName: operation?.operationName,
      })) {
        return;
      }

      console.warn(
        `GraphQL error: Operation: ${operation?.operationName || 'anonymous'}, Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      if (extensions) {
        console.warn('Error extensions:', extensions);
      }
    });
  }

  if (networkError) {
    const operationName = operation?.operationName || 'anonymous';
    console.warn(`Network error: Operation: ${operationName}, ${networkError}`);
    if (networkError.statusCode) {
      console.warn(`Status Code: ${networkError.statusCode}`);
    }
    if (networkError.result) {
      console.warn(`Network Error Result:`, networkError.result);
    }

    if (networkError.statusCode === 429) {
      console.warn('⚠️ Rate limit exceeded');
    }

    if (networkError.statusCode === 401 || networkError.statusCode === 403) {
      const refreshOperationName = operation?.operationName || '';
      const isNonRefreshOperation = NO_REFRESH_OPERATION_NAMES.has(refreshOperationName);

      return fromPromise(
        AsyncStorage.getItem('refreshToken').then((storedRefreshToken) => (
          typeof storedRefreshToken === 'string' ? storedRefreshToken.trim() : ''
        ))
      )
        .filter((refreshToken) => !isNonRefreshOperation && Boolean(refreshToken))
        .flatMap((refreshToken) => {
          if (isRefreshing) {
            return fromPromise(
              new Promise((resolve) => {
                pendingRequests.push(() => resolve());
              })
            ).flatMap(() => forward(operation));
          }

          isRefreshing = true;

          return fromPromise(
            refreshAccessToken(refreshToken)
              .then((newToken) => {
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
        });
    }
  }
});

const REMOVED_APOLLO_OPTION_KEYS = ['canonizeResults'];

/**
 * Removes Apollo options that were removed in newer client versions.
 * @param {object|undefined|null} options Raw Apollo options.
 * @return {object|undefined|null} Sanitized options.
 */
const sanitizeRemovedApolloOptions = (options) => {
  if (!options || typeof options !== 'object') {
    return options;
  }

  let sanitizedOptions = options;

  REMOVED_APOLLO_OPTION_KEYS.forEach((optionKey) => {
    if (Object.prototype.hasOwnProperty.call(sanitizedOptions, optionKey)) {
      if (sanitizedOptions === options) {
        sanitizedOptions = { ...options };
      }
      delete sanitizedOptions[optionKey];
    }
  });

  return sanitizedOptions;
};

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

/**
 * Ensures removed Apollo options are not passed to runtime internals.
 * @param {ApolloClient<object>} apolloClientInstance Apollo client instance.
 * @return {void}
 */
const patchRemovedApolloOptions = (apolloClientInstance) => {
  if (!apolloClientInstance) {
    return;
  }

  if (apolloClientInstance.defaultOptions?.watchQuery) {
    apolloClientInstance.defaultOptions.watchQuery = sanitizeRemovedApolloOptions(
      apolloClientInstance.defaultOptions.watchQuery
    );
  }
  if (apolloClientInstance.defaultOptions?.query) {
    apolloClientInstance.defaultOptions.query = sanitizeRemovedApolloOptions(
      apolloClientInstance.defaultOptions.query
    );
  }

  const originalWatchQuery = apolloClientInstance.watchQuery.bind(apolloClientInstance);
  apolloClientInstance.watchQuery = (options) => (
    originalWatchQuery(sanitizeRemovedApolloOptions(options))
  );

  const originalQuery = apolloClientInstance.query.bind(apolloClientInstance);
  apolloClientInstance.query = (options) => (
    originalQuery(sanitizeRemovedApolloOptions(options))
  );

  if (apolloClientInstance.cache?.diff) {
    const originalDiff = apolloClientInstance.cache.diff.bind(apolloClientInstance.cache);
    apolloClientInstance.cache.diff = (options) => (
      originalDiff(sanitizeRemovedApolloOptions(options))
    );
  }
};

patchRemovedApolloOptions(client);

export default client;
