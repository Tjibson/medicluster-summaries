import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { SortingControls } from "@/components/papers/SortingControls"
import { type SearchParameters } from "@/constants/searchConfig"
import { type SortOption, type SortDirection } from "../SortingControls"

interface ResultsHeaderProps {
  searchCriteria?: SearchParameters | null
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (value: SortOption) => void
  onDirectionChange: () => void
  totalResults?: number
  resultsPerPage: string
  onResultsPerPageChange: (value: string) => void
}

export function ResultsHeader({ 
  searchCriteria, 
  sortBy, 
  sortDirection,
  onSortChange,
  onDirectionChange,
  totalResults,
  resultsPerPage,
  onResultsPerPageChange
}: ResultsHeaderProps) {
  return (
    <div className="space-y-4">
      {searchCriteria && <SearchCriteria criteria={searchCriteria} />}
      <div className="flex justify-between items-center">
        {totalResults !== undefined && (
          <p className="text-sm text-muted-foreground">
            Found {totalResults} results
          </p>
        )}
        <SortingControls 
          sortBy={sortBy} 
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          onDirectionChange={onDirectionChange}
          resultsPerPage={resultsPerPage}
          onResultsPerPageChange={onResultsPerPageChange}
        />
      </div>
    </div>
  )
}