import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PapersList } from "@/components/papers/PapersList"
import { type SavedPaper } from "@/types/papers"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface ListDetailsProps {
  listId: string
  listName: string
  papers: SavedPaper[]
}

export function ListDetails({ listId, listName }: ListDetailsProps) {
  const navigate = useNavigate()
  const [papers, setPapers] = useState<SavedPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPapers()
  }, [listId])

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_papers")
        .select(`
          id,
          user_id,
          paper_id,
          title,
          authors,
          journal,
          year,
          is_liked,
          created_at,
          list_id
        `)
        .eq("list_id", listId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPapers(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch papers for this list",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePaper = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .update({ list_id: null })
        .eq("paper_id", paperId)
        .eq("list_id", listId)

      if (error) throw error

      setPapers(papers.filter(paper => paper.paper_id !== paperId))
      toast({
        title: "Success",
        description: "Paper removed from list",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove paper from list",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (paperId: string) => {
    const paper = papers.find(p => p.paper_id === paperId)
    if (paper?.pdfUrl) {
      window.open(paper.pdfUrl, '_blank')
    }
  }

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

      <PapersList
        papers={papers}
        isLoading={isLoading}
        emptyMessage="No papers in this list yet"
        onRemove={handleRemovePaper}
        onDownload={handleDownload}
      />
    </div>
  )
}