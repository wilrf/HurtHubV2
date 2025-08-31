import { useState, useEffect, useMemo, useCallback } from 'react';

import { businessDataService } from '@/services/businessDataService';

import type { BusinessSearchFilters, BusinessSearchResult } from '@/types/business';

export function useBusinessSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<BusinessSearchFilters>({});
  const [results, setResults] = useState<BusinessSearchResult | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    industries: string[];
    neighborhoods: string[];
    businessTypes: string[];
    clusters: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    businessDataService.getFilterOptions().then(setFilterOptions);
  }, []);

  const performSearch = useCallback(async (searchFilters: BusinessSearchFilters, page: number = 1) => {
    setIsLoading(true);
    try {
      const searchResults = await businessDataService.searchBusinesses(searchFilters, page, 20);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const searchFilters = { ...filters, query: query.trim() || undefined };
    if (query.trim() || Object.keys(filters).length > 0) {
      performSearch(searchFilters, 1);
      setCurrentPage(1);
    } else {
      setResults(null);
    }
  }, [query, filters, performSearch]);

  const handleFilterChange = (key: keyof BusinessSearchFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilter = (key: keyof BusinessSearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setQuery('');
  };

  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof BusinessSearchFilters];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined);
      }
      return value !== undefined;
    }).length;
  }, [filters]);

  return {
    query,
    setQuery,
    filters,
    handleFilterChange,
    clearFilter,
    clearAllFilters,
    activeFiltersCount,
    results,
    filterOptions,
    isLoading,
    currentPage,
    setCurrentPage,
    performSearch
  };
}
