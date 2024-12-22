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
  loadedResults: number
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
  loadedResults,
  resultsPerPage,
  onResultsPerPageChange
}: ResultsHeaderProps) {
  return (
    <div className="space-y-4">
      {searchCriteria && <SearchCriteria criteria={searchCriteria} />}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {totalResults !== undefined ? (
            <>
              Found <span className="font-medium">{totalResults}</span> articles
              {loadedResults > 0 && (
                <>, showing <span className="font-medium">{loadedResults}</span></>
              )}
            </>
          ) : (
            "Searching for articles..."
          )}
        </div>
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