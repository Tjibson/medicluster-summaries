import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ARTICLE_TYPES } from "@/constants/searchConfig"
import { Button } from "@/components/ui/button"

interface SearchInputsProps {
  medicine: string
  condition: string
  selectedArticleTypes: string[]
  onMedicineChange: (value: string) => void
  onConditionChange: (value: string) => void
  onArticleTypesChange: (value: string[]) => void
}

export function SearchInputs({
  medicine,
  condition,
  selectedArticleTypes,
  onMedicineChange,
  onConditionChange,
  onArticleTypesChange,
}: SearchInputsProps) {
  const handleArticleTypeChange = (value: string) => {
    switch (value) {
      case "all":
        onArticleTypesChange([...ARTICLE_TYPES])
        break
      case "none":
        onArticleTypesChange([])
        break
      default:
        onArticleTypesChange([value])
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Medicine Keywords</label>
        <Input
          value={medicine}
          onChange={(e) => onMedicineChange(e.target.value)}
          placeholder="e.g., Entresto, Sacubitril, ARNi, LCZ696"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Condition Keywords</label>
        <Input
          value={condition}
          onChange={(e) => onConditionChange(e.target.value)}
          placeholder="e.g., HFrEF, heart failure"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Article Types</label>
        <Select
          value={
            selectedArticleTypes.length === 0
              ? "none"
              : selectedArticleTypes.length === ARTICLE_TYPES.length
              ? "all"
              : selectedArticleTypes[0]
          }
          onValueChange={handleArticleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select article type">
              {selectedArticleTypes.length === 0
                ? "No types selected"
                : selectedArticleTypes.length === ARTICLE_TYPES.length
                ? "All types"
                : selectedArticleTypes[0]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="none">No types</SelectItem>
            {ARTICLE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}