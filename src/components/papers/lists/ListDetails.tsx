import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { SavedPaper } from "@/types/papers"
import { PapersList } from "@/components/papers/PapersList"
import { ListsHeader } from "@/components/papers/ListsHeader"

interface ListDetailsProps {
  listId: string
  listName: string
}

export function ListDetails({ listId, listName }: ListDetailsProps) {
  const [papers, setPapers] = useState<SavedPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPapers()
  }, [listId])

  const fetchPapers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("saved_papers")
        .select("*")
        .eq("list_id", listId)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPapers(data as SavedPaper[])
    } catch (error) {
      console.error("Error fetching papers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch papers",
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
        .eq("id", paperId)

      if (error) throw error

      setPapers(papers.filter(p => p.id !== paperId))
      toast({
        title: "Success",
        description: "Paper removed from list",
      })
    } catch (error) {
      console.error("Error removing paper:", error)
      toast({
        title: "Error",
        description: "Failed to remove paper",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (paperId: string) => {
    console.log("Downloading paper:", paperId)
    // Implement download functionality
  }

  return (
    <div className="container mx-auto p-6">
      <ListsHeader title={listName} />
      <div className="mt-6">
        <PapersList 
          papers={papers}
          isLoading={isLoading}
          emptyMessage="No papers in this list yet"
          onRemove={handleRemovePaper}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}