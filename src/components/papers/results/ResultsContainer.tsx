import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { ResultsHeader } from "./ResultsHeader"
import { ResultsGrid } from "./ResultsGrid"
import { LoadingState } from "@/components/papers/LoadingState"
import { ArticleDetails } from "@/components/papers/ArticleDetails"
import { type SearchParameters } from "@/constants/searchConfig"
import { useSortedPapers } from "./useSortedPapers"

interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
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
  const [sortedPapers, setSortedPapers] = useState<Paper[]>([])
  const [isSorting, setIsSorting] = useState(false)
  
  const { 
    sortBy, 
    sortDirection, 
    setSortBy, 
    setSortDirection 
  } = useSortedPapers(papers, {})

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUserId()
  }, [])

  // Fetch sorted papers when papers array changes
  useEffect(() => {
    const fetchSortedPapers = async () => {
      if (!papers.length) {
        setSortedPapers([])
        return
      }

      setIsSorting(true)
      try {
        const { data, error } = await supabase.functions.invoke('fetch-sorted-papers', {
          body: { papers }
        })

        if (error) throw error
        console.log('Received sorted papers:', data.papers)
        setSortedPapers(data.papers)
      } catch (error) {
        console.error('Error fetching sorted papers:', error)
        setSortedPapers(papers) // Fallback to unsorted papers
      } finally {
        setIsSorting(false)
      }
    }

    fetchSortedPapers()
  }, [papers])

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-4">
      <ResultsHeader 
        searchCriteria={searchCriteria}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={setSortBy}
        onDirectionChange={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
        totalResults={papers.length}
      />
      
      <ResultsGrid
        papers={sortedPapers}
        userId={userId}
        sortBy={sortBy}
        sortDirection={sortDirection}
        currentPage={pagination.page}
        onPageChange={onPageChange}
        onPaperSelect={setSelectedPaper}
        totalPages={pagination.totalPages}
        isLoading={isSorting}
      />

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}