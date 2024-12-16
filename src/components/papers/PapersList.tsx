import { Card } from "@/components/ui/card"
import { type SavedPaper } from "@/types/papers"
import { PaperCard } from "./PaperCard"

interface PapersListProps {
  papers: SavedPaper[]
  isLoading: boolean
  emptyMessage: string
  onUnlike?: (paperId: string) => void
  onRemove: (paperId: string) => void
  onDownload: (paperId: string) => void
  showLikeButton?: boolean
}

export const PapersList = ({
  papers,
  isLoading,
  emptyMessage,
  onUnlike,
  onRemove,
  onDownload,
  showLikeButton = false,
}: PapersListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (papers.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        {emptyMessage}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          onUnlike={onUnlike ? () => onUnlike(paper.id) : undefined}
          onRemove={() => onRemove(paper.id)}
          onDownload={() => onDownload(paper.id)}
          showLikeButton={showLikeButton}
        />
      ))}
    </div>
  )
}