import { supabase } from "@/integrations/supabase/client"
import { Paper } from "@/types/papers"

export async function getCachedResults(cacheKey: string): Promise<Paper[] | null> {
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

export async function cacheResults(cacheKey: string, results: Paper[]) {
  const { error } = await supabase
    .from('search_cache')
    .insert({
      cache_key: cacheKey,
      results: results as any // Type assertion needed due to Supabase types
    })

  if (error) {
    console.error('Error caching results:', error)
  }
}