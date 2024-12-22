import { useCitations } from "./useCitations"
import { useSortedPapers } from "./useSortedPapers"
import { ResultsHeader } from "./ResultsHeader"
import { ResultsGrid } from "./ResultsGrid"
import { type Paper } from "@/types/papers"
import { type SearchParameters } from "@/constants/searchConfig"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { ArticleDetails } from "../ArticleDetails"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"

interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
  onLoadMore: (papers: Paper[]) => void
}

export function ResultsContainer({ papers, isLoading, searchCriteria, onLoadMore }: ResultsContainerProps) {
  const startTime = useState(() => Date.now())[0]
  const [loadTime, setLoadTime] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [resultsPerPage, setResultsPerPage] = useState<string>("25")
  const [totalResults, setTotalResults] = useState<number | undefined>(undefined)
  
  const { citationsMap, isCitationsLoading, isComplete, progress: citationsProgress } = useCitations(papers)
  const { 
    sortedPapers, 
    sortBy, 
    sortDirection, 
    setSortBy, 
    setSortDirection,
    isRelevanceReady 
  } = useSortedPapers(papers, citationsMap, searchCriteria, isComplete)

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  // Calculate total progress including citations loading
  const totalProgress = isLoading ? 0 : Math.min(100, ((citationsProgress || 0) + (isRelevanceReady ? 100 : 0)) / 2)

  // Update load time when everything is complete
  if (isComplete && isRelevanceReady && loadTime === 0) {
    setLoadTime(Date.now() - startTime)
  }

  const handleLoadMore = async () => {
    if (!searchCriteria) return

    setIsLoadingMore(true)
    try {
      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: { 
          searchParams: {
            ...searchCriteria,
            offset: papers.length,
            limit: parseInt(resultsPerPage)
          }
        }
      })

      if (error) throw error

      if (data.papers) {
        onLoadMore(data.papers)
        setTotalResults(data.total)
      }
    } catch (error) {
      console.error('Error loading more papers:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Show loading screen while any of the data is being fetched
  if (isLoading || isCitationsLoading || !isRelevanceReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-6 bg-background/50 rounded-lg shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">
            {isLoading ? "Searching papers..." : 
             isCitationsLoading ? "Loading citations..." : 
             "Calculating relevance scores..."}
          </p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
          <div className="w-full max-w-xs mx-auto space-y-2">
            <Progress value={totalProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {Math.round(totalProgress)}% complete
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResultsHeader
        searchCriteria={searchCriteria}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={setSortBy}
        onDirectionChange={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
        totalResults={totalResults}
        loadedResults={papers.length}
        resultsPerPage={resultsPerPage}
        onResultsPerPageChange={setResultsPerPage}
      />
      
      <div className="space-y-4">
        {sortedPapers.map((paper) => (
          <ResultsGrid
            key={paper.id}
            papers={[paper]}
            userId={null}
            sortBy={sortBy}
            sortDirection={sortDirection}
            currentPage={1}
            onPageChange={() => {}}
            onPaperSelect={(paper) => setSelectedPaper(paper)}
          />
        ))}
      </div>

      {totalResults !== undefined && papers.length < totalResults && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full max-w-xs"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              `Load More (${papers.length} of ${totalResults})`
            )}
          </Button>
        </div>
      )}

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}