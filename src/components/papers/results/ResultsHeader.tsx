import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { SortingControls, type SortOption } from "@/components/papers/SortingControls"

interface ResultsHeaderProps {
  searchCriteria?: {
    population?: string
    disease?: string
    medicine?: string
    working_mechanism?: string
    patientCount?: string
    trialType?: string
    journal?: string
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