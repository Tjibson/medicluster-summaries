import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { DateRangeSelect } from "@/components/search/DateRangeSelect"
import { SearchInputs } from "@/components/search/SearchInputs"
import { Loader2 } from "lucide-react"
import { type SearchParameters } from "@/constants/searchConfig"
import { getCachedSearch, setCachedSearch } from "@/utils/searchCache"

interface SearchFormProps {
  onSearch: (papers: any[], params: SearchParameters) => void
  onProgressUpdate?: (progress: number) => void
}

export function SearchForm({ onSearch, onProgressUpdate }: SearchFormProps) {
  const [medicine, setMedicine] = useState("")
  const [condition, setCondition] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date('1970-01-01'))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [selectedArticleTypes, setSelectedArticleTypes] = useState<string[]>([])
  const { toast } = useToast()

  const saveSearchToHistory = async (medicine: string, condition: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase.from('search_history').insert({
        medicine: medicine || null,
        disease: condition || null,
        user_id: session.user.id
      })

      if (error) throw error
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicine && !condition) {
      toast({
        title: "Error",
        description: "Please enter at least one search term",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const searchParams: SearchParameters = {
        medicine,
        condition,
        dateRange: startDate && endDate ? {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        } : undefined,
        articleTypes: selectedArticleTypes
      }

      // Check cache first
      const cachedResults = await getCachedSearch(searchParams)
      if (cachedResults) {
        console.log('Using cached results')
        onSearch(cachedResults, searchParams)
        setIsLoading(false)
        return
      }

      console.log('Sending search request with params:', searchParams)

      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: { searchParams }
      })

      if (error) {
        console.error('Supabase function error:', error)
        throw error
      }

      console.log('Search response:', data)

      if (!data || !Array.isArray(data.papers)) {
        throw new Error('Invalid response format')
      }

      // Cache the results
      await setCachedSearch(searchParams, data.papers)

      onSearch(data.papers, searchParams)
      await saveSearchToHistory(medicine, condition)

      // Start progressive citation loading
      let citationsLoaded = 0
      const totalPapers = data.papers.length

      for (const paper of data.papers) {
        if (!paper.citations) {
          try {
            const citationResponse = await supabase.functions.invoke('fetch-citations', {
              body: { paper }
            })
            
            if (citationResponse.data?.citations !== undefined) {
              paper.citations = citationResponse.data.citations
            }
          } catch (error) {
            console.error('Error fetching citations for paper:', error)
          }
        }
        
        citationsLoaded++
        if (onProgressUpdate) {
          onProgressUpdate((citationsLoaded / totalPapers) * 100)
        }
      }

    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDateSelect = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      <SearchInputs
        medicine={medicine}
        condition={condition}
        selectedArticleTypes={selectedArticleTypes}
        onMedicineChange={setMedicine}
        onConditionChange={setCondition}
        onArticleTypesChange={setSelectedArticleTypes}
      />

      <DateRangeSelect
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickDateSelect}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  )
}