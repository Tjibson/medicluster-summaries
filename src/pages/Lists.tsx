import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { type SavedPaper } from "@/types/papers"
import { PapersList } from "@/components/papers/PapersList"

export default function Lists() {
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSavedPapers()
  }, [])

  const fetchSavedPapers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("saved_papers")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setSavedPapers(data || [])
    } catch (error) {
      console.error("Error fetching saved papers:", error)
      toast({
        title: "Error",
        description: "Failed to load saved papers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .delete()
        .eq("id", paperId)

      if (error) throw error

      setSavedPapers((prev) => prev.filter((paper) => paper.id !== paperId))
      toast({
        title: "Success",
        description: "Paper removed from your list",
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

  const handleToggleLike = async (paperId: string) => {
    const paper = savedPapers.find((p) => p.id === paperId)
    if (!paper) return

    try {
      const { error } = await supabase
        .from("saved_papers")
        .update({ is_liked: !paper.is_liked })
        .eq("id", paperId)

      if (error) throw error

      setSavedPapers((prev) =>
        prev.map((p) =>
          p.id === paperId ? { ...p, is_liked: !p.is_liked } : p
        )
      )
      toast({
        title: "Success",
        description: paper.is_liked
          ? "Paper removed from likes"
          : "Paper added to likes",
      })
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: "Failed to update paper",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (paperId: string) => {
    console.log("Downloading paper:", paperId)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Lists</h1>
      <PapersList
        papers={savedPapers}
        isLoading={loading}
        emptyMessage="No papers saved yet"
        onUnlike={handleToggleLike}
        onRemove={handleRemove}
        onDownload={handleDownload}
        showLikeButton={true}
      />
    </div>
  )
}