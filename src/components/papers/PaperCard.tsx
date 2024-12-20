import { Card } from "@/components/ui/card"
import { type Paper } from "@/types/papers"
import { PaperActions } from "./PaperActions"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface PaperCardProps {
  paper: Paper
  onSave: (paper: Paper) => void
  onLike: (paper: Paper) => void
  onClick: (paper: Paper) => void
}

export function PaperCard({ paper, onSave, onLike, onClick }: PaperCardProps) {
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${paper.id}/`

  // Helper function to safely extract and render title
  const renderTitle = (title: any): string => {
    if (!title) return 'Untitled Paper'
    if (typeof title === 'string') return title
    if (typeof title === 'object') {
      // Handle cases where title might be an object with specific properties
      if ('_' in title) return String(title._)
      if ('sub' in title) return String(title.sub)
      return JSON.stringify(title)
    }
    return String(title)
  }

  const safeTitle = renderTitle(paper.title)

  return (
    <Card 
      className="p-6 shadow-card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onClick(paper)}
    >
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{safeTitle}</h3>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <p className="font-medium">Citations: {paper.citations || 0}</p>
          <span>•</span>
          <p>{paper.year}</p>
          <span>•</span>
          <p>{paper.journal}</p>
        </div>

        <div className="text-sm text-gray-600">
          <p>Authors: {paper.authors.join(", ")}</p>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
          {typeof paper.abstract === 'string' ? paper.abstract : 'Abstract not available'}
        </p>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation()
              window.open(pubmedUrl, '_blank')
            }}
          >
            <ExternalLink className="h-4 w-4" />
            View on PubMed
          </Button>

          <PaperActions
            paper={paper}
            onSave={onSave}
            onLike={onLike}
          />
        </div>
      </div>
    </Card>
  )
}