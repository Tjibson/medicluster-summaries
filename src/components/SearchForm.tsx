import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ContinentSelect } from "./search/ContinentSelect"
import { RegionSelect } from "./search/RegionSelect"

export function SearchForm({ onSearch }: { onSearch: (criteria: any) => void }) {
  const [selectedContinent, setSelectedContinent] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [disease, setDisease] = useState("")
  const [medicine, setMedicine] = useState("")
  const [workingMechanism, setWorkingMechanism] = useState("")
  const [patientCount, setPatientCount] = useState("")
  const [trialType, setTrialType] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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

      const searchCriteria = {
        user_id: session.user.id,
        population: `${selectedContinent}${selectedRegion ? ` - ${selectedRegion}` : ''}`,
        disease,
        medicine,
        working_mechanism: workingMechanism,
        patient_count: patientCount ? parseInt(patientCount) : null,
        trial_type: trialType,
      }

      const { error } = await supabase
        .from("search_history")
        .insert(searchCriteria)

      if (error) throw error

      onSearch(searchCriteria)
    } catch (error) {
      console.error("Error saving search:", error)
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContinentSelect
            value={selectedContinent}
            onChange={setSelectedContinent}
          />

          {selectedContinent && (
            <RegionSelect
              continent={selectedContinent}
              value={selectedRegion}
              onChange={setSelectedRegion}
            />
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
    </div>
  )
}