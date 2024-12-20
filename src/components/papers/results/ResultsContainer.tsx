import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { ResultsHeader } from "./ResultsHeader"
import { ResultsGrid } from "./ResultsGrid"
import { LoadingState } from "@/components/papers/LoadingState"
import { ArticleDetails } from "@/components/papers/ArticleDetails"
import { type SortOption, type SortDirection } from "../SortingControls"
import { type SearchParameters } from "@/constants/searchConfig"

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
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [papersWithCitations, setPapersWithCitations] = useState<Paper[]>([])
  const [isCitationsLoading, setIsCitationsLoading] = useState(false)
  const [sortedPapers, setSortedPapers] = useState<Paper[]>(papers)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUserId()
  }, [])

  // Initialize sortedPapers when papers change
  useEffect(() => {
    setSortedPapers(papers)
    setPapersWithCitations([])
  }, [papers])

  useEffect(() => {
    const fetchCitations = async () => {
      setIsCitationsLoading(true)
      const updatedPapers = await Promise.all(
        papers.map(async (paper) => {
          if (paper.citations === undefined || paper.citations === null) {
            try {
              const { data, error } = await supabase.functions.invoke('fetch-citations', {
                body: { paper }
              })
              
              if (error) throw error
              return {
                ...paper,
                citations: data?.citations || 0
              }
            } catch (error) {
              console.error('Error fetching citations:', error)
              return {
                ...paper,
                citations: 0
              }
            }
          }
          return paper
        })
      )
      setPapersWithCitations(updatedPapers)
      setSortedPapers(updatedPapers)
      setIsCitationsLoading(false)
    }

    if (papers.length > 0) {
      fetchCitations()
    }
  }, [papers])

  // Effect to handle sorting using simplified logic
  useEffect(() => {
    console.log('Sorting papers:', { sortBy, sortDirection, papersCount: papersWithCitations.length })
    
    const papersToSort = papersWithCitations.length > 0 ? papersWithCitations : papers
    
    const sorted = [...papersToSort].sort((a, b) => {
      switch (sortBy) {
        case "citations":
          const aCitations = typeof a.citations === 'number' ? a.citations : 0
          const bCitations = typeof b.citations === 'number' ? b.citations : 0
          return sortDirection === "asc" ? aCitations - bCitations : bCitations - aCitations
        
        case "date":
          return sortDirection === "asc" 
            ? a.year - b.year
            : b.year - a.year
        
        case "title":
          return sortDirection === "asc"
            ? a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            : b.title.toLowerCase().localeCompare(a.title.toLowerCase())
        
        case "relevance":
          const aScore = a.relevance_score || 0
          const bScore = b.relevance_score || 0
          return sortDirection === "asc" ? aScore - bScore : bScore - aScore
        
        default:
          return 0
      }
    })

    console.log('Sorted papers:', { 
      sortBy, 
      sortDirection, 
      firstPaperCitations: sorted[0]?.citations,
      lastPaperCitations: sorted[sorted.length - 1]?.citations
    })

    setSortedPapers(sorted)
  }, [papersWithCitations, sortBy, sortDirection, papers])

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
        isLoading={isCitationsLoading}
      />

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}