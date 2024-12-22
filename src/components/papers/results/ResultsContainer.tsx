import { type Paper } from "@/types/papers"
import { calculateRelevanceScore } from "@/constants/searchConfig"
import { type SearchParameters } from "@/constants/searchConfig"
import { useState, useEffect } from "react"
import { PaperCard } from "./PaperCard"
import { Loader2 } from "lucide-react"

interface ResultsContainerProps {
  papers: Paper[]
  searchCriteria: SearchParameters
  isLoading: boolean
}

export function ResultsContainer({ papers, searchCriteria, isLoading }: ResultsContainerProps) {
  const [sortedPapers, setSortedPapers] = useState<Paper[]>([])
  const [isCitationsLoading, setIsCitationsLoading] = useState(true)
  const [isScoring, setIsScoring] = useState(false)

  useEffect(() => {
    if (!papers.length) return

    const calculateScoresAndSort = async () => {
      setIsScoring(true)
      const scoredPapers = papers.map(paper => ({
        ...paper,
        relevanceScore: calculateRelevanceScore(
          paper.title,
          paper.abstract,
          paper.journal,
          paper.citationCount || 0,
          searchCriteria
        )
      }))

      const sorted = [...scoredPapers].sort((a, b) => b.relevanceScore - a.relevanceScore)
      setSortedPapers(sorted)
      setIsScoring(false)
      setIsCitationsLoading(false)
    }

    calculateScoresAndSort()
  }, [papers, searchCriteria])

  if (isLoading || isCitationsLoading || isScoring) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">
            {isLoading ? "Searching papers..." : 
             isCitationsLoading ? "Loading articles..." : 
             "Calculating relevance scores..."}
          </p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
        </div>
      </div>
    )
  }

  if (!papers.length) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedPapers.map((paper) => (
        <PaperCard key={paper.id} paper={paper} />
      ))}
    </div>
  )
}