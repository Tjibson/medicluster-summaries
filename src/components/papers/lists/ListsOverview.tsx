import { type List } from "@/pages/Lists"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Edit2, Trash2 } from "lucide-react"
import { ListPreview } from "@/components/papers/ListPreview"
import { useNavigate } from "react-router-dom"

interface ListsOverviewProps {
  lists: List[]
  onEditList: (list: List) => void
  onRemoveList: (listId: string) => void
  onDownloadSummary: (listId: string) => void
}

export function ListsOverview({ 
  lists, 
  onEditList, 
  onRemoveList,
  onDownloadSummary 
}: ListsOverviewProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {lists.map((list) => (
        <div key={list.id} className="space-y-4">
          <div className="flex justify-between items-start">
            <div 
              className="space-y-4 flex-1 mr-4 cursor-pointer" 
              onClick={() => navigate(`/lists/${list.id}`)}
            >
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">{list.name}</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditList(list)
                    }}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveList(list.id)
                    }}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ListPreview papers={list.papers} />
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDownloadSummary(list.id)
              }}
              className="shadow-soft hover:shadow-card transition-shadow duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Summary
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}