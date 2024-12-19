export interface SearchParams {
  dateRange?: {
    start: string
    end: string
  }
  journalNames?: string[]
  keywords?: string
  medicine?: string
  condition?: string
}

export interface PubMedArticle {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  year: number
  citations: number
}