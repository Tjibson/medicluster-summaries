import { type Paper } from "@/types/papers"
import { supabase } from "@/integrations/supabase/client"

export async function getSearchCache(key: string): Promise<Paper[] | null> {
  const { data } = await supabase
    .from('search_cache')
    .select('results')
    .eq('cache_key', key)
    .single()

  if (!data) return null

  // Safely cast the results to Paper[]
  const results = data.results as Paper[]
  return results
}

export async function setSearchCache(key: string, results: Paper[]): Promise<void> {
  await supabase
    .from('search_cache')
    .upsert({ cache_key: key, results }, { onConflict: 'cache_key' })
}