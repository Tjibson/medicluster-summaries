import { type Paper } from "@/types/papers"
import { ResultsContainer } from "./papers/results/ResultsContainer"
import { type SearchParameters } from "@/constants/searchConfig"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
  error?: Error | null
}

export function ResultsList({ papers, isLoading, searchCriteria, error }: ResultsListProps) {
  console.log("ResultsList received papers:", papers)
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || "An error occurred while fetching results. Please try again."}
        </AlertDescription>
      </Alert>
    )
  }
  
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