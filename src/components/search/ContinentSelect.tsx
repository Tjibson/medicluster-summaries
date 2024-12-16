import { Select } from "@/components/ui/select"

interface ContinentSelectProps {
  value: string
  onChange: (value: string) => void
}

export function ContinentSelect({ value, onChange }: ContinentSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Continent</label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <option value="">Select Continent</option>
        <option value="Africa">Africa</option>
        <option value="Asia">Asia</option>
        <option value="Europe">Europe</option>
        <option value="North America">North America</option>
        <option value="South America">South America</option>
        <option value="Oceania">Oceania</option>
      </Select>
    </div>
  )
}