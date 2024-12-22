export interface SearchParameters {
  medicine?: string;
  condition?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  articleTypes?: string[];
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number;
  citations?: number;
  relevance_score?: number;
}