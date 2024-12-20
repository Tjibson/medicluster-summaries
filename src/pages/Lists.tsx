import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { type SavedPaper } from "@/types/papers"
import { EditListDialog } from "@/components/papers/EditListDialog"
import { ListsOverview } from "@/components/papers/lists/ListsOverview"
import { ListDetails } from "@/components/papers/lists/ListDetails"
import { useParams } from "react-router-dom"

export interface List {
  id: string
  name: string
  papers: SavedPaper[]
}

export default function Lists() {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingList, setEditingList] = useState<List | null>(null)
  const { toast } = useToast()
  const { listId } = useParams()

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: listsData, error: listsError } = await supabase
        .from("lists")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (listsError) throw listsError

      const listsWithPapers = await Promise.all(
        (listsData || []).map(async (list) => {
          const { data: papers, error: papersError } = await supabase
            .from("saved_papers")
            .select("*")
            .eq("list_id", list.id)
            .order("created_at", { ascending: false })

          if (papersError) throw papersError

          return {
            ...list,
            papers: papers || [],
          }
        })
      )

      setLists(listsWithPapers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lists",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from("lists")
        .delete()
        .eq("id", listId)

      if (error) throw error

      setLists(lists.filter(list => list.id !== listId))
      toast({
        title: "Success",
        description: "List removed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove list",
        variant: "destructive",
      })
    }
  }

  const handleEditList = async (listId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from("lists")
        .update({ name: newName })
        .eq("id", listId)

      if (error) throw error

      setLists(lists.map(list => 
        list.id === listId ? { ...list, name: newName } : list
      ))
      toast({
        title: "Success",
        description: "List name updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update list name",
        variant: "destructive",
      })
    }
  }

  const handleDownloadListSummary = async (listId: string) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return

    try {
      const summary = list.papers.map(paper => ({
        title: paper.title,
        authors: paper.authors.join(", "),
        journal: paper.journal,
        year: paper.year,
      }))

      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${list.name}-summary.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "List summary downloaded",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download list summary",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Lists</h1>
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (listId) {
    const currentList = lists.find(list => list.id === listId)
    if (!currentList) {
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">List not found</h1>
        </div>
      )
    }
    return (
      <ListDetails
        listId={currentList.id}
        listName={currentList.name}
        papers={currentList.papers}
      />
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Lists</h1>
      {lists.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No lists created yet</p>
        </div>
      ) : (
        <ListsOverview
          lists={lists}
          onEditList={setEditingList}
          onRemoveList={handleRemoveList}
          onDownloadSummary={handleDownloadListSummary}
        />
      )}
      <EditListDialog
        list={editingList}
        onClose={() => setEditingList(null)}
        onSave={handleEditList}
      />
    </div>
  )
}