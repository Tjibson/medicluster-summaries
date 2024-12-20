import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { PaperCard } from "../PaperCard"
import { PaginationControls } from "../PaginationControls"
import { type SortOption } from "../SortingControls"
import { useState } from "react"
import { calculateRelevanceScore } from "@/utils/scoring"

interface ResultsGridProps {
  papers: Paper[]
  userId: string | null
  sortBy: SortOption
  currentPage: number
  onPageChange: (page: number) => void
  onPaperSelect: (paper: Paper) => void
  totalPages?: number
}

export function ResultsGrid({ 
  papers, 
  userId, 
  sortBy, 
  currentPage, 
  onPageChange,
  onPaperSelect,
  totalPages = 1
}: ResultsGridProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

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
      default: // "relevance" is default
        // Extract keywords from papers for scoring
        const keywords = papers.reduce((acc: string[], paper) => {
          const titleWords = paper.title.toLowerCase().split(/\s+/)
          // Ensure abstract is a string before processing
          const abstractText = typeof paper.abstract === 'string' 
            ? paper.abstract 
            : paper.abstract?.toString() || ''
          const abstractWords = abstractText.toLowerCase().split(/\s+/)
          return [...new Set([...acc, ...titleWords, ...abstractWords])]
        }, [])
        
        const scoreA = calculateRelevanceScore(a, keywords)
        const scoreB = calculateRelevanceScore(b, keywords)
        return scoreB - scoreA
    }
  })

  console.log("Sorted papers with relevance scores:", sortedPapers.map(p => ({
    title: p.title,
    score: calculateRelevanceScore(p, [])
  })))

  return (
    <>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          sortedPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onSave={handleSavePaper}
              onLike={handleLikePaper}
              onClick={() => onPaperSelect(paper)}
            />
          ))
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  )
}