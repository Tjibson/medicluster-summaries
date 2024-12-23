export function calculateRelevanceScore(
  title: string,
  abstract: string,
  searchTerms: { medicine?: string; condition?: string }
): number {
  if (!title && !abstract) return 0;
  
  let score = 0;
  const titleLower = title.toLowerCase();
  const abstractLower = abstract.toLowerCase();

  // Helper function to count term occurrences
  const countOccurrences = (text: string, term: string): number => {
    if (!term) return 0;
    const regex = new RegExp(term.toLowerCase(), 'g');
    return (text.match(regex) || []).length;
  };

  // Score medicine terms
  if (searchTerms.medicine) {
    const titleMatches = countOccurrences(titleLower, searchTerms.medicine);
    const abstractMatches = countOccurrences(abstractLower, searchTerms.medicine);
    score += titleMatches * 30; // Title matches worth more
    score += abstractMatches * 10;
  }

  // Score condition terms
  if (searchTerms.condition) {
    const titleMatches = countOccurrences(titleLower, searchTerms.condition);
    const abstractMatches = countOccurrences(abstractLower, searchTerms.condition);
    score += titleMatches * 30;
    score += abstractMatches * 10;
  }

  // Normalize score to 0-100 range
  return Math.min(Math.round(score), 100);
}