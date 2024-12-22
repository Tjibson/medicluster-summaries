import { supabase } from "@/integrations/supabase/client"
import { type Paper } from "@/types/papers"

export async function getSearchCache(cacheKey: string): Promise<Paper[] | null> {
  const { data, error } = await supabase
    .from('search_cache')
    .select('results')
    .eq('cache_key', cacheKey)
    .single()

  if (error || !data) {
    return null
  }

  return data.results as Paper[]
}

export async function setSearchCache(cacheKey: string, results: Paper[]): Promise<void> {
  await supabase
    .from('search_cache')
    .upsert({ 
      cache_key: cacheKey, 
      results: results 
    }, { onConflict: 'cache_key' })
}