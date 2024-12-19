import { useState } from "react"
import { AppLayout } from "@/components/AppLayout"
import { ResultsList } from "@/components/ResultsList"
import { SearchForm } from "@/components/SearchForm"
import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"

const DEFAULT_JOURNALS = [
  "ESC heart failure",
  "JACC. Heart failure",
  "Journal of the American College of Cardiology",
  "Circulation",
  "European journal of heart failure",
  "JAMA cardiology",
  "Frontiers in cardiovascular medicine",
  "Journal of the American Heart Association",
  "Nature",
  "The Lancet",
]

const DEFAULT_KEYWORDS = "(Entresto OR Sacubitril OR ARNi OR LCZ696) AND (HFrEF OR heart failure)"

export default function Index() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<any>(null)

  const handleSearch = async (criteria: any) => {
    setIsLoading(true)
    setSearchCriteria(criteria)

    try {
      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: {
          dateRange: {
            start: criteria.dateRange?.from || "2024/01/01",
            end: criteria.dateRange?.to || "2024/12/31"
          },
          journalNames: criteria.journals || DEFAULT_JOURNALS,
          keywords: criteria.keywords || DEFAULT_KEYWORDS
        }
      })

      if (error) throw error

      setPapers(data.papers)
    } catch (error) {
      console.error('Search error:', error)
      setPapers([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl">
        <SearchForm onSearch={handleSearch} defaultJournals={DEFAULT_JOURNALS} />
        <ResultsList 
          papers={papers} 
          isLoading={isLoading} 
          searchCriteria={searchCriteria}
        />
      </div>
    </AppLayout>
  )
}