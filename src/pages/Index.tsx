import { useState, useEffect } from "react"
import { SearchForm } from "@/components/SearchForm"
import { ResultsList } from "@/components/ResultsList"
import { type Paper } from "@/types/papers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchHistory } from "@/components/search/SearchHistory"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "react-router-dom"

export default function Index() {
  const [searchResults, setSearchResults] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<any>(null)
  const { toast } = useToast()
  const location = useLocation()

  // Handle search results from TopNav search
  useEffect(() => {
    if (location.state?.searchResults) {
      setSearchResults(location.state.searchResults)
      setSearchCriteria(location.state.searchCriteria)
      // Clear the location state to avoid showing same results on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleSearch = async (criteria: any) => {
    setIsLoading(true)
    setSearchCriteria(criteria)
    
    try {
      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: criteria
      })

      if (error) throw error

      setSearchResults(data.papers || [])
    } catch (error) {
      console.error('Error searching PubMed:', error)
      toast({
        title: "Error",
        description: "Failed to search PubMed papers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <SearchHistory onHistoryClick={handleSearch} />
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