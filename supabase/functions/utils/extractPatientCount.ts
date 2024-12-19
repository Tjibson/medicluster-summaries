export function extractPatientCount(text: string): number | null {
  // Common patterns for patient count in medical papers
  const patterns = [
    /(?:n\s*=\s*)(\d+)(?:\s*patients?)?/i,
    /(\d+)(?:\s+patients? were (enrolled|included|studied))/i,
    /study (?:included|enrolled) (\d+)(?:\s+patients?)/i,
    /total of (\d+)(?:\s+patients?)/i,
    /sample size of (\d+)/i,
    /cohort of (\d+)(?:\s+patients?)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (!isNaN(count)) {
        return count;
      }
    }
  }

  return null;
}