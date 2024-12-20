import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ARTICLE_TYPES } from "@/constants/searchConfig"

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
          value={selectedArticleTypes[0]}
          onValueChange={(value) => onArticleTypesChange([value])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select article type" />
          </SelectTrigger>
          <SelectContent>
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