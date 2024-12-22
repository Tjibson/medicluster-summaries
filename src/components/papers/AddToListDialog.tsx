import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"

interface AddToListDialogProps {
  paper: Paper | null
  isOpen: boolean
  onClose: () => void
  onSave: (paper: Paper, listId: string) => void
}

export function AddToListDialog({ paper, isOpen, onClose, onSave }: AddToListDialogProps) {
  const [newListName, setNewListName] = useState("")
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchLists()
    }
  }, [isOpen])

  const fetchLists = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from("lists")
      .select("id, name")
      .eq("user_id", session.user.id)
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
    if (!newListName.trim() || !paper) return

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

    onSave(paper, data.id)
    setNewListName("")
    onClose()
    toast({
      title: "Success",
      description: "List created and paper added successfully",
    })
  }

  const handleSelectList = async (listId: string) => {
    if (!paper) return
    onSave(paper, listId)
    onClose()
    toast({
      title: "Success",
      description: "Paper added to list successfully",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription>
            Choose an existing list or create a new one
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {lists.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Select List</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {lists.map((list) => (
                    <Button
                      key={list.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleSelectList(list.id)}
                    >
                      {list.name}
                      <Plus className="h-4 w-4 ml-2" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium mb-2">Create New List</h4>
            <div className="flex space-x-2">
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name"
                onClick={(e) => e.stopPropagation()} // Stop event propagation
              />
              <Button onClick={handleCreateList}>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}