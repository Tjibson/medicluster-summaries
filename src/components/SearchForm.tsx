import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { type Paper } from "@/types/papers"
import { DateRangeSelect } from "./search/DateRangeSelect"

interface SearchFormProps {
  onSearch: (papers: Paper[], searchCriteria: {
    dateRange: { start: string; end: string };
    keywords: string;
    journalNames: string[];
  }) => void
}

const DEFAULT_JOURNALS = [
  "ESC heart failure",
  "JACC. Heart failure",
  "Journal of the American College of Cardiology",
  "Circulation",
  "European journal of heart failure",
  "JAMA cardiology",
  "Frontiers in cardiovascular medicine",
  "Journal of the American Heart Association",
  "Nature",
  "The Lancet",
]

export function SearchForm({ onSearch }: SearchFormProps) {
  const [medicine, setMedicine] = useState("")
  const [condition, setCondition] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Building search query...")
      const medicineKeywords = medicine.trim().split(/[ ,]+/).filter(Boolean)
      const conditionKeywords = condition.trim().split(/[ ,]+/).filter(Boolean)
      
      let keywordsLogic = ""
      
      if (medicineKeywords.length > 0 && conditionKeywords.length > 0) {
        keywordsLogic = `(${medicineKeywords.join(" OR ")}) AND (${conditionKeywords.join(" OR ")})`
      } else if (medicineKeywords.length > 0) {
        keywordsLogic = `(${medicineKeywords.join(" OR ")})`
      } else if (conditionKeywords.length > 0) {
        keywordsLogic = `(${conditionKeywords.join(" OR ")})`
      }

      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: {
          dateRange: {
            start: startDate ? startDate.toISOString().split('T')[0].replace(/-/g, '/') : "2024/01/01",
            end: endDate ? endDate.toISOString().split('T')[0].replace(/-/g, '/') : "2024/12/31"
          },
          journalNames: DEFAULT_JOURNALS,
          keywords: keywordsLogic
        }
      })

      if (error) {
        throw error
      }

      if (!data || !data.papers) {
        throw new Error("Invalid response format")
      }

      console.log("Search results:", data.papers)
      onSearch(data.papers, {
        dateRange: {
          start: startDate?.toISOString().split('T')[0] || "2024/01/01",
          end: endDate?.toISOString().split('T')[0] || "2024/12/31"
        },
        keywords: keywordsLogic,
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Medicine Keywords (optional)</label>
          <Input
            value={medicine}
            onChange={(e) => setMedicine(e.target.value)}
            placeholder="e.g., Entresto Sacubitril ARNi LCZ696"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Condition Keywords (optional)</label>
          <Input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g., HFrEF heart failure"
            className="w-full"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search PubMed"}
        </Button>
      </form>
    </div>
  )
}