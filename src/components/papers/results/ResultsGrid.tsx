import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { PaperCard } from "../PaperCard"
import { PaginationControls } from "../PaginationControls"
import { type SortOption } from "../SortingControls"

interface ResultsGridProps {
  papers: Paper[]
  userId: string | null
  sortBy: SortOption
  currentPage: number
  onPageChange: (page: number) => void
  onPaperSelect: (paper: Paper) => void
}

export function ResultsGrid({ 
  papers, 
  userId, 
  sortBy, 
  currentPage, 
  onPageChange,
  onPaperSelect 
}: ResultsGridProps) {
  const { toast } = useToast()
  const itemsPerPage = 25

  const handleSavePaper = async (paper: Paper) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save papers",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("saved_papers")
        .insert({
          user_id: userId,
          paper_id: paper.id,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          year: paper.year,
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Paper saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save paper",
        variant: "destructive",
      })
    }
  }

  const handleLikePaper = async (paper: Paper) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to like papers",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: existingPaper } = await supabase
        .from("saved_papers")
        .select()
        .eq("user_id", userId)
        .eq("paper_id", paper.id)
        .single()

      if (existingPaper) {
        const { error } = await supabase
          .from("saved_papers")
          .update({
            is_liked: true,
          })
          .eq("user_id", userId)
          .eq("paper_id", paper.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("saved_papers")
          .insert({
            user_id: userId,
            paper_id: paper.id,
            title: paper.title,
            authors: paper.authors,
            journal: paper.journal,
            year: paper.year,
            is_liked: true,
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Paper added to likes",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like paper",
        variant: "destructive",
      })
    }
  }

  const sortedPapers = [...papers].sort((a, b) => {
    switch (sortBy) {
      case "citations":
        return (b.citations || 0) - (a.citations || 0)
      case "date":
        return b.year - a.year
      case "title":
        return a.title.localeCompare(b.title)
      default:
        return (b.relevance_score || 0) - (a.relevance_score || 0)
    }
  })

  const totalPages = Math.ceil(sortedPapers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPapers = sortedPapers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <div className="space-y-4">
        {paginatedPapers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSave={handleSavePaper}
            onLike={handleLikePaper}
            onClick={() => onPaperSelect(paper)}
          />
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  )
}