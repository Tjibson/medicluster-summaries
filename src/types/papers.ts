export interface Paper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  citations: number
  abstract: string
  pdfUrl?: string
}

export interface SavedPaper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  created_at: string
  paper_id: string
  user_id: string
  is_liked: boolean | null
}