import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface JournalSelectProps {
  value: string
  onChange: (value: string) => void
  journals: { id: string; name: string }[]
}

export function JournalSelect({ value, onChange, journals }: JournalSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Journal</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select journal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Journals</SelectItem>
          {journals.map((journal) => (
            <SelectItem key={journal.id} value={journal.name}>
              {journal.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}