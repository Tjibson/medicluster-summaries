import { Button } from "@/components/ui/button"

interface SearchHistoryProps {
  searchHistory: any[]
  onHistoryClick: (search: any) => void
}

export function SearchHistory({ searchHistory, onHistoryClick }: SearchHistoryProps) {
  if (searchHistory.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Recent Searches</h3>
      <div className="space-y-2">
        {searchHistory.map((search: any) => (
          <Button
            key={search.id}
            variant="outline"
            className="w-full text-left justify-start"
            onClick={() => onHistoryClick(search)}
          >
            {search.disease} - {search.medicine} ({search.population})
          </Button>
        ))}
      </div>
    </div>
  )
}