import { Card } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { LoadingState } from "@/components/papers/LoadingState"
import { SearchCriteria } from "@/components/papers/SearchCriteria"
import { PaperActions } from "@/components/papers/PaperActions"
import { type Paper } from "@/types/papers"
import { AddToListDialog } from "./papers/AddToListDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

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

type SortOption = "citations" | "date" | "relevance"

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

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

    setSelectedPaper(paper)
    setIsAddToListDialogOpen(true)
  }

  const handleAddToList = async (paper: Paper, listId: string) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .insert({
          user_id: userId,
          paper_id: paper.id,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          year: paper.year,
          list_id: listId,
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Paper saved to list",
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
      const { data: existingPaper } = await supabase
        .from("saved_papers")
        .select()
        .eq("user_id", userId)
        .eq("paper_id", paper.id)
        .single()

      if (existingPaper) {
        const { error } = await supabase
          .from("saved_papers")
          .update({
            is_liked: true,
          })
          .eq("user_id", userId)
          .eq("paper_id", paper.id)

        if (error) throw error
      } else {
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

  const sortedPapers = [...papers].sort((a, b) => {
    switch (sortBy) {
      case "citations":
        return (b.citations || 0) - (a.citations || 0)
      case "date":
        return b.year - a.year
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedPapers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPapers = sortedPapers.slice(startIndex, startIndex + itemsPerPage)

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
      
      <div className="flex justify-end mb-4">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="citations">Citations</SelectItem>
            <SelectItem value="date">Date Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paginatedPapers.map((paper) => (
        <Card key={paper.id} className="p-6 shadow-card hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{paper.title}</h3>
              <p className="text-sm text-gray-600">
                {paper.authors.join(", ")} • {paper.journal} • {paper.year}
              </p>
              <p className="text-sm text-gray-500">
                Citations: {paper.citations || 0}
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

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AddToListDialog
        paper={selectedPaper}
        isOpen={isAddToListDialogOpen}
        onClose={() => setIsAddToListDialogOpen(false)}
        onSave={handleAddToList}
      />
    </div>
  )
}