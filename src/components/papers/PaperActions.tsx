import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Heart, Plus } from "lucide-react"
import { type Paper } from "@/types/papers"
import { AddToListDialog } from "./AddToListDialog"

interface PaperActionsProps {
  paper: Paper
  onSave: (paper: Paper, listName: string) => void
  onLike: (paper: Paper) => void
}

export function PaperActions({ paper, onSave, onLike }: PaperActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="flex space-x-2">
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
          <Heart className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDialogOpen(true)
          }}
          title="Add to List"
          className="shadow-soft hover:shadow-card transition-shadow duration-200"
        >
          <Plus className="h-4 w-4" />
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
      </div>
      <AddToListDialog
        paper={paper}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={(paper, listName) => {
          onSave(paper, listName)
          setIsDialogOpen(false)
        }}
      />
    </>
  )
}