import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { PaperCard } from "@/components/papers/PaperCard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Edit2, Trash2 } from "lucide-react"
import { type SavedPaper } from "@/types/papers"
import { ListPreview } from "@/components/papers/ListPreview"
import { EditListDialog } from "@/components/papers/EditListDialog"

interface List {
  id: string
  name: string
  papers: SavedPaper[]
}

export default function Lists() {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingList, setEditingList] = useState<List | null>(null)
  const { toast } = useToast()

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
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Lists</h1>
        <Card className="p-6 text-center text-gray-500">
          No lists created yet
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Lists</h1>
      <div className="space-y-8">
        {lists.map((list) => (
          <div key={list.id} className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-4 flex-1 mr-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold">{list.name}</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingList(list)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveList(list.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ListPreview papers={list.papers} />
              </div>
              <Button
                onClick={() => handleDownloadListSummary(list.id)}
                className="shadow-soft hover:shadow-card transition-shadow duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Summary
              </Button>
            </div>
            <div className="space-y-4">
              {list.papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onSave={() => {}}
                  onLike={() => {}}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <EditListDialog
        list={editingList}
        onClose={() => setEditingList(null)}
        onSave={handleEditList}
      />
    </div>
  )
}