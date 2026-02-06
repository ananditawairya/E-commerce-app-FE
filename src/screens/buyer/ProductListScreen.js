import React, { useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NetworkStatus, useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import {
  GET_CATEGORIES,
  GET_PRODUCTS,
  GET_RECOMMENDATIONS,
  GET_TRENDING_PRODUCTS,
} from '../../graphql/queries';
import ChatBot from '../../components/ChatBot';
import ProductCard from '../../components/ProductCard';
import ProductHorizontalList from '../../components/ProductHorizontalList';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Top Match', value: 'RELEVANCE' },
  { label: 'Price Low to High', value: 'PRICE_LOW_TO_HIGH' },
  { label: 'Price High to Low', value: 'PRICE_HIGH_TO_LOW' },
  { label: 'Name A-Z', value: 'NAME_A_TO_Z' },
];

const PRICE_OPTIONS = [
  { key: 'all', label: 'Any Price' },
  { key: 'budget', label: 'Under $50', min: 0, max: 50 },
  { key: 'mid', label: '$50-$150', min: 50, max: 150 },
  { key: 'premium', label: '$150+', min: 150 },
];

const ProductListScreen = ({ navigation, onLogout }) => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('NEWEST');
  const [selectedPriceKey, setSelectedPriceKey] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [userId, setUserId] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [draftCategory, setDraftCategory] = useState('');
  const [draftPriceKey, setDraftPriceKey] = useState('all');
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
  }, [debouncedSearch, selectedCategory, selectedSort, selectedPriceKey, inStockOnly]);

  React.useEffect(() => {
    if (!debouncedSearch && selectedSort === 'RELEVANCE') {
      setSelectedSort('NEWEST');
    }
  }, [debouncedSearch, selectedSort]);

  const selectedPriceFilter = useMemo(
    () => PRICE_OPTIONS.find((option) => option.key === selectedPriceKey) || PRICE_OPTIONS[0],
    [selectedPriceKey]
  );

  const sortForQuery =
    selectedSort === 'RELEVANCE' && !debouncedSearch ? 'NEWEST' : selectedSort;

  const productQueryVariables = useMemo(
    () => ({
      search: debouncedSearch || null,
      category: selectedCategory || null,
      minPrice: typeof selectedPriceFilter.min === 'number' ? selectedPriceFilter.min : null,
      maxPrice: typeof selectedPriceFilter.max === 'number' ? selectedPriceFilter.max : null,
      inStockOnly,
      sortBy: sortForQuery,
      limit: PAGE_SIZE,
      offset: 0,
    }),
    [debouncedSearch, inStockOnly, selectedCategory, selectedPriceFilter, sortForQuery]
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
    onCompleted: (result) => {
      setHasMore((result?.products?.length || 0) >= PAGE_SIZE);
    },
  });

  const { data: recData, loading: recLoading } = useQuery(GET_RECOMMENDATIONS, {
    variables: { userId, limit: 10 },
    skip: !userId,
  });

  const { data: trendingData, loading: trendingLoading } = useQuery(GET_TRENDING_PRODUCTS, {
    variables: { limit: 10 },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  const products = data?.products || [];
  const isInitialLoading = loading && products.length === 0;
  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isRefreshing = networkStatus === NetworkStatus.refetch;
  const categoryOptions = ['All Categories', ...(categoriesData?.categories || [])];

  const isDiscoveryMode =
    !debouncedSearch &&
    !selectedCategory &&
    selectedSort === 'NEWEST' &&
    selectedPriceKey === 'all' &&
    !inStockOnly;

  const selectedSortLabel =
    SORT_OPTIONS.find((item) => item.value === selectedSort)?.label || 'Newest';

  const appliedFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedPriceKey !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (selectedSort !== 'NEWEST' ? 1 : 0);

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

  const getEnrichedProducts = (recommendations) => {
    if (!recommendations?.length || !products.length) return [];

    return recommendations
      .map((recommendation) => {
        const product = products.find((item) => item.id === recommendation.productId);
        return product ? { ...product, ...recommendation } : null;
      })
      .filter(Boolean);
  };

  const recommendedProducts = getEnrichedProducts(recData?.getRecommendations);
  const trendingProducts = getEnrichedProducts(trendingData?.getTrendingProducts);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSort('NEWEST');
    setSelectedPriceKey('all');
    setInStockOnly(false);
    setHasMore(true);
  };

  const resetFiltersAndSearch = () => {
    clearAllFilters();
    setSearchInput('');
    setDebouncedSearch('');
  };

  const openFilterModal = () => {
    setDraftCategory(selectedCategory);
    setDraftPriceKey(selectedPriceKey);
    setDraftInStockOnly(inStockOnly);
    setFilterModalVisible(true);
  };

  const applyFilterModal = () => {
    setSelectedCategory(draftCategory);
    setSelectedPriceKey(draftPriceKey);
    setInStockOnly(draftInStockOnly);
    setFilterModalVisible(false);
  };

  const resetDraftFilters = () => {
    setDraftCategory('');
    setDraftPriceKey('all');
    setDraftInStockOnly(false);
  };

  const loadMore = async () => {
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

          const seen = new Set(previousResult.products.map((item) => item.id));
          const uniqueNextProducts = nextProducts.filter((item) => !seen.has(item.id));

          return {
            ...previousResult,
            products: [...previousResult.products, ...uniqueNextProducts],
          };
        },
      });
    } catch (fetchError) {
      console.error('Failed to load more products:', fetchError);
    }
  };

  const handleRefresh = async () => {
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
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={(product) => navigation.navigate('ProductDetail', { product })}
      style={styles.mainProductCard}
    />
  );

  const renderHeader = () => (
    <View>
      {isDiscoveryMode && recommendedProducts.length > 0 && (
        <ProductHorizontalList
          title="Recommended for You"
          products={recommendedProducts}
          onProductPress={(product) => navigation.navigate('ProductDetail', { product })}
          loading={recLoading}
        />
      )}

      {isDiscoveryMode && trendingProducts.length > 0 && (
        <ProductHorizontalList
          title="Trending Now"
          products={trendingProducts}
          onProductPress={(product) => navigation.navigate('ProductDetail', { product })}
          loading={trendingLoading}
        />
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Explore Catalog</Text>
        <Text style={styles.resultsCount}>
          {loading && products.length === 0 ? 'Loading products...' : `${products.length} items`}
        </Text>
      </View>
    </View>
  );

  const renderSkeletonCard = (_, index) => (
    <View key={`skeleton-${index}`} style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLineLong} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLineMedium} />
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Shop Better</Text>
            <Text style={styles.headerSubtitle}>Find what fits your style and budget</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            accessibilityLabel="Logout"
            accessibilityHint="Logout from the application"
          >
            <MaterialIcons name="logout" size={22} color="#1D4ED8" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or keyword..."
            placeholderTextColor="#94A3B8"
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput('')}>
              <MaterialIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterToolbar}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setSortModalVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="sort" size={17} color="#1E293B" />
            <Text style={styles.toolbarButtonText}>{selectedSortLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, appliedFilterCount > 0 && styles.toolbarButtonHighlighted]}
            onPress={openFilterModal}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="tune"
              size={16}
              color={appliedFilterCount > 0 ? '#1D4ED8' : '#1E293B'}
            />
            <Text
              style={[
                styles.toolbarButtonText,
                appliedFilterCount > 0 && styles.toolbarButtonTextHighlighted,
              ]}
            >
              {appliedFilterCount > 0 ? `Filters (${appliedFilterCount})` : 'Filters'}
            </Text>
          </TouchableOpacity>

          {appliedFilterCount > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.toolbarClearButton}>
              <Text style={styles.toolbarClearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {isInitialLoading ? (
          <View style={styles.skeletonGrid}>{Array.from({ length: 6 }).map(renderSkeletonCard)}</View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="cloud-off" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Couldn't load products</Text>
            <Text style={styles.errorMessage}>Check your connection and try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListHeaderComponent={renderHeader}
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
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
                <Text style={styles.emptyTitle}>No products match this filter set</Text>
                <Text style={styles.emptyText}>Try changing your category, price, or search keywords.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={resetFiltersAndSearch}>
                  <Text style={styles.retryButtonText}>Reset filters</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSortModalVisible(false)}>
          <Pressable style={styles.sortSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => {
              const isDisabled = option.value === 'RELEVANCE' && !debouncedSearch;
              const isSelected = selectedSort === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sheetOptionRow, isDisabled && styles.sheetOptionDisabled]}
                  onPress={() => {
                    if (isDisabled) return;
                    setSelectedSort(option.value);
                    setSortModalVisible(false);
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[styles.sheetOptionLabel, isDisabled && styles.sheetOptionLabelDisabled]}>
                    {option.label}
                  </Text>
                  {isSelected && <MaterialIcons name="check" size={20} color="#1D4ED8" />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.filterSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.filterSheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollBody}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptionsWrap}>
                {categoryOptions.map((option) => {
                  const normalizedOption = option === 'All Categories' ? '' : option;
                  const isSelected = draftCategory === normalizedOption;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.modalFilterChip,
                        isSelected && styles.modalFilterChipSelected,
                      ]}
                      onPress={() => setDraftCategory(normalizedOption)}
                    >
                      <Text
                        style={[
                          styles.modalFilterChipText,
                          isSelected && styles.modalFilterChipTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterSectionTitle}>Price</Text>
              <View style={styles.filterOptionsWrap}>
                {PRICE_OPTIONS.map((option) => {
                  const isSelected = draftPriceKey === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.modalFilterChip,
                        isSelected && styles.modalFilterChipSelected,
                      ]}
                      onPress={() => setDraftPriceKey(option.key)}
                    >
                      <Text
                        style={[
                          styles.modalFilterChipText,
                          isSelected && styles.modalFilterChipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inStockRow}>
                <Text style={styles.inStockLabel}>In-stock only</Text>
                <Switch
                  value={draftInStockOnly}
                  onValueChange={setDraftInStockOnly}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={draftInStockOnly ? '#1D4ED8' : '#FFFFFF'}
                />
              </View>
            </ScrollView>

            <View style={styles.filterFooter}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetDraftFilters}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyFilterModal}>
                <Text style={styles.primaryButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ChatBot navigation={navigation} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
  },
  filterToolbar: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
  },
  toolbarButtonHighlighted: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  toolbarButtonText: {
    marginLeft: 6,
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 13,
  },
  toolbarButtonTextHighlighted: {
    color: '#1D4ED8',
  },
  toolbarClearButton: {
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  toolbarClearText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 13,
  },
  productsGrid: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  mainProductCard: {
    flex: 1,
    maxWidth: '48%',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  resultsCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorMessage: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  skeletonCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 12,
  },
  skeletonImage: {
    height: 120,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  skeletonLineLong: {
    height: 12,
    borderRadius: 8,
    width: '92%',
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: 8,
    width: '58%',
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  skeletonLineMedium: {
    height: 12,
    borderRadius: 8,
    width: '72%',
    backgroundColor: '#E2E8F0',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '78%',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetOptionDisabled: {
    opacity: 0.45,
  },
  sheetOptionLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  sheetOptionLabelDisabled: {
    color: '#64748B',
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  filterScrollBody: {
    paddingBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 10,
  },
  filterOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modalFilterChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  modalFilterChipSelected: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  modalFilterChipText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  modalFilterChipTextSelected: {
    color: '#1D4ED8',
  },
  inStockRow: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inStockLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProductListScreen;
