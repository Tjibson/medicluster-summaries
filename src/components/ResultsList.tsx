import { Paper } from "@/types/papers"
import { ResultsContainer } from "@/components/papers/results/ResultsContainer"
import { SearchParameters } from "@/types/papers"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria: SearchParameters
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ResultsContainer
        papers={papers}
        isLoading={isLoading}
        searchCriteria={searchCriteria}
      />
    </div>
  )
}