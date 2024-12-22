import { Paper } from "@/types/papers"
import { PaperCard } from "@/components/papers/PaperCard"
import { LoadingState } from "@/components/papers/LoadingState"

export interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria: any
  onLoadMore?: (papers: Paper[]) => void
}

export function ResultsContainer({ papers, isLoading, searchCriteria, onLoadMore }: ResultsContainerProps) {
  if (isLoading) {
    return <LoadingState message="Loading articles..." />
  }

  if (!papers || papers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">No articles found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          searchCriteria={searchCriteria}
        />
      ))}
    </div>
  )
}