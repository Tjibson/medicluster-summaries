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
  const [sortBy, setSortBy] = useState<SortOption>("citations")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [sortedPapers, setSortedPapers] = useState<Paper[]>([])
  const [isCitationsLoading, setIsCitationsLoading] = useState(false)
  const [citationsMap, setCitationsMap] = useState<Record<string, number>>({})

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

  // Fetch citations for papers that don't have them
  useEffect(() => {
    const fetchCitations = async () => {
      setIsCitationsLoading(true)
      const newCitationsMap: Record<string, number> = {}

      await Promise.all(
        papers.map(async (paper) => {
          if (paper.citations === undefined || paper.citations === null) {
            try {
              const { data, error } = await supabase.functions.invoke('fetch-citations', {
                body: { paper }
              })
              
              if (error) throw error
              newCitationsMap[paper.id] = Number(data?.citations) || 0
            } catch (error) {
              console.error('Error fetching citations:', error)
              newCitationsMap[paper.id] = 0
            }
          } else {
            newCitationsMap[paper.id] = Number(paper.citations) || 0
          }
        })
      )

      console.log('Citations map:', newCitationsMap)
      setCitationsMap(newCitationsMap)
      setIsCitationsLoading(false)
    }

    if (papers.length > 0) {
      fetchCitations()
    } else {
      setCitationsMap({})
    }
  }, [papers])

  // Update sorted papers when citations are loaded or sort options change
  useEffect(() => {
    const papersWithCitations = papers.map(paper => ({
      ...paper,
      citations: citationsMap[paper.id] || 0
    }))

    const sortPapers = () => {
      const papersToSort = [...papersWithCitations]
      
      papersToSort.sort((a, b) => {
        switch (sortBy) {
          case "citations": {
            const aCitations = Number(a.citations) || 0
            const bCitations = Number(b.citations) || 0
            console.log(`Comparing citations: ${aCitations} vs ${bCitations}`)
            return sortDirection === "asc" 
              ? aCitations - bCitations 
              : bCitations - aCitations
          }
          case "date":
            return sortDirection === "asc" 
              ? a.year - b.year
              : b.year - a.year
          case "title":
            return sortDirection === "asc"
              ? a.title.toLowerCase().localeCompare(b.title.toLowerCase())
              : b.title.toLowerCase().localeCompare(a.title.toLowerCase())
          case "relevance": {
            const aScore = a.relevance_score || 0
            const bScore = b.relevance_score || 0
            return sortDirection === "asc" 
              ? aScore - bScore 
              : bScore - aScore
          }
          default:
            return 0
        }
      })

      console.log('Sorted papers:', papersToSort.map(p => ({ 
        title: p.title, 
        citations: p.citations 
      })))
      setSortedPapers(papersToSort)
    }

    sortPapers()
  }, [citationsMap, sortBy, sortDirection, papers])

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