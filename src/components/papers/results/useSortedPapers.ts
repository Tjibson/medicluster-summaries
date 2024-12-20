import { useState, useEffect } from "react"
import { type Paper } from "@/types/papers"
import { type SortOption, type SortDirection } from "../SortingControls"
import { calculateRelevanceScore } from "@/constants/searchConfig"

export function useSortedPapers(
  papers: Paper[],
  citationsMap: Record<string, number>,
  searchParams: any,
  isCitationsComplete: boolean
) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [sortedPapers, setSortedPapers] = useState<Paper[]>([])
  const [relevanceScores, setRelevanceScores] = useState<Record<string, number>>({})

  // Calculate relevance scores when citations are loaded
  useEffect(() => {
    if (isCitationsComplete && papers.length > 0) {
      const scores: Record<string, number> = {};
      papers.forEach(paper => {
        scores[paper.id] = calculateRelevanceScore(
          paper.title,
          paper.abstract || '',
          paper.journal,
          citationsMap[paper.id] || 0,
          searchParams
        );
      });
      setRelevanceScores(scores);
    }
  }, [papers, citationsMap, isCitationsComplete, searchParams]);

  // Sort papers whenever relevance scores or sort criteria change
  useEffect(() => {
    console.log('Sorting papers with citations map:', citationsMap)
    
    const papersToSort = papers.map(paper => ({
      ...paper,
      citations: citationsMap[paper.id] || paper.citations || 0,
      relevance_score: relevanceScores[paper.id] || 0
    }));

    papersToSort.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      
      switch (sortBy) {
        case "citations": {
          const aCitations = Number(a.citations) || 0;
          const bCitations = Number(b.citations) || 0;
          return (bCitations - aCitations) * multiplier;
        }
        case "date":
          return (b.year - a.year) * multiplier;
        case "title": {
          const aTitle = String(a.title).toLowerCase();
          const bTitle = String(b.title).toLowerCase();
          return aTitle.localeCompare(bTitle) * multiplier;
        }
        case "relevance": {
          const aScore = relevanceScores[a.id] || 0;
          const bScore = relevanceScores[b.id] || 0;
          return (bScore - aScore) * multiplier;
        }
        default:
          return 0;
      }
    });

    console.log('Papers after sorting:', 
      papersToSort.map(p => ({ 
        id: p.id,
        title: p.title, 
        citations: p.citations,
        year: p.year,
        relevance_score: relevanceScores[p.id],
        sortBy,
        sortDirection 
      }))
    );
    
    setSortedPapers(papersToSort);
  }, [papers, citationsMap, sortBy, sortDirection, relevanceScores]);

  return {
    sortedPapers,
    sortBy,
    sortDirection,
    setSortBy,
    setSortDirection,
    isRelevanceReady: isCitationsComplete
  }
}