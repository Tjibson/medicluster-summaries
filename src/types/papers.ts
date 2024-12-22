export interface Paper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  citations?: number
  abstract?: string
  pdfUrl?: string
  relevance_score?: number
  patient_count?: number
}

export interface SavedPaper extends Paper {
  user_id: string
  paper_id: string
  is_liked?: boolean
  list_id?: string
  created_at: string
  pdfUrl?: string
}