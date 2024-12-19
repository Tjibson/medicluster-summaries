import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const JOURNAL_NAMES = [
  "ESC heart failure",
  "JACC. Heart failure",
  "Journal of the American College of Cardiology",
  "Circulation",
  "European journal of heart failure",
  "JAMA cardiology",
  "Frontiers in cardiovascular medicine",
  "Journal of the American Heart Association",
  "Nature",
  "The Lancet",
]

interface SearchCriteriaProps {
  criteria: {
    dateRange?: {
      start: string
      end: string
    }
    keywords?: string
    journalNames?: string[]
  }
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
          {criteria.keywords && (
            <Badge variant="outline">
              Keywords: {criteria.keywords}
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