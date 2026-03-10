import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import styles from '../styles';
import theme from '../../../../theme/theme';

/**
 * Header area with logout, search, and primary filter actions.
 * @param {{
 *   appliedFilterCount: number,
 *   isSuggestionsLoading: boolean,
 *   onClearAllFilters: () => void,
 *   onClearSearch: () => void,
 *   onLogout: () => void,
 *   onOpenFilterModal: () => void,
 *   onOpenSortModal: () => void,
 *   onSearchBlur: () => void,
 *   onSearchChange: (value: string) => void,
 *   onSearchFocus: () => void,
 *   onSuggestionPress: (value: string) => void,
 *   isGuest: boolean,
 *   searchInput: string,
 *   selectedSortLabel: string,
 *   showSuggestions: boolean,
 *   suggestions: Array<{text: string, category: string | null}>,
 * }} props Component props.
 * @return {React.JSX.Element} Header section UI.
 */
export default function ProductListHeaderSection({
  isGuest,
  appliedFilterCount,
  isSuggestionsLoading,
  onClearAllFilters,
  onClearSearch,
  onLogout,
  onOpenFilterModal,
  onOpenSortModal,
  onSearchBlur,
  onSearchChange,
  onSearchFocus,
  onSuggestionPress,
  searchInput,
  selectedSortLabel,
  showSuggestions,
  suggestions,
}) {
  const hasSearchText = searchInput.length > 0;
  const hasAppliedFilters = appliedFilterCount > 0;

  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shop Better</Text>
          <Text style={styles.headerSubtitle}>
            Find what fits your style and budget
          </Text>
        </View>
        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutButton}
          accessibilityLabel={isGuest ? 'Login' : 'Logout'}
          accessibilityHint={isGuest ? 'Go to login screen' : 'Logout from the application'}
        >
          <MaterialIcons
            name={isGuest ? 'login' : 'logout'}
            size={22}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or keyword..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchInput}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={() => {
            setTimeout(() => {
              onSearchBlur();
            }, 120);
          }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {hasSearchText && (
          <TouchableOpacity onPress={onClearSearch}>
            <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestionPanel}>
          {isSuggestionsLoading ? (
            <Text style={styles.suggestionLoadingText}>Searching suggestions...</Text>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <TouchableOpacity
                key={`${suggestion.text}:${suggestion.category || 'all'}`}
                style={styles.suggestionRow}
                onPress={() => onSuggestionPress(suggestion.text)}
              >
                <MaterialIcons
                  name="north-west"
                  size={15}
                  color={theme.colors.textSecondary}
                />
                <View style={styles.suggestionTextWrap}>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  {suggestion.category ? (
                    <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.suggestionEmptyText}>No suggestions found</Text>
          )}
        </View>
      )}

      <View style={styles.filterToolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onOpenSortModal}
          activeOpacity={0.85}
        >
          <MaterialIcons name="sort" size={17} color={theme.colors.textPrimary} />
          <Text style={styles.toolbarButtonText}>{selectedSortLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolbarButton,
            hasAppliedFilters && styles.toolbarButtonHighlighted,
          ]}
          onPress={onOpenFilterModal}
          activeOpacity={0.85}
        >
          <MaterialIcons
            name="tune"
            size={16}
            color={hasAppliedFilters ? theme.colors.primary : theme.colors.textPrimary}
          />
          <Text
            style={[
              styles.toolbarButtonText,
              hasAppliedFilters && styles.toolbarButtonTextHighlighted,
            ]}
          >
            {hasAppliedFilters ? `Filters (${appliedFilterCount})` : 'Filters'}
          </Text>
        </TouchableOpacity>

        {hasAppliedFilters && (
          <TouchableOpacity
            onPress={onClearAllFilters}
            style={styles.toolbarClearButton}
          >
            <Text style={styles.toolbarClearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}
