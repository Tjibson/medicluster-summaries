import { type Paper } from "@/types/papers"
import { ResultsContainer } from "./papers/results/ResultsContainer"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: {
    population?: string
    disease?: string
    medicine?: string
    working_mechanism?: string
    patientCount?: string
    trialType?: string
    journal?: string
  }
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  return (
    <ResultsContainer
      papers={papers}
      isLoading={isLoading}
      searchCriteria={searchCriteria}
    />
  )
}