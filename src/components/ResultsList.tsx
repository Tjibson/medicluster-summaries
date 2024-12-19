import { type Paper } from "@/types/papers"
import { ResultsContainer } from "./papers/results/ResultsContainer"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: {
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  }
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