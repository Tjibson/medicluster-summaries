import { useState } from "react"
import { ResultsList } from "@/components/ResultsList"
import { SearchForm } from "@/components/SearchForm"
import { type Paper } from "@/types/papers"
import { type SearchParameters } from "@/constants/searchConfig"

// Create a simple storage key for the session
const SEARCH_STORAGE_KEY = "lastSearchResults"
const SEARCH_CRITERIA_KEY = "lastSearchCriteria"

export default function Index() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<SearchParameters | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Load last search results from session storage on component mount
  useEffect(() => {
    const storedPapers = sessionStorage.getItem(SEARCH_STORAGE_KEY)
    const storedCriteria = sessionStorage.getItem(SEARCH_CRITERIA_KEY)
    
    if (storedPapers && storedCriteria) {
      setPapers(JSON.parse(storedPapers))
      setSearchCriteria(JSON.parse(storedCriteria))
    }
  }, [])

  const handleSearch = async (papers: Paper[], criteria: SearchParameters) => {
    console.log("Search results received:", papers)
    setPapers(papers)
    setSearchCriteria(criteria)
    setIsLoading(false)
    setError(null)

    // Store the search results and criteria in session storage
    sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(papers))
    sessionStorage.setItem(SEARCH_CRITERIA_KEY, JSON.stringify(criteria))
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      <SearchForm onSearch={handleSearch} />
      <ResultsList 
        papers={papers} 
        isLoading={isLoading} 
        searchCriteria={searchCriteria}
        error={error}
      />
    </div>
  )
}