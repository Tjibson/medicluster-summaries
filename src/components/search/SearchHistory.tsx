import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

interface SearchHistoryProps {
  onHistoryClick: (search: any) => void
}

export function SearchHistory({ onHistoryClick }: SearchHistoryProps) {
  const [searchHistory, setSearchHistory] = useState([])

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
        .limit(5)

      if (error) throw error
      setSearchHistory(data || [])
    } catch (error) {
      console.error("Error fetching search history:", error)
    }
  }

  if (searchHistory.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No search history available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {searchHistory.map((search: any) => (
          <Button
            key={search.id}
            variant="outline"
            className="w-full text-left justify-start"
            onClick={() => onHistoryClick(search)}
          >
            {search.disease} - {search.medicine} ({search.population})
          </Button>
        ))}
      </div>
    </div>
  )
}