import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ContinentSelect } from "./search/ContinentSelect"
import { RegionSelect } from "./search/RegionSelect"
import { DateRangeSelect } from "./search/DateRangeSelect"
import { JournalSelect } from "./search/JournalSelect"
import { StudyDetailsInputs } from "./search/StudyDetailsInputs"

export function SearchForm({ onSearch }: { onSearch: (criteria: any) => void }) {
  const [selectedContinent, setSelectedContinent] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedJournal, setSelectedJournal] = useState("all")
  const [journals, setJournals] = useState<{ id: string; name: string }[]>([])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [formData, setFormData] = useState({
    disease: "",
    medicine: "",
    workingMechanism: "",
    patientCount: "",
    trialType: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchJournals()
  }, [])

  const fetchJournals = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_journals")
        .select("*")
        .order("name")

      if (error) throw error
      setJournals(data || [])
    } catch (error) {
      console.error("Error fetching journals:", error)
      toast({
        title: "Error",
        description: "Failed to load journals",
        variant: "destructive",
      })
    }
  }

  const handleQuickDateSelect = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start)
    setEndDate(end)
  }

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
        population: selectedContinent && `${selectedContinent}${selectedRegion ? ` - ${selectedRegion}` : ''}`,
        disease: formData.disease,
        medicine: formData.medicine,
        working_mechanism: formData.workingMechanism,
        patient_count: formData.patientCount ? parseInt(formData.patientCount) : undefined,
        trial_type: formData.trialType,
        journal: selectedJournal !== "all" ? selectedJournal : undefined,
        date_range: startDate && endDate ? {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        } : undefined
      }

      console.log('Search criteria:', searchCriteria)

      // Call the search-pubmed edge function
      const { data: pubmedData, error: pubmedError } = await supabase.functions.invoke('search-pubmed', {
        body: searchCriteria
      })

      if (pubmedError) throw pubmedError

      // Save search history in background
      const { population, disease, medicine, working_mechanism, patient_count, trial_type } = searchCriteria
      await supabase
        .from("search_history")
        .insert({
          user_id: session.user.id,
          population,
          disease,
          medicine,
          working_mechanism,
          patient_count,
          trial_type
        })
        .single()

      onSearch(pubmedData.papers || [])

    } catch (error) {
      console.error("Error performing search:", error)
      toast({
        title: "Error",
        description: "Failed to perform search",
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

          <StudyDetailsInputs
            disease={formData.disease}
            onDiseaseChange={(value) => setFormData(prev => ({ ...prev, disease: value }))}
            medicine={formData.medicine}
            onMedicineChange={(value) => setFormData(prev => ({ ...prev, medicine: value }))}
            workingMechanism={formData.workingMechanism}
            onWorkingMechanismChange={(value) => setFormData(prev => ({ ...prev, workingMechanism: value }))}
            patientCount={formData.patientCount}
            onPatientCountChange={(value) => setFormData(prev => ({ ...prev, patientCount: value }))}
            trialType={formData.trialType}
            onTrialTypeChange={(value) => setFormData(prev => ({ ...prev, trialType: value }))}
          />

          <JournalSelect
            value={selectedJournal}
            onChange={setSelectedJournal}
            journals={journals}
          />

          <DateRangeSelect
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onQuickSelect={handleQuickDateSelect}
          />
        </div>

        <Button type="submit" className="w-full">
          Search PubMed
        </Button>
      </form>
    </div>
  )
}