import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { type Paper } from "@/types/papers"

interface ArticleDetailsProps {
  paper: Paper | null
  isOpen: boolean
  onClose: () => void
}

export function ArticleDetails({ paper, isOpen, onClose }: ArticleDetailsProps) {
  if (!paper) return null

  const handleDownload = async () => {
    if (paper.pdfUrl) {
      window.open(paper.pdfUrl, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{paper.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">
                {paper.authors.join(", ")} • {paper.journal} • {paper.year}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Citations: {paper.citations || 0}
              </p>
            </div>
            {paper.pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Abstract</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{paper.abstract}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}