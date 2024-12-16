import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface SearchHistory {
  id: string
  created_at: string
  population: string | null
  disease: string | null
  medicine: string | null
  working_mechanism: string | null
  patient_count: number | null
  trial_type: string | null
}

const Dashboard = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("search_history")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setSearches(data || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch search history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchHistory()
  }, [toast])

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary">Search History</h1>
          <p className="text-gray-600">View your past medical research searches</p>
        </div>

        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : searches.length === 0 ? (
          <div className="text-center text-gray-500">No search history found</div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="grid grid-cols-2 gap-4">
                  {search.population && (
                    <div>
                      <span className="font-medium">Demographic Characteristics:</span>{" "}
                      {search.population}
                    </div>
                  )}
                  {search.disease && (
                    <div>
                      <span className="font-medium">Disease:</span> {search.disease}
                    </div>
                  )}
                  {search.medicine && (
                    <div>
                      <span className="font-medium">Medicine:</span> {search.medicine}
                    </div>
                  )}
                  {search.working_mechanism && (
                    <div>
                      <span className="font-medium">Working Mechanism:</span>{" "}
                      {search.working_mechanism}
                    </div>
                  )}
                  {search.patient_count && (
                    <div>
                      <span className="font-medium">Patient Count:</span>{" "}
                      {search.patient_count}
                    </div>
                  )}
                  {search.trial_type && (
                    <div>
                      <span className="font-medium">Trial Type:</span>{" "}
                      {search.trial_type}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Searched on: {new Date(search.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard