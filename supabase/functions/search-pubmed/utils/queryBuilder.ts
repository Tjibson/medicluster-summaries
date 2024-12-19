import { SearchParams } from './types'

export function buildPubMedQuery(params: SearchParams): string {
  const searchTerms = []
  if (params.medicine) searchTerms.push(`(${params.medicine})`)
  if (params.condition) searchTerms.push(`(${params.condition})`)
  
  const journalQuery = params.journalNames?.length 
    ? ` AND (${params.journalNames.map(journal => `"${journal}"[Journal]`).join(' OR ')})`
    : ''

  const dateQuery = params.dateRange
    ? ` AND ("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    : ''

  return `${searchTerms.join(' AND ')}${journalQuery}${dateQuery}`
}