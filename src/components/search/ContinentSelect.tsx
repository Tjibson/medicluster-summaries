import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContinentSelectProps {
  value: string
  onChange: (value: string) => void
}

export function ContinentSelect({ value, onChange }: ContinentSelectProps) {
  const continents = [
    "Africa", 
    "Asia", 
    "Europe", 
    "North America", 
    "South America", 
    "Oceania"
  ]

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Population Demographics</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Population Demographics" />
        </SelectTrigger>
        <SelectContent>
          {continents.map((continent) => (
            <SelectItem key={continent} value={continent}>
              {continent}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}