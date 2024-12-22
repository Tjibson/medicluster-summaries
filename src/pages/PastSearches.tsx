import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

interface SearchHistoryItem {
  id: string
  disease?: string | null
  medicine?: string | null
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
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
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

  const handleNewSearch = (medicine?: string | null, disease?: string | null) => {
    navigate("/", { 
      state: { 
        initialSearch: {
          medicine,
          disease
        }
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Past Searches</h1>
      {searchHistory.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No search history available</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Start a New Search
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {searchHistory.map((search) => (
            <Card
              key={search.id}
              className="p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  {search.medicine && (
                    <p><span className="font-medium">Medicine:</span> {search.medicine}</p>
                  )}
                  {search.disease && (
                    <p><span className="font-medium">Condition:</span> {search.disease}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Searched on {formatDate(search.created_at)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleNewSearch(search.medicine, search.disease)}
                >
                  Repeat Search
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}