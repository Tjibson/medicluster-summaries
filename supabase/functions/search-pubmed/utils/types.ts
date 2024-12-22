export interface SearchParams {
  medicine?: string;
  condition?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  articleTypes?: string[];
  offset?: number;
  limit?: number;
}

export interface PubMedArticle {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number;
  citations?: number;
}