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

  if (isLoading || isCitationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">
          {isCitationsLoading ? "Loading citations..." : "Loading papers..."}
        </span>
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