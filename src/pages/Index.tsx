import { useState } from "react"
import { SearchForm } from "@/components/SearchForm"
import { ResultsList } from "@/components/ResultsList"
import { type Paper } from "@/types/papers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchHistory } from "@/components/search/SearchHistory"

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
      ]
      setSearchResults(mockResults)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="search" className="flex-1">New Search</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Search History</TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          <SearchForm onSearch={handleSearch} />
        </TabsContent>
        <TabsContent value="history">
          <SearchHistory 
            onHistoryClick={handleSearch}
          />
        </TabsContent>
      </Tabs>
      <ResultsList
        papers={searchResults}
        isLoading={isLoading}
        searchCriteria={searchCriteria}
      />
    </div>
  )
}