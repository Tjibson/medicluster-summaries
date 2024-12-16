import { Button } from "@/components/ui/button"
import { Download, Star, List } from "lucide-react"
import { type Paper } from "@/types/papers"

interface PaperActionsProps {
  paper: Paper
  onSave: (paper: Paper) => void
  onLike: (paper: Paper) => void
}

export function PaperActions({ paper, onSave, onLike }: PaperActionsProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onSave(paper)
        }}
        title="Add to List"
        className="shadow-soft hover:shadow-card transition-shadow duration-200"
      >
        <List className="h-4 w-4" />
      </Button>
      {paper.pdfUrl && (
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.open(paper.pdfUrl, '_blank')
          }}
          title="Download PDF"
          className="shadow-soft hover:shadow-card transition-shadow duration-200"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onLike(paper)
        }}
        title="Like Paper"
        className="shadow-soft hover:shadow-card transition-shadow duration-200"
      >
        <Star className="h-4 w-4" />
      </Button>
    </div>
  )
}