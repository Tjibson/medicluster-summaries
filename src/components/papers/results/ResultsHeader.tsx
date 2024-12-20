import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { SortingControls, type SortOption } from "@/components/papers/SortingControls"
import { type SearchParameters } from "@/constants/searchConfig"

interface ResultsHeaderProps {
  searchCriteria?: SearchParameters | null
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  totalResults?: number
}

export function ResultsHeader({ searchCriteria, sortBy, onSortChange, totalResults }: ResultsHeaderProps) {
  return (
    <div className="space-y-4">
      {searchCriteria && <SearchCriteria criteria={searchCriteria} />}
      <div className="flex justify-between items-center">
        {totalResults !== undefined && (
          <p className="text-sm text-muted-foreground">
            Found {totalResults} results
          </p>
        )}
        <SortingControls sortBy={sortBy} onSortChange={onSortChange} />
      </div>
    </div>
  )
}