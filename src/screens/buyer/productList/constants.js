/**
 * Product list configuration values.
 */
export const PAGE_SIZE = 12;
export const DEFAULT_SORT = 'NEWEST';
export const DEFAULT_PRICE_KEY = 'all';
export const PRODUCT_DETAIL_ROUTE = 'ProductDetail';
export const ALL_CATEGORIES_LABEL = 'All Categories';

/** Available sort options for the product list screen. */
export const SORT_OPTIONS = [
  { label: 'Newest', value: DEFAULT_SORT },
  { label: 'Top Match', value: 'RELEVANCE' },
  { label: 'Price Low to High', value: 'PRICE_LOW_TO_HIGH' },
  { label: 'Price High to Low', value: 'PRICE_HIGH_TO_LOW' },
  { label: 'Name A-Z', value: 'NAME_A_TO_Z' },
];

/** Available price filter options for the product list screen. */
export const PRICE_OPTIONS = [
  { key: DEFAULT_PRICE_KEY, label: 'Any Price' },
  { key: 'budget', label: 'Under $50', min: 0, max: 50 },
  { key: 'mid', label: '$50-$150', min: 50, max: 150 },
  { key: 'premium', label: '$150+', min: 150 },
];
