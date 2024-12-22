import { useState } from "react"
import { SearchInputs } from "./search/SearchInputs"
import { DateRangeSelect } from "./search/DateRangeSelect"
import { Button } from "./ui/button"
import { searchPubMed } from "@/utils/pubmedSearch"
import { type Paper } from "@/types/papers"
import { Loader2 } from "lucide-react"
import { type SearchParameters } from "@/constants/searchConfig"
import { getSearchCache, setSearchCache } from "@/utils/searchCache"

interface SearchFormProps {
  onSearch: (papers: Paper[], criteria: SearchParameters) => void
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [searchInputs, setSearchInputs] = useState<SearchParameters>({
    medicine: "",
    condition: "",
    studyType: "",
    startDate: "",
    endDate: "",
    keywords: {
      medicine: [],
      condition: []
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    setIsLoading(true)
    const cacheKey = `${searchInputs.medicine}-${searchInputs.condition}`
    const cachedResults = await getSearchCache(cacheKey)
    
    if (cachedResults) {
      onSearch(cachedResults, searchInputs)
      setIsLoading(false)
      return
    }

    const results = await searchPubMed(searchInputs)
    onSearch(results, searchInputs)
    await setSearchCache(cacheKey, results)
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <SearchInputs
        medicine={searchInputs.medicine}
        condition={searchInputs.condition}
        selectedArticleTypes={[searchInputs.studyType]}
        onMedicineChange={(value) => setSearchInputs(prev => ({ ...prev, medicine: value }))}
        onConditionChange={(value) => setSearchInputs(prev => ({ ...prev, condition: value }))}
        onArticleTypesChange={(value) => setSearchInputs(prev => ({ ...prev, studyType: value[0] }))}
      />
      <DateRangeSelect
        startDate={searchInputs.startDate ? new Date(searchInputs.startDate) : undefined}
        endDate={searchInputs.endDate ? new Date(searchInputs.endDate) : undefined}
        onStartDateChange={(date) => setSearchInputs(prev => ({ ...prev, startDate: date?.toISOString() || "" }))}
        onEndDateChange={(date) => setSearchInputs(prev => ({ ...prev, endDate: date?.toISOString() || "" }))}
        onQuickSelect={(days) => {
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - days)
          setSearchInputs(prev => ({
            ...prev,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }))
        }}
      />
      <Button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
      </Button>
    </div>
  )
}