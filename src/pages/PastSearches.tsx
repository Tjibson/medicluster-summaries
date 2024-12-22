import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

interface SearchHistoryItem {
  id: string
  disease?: string
  medicine?: string
  population?: string
  created_at: string
}

export default function PastSearches() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
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
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSearchHistory(data || [])
    } catch (error) {
      console.error("Error fetching search history:", error)
      toast({
        title: "Error",
        description: "Failed to load search history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Past Searches</h1>
      {searchHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No search history available
        </div>
      ) : (
        <div className="space-y-4">
          {searchHistory.map((search) => (
            <div
              key={search.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  {search.medicine && (
                    <p><span className="font-medium">Medicine:</span> {search.medicine}</p>
                  )}
                  {search.disease && (
                    <p><span className="font-medium">Condition:</span> {search.disease}</p>
                  )}
                  {search.population && (
                    <p><span className="font-medium">Population:</span> {search.population}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Searched on {formatDate(search.created_at)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  New Search
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}