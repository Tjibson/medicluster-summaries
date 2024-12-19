import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type SortOption = "citations" | "date" | "relevance" | "title"

interface SortingControlsProps {
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
}

export function SortingControls({ sortBy, onSortChange }: SortingControlsProps) {
  return (
    <div className="flex justify-end mb-4">
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
    </div>
  )
}