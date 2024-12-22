import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateRangeSelect } from "@/components/search/DateRangeSelect"
import { StudyDetailsInputs } from "@/components/search/StudyDetailsInputs"
import { SearchInputs } from "@/components/search/SearchInputs"
import { Loader2 } from "lucide-react"

interface SearchFormProps {
  onSearch: (papers: any[], params: any) => void
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [medicine, setMedicine] = useState("")
  const [condition, setCondition] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
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
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicine,
          condition,
          dateRange: startDate && endDate ? {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          } : undefined,
          articleTypes: selectedArticleTypes
        }),
      })

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      onSearch(data.papers, {
        medicine,
        condition,
        dateRange: startDate && endDate ? {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        } : undefined,
        articleTypes: selectedArticleTypes
      })

      await saveSearchToHistory(medicine, condition)
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "Failed to perform search. Please try again.",
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