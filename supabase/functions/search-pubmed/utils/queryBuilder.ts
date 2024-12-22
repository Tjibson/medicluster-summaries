import { SearchParams } from './types';
import { PUBMED_TOOL_NAME, PUBMED_EMAIL } from './constants';

export function buildSearchQuery(params: SearchParams): string {
  const queryParts = [];
  
  if (params.medicine) {
    queryParts.push(`"${params.medicine}"[Title/Abstract]`);
  }
  
  if (params.condition) {
    queryParts.push(`"${params.condition}"[Title/Abstract]`);
  }

  if (params.articleTypes?.length) {
    const typeQuery = params.articleTypes
      .map(type => `"${type}"[Publication Type]`)
      .join(" OR ");
    queryParts.push(`(${typeQuery})`);
  }

  if (params.dateRange) {
    queryParts.push(
      `("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    );
  }

  const query = queryParts.join(" AND ");
  console.log('Built PubMed query:', query);
  return query;
}

export function buildSearchParams(query: string, offset: number = 0, limit: number = 25): URLSearchParams {
  return new URLSearchParams({
    db: 'pubmed',
    term: query,
    retstart: offset.toString(),
    retmax: limit.toString(),
    usehistory: 'y',
    retmode: 'xml',
    tool: PUBMED_TOOL_NAME,
    email: PUBMED_EMAIL
  });
}