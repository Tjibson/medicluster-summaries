import { JOURNAL_WEIGHTS } from '../../../src/constants/searchConfig'

export function calculateRelevanceScore(title: string, abstract: string, journal: string, searchParams: any): number {
  let score = 0;
  const text = `${title} ${abstract}`.toLowerCase();

  // Journal weight (30% of total score)
  const journalWeight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1;
  score += (journalWeight / Math.max(...Object.values(JOURNAL_WEIGHTS))) * 30;

  // Keyword matches (70% of total score)
  const allKeywords = [...searchParams.keywords.medicine, ...searchParams.keywords.condition];
  allKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    // Title matches worth more (2x)
    if (title.toLowerCase().includes(keywordLower)) {
      score += 15;
    }
    // Abstract matches
    const matches = (text.match(new RegExp(keywordLower, 'g')) || []).length;
    score += matches * 5;
  });

  // Normalize to 0-100
  return Math.min(Math.round(score), 100);
}