import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { PaperCard } from "../PaperCard"
import { PaginationControls } from "../PaginationControls"
import { type SortOption, type SortDirection } from "../SortingControls"
import { ErrorPage } from "../ErrorPage"

interface ResultsGridProps {
  papers: Paper[]
  userId: string | null
  sortBy: SortOption
  sortDirection: SortDirection
  currentPage: number
  onPageChange: (page: number) => void
  onPaperSelect: (paper: Paper) => void
  totalPages?: number
  isLoading?: boolean
}

export function ResultsGrid({ 
  papers, 
  userId, 
  sortBy,
  sortDirection,
  currentPage, 
  onPageChange,
  onPaperSelect,
  totalPages = 1,
  isLoading = false
}: ResultsGridProps) {
  const { toast } = useToast()

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

  const getSortValue = (paper: Paper, sortType: SortOption): number | string => {
    switch (sortType) {
      case "citations":
        return typeof paper.citations === 'number' ? paper.citations : 0
      case "date":
        return new Date(paper.year, 0).getTime()
      case "title":
        return paper.title.toLowerCase()
      case "relevance":
        return paper.relevance_score || 0
      default:
        return 0
    }
  }

  const sortedPapers = [...papers].sort((a, b) => {
    const aValue = getSortValue(a, sortBy)
    const bValue = getSortValue(b, sortBy)
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    const numericA = aValue as number
    const numericB = bValue as number
    return sortDirection === "asc" 
      ? numericA - numericB
      : numericB - numericA
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {sortedPapers.map((paper) => (
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
