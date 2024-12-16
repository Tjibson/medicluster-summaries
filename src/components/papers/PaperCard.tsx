import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Heart, Trash2 } from "lucide-react"
import { type SavedPaper } from "@/types/papers"

interface PaperCardProps {
  paper: SavedPaper
  onUnlike?: () => void
  onRemove: () => void
  onDownload: () => void
  showLikeButton?: boolean
}

export const PaperCard = ({
  paper,
  onUnlike,
  onRemove,
  onDownload,
  showLikeButton = false,
}: PaperCardProps) => {
  return (
    <Card className="p-6 shadow-card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{paper.title}</h3>
          <p className="text-sm text-gray-600">
            {paper.authors.join(", ")} • {paper.journal} • {paper.year}
          </p>
        </div>
        <div className="flex space-x-2">
          {showLikeButton && onUnlike && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-yellow-100 active:bg-yellow-200 transition-colors duration-200 shadow-soft"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onUnlike()
              }}
              title="Unlike"
            >
              <Heart className="h-4 w-4 fill-yellow-400" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200 shadow-soft"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDownload()
            }}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-red-100 active:bg-red-200 transition-colors duration-200 shadow-soft"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            title="Remove from list"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}