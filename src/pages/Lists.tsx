import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { type SavedPaper } from "@/types/papers"
import { PapersList } from "@/components/papers/PapersList"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

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

  const handleDownloadSummary = () => {
    // Create a text summary of all saved papers
    const summary = savedPapers.map(paper => (
      `Title: ${paper.title}\nAuthors: ${paper.authors.join(", ")}\nJournal: ${paper.journal} (${paper.year})\n\n`
    )).join("---\n\n")

    // Create and download the file
    const blob = new Blob([summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "papers-summary.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Summary downloaded successfully",
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Lists</h1>
        <Button
          onClick={handleDownloadSummary}
          className="shadow-soft hover:shadow-card transition-shadow duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Summary
        </Button>
      </div>
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