import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { PapersList } from "@/components/papers/PapersList"
import { type SavedPaper } from "@/types/papers"

export default function LikedPapers() {
  const [papers, setPapers] = useState<SavedPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchLikedPapers()
  }, [])

  const fetchLikedPapers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("saved_papers")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_liked", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPapers(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch liked papers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlike = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .update({ is_liked: false })
        .eq("id", paperId)

      if (error) throw error

      setPapers(papers.filter(paper => paper.id !== paperId))
      toast({
        title: "Success",
        description: "Paper removed from likes",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlike paper",
        variant: "destructive",
      })
    }
  }

  const handleRemove = async (paperId: string) => {
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
      toast({
        title: "Error",
        description: "Failed to remove paper",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (paperId: string) => {
    const paper = papers.find(p => p.id === paperId)
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Liked Papers</h1>
      <PapersList
        papers={papers}
        isLoading={isLoading}
        emptyMessage="No liked papers yet"
        onUnlike={handleUnlike}
        onRemove={handleRemove}
        onDownload={handleDownload}
        showLikeButton={true}
      />
    </div>
  )
}