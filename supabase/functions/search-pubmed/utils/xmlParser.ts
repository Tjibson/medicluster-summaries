export function parseArticles(xmlText: string) {
  const articles = [];
  const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

  for (const articleXml of articleMatches) {
    try {
      const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || '';
      const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title';
      const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || '';
      
      const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g);
      const authors = Array.from(authorMatches).map(match => {
        const lastName = match[1] || '';
        const foreName = match[2] || '';
        return `${lastName} ${foreName}`.trim();
      });

      const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                     articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                     'Unknown Journal';
      
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1];
      const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear();

      articles.push({
        id,
        title: decodeXMLEntities(title),
        abstract: decodeXMLEntities(abstract),
        authors,
        journal: decodeXMLEntities(journal),
        year,
        citations: 0
      });
    } catch (error) {
      console.error('Error processing article:', error);
      continue;
    }
  }

  return articles;
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}