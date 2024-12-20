import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { type Paper } from "@/types/papers"
import { DateRangeSelect } from "./search/DateRangeSelect"
import { SearchInputs } from "./search/SearchInputs"
import { Loader2 } from "lucide-react"
import { DEFAULT_SEARCH_PARAMS, type SearchParameters } from "@/constants/searchConfig"

interface SearchFormProps {
  onSearch: (papers: Paper[], searchCriteria: SearchParameters) => void
  onSearchStart: () => void
  onError: (error: Error) => void
}

export function SearchForm({ onSearch, onSearchStart, onError }: SearchFormProps) {
  const [medicine, setMedicine] = useState("")
  const [condition, setCondition] = useState("")
  const [selectedArticleTypes, setSelectedArticleTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date(DEFAULT_SEARCH_PARAMS.dateRange.start))
  const [endDate, setEndDate] = useState<Date>(new Date(DEFAULT_SEARCH_PARAMS.dateRange.end))
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    onSearchStart()

    try {
      if (!medicine.trim() && !condition.trim()) {
        throw new Error("Please enter at least one search term (medicine or condition)")
      }

      const searchParams: SearchParameters = {
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        journalNames: DEFAULT_SEARCH_PARAMS.journalNames,
        keywords: {
          medicine: medicine.trim().split(/[ ,]+/).filter(Boolean),
          condition: condition.trim().split(/[ ,]+/).filter(Boolean),
        },
        articleTypes: selectedArticleTypes as typeof DEFAULT_SEARCH_PARAMS.articleTypes,
      }

      console.log("Submitting search with params:", searchParams)

      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: { searchParams }
      })

      if (error) {
        console.error("Supabase function error:", error)
        throw new Error(error.message || "Failed to perform search")
      }

      if (!data || !Array.isArray(data.papers)) {
        console.error("Invalid response format:", data)
        throw new Error("Invalid response from search service")
      }

      console.log("Search results received:", data.papers)
      onSearch(data.papers, searchParams)
    } catch (error: any) {
      console.error("Error performing search:", error)
      onError(error)
      toast({
        title: "Error",
        description: error.message || "Failed to perform search",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <DateRangeSelect
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onQuickSelect={(days) => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - days)
            setStartDate(start)
            setEndDate(end)
          }}
        />

        <SearchInputs
          medicine={medicine}
          condition={condition}
          selectedArticleTypes={selectedArticleTypes}
          onMedicineChange={setMedicine}
          onConditionChange={setCondition}
          onArticleTypesChange={setSelectedArticleTypes}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search PubMed"
          )}
        </Button>
      </form>
    </div>
  )
}