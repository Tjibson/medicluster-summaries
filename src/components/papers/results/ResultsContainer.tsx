import { useCitations } from "./useCitations"
import { useSortedPapers } from "./useSortedPapers"
import { SortingControls } from "../SortingControls"
import { PaperCard } from "../PaperCard"
import { type Paper } from "@/types/papers"
import { type SearchParameters } from "@/constants/searchConfig"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { ArticleDetails } from "../ArticleDetails"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
  onLoadMore: (papers: Paper[]) => void
}

export function ResultsContainer({ papers, isLoading, searchCriteria, onLoadMore }: ResultsContainerProps) {
  const startTime = useState(() => Date.now())[0]
  const [loadTime, setLoadTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [resultsPerPage, setResultsPerPage] = useState<string>("25")
  const { toast } = useToast()
  
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

      if (data?.papers && Array.isArray(data.papers)) {
        onLoadMore(data.papers)
        toast({
          title: "Success",
          description: `Loaded ${data.papers.length} more papers`,
        })
      }
    } catch (error) {
      console.error('Error loading more papers:', error)
      toast({
        title: "Error",
        description: "Failed to load more papers",
        variant: "destructive",
      })
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

  // Get the top papers by citations and relevance
  const displayPapers = sortedPapers
    .sort((a, b) => {
      // First sort by citations
      const citationDiff = (citationsMap[b.id] || 0) - (citationsMap[a.id] || 0)
      if (citationDiff !== 0) return citationDiff
      
      // Then by relevance score
      return (b.relevance_score || 0) - (a.relevance_score || 0)
    })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Showing {displayPapers.length} articles from {sortedPapers.length} results
          </p>
          <p className="text-xs text-muted-foreground">
            Load time: {(loadTime / 1000).toFixed(2)}s
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={resultsPerPage}
            onValueChange={setResultsPerPage}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Results per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 results per page</SelectItem>
              <SelectItem value="50">50 results per page</SelectItem>
              <SelectItem value="100">100 results per page</SelectItem>
            </SelectContent>
          </Select>
          <SortingControls
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={setSortBy}
            onDirectionChange={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
            isRelevanceReady={isRelevanceReady}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {displayPapers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSave={() => {}}
            onLike={() => {}}
            onClick={(paper) => setSelectedPaper(paper)}
          />
        ))}
      </div>

      {papers.length >= parseInt(resultsPerPage) && (
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
              "Load More Results"
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