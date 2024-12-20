import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { type SearchParameters } from "@/constants/searchConfig"

interface SearchCriteriaProps {
  criteria: SearchParameters
}

export function SearchCriteria({ criteria }: SearchCriteriaProps) {
  return (
    <Card className="p-4 mb-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {criteria.dateRange && (
            <Badge variant="outline">
              Date Range: {criteria.dateRange.start} to {criteria.dateRange.end}
            </Badge>
          )}
          {criteria.keywords.medicine.length > 0 && (
            <Badge variant="outline">
              Medicine Keywords: {criteria.keywords.medicine.join(", ")}
            </Badge>
          )}
          {criteria.keywords.condition.length > 0 && (
            <Badge variant="outline">
              Condition Keywords: {criteria.keywords.condition.join(", ")}
            </Badge>
          )}
          {criteria.articleTypes.length > 0 && (
            <Badge variant="outline">
              Article Types: {criteria.articleTypes.join(", ")}
            </Badge>
          )}
        </div>
        {criteria.journalNames && criteria.journalNames.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">Selected Journals:</p>
            <div className="flex flex-wrap gap-2">
              {criteria.journalNames.map((journal) => (
                <Badge key={journal} variant="secondary">
                  {journal}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}