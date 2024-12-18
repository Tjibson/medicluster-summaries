import { Card } from "@/components/ui/card"
import { type Paper } from "@/types/papers"
import { PaperActions } from "./PaperActions"

interface PaperCardProps {
  paper: Paper
  onSave: (paper: Paper) => void
  onLike: (paper: Paper) => void
  onClick: (paper: Paper) => void
}

export function PaperCard({ paper, onSave, onLike, onClick }: PaperCardProps) {
  return (
    <Card 
      className="p-6 shadow-card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onClick(paper)}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{paper.title}</h3>
          <p className="text-sm text-gray-600">
            {paper.authors.join(", ")} • {paper.journal} • {paper.year}
          </p>
          <p className="text-sm text-gray-500">
            Citations: {paper.citations || 0}
          </p>
          <p className="mt-2 text-gray-700 line-clamp-3">{paper.abstract}</p>
        </div>
        <PaperActions
          paper={paper}
          onSave={onSave}
          onLike={onLike}
        />
      </div>
    </Card>
  )
}