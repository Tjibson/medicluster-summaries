import { Card } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { LoadingState } from "@/components/papers/LoadingState"
import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { PaperActions } from "@/components/papers/PaperActions"
import { type Paper } from "@/types/papers"

interface ResultsListProps {
  papers: Paper[]
  isLoading: boolean
  searchCriteria?: {
    population?: string
    disease?: string
    medicine?: string
    working_mechanism?: string
    patientCount?: string
    trialType?: string
    journal?: string
  }
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUserId()
  }, [])

  const handleSavePaper = async (paper: Paper) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save papers",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if paper is already saved
      const { data: existingPaper } = await supabase
        .from("saved_papers")
        .select()
        .eq("user_id", userId)
        .eq("paper_id", paper.id)
        .single()

      if (existingPaper) {
        // Paper already exists, update it
        const { error } = await supabase
          .from("saved_papers")
          .update({
            title: paper.title,
            authors: paper.authors,
            journal: paper.journal,
            year: paper.year,
          })
          .eq("user_id", userId)
          .eq("paper_id", paper.id)

        if (error) throw error
      } else {
        // Paper doesn't exist, insert it
        const { error } = await supabase
          .from("saved_papers")
          .insert({
            user_id: userId,
            paper_id: paper.id,
            title: paper.title,
            authors: paper.authors,
            journal: paper.journal,
            year: paper.year,
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Paper saved to your list",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save paper",
        variant: "destructive",
      })
    }
  }

  const handleLikePaper = async (paper: Paper) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to like papers",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if paper is already saved
      const { data: existingPaper } = await supabase
        .from("saved_papers")
        .select()
        .eq("user_id", userId)
        .eq("paper_id", paper.id)
        .single()

      if (existingPaper) {
        // Paper exists, update it
        const { error } = await supabase
          .from("saved_papers")
          .update({
            is_liked: true,
          })
          .eq("user_id", userId)
          .eq("paper_id", paper.id)

        if (error) throw error
      } else {
        // Paper doesn't exist, insert it
        const { error } = await supabase
          .from("saved_papers")
          .insert({
            user_id: userId,
            paper_id: paper.id,
            title: paper.title,
            authors: paper.authors,
            journal: paper.journal,
            year: paper.year,
            is_liked: true,
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Paper added to likes",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like paper",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (papers.length === 0) {
    return (
      <Card className="p-6 text-center shadow-card">
        <p className="text-gray-500">No papers found matching your criteria.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {searchCriteria && <SearchCriteria criteria={searchCriteria} />}
      {papers.map((paper) => (
        <Card key={paper.id} className="p-6 shadow-card hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{paper.title}</h3>
              <p className="text-sm text-gray-600">
                {paper.authors.join(", ")} • {paper.journal} • {paper.year}
              </p>
              <p className="text-sm text-gray-500">
                Citations: {paper.citations}
              </p>
              <p className="mt-2 text-gray-700">{paper.abstract}</p>
            </div>
            <PaperActions
              paper={paper}
              onSave={handleSavePaper}
              onLike={handleLikePaper}
            />
          </div>
        </Card>
      ))}
    </div>
  )
}