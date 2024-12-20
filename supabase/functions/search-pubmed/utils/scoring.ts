import { JOURNAL_WEIGHTS } from '../../../src/constants/searchConfig'

export function calculateRelevanceScore(
  title: string, 
  abstract: string, 
  journal: string, 
  citations: number,
  searchParams: any
): number {
  let score = 0;
  const text = `${title} ${abstract}`.toLowerCase();

  // Journal weight (20% of total score)
  const journalWeight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1;
  const maxJournalWeight = Math.max(...Object.values(JOURNAL_WEIGHTS));
  const journalScore = (journalWeight / maxJournalWeight) * 100;
  score += journalScore * 0.2;

  // Keyword matches (60% of total score)
  const allKeywords = [...searchParams.keywords.medicine, ...searchParams.keywords.condition];
  let keywordScore = 0;
  allKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    // Title matches worth more (2x)
    if (title.toLowerCase().includes(keywordLower)) {
      keywordScore += 15;
    }
    // Abstract matches
    const matches = (text.match(new RegExp(keywordLower, 'g')) || []).length;
    keywordScore += matches * 5;
  });
  
  // Normalize keyword score to 0-100 and add to total
  const normalizedKeywordScore = Math.min(100, keywordScore);
  score += normalizedKeywordScore * 0.6;

  // Citations score (20% of total score)
  const maxCitations = 1000; // Cap for normalization
  const citationScore = citations > 0 ? 
    Math.min(Math.log10(citations + 1) / Math.log10(maxCitations + 1), 1) * 100 : 
    0;
  score += citationScore * 0.2;

  // Round and ensure score is between 0-100
  return Math.round(Math.max(0, Math.min(100, score)));
}