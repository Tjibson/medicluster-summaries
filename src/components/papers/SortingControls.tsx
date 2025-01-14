import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortOption = "citations" | "date" | "relevance" | "title"
export type SortDirection = "asc" | "desc"

interface SortingControlsProps {
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (value: SortOption) => void
  onDirectionChange: () => void
  isRelevanceReady?: boolean
  resultsPerPage: string
  onResultsPerPageChange: (value: string) => void
}

export function SortingControls({ 
  sortBy, 
  sortDirection, 
  onSortChange, 
  onDirectionChange,
  isRelevanceReady = true,
  resultsPerPage,
  onResultsPerPageChange
}: SortingControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={resultsPerPage}
        onValueChange={onResultsPerPageChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Results per page" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="25">25 results per page</SelectItem>
          <SelectItem value="50">50 results per page</SelectItem>
          <SelectItem value="100">100 results per page</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={sortBy} 
        onValueChange={(value) => onSortChange(value as SortOption)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Relevance</SelectItem>
          <SelectItem value="citations">Citations</SelectItem>
          <SelectItem value="date">Date Published</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onDirectionChange}
        className="h-10 w-10 relative group"
        title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
      >
        <ArrowUpDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            sortDirection === "desc" ? "rotate-180" : ""
          )}
        />
        <span className="sr-only">
          Toggle sort direction (currently {sortDirection})
        </span>
      </Button>
    </div>
  )
}