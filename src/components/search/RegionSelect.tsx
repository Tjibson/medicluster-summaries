import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RegionSelectProps {
  continent: string
  value: string
  onChange: (value: string) => void
}

export function RegionSelect({ continent, value, onChange }: RegionSelectProps) {
  const getRegionOptions = () => {
    switch (continent) {
      case "Africa":
        return [
          "North Africa",
          "West Africa",
          "East Africa",
          "Central Africa",
          "Southern Africa"
        ]
      case "Asia":
        return [
          "East Asia",
          "South Asia",
          "Southeast Asia",
          "Central Asia",
          "West Asia"
        ]
      case "Europe":
        return [
          "Northern Europe",
          "Western Europe",
          "Eastern Europe",
          "Southern Europe",
          "Central Europe"
        ]
      case "North America":
        return [
          "Northern America",
          "Central America",
          "Caribbean"
        ]
      case "South America":
        return [
          "Northern South America",
          "Central South America",
          "Southern South America"
        ]
      case "Oceania":
        return [
          "Australia and New Zealand",
          "Melanesia",
          "Micronesia",
          "Polynesia"
        ]
      default:
        return []
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Region</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Select All</SelectItem>
          {getRegionOptions().map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}