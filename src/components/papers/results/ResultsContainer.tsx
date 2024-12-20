import { useCitations } from "./useCitations"
import { useSortedPapers } from "./useSortedPapers"
import { SortingControls } from "../SortingControls"
import { PaperCard } from "../PaperCard"
import { type Paper } from "@/types/papers"
import { type SearchParameters } from "@/constants/searchConfig"
import { Loader2 } from "lucide-react"

interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
}

export function ResultsContainer({ papers, isLoading, searchCriteria }: ResultsContainerProps) {
  const { citationsMap, isCitationsLoading, isComplete } = useCitations(papers)
  const { 
    sortedPapers, 
    sortBy, 
    sortDirection, 
    setSortBy, 
    setSortDirection,
    isRelevanceReady 
  } = useSortedPapers(papers, citationsMap, searchCriteria, isComplete)

  // Show loading screen while any of the data is being fetched
  if (isLoading || isCitationsLoading || !isRelevanceReady) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-background/50 rounded-lg shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">
            {isLoading ? "Searching papers..." : 
             isCitationsLoading ? "Loading citations..." : 
             "Calculating relevance scores..."}
          </p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SortingControls
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={setSortBy}
        onDirectionChange={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
        isRelevanceReady={isRelevanceReady}
      />
      
      <div className="space-y-4">
        {sortedPapers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSave={() => {}}
            onLike={() => {}}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  )
}