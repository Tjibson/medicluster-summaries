import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { ResultsHeader } from "./ResultsHeader"
import { ResultsGrid } from "./ResultsGrid"
import { LoadingState } from "@/components/papers/LoadingState"
import { ArticleDetails } from "@/components/papers/ArticleDetails"
import { type SortOption } from "../SortingControls"

interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: {
    dateRange: { start: string; end: string }
    keywords: string
    journalNames: string[]
  } | null
  pagination?: {
    total: number
    page: number
    totalPages: number
    hasMore: boolean
  }
  onPageChange?: (page: number) => void
}

export function ResultsContainer({ 
  papers, 
  isLoading, 
  searchCriteria,
  pagination = { total: 0, page: 1, totalPages: 1, hasMore: false },
  onPageChange = () => {}
}: ResultsContainerProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [papersWithCitations, setPapersWithCitations] = useState<Paper[]>([])

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
    console.log("Papers received in ResultsContainer:", papers)
    setPapersWithCitations(papers.map(paper => ({
      ...paper,
      citations: paper.citations || 0
    })))
  }, [papers])

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-4">
      <ResultsHeader 
        searchCriteria={searchCriteria}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalResults={pagination.total}
      />
      
      <ResultsGrid
        papers={papersWithCitations}
        userId={userId}
        sortBy={sortBy}
        currentPage={pagination.page}
        onPageChange={onPageChange}
        onPaperSelect={setSelectedPaper}
        totalPages={pagination.totalPages}
      />

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}