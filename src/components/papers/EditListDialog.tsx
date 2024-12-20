import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface List {
  id: string
  name: string
}

interface EditListDialogProps {
  list: List | null
  onClose: () => void
  onSave: (listId: string, newName: string) => void
}

export function EditListDialog({ list, onClose, onSave }: EditListDialogProps) {
  const [newName, setNewName] = useState("")

  useEffect(() => {
    if (list) {
      setNewName(list.name)
    }
  }, [list])

  const handleSave = () => {
    if (list && newName.trim()) {
      onSave(list.id, newName.trim())
      onClose()
    }
  }

  return (
    <Dialog open={!!list} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit List Name</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter new list name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
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