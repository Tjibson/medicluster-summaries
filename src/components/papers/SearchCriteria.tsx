import { Card } from "@/components/ui/card"

interface SearchCriteriaProps {
  criteria: {
    population?: string
    disease?: string
    medicine?: string
    working_mechanism?: string
    patientCount?: string
    trialType?: string
    journal?: string
  }
}

export function SearchCriteria({ criteria }: SearchCriteriaProps) {
  if (!criteria) return null

  return (
    <Card className="p-4 bg-gray-50 shadow-soft">
      <h3 className="font-semibold mb-2">Search Criteria:</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        {criteria.population && (
          <div>
            <span className="font-medium">Demographics:</span> {criteria.population}
          </div>
        )}
        {criteria.disease && (
          <div>
            <span className="font-medium">Disease:</span> {criteria.disease}
          </div>
        )}
        {criteria.medicine && (
          <div>
            <span className="font-medium">Medicine:</span> {criteria.medicine}
          </div>
        )}
        {criteria.working_mechanism && (
          <div>
            <span className="font-medium">Mechanism:</span> {criteria.working_mechanism}
          </div>
        )}
        {criteria.patientCount && (
          <div>
            <span className="font-medium">Min. Patients:</span> {criteria.patientCount}
          </div>
        )}
        {criteria.trialType && (
          <div>
            <span className="font-medium">Trial Type:</span> {criteria.trialType}
          </div>
        )}
        {criteria.journal && (
          <div>
            <span className="font-medium">Journal:</span> {criteria.journal}
          </div>
        )}
      </div>
    </Card>
  )
}