import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';

import type { Business, BusinessSearchResult, BusinessSearchFilters } from '@/types/business';

interface SearchResultsProps {
  results: BusinessSearchResult;
  isLoading: boolean;
  filters: BusinessSearchFilters;
  handleFilterChange: (key: keyof BusinessSearchFilters, value: unknown) => void;
  onBusinessSelect?: (business: Business) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  performSearch: (filters: BusinessSearchFilters, page: number) => void;
  query: string;
}

export function SearchResults({ results, isLoading, filters, handleFilterChange, onBusinessSelect, currentPage, setCurrentPage, performSearch, query }: SearchResultsProps) {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {results.total} businesses found {query && `for "${query}"`}
        </p>
        
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy || 'name'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={`text-sm p-1 border rounded ${
              isDarkMode 
                ? 'bg-midnight-800 border-midnight-700 text-white' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="name">Name</option>
            <option value="revenue">Revenue</option>
            <option value="employees">Employees</option>
            <option value="rating">Rating</option>
            <option value="yearEstablished">Year Est.</option>
          </select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${
              filters.sortOrder === 'asc' ? 'rotate-180' : ''
            }`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Searching...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results?.businesses?.map(business => (
            <Card
              key={business.id}
              variant={isDarkMode ? 'glass' : 'elevated'}
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => {
                onBusinessSelect?.(business);
                navigate(`/business/${business.id}`);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {business.industry} • {business.neighborhood}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {business.businessType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {business.employees} employees
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ${business.revenue ? (business.revenue / 1000000).toFixed(1) : '0'}M revenue
                      </Badge>
                      {business?.rating && (
                        <Badge variant="outline" className="text-xs">
                          ⭐ {business.rating?.toFixed(1) || '0.0'}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {business.address.line1}, {business.address.city}, {business.address.state}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  performSearch(filters, newPage);
                }}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage} of {results.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= results.totalPages}
                onClick={() => {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  performSearch(filters, newPage);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
