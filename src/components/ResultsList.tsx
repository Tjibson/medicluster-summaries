import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { LoadingState } from "@/components/papers/LoadingState"
import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { type Paper } from "@/types/papers"
import { PaperCard } from "./papers/PaperCard"
import { ArticleDetails } from "./papers/ArticleDetails"
import { SortingControls, type SortOption } from "./papers/SortingControls"
import { PaginationControls } from "./papers/PaginationControls"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: {
    population?: string
    disease?: string
    medicine?: string
    working_mechanism?: string
    patientCount?: string
    trialType?: string
    journal?: string
  }
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [currentPage, setCurrentPage] = useState(1)
  const [papersWithCitations, setPapersWithCitations] = useState<Paper[]>([])
  const itemsPerPage = 25

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUserId()
  }, [])

  useEffect(() => {
    const fetchCitations = async () => {
      const updatedPapers = await Promise.all(
        papers.map(async (paper) => {
          try {
            const response = await supabase.functions.invoke('fetch-citations', {
              body: { title: paper.title, authors: paper.authors }
            })
            
            if (response.data?.citations !== undefined) {
              return { ...paper, citations: response.data.citations }
            }
            return paper
          } catch (error) {
            console.error('Error fetching citations:', error)
            return paper
          }
        })
      )
      setPapersWithCitations(updatedPapers)
    }

    if (papers.length > 0) {
      fetchCitations()
    } else {
      setPapersWithCitations([])
    }
  }, [papers])

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

  const sortedPapers = [...papersWithCitations].sort((a, b) => {
    switch (sortBy) {
      case "citations":
        return (b.citations || 0) - (a.citations || 0)
      case "date":
        return b.year - a.year
      case "title":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const totalPages = Math.ceil(sortedPapers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPapers = sortedPapers.slice(startIndex, startIndex + itemsPerPage)

  if (isLoading) {
    return <LoadingState />
  }

  if (papers.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow">
        <p className="text-gray-500">No papers found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchCriteria && <SearchCriteria criteria={searchCriteria} />}
      
      <SortingControls sortBy={sortBy} onSortChange={setSortBy} />

      <div className="space-y-4">
        {paginatedPapers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSave={handleSavePaper}
            onLike={handleLikePaper}
            onClick={() => setSelectedPaper(paper)}
          />
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}