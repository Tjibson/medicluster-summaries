import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"

export function useCitations(papers: Paper[]) {
  const [citationsMap, setCitationsMap] = useState<Record<string, number>>({})
  const [isCitationsLoading, setIsCitationsLoading] = useState(false)

  useEffect(() => {
    if (papers.length > 0) {
      fetchCitations(papers)
    } else {
      setCitationsMap({})
    }
  }, [papers])

  const fetchCitations = async (papersToFetch: Paper[]) => {
    console.log('Starting citations fetch for papers:', papersToFetch.length)
    setIsCitationsLoading(true)

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
      }
    } catch (error) {
      console.error('Error in fetchCitations:', error)
    } finally {
      setIsCitationsLoading(false)
    }
  }

  return { citationsMap, isCitationsLoading }
}