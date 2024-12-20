import { type Paper } from "@/types/papers"
import { ResultsContainer } from "./papers/results/ResultsContainer"
import { type SearchParameters } from "@/constants/searchConfig"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  console.log("ResultsList received papers:", papers)
  
  if (!papers.length && !isLoading) {
    return (
      <div className="text-center p-6 bg-background rounded-lg shadow">
        <p className="text-muted-foreground">
          No papers found. Try adjusting your search criteria.
        </p>
      </div>
    )
  }
  
  return (
    <ResultsContainer
      papers={papers}
      isLoading={isLoading}
      searchCriteria={searchCriteria}
    />
  )
}