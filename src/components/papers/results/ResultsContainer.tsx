import { Paper } from "@/types/papers"
import { PaperCard } from "@/components/papers/PaperCard"
import { LoadingState } from "@/components/papers/LoadingState"
import { SortingControls, type SortOption, type SortDirection } from "@/components/papers/SortingControls"
import { useState } from "react"

export interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria: any
  onLoadMore?: (papers: Paper[]) => void
}

export function ResultsContainer({ papers, isLoading, searchCriteria }: ResultsContainerProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [resultsPerPage, setResultsPerPage] = useState("25")

  if (isLoading) {
    return <div className="text-center py-8">Loading articles...</div>
  }

  if (!papers || papers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">No articles found matching your criteria.</p>
      </div>
    )
  }

  const sortedPapers = [...papers].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1
    
    switch (sortBy) {
      case "citations":
        return ((a.citations || 0) - (b.citations || 0)) * multiplier
      case "date":
        return (a.year - b.year) * multiplier
      case "title":
        return a.title.localeCompare(b.title) * multiplier
      case "relevance":
      default:
        return ((b.relevance_score || 0) - (a.relevance_score || 0)) * multiplier
    }
  })

  const displayedPapers = sortedPapers.slice(0, parseInt(resultsPerPage))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {displayedPapers.length} of {papers.length} articles
        </p>
        <SortingControls
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={setSortBy}
          onDirectionChange={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
          resultsPerPage={resultsPerPage}
          onResultsPerPageChange={setResultsPerPage}
        />
      </div>

      <div className="space-y-4">
        {displayedPapers.map((paper) => (
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