import { supabase } from "@/integrations/supabase/client"
import { Paper } from "@/types/papers"

export async function getSearchCache(cacheKey: string): Promise<Paper[] | null> {
  const { data: cacheEntry } = await supabase
    .from("search_cache")
    .select("results")
    .eq("cache_key", cacheKey)
    .single()

  if (cacheEntry) {
    return cacheEntry.results as Paper[]
  }

  return null
}

export async function setSearchCache(cacheKey: string, results: Paper[]) {
  await supabase
    .from("search_cache")
    .insert({
      cache_key: cacheKey,
      results: results
    })
}