import { SearchParams } from './types.ts'

export function validateSearchParams(params: any): SearchParams {
  if (!params) {
    throw new Error('No search parameters provided')
  }

  // Ensure at least one search term is provided
  if (!params.medicine && !params.condition) {
    throw new Error('At least one search term (medicine or condition) is required')
  }

  return {
    medicine: params.medicine || '',
    condition: params.condition || '',
    dateRange: params.dateRange,
    articleTypes: params.articleTypes || [],
    offset: params.offset || 0,
    limit: params.limit || 25,
    sort: params.sort || 'relevance'
  }
}