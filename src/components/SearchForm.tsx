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
      <StudyDetailsInputs
        disease={searchInputs.condition}
        onDiseaseChange={(value) => setSearchInputs(prev => ({ ...prev, condition: value }))}
        medicine={searchInputs.medicine}
        onMedicineChange={(value) => setSearchInputs(prev => ({ ...prev, medicine: value }))}
        workingMechanism=""
        onWorkingMechanismChange={() => {}}
        patientCount=""
        onPatientCountChange={() => {}}
        trialType={searchInputs.studyType}
        onTrialTypeChange={(value) => setSearchInputs(prev => ({ ...prev, studyType: value }))}
      />
      <Button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
      </Button>
    </div>
  )
}