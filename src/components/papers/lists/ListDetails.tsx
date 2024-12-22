import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { ListsHeader } from "@/components/papers/ListsHeader"
import { PapersList } from "@/components/papers/PapersList"
import { type SavedPaper } from "@/types/papers"

interface ListDetailsProps {
  listId: string
  listName: string
  papers: SavedPaper[]
}

export function ListDetails({ listId, listName, papers: initialPapers }: ListDetailsProps) {
  const [papers, setPapers] = useState<SavedPaper[]>(initialPapers)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleRemovePaper = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .delete()
        .eq("id", paperId)

      if (error) throw error

      setPapers(papers.filter(paper => paper.id !== paperId))
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

  const handleDownloadPaper = async (paperId: string) => {
    const paper = papers.find(p => p.id === paperId)
    if (!paper?.pdf_url) {
      toast({
        title: "Error",
        description: "No PDF available for this paper",
        variant: "destructive",
      })
      return
    }

    // Trigger download using the pdf_url
    window.open(paper.pdf_url, '_blank')
  }

  return (
    <div className="container mx-auto p-6">
      <ListsHeader title={listName} />
      <PapersList
        papers={papers}
        isLoading={isLoading}
        emptyMessage="No papers in this list yet"
        onRemove={handleRemovePaper}
        onDownload={handleDownloadPaper}
      />
    </div>
  )
}