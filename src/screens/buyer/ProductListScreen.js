import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NetworkStatus, useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatBot from '../../components/ChatBot';
import ProductCard from '../../components/ProductCard';
import {
  GET_CATEGORIES,
  GET_PRODUCTS,
  GET_RECOMMENDATIONS,
  GET_TRENDING_PRODUCTS,
} from '../../graphql/queries';
import {
  ALL_CATEGORIES_LABEL,
  DEFAULT_PRICE_KEY,
  DEFAULT_SORT,
  PAGE_SIZE,
  PRICE_OPTIONS,
  PRODUCT_DETAIL_ROUTE,
  SORT_OPTIONS,
} from './productList/constants';
import ProductListDiscoveryHeader from './productList/components/ProductListDiscoveryHeader';
import ProductListFilterModal from './productList/components/ProductListFilterModal';
import ProductListHeaderSection from './productList/components/ProductListHeaderSection';
import ProductListSkeletonGrid from './productList/components/ProductListSkeletonGrid';
import ProductListSortModal from './productList/components/ProductListSortModal';
import styles from './productList/styles';

/**
 * Maps recommendation payloads to product entities available in the current list.
 * @param {Array<object>} recommendations Recommendation payloads.
 * @param {Array<object>} products Product list from catalog query.
 * @return {Array<object>} Enriched product list.
 */
function enrichProducts(recommendations, products) {
  if (!recommendations?.length || !products.length) {
    return [];
  }

  return recommendations
    .map((recommendation) => {
      const product = products.find(
        (item) => item.id === recommendation.productId
      );
      return product ? { ...product, ...recommendation } : null;
    })
    .filter(Boolean);
}

/**
 * Product catalog screen with search, filters, and recommendations.
 * @param {{
 *   navigation: object,
 *   onLogout?: () => Promise<void>,
 * }} props Screen props.
 * @return {React.JSX.Element} Product list screen UI.
 */
