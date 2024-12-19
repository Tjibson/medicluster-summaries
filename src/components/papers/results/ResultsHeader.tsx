import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { SortingControls, type SortOption } from "@/components/papers/SortingControls"

interface ResultsHeaderProps {
  searchCriteria?: {
    dateRange?: { start: string; end: string }
    keywords?: string
    journalNames?: string[]
  }
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
}

export function ResultsHeader({ searchCriteria, sortBy, onSortChange }: ResultsHeaderProps) {
  return (
    <>
      {searchCriteria && <SearchCriteria criteria={searchCriteria} />}
      <SortingControls sortBy={sortBy} onSortChange={onSortChange} />
    </>
  )
}