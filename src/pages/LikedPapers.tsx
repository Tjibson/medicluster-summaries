import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { type SavedPaper } from "@/types/papers"
import { PapersList } from "@/components/papers/PapersList"

export default function LikedPapers() {
  const [likedPapers, setLikedPapers] = useState<SavedPaper[]>([])
  const [loading, setLoading] = useState(true)
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
        .eq("is_liked", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setLikedPapers(data || [])
    } catch (error) {
      console.error("Error fetching liked papers:", error)
      toast({
        title: "Error",
        description: "Failed to load liked papers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlike = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .update({ is_liked: false })
        .eq("id", paperId)

      if (error) throw error

      setLikedPapers((prev) => prev.filter((paper) => paper.id !== paperId))
      toast({
        title: "Success",
        description: "Paper removed from likes",
      })
    } catch (error) {
      console.error("Error unliking paper:", error)
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

      setLikedPapers((prev) => prev.filter((paper) => paper.id !== paperId))
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

  const handleDownload = (paperId: string) => {
    console.log("Downloading paper:", paperId)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Liked Papers</h1>
      <PapersList
        papers={likedPapers}
        isLoading={loading}
        emptyMessage="No liked papers yet"
        onUnlike={handleUnlike}
        onRemove={handleRemove}
        onDownload={handleDownload}
        showLikeButton={true}
      />
    </div>
  )
}