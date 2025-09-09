import { Search, Filter, Sparkles, FileSearch, Brain } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useBusinessSearch, SearchMode } from "@/hooks/useBusinessSearch";

import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";

import type { Business, BusinessSearchResult } from "@/types/business";

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  placeholder: string;
  showFilters: boolean;
  activeFiltersCount: number;
  showFiltersPanel: boolean;
  setShowFiltersPanel: (show: boolean) => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  isAISearch: boolean;
}

function SearchInput({
  query,
  setQuery,
  placeholder,
  showFilters,
  activeFiltersCount,
  showFiltersPanel,
  setShowFiltersPanel,
  searchMode,
  setSearchMode,
  isAISearch,
}: SearchInputProps) {
  const getSearchIcon = () => {
    switch (searchMode) {
      case 'ai':
        return <Sparkles className="h-4 w-4 text-sapphire-400" />;
      case 'smart':
        return <Brain className="h-4 w-4 text-sapphire-400" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'ai':
        return "Ask naturally: 'coffee shops downtown' or 'tech companies with high growth'...";
      case 'smart':
        return "Search smart: AI understands natural language, exact names work too...";
      default:
        return placeholder;
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <Button
          variant={searchMode === 'smart' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchMode('smart')}
          className="text-xs"
        >
          <Brain className="h-3 w-3 mr-1" />
          Smart
        </Button>
        <Button
          variant={searchMode === 'ai' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchMode('ai')}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI Only
        </Button>
        <Button
          variant={searchMode === 'exact' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchMode('exact')}
          className="text-xs"
        >
          <FileSearch className="h-3 w-3 mr-1" />
          Exact
        </Button>
        {isAISearch && (
          <Badge variant="secondary" className="text-xs ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        )}
      </div>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={getPlaceholder()}
        leftIcon={getSearchIcon()}
        variant="search"
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
            className={`p-1 ${showFiltersPanel ? "text-primary" : ""}`}
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
  className = "",
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
    performSearch,
    searchMode,
    setSearchMode,
  } = useBusinessSearch();

  // Call onResults when results change
  useEffect(() => {
    if (onResults && results) {
      onResults(results);
    }
  }, [results, onResults]);

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
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        isAISearch={results?.searchType === 'semantic' || results?.searchType === 'hybrid'}
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
