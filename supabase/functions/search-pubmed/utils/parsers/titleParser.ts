export function extractTitle(articleData: any): string | null {
  try {
    const article = articleData.MedlineCitation?.Article
    if (!article) return null

    // Handle different title formats
    if (typeof article.ArticleTitle === 'string') {
      return article.ArticleTitle
    }

    if (article.ArticleTitle?._text) {
      return article.ArticleTitle._text
    }

    if (article.ArticleTitle?.text) {
      return article.ArticleTitle.text
    }

    // Handle vernacular title as fallback
    if (article.VernacularTitle) {
      return article.VernacularTitle
    }

    return null
  } catch (error) {
    console.error('Error extracting title:', error)
    return null
  }
}