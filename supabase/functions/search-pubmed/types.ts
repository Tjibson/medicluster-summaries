export interface SearchParameters {
  dateRange: {
    start: string;
    end: string;
  };
  journalNames: string[];
  keywords: {
    medicine: string[];
    condition: string[];
  };
  articleTypes: string[];
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  relevance_score: number;
}