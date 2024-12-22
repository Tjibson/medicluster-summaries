import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DEFAULT_SEARCH_PARAMS } from "@/constants/searchConfig"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

export function SearchForm({ onSearch }: { onSearch: (papers: any[], params: any) => void }) {
  const [medicine, setMedicine] = useState("")
  const [condition, setCondition] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [patientCount, setPatientCount] = useState(DEFAULT_SEARCH_PARAMS.patientCount)
  const [trialType, setTrialType] = useState(DEFAULT_SEARCH_PARAMS.trialType)
  const [population, setPopulation] = useState(DEFAULT_SEARCH_PARAMS.population)
  const [workingMechanism, setWorkingMechanism] = useState(DEFAULT_SEARCH_PARAMS.workingMechanism)
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
          patientCount: advancedMode ? patientCount : DEFAULT_SEARCH_PARAMS.patientCount,
          trialType: advancedMode ? trialType : DEFAULT_SEARCH_PARAMS.trialType,
          population: advancedMode ? population : DEFAULT_SEARCH_PARAMS.population,
          workingMechanism: advancedMode ? workingMechanism : DEFAULT_SEARCH_PARAMS.workingMechanism,
        }),
      })

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      onSearch(data.papers, {
        medicine,
        condition,
        patientCount,
        trialType,
        population,
        workingMechanism,
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

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="medicine">Medicine</Label>
          <Input
            id="medicine"
            placeholder="Enter medicine name"
            value={medicine}
            onChange={(e) => setMedicine(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">Medical Condition</Label>
          <Input
            id="condition"
            placeholder="Enter medical condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="advanced-mode"
          checked={advancedMode}
          onCheckedChange={setAdvancedMode}
        />
        <Label htmlFor="advanced-mode">Advanced Search Options</Label>
      </div>

      {advancedMode && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Minimum Patient Count: {patientCount}</Label>
            <Slider
              value={[patientCount]}
              onValueChange={(value) => setPatientCount(value[0])}
              min={0}
              max={1000}
              step={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trial-type">Trial Type</Label>
            <Input
              id="trial-type"
              placeholder="e.g., Randomized Control Trial"
              value={trialType}
              onChange={(e) => setTrialType(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="population">Population</Label>
            <Input
              id="population"
              placeholder="e.g., Adults, Children"
              value={population}
              onChange={(e) => setPopulation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mechanism">Working Mechanism</Label>
            <Input
              id="mechanism"
              placeholder="e.g., Enzyme inhibitor"
              value={workingMechanism}
              onChange={(e) => setWorkingMechanism(e.target.value)}
            />
          </div>
        </div>
      )}

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