import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import styles from '../styles';
import theme from '../../../../theme/theme';

/**
 * Header area with logout, search, and primary filter actions.
 * @param {{
 *   appliedFilterCount: number,
 *   onClearAllFilters: () => void,
 *   onClearSearch: () => void,
 *   onLogout: () => void,
 *   onOpenFilterModal: () => void,
 *   onOpenSortModal: () => void,
 *   onSearchChange: (value: string) => void,
 *   searchInput: string,
 *   selectedSortLabel: string,
 * }} props Component props.
 * @return {React.JSX.Element} Header section UI.
 */
export default function ProductListHeaderSection({
  appliedFilterCount,
  onClearAllFilters,
  onClearSearch,
  onLogout,
  onOpenFilterModal,
  onOpenSortModal,
  onSearchChange,
  searchInput,
  selectedSortLabel,
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
          accessibilityLabel="Logout"
          accessibilityHint="Logout from the application"
        >
          <MaterialIcons name="logout" size={22} color={theme.colors.primary} />
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
        />
        {hasSearchText && (
          <TouchableOpacity onPress={onClearSearch}>
            <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

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
