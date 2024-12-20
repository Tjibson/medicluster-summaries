import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ResultsList } from "@/components/ResultsList"
import { type SavedPaper } from "@/types/papers"

interface ListDetailsProps {
  listId: string
  listName: string
  papers: SavedPaper[]
}

export function ListDetails({ listId, listName, papers }: ListDetailsProps) {
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/lists")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{listName}</h1>
        </div>
      </div>

      <ResultsList
        papers={papers}
        isLoading={isLoading}
      />
    </div>
  )
}