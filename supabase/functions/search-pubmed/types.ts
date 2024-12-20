export interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  year: number
  publicationTypes?: string[]
  doi?: string | null
  pdfUrl?: string | null
  citations: number
  relevance_score: number
}