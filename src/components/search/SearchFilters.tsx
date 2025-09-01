import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/contexts/ThemeContext";

import type { BusinessSearchFilters } from "@/types/business";

interface SelectFilterProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  isDarkMode: boolean;
}

function SelectFilter({
  label,
  options,
  value,
  onChange,
  isDarkMode,
}: SelectFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <select
        multiple
        value={value}
        onChange={(e) =>
          onChange(Array.from(e.target.selectedOptions, (o) => o.value))
        }
        className={`w-full p-2 border rounded-md ${
          isDarkMode
            ? "bg-midnight-800 border-midnight-700 text-white"
            : "bg-white border-gray-300"
        }`}
        size={4}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RangeFilterProps {
  label: string;
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
}

function RangeFilter({ label, value, onChange }: RangeFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={value?.min || ""}
          onChange={(e) =>
            onChange({
              ...value,
              min: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
        />
        <Input
          type="number"
          placeholder="Max"
          value={value?.max || ""}
          onChange={(e) =>
            onChange({
              ...value,
              max: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
        />
      </div>
    </div>
  );
}

interface SearchFiltersProps {
  filters: BusinessSearchFilters;
  handleFilterChange: (
    key: keyof BusinessSearchFilters,
    value: unknown,
  ) => void;
  clearAllFilters: () => void;
  activeFiltersCount: number;
  filterOptions: {
    industries: string[];
    neighborhoods: string[];
    businessTypes: string[];
    clusters: string[];
  };
}

export function SearchFilters({
  filters,
  handleFilterChange,
  clearAllFilters,
  activeFiltersCount,
  filterOptions,
}: SearchFiltersProps) {
  const { isDarkMode } = useTheme();

  return (
    <Card variant={isDarkMode ? "glass" : "elevated"} className="mt-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Advanced Filters</h3>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Industry"
            options={filterOptions.industries}
            value={filters.industry || []}
            onChange={(value) => handleFilterChange("industry", value)}
            isDarkMode={isDarkMode}
          />
          <SelectFilter
            label="Neighborhood"
            options={filterOptions.neighborhoods}
            value={filters.neighborhood || []}
            onChange={(value) => handleFilterChange("neighborhood", value)}
            isDarkMode={isDarkMode}
          />
          <SelectFilter
            label="Business Type"
            options={filterOptions.businessTypes}
            value={filters.businessType || []}
            onChange={(value) => handleFilterChange("businessType", value)}
            isDarkMode={isDarkMode}
          />
          <RangeFilter
            label="Employees"
            value={filters.employeeRange || {}}
            onChange={(value) => handleFilterChange("employeeRange", value)}
          />
          <RangeFilter
            label="Revenue"
            value={filters.revenueRange || {}}
            onChange={(value) => handleFilterChange("revenueRange", value)}
          />
          <RangeFilter
            label="Year Established"
            value={filters.yearEstablished || {}}
            onChange={(value) => handleFilterChange("yearEstablished", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
