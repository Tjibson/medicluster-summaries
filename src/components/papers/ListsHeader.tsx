import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ListsHeaderProps {
  onDownloadSummary: () => void
}

export function ListsHeader({ onDownloadSummary }: ListsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">My Lists</h1>
      <Button
        onClick={onDownloadSummary}
        className="shadow-soft hover:shadow-card transition-shadow duration-200"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Summary
      </Button>
    </div>
  )
}