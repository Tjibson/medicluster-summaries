import { useState } from "react"
import { SearchInputs } from "./search/SearchInputs"
import { StudyDetailsInputs } from "./search/StudyDetailsInputs"
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
    keywords: "",
    studyType: "",
    startDate: "",
    endDate: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    setIsLoading(true)
    const cachedResults = await getSearchCache(searchInputs.keywords)
    if (cachedResults) {
      onSearch(cachedResults, searchInputs)
      setIsLoading(false)
      return
    }

    const results = await searchPubMed(searchInputs)
    onSearch(results, searchInputs)
    await setSearchCache(searchInputs.keywords, results)
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <SearchInputs
        searchInputs={searchInputs}
        setSearchInputs={setSearchInputs}
      />
      <StudyDetailsInputs
        searchInputs={searchInputs}
        setSearchInputs={setSearchInputs}
      />
      <Button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
      </Button>
    </div>
  )
}
