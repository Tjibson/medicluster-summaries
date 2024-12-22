import { type Paper } from "@/types/papers"
import { supabase } from "@/integrations/supabase/client"
import { type Json } from "@/integrations/supabase/types"

export async function getSearchCache(cacheKey: string): Promise<Paper[] | null> {
  const { data: cacheEntry } = await supabase
    .from("search_cache")
    .select()
    .eq("cache_key", cacheKey)
    .single()

  if (cacheEntry) {
    return cacheEntry.results as unknown as Paper[]
  }

  return null
}

export async function setSearchCache(cacheKey: string, results: Paper[]): Promise<void> {
  await supabase
    .from("search_cache")
    .insert({
      cache_key: cacheKey,
      results: results as unknown as Json
    })
}