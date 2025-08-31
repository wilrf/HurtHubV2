import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBusinessSearch } from '@/hooks/useBusinessSearch';

import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';

import type { Business, BusinessSearchResult } from '@/types/business';

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  placeholder: string;
  showFilters: boolean;
  activeFiltersCount: number;
  showFiltersPanel: boolean;
  setShowFiltersPanel: (show: boolean) => void;
}

function SearchInput({ query, setQuery, placeholder, showFilters, activeFiltersCount, showFiltersPanel, setShowFiltersPanel }: SearchInputProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="h-4 w-4" />}
        className="pr-24"
      />
      
      {showFilters && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`p-1 ${showFiltersPanel ? 'text-primary' : ''}`}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface BusinessSearchProps {
  onResults?: (results: BusinessSearchResult) => void;
  onBusinessSelect?: (business: Business) => void;
  showFilters?: boolean;
  placeholder?: string;
  className?: string;
}

export function BusinessSearch({ 
  onResults, 
  onBusinessSelect,
  showFilters = true, 
  placeholder = "Search businesses by name, industry, or location...",
  className = ""
}: BusinessSearchProps) {
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const {
    query,
    setQuery,
    filters,
    handleFilterChange,
    clearAllFilters,
    activeFiltersCount,
    results,
    filterOptions,
    isLoading,
    currentPage,
    setCurrentPage,
    performSearch
  } = useBusinessSearch();

  return (
    <div className={`${className}`}>
      <SearchInput 
        query={query} 
        setQuery={setQuery} 
        placeholder={placeholder} 
        showFilters={showFilters} 
        activeFiltersCount={activeFiltersCount} 
        showFiltersPanel={showFiltersPanel} 
        setShowFiltersPanel={setShowFiltersPanel} 
      />

      {showFilters && showFiltersPanel && filterOptions && (
        <SearchFilters 
          filters={filters} 
          handleFilterChange={handleFilterChange} 
          clearAllFilters={clearAllFilters} 
          activeFiltersCount={activeFiltersCount} 
          filterOptions={filterOptions} 
        />
      )}

      {results && (
        <SearchResults 
          results={results} 
          isLoading={isLoading} 
          filters={filters} 
          handleFilterChange={handleFilterChange} 
          onBusinessSelect={onBusinessSelect} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          performSearch={performSearch} 
          query={query} 
        />
      )}
    </div>
  );
}