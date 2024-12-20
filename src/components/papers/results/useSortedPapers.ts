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
        const multiplier = sortDirection === "asc" ? 1 : -1
        
        switch (sortBy) {
          case "citations": {
            const aCitations = Number(a.citations) || 0
            const bCitations = Number(b.citations) || 0
            return (bCitations - aCitations) * multiplier
          }
          case "date":
            return (b.year - a.year) * multiplier
          case "title": {
            const aTitle = String(a.title).toLowerCase()
            const bTitle = String(b.title).toLowerCase()
            return aTitle.localeCompare(bTitle) * multiplier
          }
          case "relevance": {
            const aScore = a.relevance_score || 0
            const bScore = b.relevance_score || 0
            return (bScore - aScore) * multiplier
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
          year: p.year,
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