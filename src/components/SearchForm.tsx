import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Heart } from "lucide-react"

export function SearchForm({ onSearch }: { onSearch: (criteria: any) => void }) {
  const [searchHistory, setSearchHistory] = useState([])
  const [selectedContinent, setSelectedContinent] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [disease, setDisease] = useState("")
  const [medicine, setMedicine] = useState("")
  const [workingMechanism, setWorkingMechanism] = useState("")
  const [patientCount, setPatientCount] = useState("")
  const [trialType, setTrialType] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchSearchHistory()
  }, [])

  const fetchSearchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setSearchHistory(data || [])
    } catch (error) {
      console.error("Error fetching search history:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const searchCriteria = {
      population: `${selectedContinent}${selectedRegion ? ` - ${selectedRegion}` : ''}`,
      disease,
      medicine,
      working_mechanism: workingMechanism,
      patient_count: patientCount ? parseInt(patientCount) : null,
      trial_type: trialType,
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to search",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("search_history")
        .insert([searchCriteria])

      if (error) throw error

      onSearch(searchCriteria)
      fetchSearchHistory() // Refresh history after new search
    } catch (error) {
      console.error("Error saving search:", error)
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      })
    }
  }

  const handleHistoryClick = (historicalSearch: any) => {
    setSelectedContinent(historicalSearch.population?.split(" - ")[0] || "")
    setSelectedRegion(historicalSearch.population?.split(" - ")[1] || "")
    setDisease(historicalSearch.disease || "")
    setMedicine(historicalSearch.medicine || "")
    setWorkingMechanism(historicalSearch.working_mechanism || "")
    setPatientCount(historicalSearch.patient_count?.toString() || "")
    setTrialType(historicalSearch.trial_type || "")
    onSearch(historicalSearch)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Continent</label>
            <Select
              value={selectedContinent}
              onValueChange={setSelectedContinent}
            >
              <option value="">Select Continent</option>
              <option value="Africa">Africa</option>
              <option value="Asia">Asia</option>
              <option value="Europe">Europe</option>
              <option value="North America">North America</option>
              <option value="South America">South America</option>
              <option value="Oceania">Oceania</option>
            </Select>
          </div>

          {selectedContinent && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select
                value={selectedRegion}
                onValueChange={setSelectedRegion}
              >
                <option value="">Select Region</option>
                {selectedContinent === "Africa" && (
                  <>
                    <option value="North Africa">North Africa</option>
                    <option value="West Africa">West Africa</option>
                    <option value="East Africa">East Africa</option>
                    <option value="Central Africa">Central Africa</option>
                    <option value="Southern Africa">Southern Africa</option>
                  </>
                )}
                {selectedContinent === "Asia" && (
                  <>
                    <option value="East Asia">East Asia</option>
                    <option value="South Asia">South Asia</option>
                    <option value="Southeast Asia">Southeast Asia</option>
                    <option value="Central Asia">Central Asia</option>
                    <option value="West Asia">West Asia</option>
                  </>
                )}
                {/* Add similar options for other continents */}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Disease</label>
            <Input
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              placeholder="Enter disease"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Medicine</label>
            <Input
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              placeholder="Enter medicine"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Working Mechanism</label>
            <Input
              value={workingMechanism}
              onChange={(e) => setWorkingMechanism(e.target.value)}
              placeholder="Enter working mechanism"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Patient Count</label>
            <Input
              type="number"
              value={patientCount}
              onChange={(e) => setPatientCount(e.target.value)}
              placeholder="Enter minimum patient count"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Trial Type</label>
            <Input
              value={trialType}
              onChange={(e) => setTrialType(e.target.value)}
              placeholder="Enter trial type"
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Search
        </Button>
      </form>

      {searchHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Recent Searches</h3>
          <div className="space-y-2">
            {searchHistory.map((search: any) => (
              <Button
                key={search.id}
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => handleHistoryClick(search)}
              >
                {search.disease} - {search.medicine} ({search.population})
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
