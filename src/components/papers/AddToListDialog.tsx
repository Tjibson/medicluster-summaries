import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { useToast } from "@/components/ui/use-toast"

interface AddToListDialogProps {
  paper: Paper
  isOpen: boolean
  onClose: () => void
  onSave: (paper: Paper, listName: string) => void
  existingLists?: string[]
}

export function AddToListDialog({
  paper,
  isOpen,
  onClose,
  onSave,
  existingLists = [],
}: AddToListDialogProps) {
  const [newListName, setNewListName] = useState("")
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from("lists")
      .select("id, name")
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lists",
        variant: "destructive",
      })
      return
    }

    setLists(data || [])
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a list",
        variant: "destructive",
      })
      return
    }

    const { data, error } = await supabase
      .from("lists")
      .insert({ name: newListName.trim(), user_id: session.user.id })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create list",
        variant: "destructive",
      })
      return
    }

    onSave(paper, data.name)
    setNewListName("")
    onClose()
  }

  const handleSelectList = (listName: string) => {
    onSave(paper, listName)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Create New List</h4>
            <div className="flex space-x-2">
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name"
              />
              <Button onClick={handleCreateList}>Create</Button>
            </div>
          </div>
          {lists.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Or Select Existing List</h4>
              <div className="space-y-2">
                {lists.map((list) => (
                  <Button
                    key={list.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectList(list.name)}
                  >
                    {list.name}
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