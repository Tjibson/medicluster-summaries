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
  }
}

export function ResultsContainer({ papers, isLoading, searchCriteria }: ResultsContainerProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [currentPage, setCurrentPage] = useState(1)
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

  if (isLoading) {
    return <LoadingState />
  }

  if (papers.length === 0) {
    return (
      <div className="text-center p-6 bg-background rounded-lg shadow">
        <p className="text-muted-foreground">No papers found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResultsHeader 
        searchCriteria={searchCriteria}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <ResultsGrid
        papers={papersWithCitations}
        userId={userId}
        sortBy={sortBy}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPaperSelect={setSelectedPaper}
      />

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}