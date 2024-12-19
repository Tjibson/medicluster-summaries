import { type Paper } from "@/types/papers"
import { ResultsContainer } from "./papers/results/ResultsContainer"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: {
    medicine?: string
    population?: string
    disease?: string
    working_mechanism?: string
    patientCount?: string
    trialType?: string
    journal?: string
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