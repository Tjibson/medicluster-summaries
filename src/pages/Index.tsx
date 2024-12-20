import { useState } from "react"
import { ResultsList } from "@/components/ResultsList"
import { SearchForm } from "@/components/SearchForm"
import { type Paper } from "@/types/papers"
import { type SearchParameters } from "@/constants/searchConfig"

export default function Index() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<SearchParameters | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const handleSearchStart = () => {
    setPapers([])
    setError(null)
    setIsLoading(true)
  }

  const handleSearch = async (papers: Paper[], criteria: SearchParameters) => {
    console.log("Search results received:", papers)
    setPapers(papers)
    setSearchCriteria(criteria)
    setIsLoading(false)
  }

  const handleError = (error: Error) => {
    setError(error)
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      <SearchForm 
        onSearch={handleSearch} 
        onSearchStart={handleSearchStart}
        onError={handleError}
      />
      <ResultsList 
        papers={papers} 
        isLoading={isLoading} 
        searchCriteria={searchCriteria}
        error={error}
      />
    </div>
  )
}