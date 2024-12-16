import { useState } from "react"
import { SearchForm } from "@/components/SearchForm"
import { ResultsList } from "@/components/ResultsList"
import { type Paper } from "@/types/papers"

export default function Index() {
  const [searchResults, setSearchResults] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<any>(null)

  const handleSearch = async (criteria: any) => {
    setIsLoading(true)
    setSearchCriteria(criteria)
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mockResults: Paper[] = [
        {
          id: "1",
          title: "Example Paper 1",
          authors: ["Author 1", "Author 2"],
          journal: "Medical Journal",
          year: 2023,
          citations: 42,
          abstract: "This is an example abstract for paper 1",
          pdfUrl: "https://example.com/paper1.pdf"
        },
        // Add more mock papers as needed
      ]
      setSearchResults(mockResults)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SearchForm onSearch={handleSearch} />
      <ResultsList
        papers={searchResults}
        isLoading={isLoading}
        searchCriteria={searchCriteria}
      />
    </div>
  )
}