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
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{paper.title}</h3>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <p>Citations: {paper.citations || 0}</p>
          <span>•</span>
          <p>{paper.year}</p>
          <span>•</span>
          <p>{paper.journal}</p>
        </div>

        <div className="text-sm text-gray-600">
          <p>Authors: {paper.authors.join(", ")}</p>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed">
          {paper.abstract || "Abstract not available"}
        </p>

        <div className="flex justify-end">
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