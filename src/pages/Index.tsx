import { useState } from "react"
import { AppLayout } from "@/components/AppLayout"
import { ResultsList } from "@/components/ResultsList"
import { SearchForm } from "@/components/SearchForm"
import { type Paper } from "@/types/papers"

export default function Index() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<{
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  } | null>(null)

  const handleSearch = async (papers: Paper[], criteria: {
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  }) => {
    setIsLoading(true)
    setSearchCriteria(criteria)
    setPapers(papers)
    setIsLoading(false)
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl">
        <SearchForm onSearch={handleSearch} />
        <ResultsList 
          papers={papers} 
          isLoading={isLoading} 
          searchCriteria={searchCriteria}
        />
      </div>
    </AppLayout>
  )
}