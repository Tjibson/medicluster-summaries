export function extractIdentifiers(articleData: any): { doi: string | null; pdfUrl: string | null } {
  try {
    const articleIdList = articleData.PubmedData?.ArticleIdList?.ArticleId || []
    const ids = Array.isArray(articleIdList) ? articleIdList : [articleIdList]

    let doi: string | null = null
    ids.forEach((id: any) => {
      if (id?._attributes?.IdType === 'doi') {
        doi = id._text || id
      }
    })

    // Construct PDF URL if DOI is available
    const pdfUrl = doi ? `https://doi.org/${doi}` : null

    return { doi, pdfUrl }
  } catch (error) {
    console.error('Error extracting identifiers:', error)
    return { doi: null, pdfUrl: null }
  }
}