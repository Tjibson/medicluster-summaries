import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Star, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SavedPaper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  created_at: string
  paper_id: string
  user_id: string
  is_liked: boolean | null
}

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

  const handleToggleLike = async (paper: SavedPaper) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .update({ is_liked: !paper.is_liked })
        .eq("id", paper.id)

      if (error) throw error

      setSavedPapers((prev) =>
        prev.map((p) =>
          p.id === paper.id ? { ...p, is_liked: !p.is_liked } : p
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

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Lists</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Lists</h1>
      {savedPapers.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          No papers saved yet
        </Card>
      ) : (
        <div className="space-y-4">
          {savedPapers.map((paper) => (
            <Card key={paper.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{paper.title}</h3>
                  <p className="text-sm text-gray-600">
                    {paper.authors.join(", ")} • {paper.journal} • {paper.year}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/90 active:bg-primary/70"
                    onClick={() => handleToggleLike(paper)}
                    title={paper.is_liked ? "Unlike" : "Like"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        paper.is_liked ? "fill-yellow-400" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/90 active:bg-primary/70"
                    onClick={() => {
                      // Download functionality would go here
                      console.log("Downloading paper:", paper.paper_id)
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/90 active:bg-primary/70"
                    onClick={() => handleRemove(paper.id)}
                    title="Remove from list"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}