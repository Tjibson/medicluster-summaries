import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"

export function useCitations(papers: Paper[]) {
  const [citationsMap, setCitationsMap] = useState<Record<string, number>>({})
  const [isCitationsLoading, setIsCitationsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (papers.length > 0) {
      fetchCitations(papers)
    } else {
      setCitationsMap({})
      setIsComplete(true)
      setProgress(100)
    }
  }, [papers])

  const fetchCitations = async (papersToFetch: Paper[]) => {
    console.log('Starting citations fetch for papers:', papersToFetch.length)
    setIsCitationsLoading(true)
    setIsComplete(false)
    setProgress(0)

    try {
      const batchSize = 5
      for (let i = 0; i < papersToFetch.length; i += batchSize) {
        const batch = papersToFetch.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (paper) => {
            if (paper.citations === undefined || paper.citations === null) {
              try {
                const { data, error } = await supabase.functions.invoke('fetch-citations', {
                  body: { paper }
                })
                
                if (error) throw error
                
                setCitationsMap(prev => ({
                  ...prev,
                  [paper.id]: Number(data?.citations) || 0
                }))
                console.log(`Fetched citations for paper ${paper.id}:`, data?.citations)
              } catch (error) {
                console.error('Error fetching citations for paper:', paper.id, error)
                setCitationsMap(prev => ({
                  ...prev,
                  [paper.id]: 0
                }))
              }
            } else {
              setCitationsMap(prev => ({
                ...prev,
                [paper.id]: Number(paper.citations)
              }))
            }
          })
        )
        // Update progress after each batch
        setProgress(Math.min(100, ((i + batchSize) / papersToFetch.length) * 100))
      }
    } catch (error) {
      console.error('Error in fetchCitations:', error)
    } finally {
      setIsCitationsLoading(false)
      setIsComplete(true)
      setProgress(100)
    }
  }

  return { citationsMap, isCitationsLoading, isComplete, progress }
}