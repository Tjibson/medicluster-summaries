import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { type Paper } from "@/types/papers"
import { DateRangeSelect } from "./search/DateRangeSelect"
import { SearchInputs } from "./search/SearchInputs"
import { Loader2 } from "lucide-react"
import { DEFAULT_JOURNALS } from "@/constants/journals"
import { buildSearchQuery } from "@/utils/searchQueryBuilder"

interface SearchFormProps {
  onSearch: (papers: Paper[], searchCriteria: {
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  }) => void
  onSearchStart: () => void
}

export function SearchForm({ onSearch, onSearchStart }: SearchFormProps) {
  const [medicine, setMedicine] = useState("")
  const [condition, setCondition] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Set default dates for 20 years range
  const defaultEndDate = new Date()
  const defaultStartDate = new Date()
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 20)
  
  const [startDate, setStartDate] = useState<Date>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date>(defaultEndDate)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    onSearchStart()

    try {
      console.log("Building search query...")
      const medicineKeywords = medicine.trim().split(/[ ,]+/).filter(Boolean)
      const conditionKeywords = condition.trim().split(/[ ,]+/).filter(Boolean)
      
      const searchTerms = [...medicineKeywords, ...conditionKeywords].join(' ')
      console.log("Search terms:", searchTerms)

      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: {
          term: searchTerms,
          dateRange: {
            start: startDate.toISOString().split('T')[0].replace(/-/g, '/'),
            end: endDate.toISOString().split('T')[0].replace(/-/g, '/')
          },
          journalNames: DEFAULT_JOURNALS
        }
      })

      if (error) {
        throw error
      }

      if (!data || !data.articles) {
        throw new Error("Invalid response format")
      }

      // Transform PubMed articles to match Paper type
      const papers: Paper[] = data.articles.map((article: any) => ({
        id: article.pmid,
        title: article.title,
        abstract: article.abstract,
        authors: article.authors,
        journal: article.journal.title || article.journal.isoAbbreviation,
        year: parseInt(article.journal.pubDate.Year) || new Date().getFullYear(),
        citations: 0 // PubMed API doesn't provide citation count
      }))

      console.log("Transformed papers:", papers)
      onSearch(papers, {
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        keywords: searchTerms,
        journalNames: DEFAULT_JOURNALS
      })

    } catch (error: any) {
      console.error("Error performing search:", error)
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
          onMedicineChange={setMedicine}
          onConditionChange={setCondition}
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