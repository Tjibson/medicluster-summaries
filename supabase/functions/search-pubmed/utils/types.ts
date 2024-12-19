export interface SearchParams {
  keywords: string
  dateRange?: {
    start: string
    end: string
  }
  journalNames?: string[]
}

export interface PubMedArticle {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  year: number
  citations?: number
}