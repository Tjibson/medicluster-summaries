import { type Paper } from "@/types/papers"
import { ResultsContainer } from "./papers/results/ResultsContainer"

interface SearchCriteria {
  dateRange: { start: string; end: string }
  keywords: string
  journalNames: string[]
}

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchCriteria
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  console.log("ResultsList received papers:", papers)
  
  return (
    <ResultsContainer
      papers={papers}
      isLoading={isLoading}
      searchCriteria={searchCriteria}
    />
  )
}