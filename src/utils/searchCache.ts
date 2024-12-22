import { supabase } from "@/integrations/supabase/client"
import type { Paper } from "@/types/papers"
import type { Json } from "@/integrations/supabase/types"

interface SearchCacheEntry {
  cache_key: string
  results: Paper[]
  created_at?: string
}

export async function getFromCache(cacheKey: string): Promise<Paper[] | null> {
  try {
    const { data, error } = await supabase
      .from('search_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single()

    if (error) throw error

    if (data && new Date(data.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
      return data.results as Paper[]
    }

    return null
  } catch (error) {
    console.error('Error fetching from cache:', error)
    return null
  }
}

export async function saveToCache(entry: SearchCacheEntry) {
  try {
    const { error } = await supabase
      .from('search_cache')
      .upsert({
        cache_key: entry.cache_key,
        results: entry.results as unknown as Json,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving to cache:', error)
  }
}