import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paper } from "@/types/papers"

interface AddToListDialogProps {
  paper: Paper | null
  isOpen: boolean
  onClose: () => void
  onSave: (paper: Paper, listName: string) => void
}

export function AddToListDialog({ paper, isOpen, onClose, onSave }: AddToListDialogProps) {
  const [listName, setListName] = useState("")

  const handleSave = () => {
    if (paper && listName) {
      onSave(paper, listName)
      onClose()
      setListName("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter list name"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}