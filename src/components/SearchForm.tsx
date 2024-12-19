import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ContinentSelect } from "./search/ContinentSelect"
import { RegionSelect } from "./search/RegionSelect"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function SearchForm({ onSearch }: { onSearch: (criteria: any) => void }) {
  const [selectedContinent, setSelectedContinent] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [disease, setDisease] = useState("")
  const [medicine, setMedicine] = useState("")
  const [workingMechanism, setWorkingMechanism] = useState("")
  const [patientCount, setPatientCount] = useState("")
  const [trialType, setTrialType] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedJournal, setSelectedJournal] = useState("")
  const [journals, setJournals] = useState<{ id: string; name: string }[]>([])
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
        user_id: session.user.id,
        population: `${selectedContinent}${selectedRegion ? ` - ${selectedRegion}` : ''}`,
        disease,
        medicine,
        working_mechanism: workingMechanism,
        patient_count: patientCount ? parseInt(patientCount) : null,
        trial_type: trialType,
        journal: selectedJournal,
        date_range: startDate && endDate ? {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        } : null
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Journal</label>
            <Select value={selectedJournal} onValueChange={setSelectedJournal}>
              <SelectTrigger>
                <SelectValue placeholder="Select journal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Journals</SelectItem>
                {journals.map((journal) => (
                  <SelectItem key={journal.id} value={journal.name}>
                    {journal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(90)}
              >
                Last 90 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(365)}
              >
                Last year
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(1825)}
              >
                Last 5 years
              </Button>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Search
        </Button>
      </form>
    </div>
  )
}