const ProductListScreen = ({ navigation, onLogout }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSort, setSelectedSort] = useState(DEFAULT_SORT);
  const [selectedPriceKey, setSelectedPriceKey] = useState(DEFAULT_PRICE_KEY);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [userId, setUserId] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [draftCategories, setDraftCategories] = useState([]);
  const [draftPriceKey, setDraftPriceKey] = useState(DEFAULT_PRICE_KEY);
  const [draftInStockOnly, setDraftInStockOnly] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };

    getUserId();
  }, []);

  React.useEffect(() => {
    setHasMore(true);
  }, [
    debouncedSearch,
    selectedCategories,
    selectedSort,
    selectedPriceKey,
    inStockOnly,
  ]);

  React.useEffect(() => {
    if (!debouncedSearch && selectedSort === 'RELEVANCE') {
      setSelectedSort(DEFAULT_SORT);
    }
  }, [debouncedSearch, selectedSort]);

  const selectedPriceFilter = useMemo(
    () =>
      PRICE_OPTIONS.find((option) => option.key === selectedPriceKey) ||
      PRICE_OPTIONS[0],
    [selectedPriceKey]
  );

  const sortForQuery =
    selectedSort === 'RELEVANCE' && !debouncedSearch
      ? DEFAULT_SORT
      : selectedSort;

  const productQueryVariables = useMemo(
    () => ({
      search: debouncedSearch || null,
      category: selectedCategories.length === 1 ? selectedCategories[0] : null,
      categories: selectedCategories.length > 0 ? selectedCategories : null,
      minPrice:
        typeof selectedPriceFilter.min === 'number'
          ? selectedPriceFilter.min
          : null,
      maxPrice:
        typeof selectedPriceFilter.max === 'number'
          ? selectedPriceFilter.max
          : null,
      inStockOnly,
      sortBy: sortForQuery,
      limit: PAGE_SIZE,
      offset: 0,
    }),
    [
      debouncedSearch,
      selectedCategories,
      selectedPriceFilter,
      inStockOnly,
      sortForQuery,
    ]
  );

  const {
    data,
    loading,
    error,
    fetchMore,
    refetch,
    networkStatus,
  } = useQuery(GET_PRODUCTS, {
    variables: productQueryVariables,
    notifyOnNetworkStatusChange: true,
  });

  React.useEffect(() => {
    const productCount = data?.products?.length;
    if (typeof productCount === 'number') {
      setHasMore(productCount >= PAGE_SIZE);
    }
  }, [data?.products?.length]);

  const { data: recData, loading: recLoading } = useQuery(GET_RECOMMENDATIONS, {
    variables: { userId, limit: 10 },
    skip: !userId,
  });

  const { data: trendingData, loading: trendingLoading } = useQuery(
    GET_TRENDING_PRODUCTS,
    {
      variables: { limit: 10 },
    }
  );

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  const products = data?.products || [];
  const isInitialLoading = loading && products.length === 0;
  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isRefreshing = networkStatus === NetworkStatus.refetch;
  const categoryOptions = [
    ALL_CATEGORIES_LABEL,
    ...(categoriesData?.categories || []),
  ];

  const isDiscoveryMode =
    !debouncedSearch &&
    selectedCategories.length === 0 &&
    selectedSort === DEFAULT_SORT &&
    selectedPriceKey === DEFAULT_PRICE_KEY &&
    !inStockOnly;

  const selectedSortLabel =
    SORT_OPTIONS.find((item) => item.value === selectedSort)?.label ||
    SORT_OPTIONS[0].label;

  const appliedFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedPriceKey !== DEFAULT_PRICE_KEY ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (selectedSort !== DEFAULT_SORT ? 1 : 0);

  const recommendedProducts = useMemo(
    () => enrichProducts(recData?.getRecommendations, products),
    [recData?.getRecommendations, products]
  );
  const trendingProducts = useMemo(
    () => enrichProducts(trendingData?.getTrendingProducts, products),
    [trendingData?.getTrendingProducts, products]
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (onLogout) {
            await onLogout();
          } else {
            await AsyncStorage.clear();
          }
        },
      },
    ]);
  };

  /**
   * Opens sort modal.
   * @return {void} No return value.
   */
  const handleOpenSortModal = () => {
    setSortModalVisible(true);
  };

  /**
   * Closes sort modal.
   * @return {void} No return value.
   */
  const handleCloseSortModal = () => {
    setSortModalVisible(false);
  };

  /**
   * Opens filter modal.
   * @return {void} No return value.
   */
  const handleOpenFilterModal = () => {
    setDraftCategories(selectedCategories);
    setDraftPriceKey(selectedPriceKey);
    setDraftInStockOnly(inStockOnly);
    setFilterModalVisible(true);
  };

  /**
   * Closes filter modal.
   * @return {void} No return value.
   */
  const handleCloseFilterModal = () => {
    setFilterModalVisible(false);
  };

  /**
   * Clears search.
   * @return {void} No return value.
   */
  const handleClearSearch = () => {
    setSearchInput('');
  };

  /**
   * Clears all filters.
   * @return {void} No return value.
   */
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSort(DEFAULT_SORT);
    setSelectedPriceKey(DEFAULT_PRICE_KEY);
    setInStockOnly(false);
    setHasMore(true);
  };

  /**
   * Resets filters and search.
   * @return {void} No return value.
   */
  const resetFiltersAndSearch = () => {
    clearAllFilters();
    setSearchInput('');
    setDebouncedSearch('');
  };

  /**
   * Resets draft filters.
   * @return {void} No return value.
   */
  const resetDraftFilters = () => {
    setDraftCategories([]);
    setDraftPriceKey(DEFAULT_PRICE_KEY);
    setDraftInStockOnly(false);
  };

  /**
   * Applies filter modal.
   * @return {void} No return value.
   */
  const applyFilterModal = () => {
    setSelectedCategories(draftCategories);
    setSelectedPriceKey(draftPriceKey);
    setInStockOnly(draftInStockOnly);
    setFilterModalVisible(false);
  };

  /**
   * Toggles one category in draft filters.
   * @param {string} categoryName Category label.
   * @return {void} No return value.
   */
  const handleToggleDraftCategory = (categoryName) => {
    if (categoryName === ALL_CATEGORIES_LABEL) {
      setDraftCategories([]);
      return;
    }

    setDraftCategories((previousCategories) => {
      if (previousCategories.includes(categoryName)) {
        return previousCategories.filter(
          (existingCategory) => existingCategory !== categoryName
        );
      }
      return [...previousCategories, categoryName];
    });
  };

  /**
   * Selects sort.
   * @param {string} nextSort Next sort option.
   * @return {void} No return value.
   */
  const handleSelectSort = (nextSort) => {
    setSelectedSort(nextSort);
    setSortModalVisible(false);
  };

  /**
   * Handles navigate to product detail.
   * @param {object} product Product object.
   * @return {void} No return value.
   */
  const handleNavigateToProductDetail = useCallback((product) => {
    navigation.navigate(PRODUCT_DETAIL_ROUTE, { product });
  }, [navigation]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || isInitialLoading || products.length === 0) {
      return;
    }

    const offset = products.length;

    try {
      await fetchMore({
        variables: {
          ...productQueryVariables,
          offset,
          limit: PAGE_SIZE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const nextProducts = fetchMoreResult?.products || [];

          if (!nextProducts.length) {
            setHasMore(false);
            return previousResult;
          }

          if (nextProducts.length < PAGE_SIZE) {
            setHasMore(false);
          }

          const seen = new Set(
            previousResult.products.map((item) => item.id)
          );
          const uniqueNextProducts = nextProducts.filter(
            (item) => !seen.has(item.id)
          );

          return {
            ...previousResult,
            products: [...previousResult.products, ...uniqueNextProducts],
          };
        },
      });
    } catch (fetchError) {
      console.error('Failed to load more products:', fetchError);
    }
  }, [
    fetchMore,
    hasMore,
    isFetchingMore,
    isInitialLoading,
    productQueryVariables,
    products.length,
  ]);

  const handleRefresh = useCallback(async () => {
    try {
      setHasMore(true);
      await refetch({
        ...productQueryVariables,
        offset: 0,
        limit: PAGE_SIZE,
      });
    } catch (refreshError) {
      console.error('Failed to refresh products:', refreshError);
    }
  }, [productQueryVariables, refetch]);

  /**
   * Renders product.
   * @param {object} params Callback parameters.
   * @return {React.JSX.Element} Rendered element.
   */
  const renderProduct = useCallback(({ item }) => (
    <ProductCard
      product={item}
      onPress={handleNavigateToProductDetail}
      style={styles.mainProductCard}
    />
  ), [handleNavigateToProductDetail]);

  const listHeaderComponent = useMemo(() => (
    <ProductListDiscoveryHeader
      isDiscoveryMode={isDiscoveryMode}
      recommendedProducts={recommendedProducts}
      trendingProducts={trendingProducts}
      onProductPress={handleNavigateToProductDetail}
      recLoading={recLoading}
      trendingLoading={trendingLoading}
      loading={loading}
      productsCount={products.length}
    />
  ), [
    isDiscoveryMode,
    recommendedProducts,
    trendingProducts,
    handleNavigateToProductDetail,
    recLoading,
    trendingLoading,
    loading,
    products.length,
  ]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ProductListHeaderSection
          appliedFilterCount={appliedFilterCount}
          onClearAllFilters={clearAllFilters}
          onClearSearch={handleClearSearch}
          onLogout={handleLogout}
          onOpenFilterModal={handleOpenFilterModal}
          onOpenSortModal={handleOpenSortModal}
          onSearchChange={setSearchInput}
          searchInput={searchInput}
          selectedSortLabel={selectedSortLabel}
        />

        {isInitialLoading ? (
          <ProductListSkeletonGrid />
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="cloud-off" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Couldn't load products</Text>
            <Text style={styles.errorMessage}>
              Check your connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={keyExtractor}
            numColumns={2}
            contentContainerStyle={[
              styles.productsGrid,
              { paddingBottom: tabBarHeight + insets.bottom + 24 },
            ]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListHeaderComponent={listHeaderComponent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
            ListFooterComponent={
              isFetchingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#1D4ED8" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="inventory-2" size={60} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>
                  No products match this filter set
                </Text>
                <Text style={styles.emptyText}>
                  Try changing your category, price, or search keywords.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={resetFiltersAndSearch}
                >
                  <Text style={styles.retryButtonText}>Reset filters</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <ProductListSortModal
        debouncedSearch={debouncedSearch}
        onClose={handleCloseSortModal}
        onSelectSort={handleSelectSort}
        selectedSort={selectedSort}
        visible={isSortModalVisible}
      />

      <ProductListFilterModal
        visible={isFilterModalVisible}
        onClose={handleCloseFilterModal}
        categoryOptions={categoryOptions}
        draftCategories={draftCategories}
        draftPriceKey={draftPriceKey}
        draftInStockOnly={draftInStockOnly}
        onToggleCategory={handleToggleDraftCategory}
        onSelectPrice={setDraftPriceKey}
        onToggleInStock={setDraftInStockOnly}
        onReset={resetDraftFilters}
        onApply={applyFilterModal}
      />

      <ChatBot navigation={navigation} />
    </>
  );
};

export default ProductListScreen;
