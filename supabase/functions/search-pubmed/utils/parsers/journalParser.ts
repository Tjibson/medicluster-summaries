export function extractJournalInfo(articleData: any): { journal: string; year: number } {
  try {
    const journal = articleData.MedlineCitation?.Article?.Journal
    const journalTitle = journal?.Title || journal?.ISOAbbreviation || 'Unknown Journal'
    
    let year = new Date().getFullYear()
    const pubDate = journal?.JournalIssue?.PubDate

    if (pubDate?.Year) {
      year = parseInt(pubDate.Year)
    } else if (pubDate?.MedlineDate) {
      // Handle MedlineDate format (e.g., "2023 Jan-Feb")
      const yearMatch = pubDate.MedlineDate.match(/\d{4}/)
      if (yearMatch) {
        year = parseInt(yearMatch[0])
      }
    }

    return { journal: journalTitle, year }
  } catch (error) {
    console.error('Error extracting journal info:', error)
    return { journal: 'Unknown Journal', year: new Date().getFullYear() }
  }
}