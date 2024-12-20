import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { SortingControls, type SortOption, type SortDirection } from "@/components/papers/SortingControls"
import { type SearchParameters } from "@/constants/searchConfig"

interface ResultsHeaderProps {
  searchCriteria?: SearchParameters | null
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (value: SortOption) => void
  onDirectionChange: () => void
  totalResults?: number
}

export function ResultsHeader({ 
  searchCriteria, 
  sortBy, 
  sortDirection,
  onSortChange,
  onDirectionChange,
  totalResults 
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
        />
      </div>
    </div>
  )
}