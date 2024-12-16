import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { type Paper } from "@/types/papers"

interface AddToListDialogProps {
  paper: Paper
  isOpen: boolean
  onClose: () => void
  onSave: (paper: Paper, listName: string) => void
  existingLists: string[]
}

export function AddToListDialog({
  paper,
  isOpen,
  onClose,
  onSave,
  existingLists,
}: AddToListDialogProps) {
  const [newListName, setNewListName] = useState("")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Create New List</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button
                onClick={() => {
                  if (newListName.trim()) {
                    onSave(paper, newListName)
                    setNewListName("")
                  }
                }}
                disabled={!newListName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
          {existingLists.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Existing Lists</h3>
              <div className="space-y-2">
                {existingLists.map((list) => (
                  <Button
                    key={list}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onSave(paper, list)}
                  >
                    {list}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}