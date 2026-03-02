const DEFAULT_API_BASE_URL = 'http://65.0.242.12';

/**
 * API base URL for frontend network requests.
 * Uses Expo env override when available.
 * @type {string}
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE_URL;
