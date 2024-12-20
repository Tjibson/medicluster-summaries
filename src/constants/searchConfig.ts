export const JOURNAL_WEIGHTS = {
  "The New England Journal of Medicine": 5,
  "The Lancet": 5,
  "Nature": 4,
  "Journal of the American College of Cardiology": 4,
  "Circulation": 4,
  "JAMA cardiology": 4,
  "European journal of heart failure": 3,
  "ESC heart failure": 3,
  "JACC. Heart failure": 3,
  "Frontiers in cardiovascular medicine": 2,
  "Journal of the American Heart Association": 2,
} as const;

export const KEYWORD_WEIGHTS = {
  "Entresto": 5,
  "Sacubitril": 4,
  "ARNi": 4,
  "LCZ696": 3,
  "HFrEF": 3,
  "heart failure": 2,
} as const;

export const ARTICLE_TYPES = [
  'Abstract',
  'Clinical Study',
  'Clinical Trial',
  'Comparative Study',
  'Meta-Analysis',
  'Multicenter Study',
  'Practice Guideline',
  'Randomized Controlled Trial',
  'Systematic Review',
] as const;

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
  articleTypes: typeof ARTICLE_TYPES[number][];
}

export const DEFAULT_SEARCH_PARAMS: SearchParameters = {
  dateRange: {
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 20)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  journalNames: Object.keys(JOURNAL_WEIGHTS),
  keywords: {
    medicine: [],
    condition: [],
  },
  articleTypes: [...ARTICLE_TYPES],
};

export function calculateRelevanceScore(title: string, abstract: string, journal: string, searchParams: SearchParameters): number {
  // Calculate keyword score
  const allKeywords = [...searchParams.keywords.medicine, ...searchParams.keywords.condition];
  const text = `${title.toLowerCase()} ${abstract.toLowerCase()}`;
  
  let keywordScore = 0;
  const maxKeywordScore = Object.values(KEYWORD_WEIGHTS).reduce((a, b) => a + b, 0);
  
  allKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    // Check title (2x weight)
    if (title.toLowerCase().includes(keywordLower)) {
      keywordScore += (KEYWORD_WEIGHTS[keywordLower as keyof typeof KEYWORD_WEIGHTS] || 1) * 2;
    }
    // Check abstract
    if (abstract.toLowerCase().includes(keywordLower)) {
      keywordScore += (KEYWORD_WEIGHTS[keywordLower as keyof typeof KEYWORD_WEIGHTS] || 1);
    }
  });

  // Calculate journal score
  const journalScore = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 0;
  const maxJournalScore = Math.max(...Object.values(JOURNAL_WEIGHTS));

  // Normalize scores to 0-100
  const normalizedKeywordScore = (keywordScore / maxKeywordScore) * 100;
  const normalizedJournalScore = (journalScore / maxJournalScore) * 100;

  // Final weighted score (70% keywords, 30% journal)
  const finalScore = (0.7 * normalizedKeywordScore) + (0.3 * normalizedJournalScore);

  console.log('Relevance score calculation:', {
    title,
    journal,
    keywordScore,
    journalScore,
    normalizedKeywordScore,
    normalizedJournalScore,
    finalScore
  });

  return Math.round(Math.max(0, Math.min(100, finalScore)));
}