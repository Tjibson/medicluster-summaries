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

interface ResultsContainerProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: SearchParameters | null
}

export function ResultsContainer({ papers, isLoading, searchCriteria }: ResultsContainerProps) {
  const startTime = useState(() => Date.now())[0]
  const [loadTime, setLoadTime] = useState(0)
  const [progress, setProgress] = useState(0)
  
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

  // Get the top 25 papers by citations and relevance
  const displayPapers = sortedPapers
    .sort((a, b) => {
      // First sort by citations
      const citationDiff = (citationsMap[b.id] || 0) - (citationsMap[a.id] || 0)
      if (citationDiff !== 0) return citationDiff
      
      // Then by relevance score
      return (b.relevance_score || 0) - (a.relevance_score || 0)
    })
    .slice(0, 25)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Showing top 25 articles from {sortedPapers.length} results
          </p>
          <p className="text-xs text-muted-foreground">
            Load time: {(loadTime / 1000).toFixed(2)}s
          </p>
        </div>
        <SortingControls
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={setSortBy}
          onDirectionChange={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
          isRelevanceReady={isRelevanceReady}
        />
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

      <ArticleDetails
        paper={selectedPaper}
        isOpen={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  )
}