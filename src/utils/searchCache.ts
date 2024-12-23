import { type Paper } from "@/types/papers"
import { supabase } from "@/integrations/supabase/client"
import { type Json } from "@/integrations/supabase/types"

export async function getSearchCache(cacheKey: string): Promise<Paper[] | null> {
  try {
    const { data: cacheEntry, error } = await supabase
      .from("search_cache")
      .select()
      .eq("cache_key", cacheKey)
      .maybeSingle()

    if (error) {
      console.error("Error fetching from cache:", error)
      return null
    }

    if (cacheEntry) {
      return cacheEntry.results as unknown as Paper[]
    }

    return null
  } catch (error) {
    console.error("Error in getSearchCache:", error)
    return null
  }
}

export async function setSearchCache(cacheKey: string, results: Paper[]): Promise<void> {
  try {
    const { error } = await supabase
      .from("search_cache")
      .insert({
        cache_key: cacheKey,
        results: results as unknown as Json
      })

    if (error) {
      console.error("Error setting cache:", error)
    }
  } catch (error) {
    console.error("Error in setSearchCache:", error)
  }
}