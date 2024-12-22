export interface SearchParameters {
  medicine: string
  condition: string
  studyType: string
  startDate: string
  endDate: string
  keywords: {
    medicine: string[]
    condition: string[]
  }
}