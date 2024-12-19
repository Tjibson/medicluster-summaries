import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function SearchForm({ onSearch }: { onSearch: (papers: any[]) => void }) {
  const [medicine, setMedicine] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedMedicine = medicine.trim()
    if (!trimmedMedicine) {
      toast({
        title: "Error",
        description: "Please enter a medicine name",
        variant: "destructive",
      })
      return
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

      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: { medicine: trimmedMedicine }
      })

      if (error) {
        console.error("Search error:", error)
        throw error
      }

      if (!data || !data.papers) {
        throw new Error("Invalid response format")
      }

      // Save search history in background
      await supabase
        .from("search_history")
        .insert({
          user_id: session.user.id,
          medicine: trimmedMedicine,
        })
        .single()

      onSearch(data.papers)

    } catch (error: any) {
      console.error("Error performing search:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to perform search",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Medicine Name</label>
          <Input
            value={medicine}
            onChange={(e) => setMedicine(e.target.value)}
            placeholder="Enter medicine name"
            className="w-full"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Search PubMed
        </Button>
      </form>
    </div>
  )
}