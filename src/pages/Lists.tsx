import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { PapersList } from "@/components/papers/PapersList"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { type SavedPaper } from "@/types/papers"
import { ListPreview } from "@/components/papers/ListPreview"

interface List {
  id: string
  name: string
  papers: SavedPaper[]
}

export default function Lists() {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  const handleRemove = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .delete()
        .eq("id", paperId)

      if (error) throw error

      setLists(lists.map(list => ({
        ...list,
        papers: list.papers.filter(paper => paper.id !== paperId)
      })))

      toast({
        title: "Success",
        description: "Paper removed from list",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove paper",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (paperId: string) => {
    const paper = lists
      .flatMap(list => list.papers)
      .find(p => p.id === paperId)
    
    if (!paper?.pdfUrl) {
      toast({
        title: "Error",
        description: "PDF not available for this paper",
        variant: "destructive",
      })
      return
    }
    
    window.open(paper.pdfUrl, '_blank')
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
                <h2 className="text-xl font-semibold">{list.name}</h2>
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
            <PapersList
              papers={list.papers}
              isLoading={false}
              emptyMessage={`No papers in ${list.name}`}
              onRemove={handleRemove}
              onDownload={handleDownload}
            />
          </div>
        ))}
      </div>
    </div>
  )
}