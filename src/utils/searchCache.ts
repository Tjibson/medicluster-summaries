import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"
import { type SearchParameters } from "@/constants/searchConfig"

const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export async function getCachedSearch(params: SearchParameters): Promise<Paper[] | null> {
  const cacheKey = generateCacheKey(params)
  const { data: cache } = await supabase
    .from('search_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .single()

  if (!cache || Date.now() - new Date(cache.created_at).getTime() > CACHE_EXPIRY) {
    return null
  }

  return cache.results
}

export async function setCachedSearch(params: SearchParameters, results: Paper[]): Promise<void> {
  const cacheKey = generateCacheKey(params)
  await supabase
    .from('search_cache')
    .upsert({
      cache_key: cacheKey,
      results,
      created_at: new Date().toISOString()
    })
}

function generateCacheKey(params: SearchParameters): string {
  return JSON.stringify({
    medicine: params.medicine || '',
    condition: params.condition || '',
    dateRange: params.dateRange || {},
    articleTypes: params.articleTypes || []
  })
}