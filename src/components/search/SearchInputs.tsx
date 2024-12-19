import { Input } from "@/components/ui/input"

interface SearchInputsProps {
  medicine: string
  condition: string
  onMedicineChange: (value: string) => void
  onConditionChange: (value: string) => void
}

export function SearchInputs({
  medicine,
  condition,
  onMedicineChange,
  onConditionChange,
}: SearchInputsProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Medicine Keywords (optional)</label>
        <Input
          value={medicine}
          onChange={(e) => onMedicineChange(e.target.value)}
          placeholder="e.g., Entresto Sacubitril ARNi LCZ696"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Condition Keywords (optional)</label>
        <Input
          value={condition}
          onChange={(e) => onConditionChange(e.target.value)}
          placeholder="e.g., HFrEF heart failure"
          className="w-full"
        />
      </div>
    </>
  )
}