import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Company, CompanySearchFilters, PaginatedResponse } from '@/types'

interface CompaniesState {
  companies: Company[]
  selectedCompany: Company | null
  searchResults: PaginatedResponse<Company> | null
  filters: CompanySearchFilters
  isLoading: boolean
  error: string | null
  recentSearches: string[]
}

const initialState: CompaniesState = {
  companies: [],
  selectedCompany: null,
  searchResults: null,
  filters: {},
  isLoading: false,
  error: null,
  recentSearches: JSON.parse(
    localStorage.getItem('charlotte-econdev-recent-searches') || '[]'
  ),
}

export const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
      if (action.payload) {
        state.error = null
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearError: state => {
      state.error = null
    },

    // Companies data
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload
      state.isLoading = false
      state.error = null
    },
    addCompany: (state, action: PayloadAction<Company>) => {
      state.companies.unshift(action.payload)
    },
    updateCompany: (state, action: PayloadAction<Company>) => {
      const index = state.companies.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.companies[index] = action.payload
      }
      if (state.selectedCompany?.id === action.payload.id) {
        state.selectedCompany = action.payload
      }
    },
    removeCompany: (state, action: PayloadAction<string>) => {
      state.companies = state.companies.filter(c => c.id !== action.payload)
      if (state.selectedCompany?.id === action.payload) {
        state.selectedCompany = null
      }
    },

    // Selected company
    setSelectedCompany: (state, action: PayloadAction<Company | null>) => {
      state.selectedCompany = action.payload
    },

    // Search functionality
    setSearchResults: (state, action: PayloadAction<PaginatedResponse<Company>>) => {
      state.searchResults = action.payload
      state.isLoading = false
      state.error = null
    },
    clearSearchResults: state => {
      state.searchResults = null
    },
    setFilters: (state, action: PayloadAction<CompanySearchFilters>) => {
      state.filters = action.payload
    },
    updateFilters: (state, action: PayloadAction<Partial<CompanySearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: state => {
      state.filters = {}
    },

    // Recent searches
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim()
      if (query) {
        state.recentSearches = [
          query,
          ...state.recentSearches.filter(s => s !== query),
        ].slice(0, 10)
        localStorage.setItem(
          'charlotte-econdev-recent-searches',
          JSON.stringify(state.recentSearches)
        )
      }
    },
    clearRecentSearches: state => {
      state.recentSearches = []
      localStorage.removeItem('charlotte-econdev-recent-searches')
    },

    // Bulk operations
    setCompaniesFromSearch: (state, action: PayloadAction<PaginatedResponse<Company>>) => {
      state.searchResults = action.payload
      // Also update the main companies array if it's empty
      if (state.companies.length === 0) {
        state.companies = action.payload.data
      }
      state.isLoading = false
      state.error = null
    },
  },
})

export const companiesActions = companiesSlice.actions