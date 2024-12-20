import { useState, useEffect } from "react"
import { type Paper } from "@/types/papers"
import { type SortOption, type SortDirection } from "../SortingControls"

export function useSortedPapers(
  papers: Paper[],
  citationsMap: Record<string, number>
) {
  const [sortBy, setSortBy] = useState<SortOption>("citations")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [sortedPapers, setSortedPapers] = useState<Paper[]>([])

  useEffect(() => {
    if (papers.length > 0) {
      const initialPapers = papers.map(paper => ({
        ...paper,
        citations: paper.citations || 0
      }))
      setSortedPapers(initialPapers)
    } else {
      setSortedPapers([])
    }
  }, [papers])

  useEffect(() => {
    console.log('Sorting papers with citations map:', citationsMap)
    
    const papersWithCitations = sortedPapers.map(paper => ({
      ...paper,
      citations: citationsMap[paper.id] || paper.citations || 0
    }))

    const sortPapers = () => {
      const papersToSort = [...papersWithCitations]
      
      papersToSort.sort((a, b) => {
        switch (sortBy) {
          case "citations": {
            const aCitations = Number(a.citations) || 0
            const bCitations = Number(b.citations) || 0
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

      console.log('Papers after sorting:', 
        papersToSort.map(p => ({ 
          id: p.id,
          title: p.title, 
          citations: p.citations,
          sortBy,
          sortDirection 
        }))
      )
      
      setSortedPapers(papersToSort)
    }

    sortPapers()
  }, [citationsMap, sortBy, sortDirection])

  return {
    sortedPapers,
    sortBy,
    sortDirection,
    setSortBy,
    setSortDirection
  }
}