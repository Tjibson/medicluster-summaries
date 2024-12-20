import { type SavedPaper } from "@/types/papers"

interface ListPreviewProps {
  papers: SavedPaper[]
}

export function ListPreview({ papers }: ListPreviewProps) {
  const recentPapers = papers.slice(0, 5)

  if (recentPapers.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-6 bg-muted/30 p-4 rounded-lg">
      <h3 className="text-lg font-semibold">Recent Papers</h3>
      <div className="space-y-4">
        {recentPapers.map((paper) => (
          <div key={paper.id} className="space-y-2">
            <h4 className="font-medium text-sm">{paper.title}</h4>
            {paper.abstract && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {paper.abstract}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}