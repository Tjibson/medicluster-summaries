import { useState } from "react"
import { ResultsList } from "@/components/ResultsList"
import { SearchForm } from "@/components/SearchForm"
import { type Paper } from "@/types/papers"
import { Loader2 } from "lucide-react"

export default function Index() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<{
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  } | null>(null)

  const handleSearchStart = () => {
    setPapers([])
    setIsLoading(true)
  }

  const handleSearch = async (papers: Paper[], criteria: {
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  }) => {
    console.log("Search results received:", papers)
    setPapers(papers)
    setSearchCriteria(criteria)
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      <SearchForm 
        onSearch={handleSearch} 
        onSearchStart={handleSearchStart}
      />
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {!isLoading && (
        <ResultsList 
          papers={papers} 
          isLoading={isLoading} 
          searchCriteria={searchCriteria}
        />
      )}
    </div>
  )
}