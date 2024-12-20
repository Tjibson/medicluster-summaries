import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type SortOption = "citations" | "date" | "relevance" | "title"
export type SortDirection = "asc" | "desc"

interface SortingControlsProps {
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (value: SortOption) => void
  onDirectionChange: () => void
}

export function SortingControls({ 
  sortBy, 
  sortDirection, 
  onSortChange, 
  onDirectionChange 
}: SortingControlsProps) {
  return (
    <div className="flex justify-end mb-4 gap-2 items-center">
      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
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
        className="h-10 w-10"
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  )
}