import { type SearchParameters } from "@/constants/searchConfig"
import { type Paper } from "@/types/papers"
import { supabase } from "@/integrations/supabase/client"

export async function searchPubMed(searchParams: SearchParameters): Promise<Paper[]> {
  try {
    // Step 1: Construct search query with Boolean logic
    const medicineQuery = searchParams.keywords.medicine.length > 0 
      ? `(${searchParams.keywords.medicine.join(" OR ")})`
      : ""
    
    const conditionQuery = searchParams.keywords.condition.length > 0
      ? `(${searchParams.keywords.condition.join(" OR ")})`
      : ""
    
    const journalQuery = searchParams.journalNames.length > 0
      ? `(${searchParams.journalNames.map(journal => `"${journal}"[Journal]`).join(" OR ")})`
      : ""
    
    const articleTypesQuery = searchParams.articleTypes.length > 0
      ? `(${searchParams.articleTypes.map(type => `"${type}"[Publication Type]`).join(" OR ")})`
      : ""
    
    const dateQuery = `("${searchParams.dateRange.start}"[Date - Publication] : "${searchParams.dateRange.end}"[Date - Publication])`
    
    // Combine all query parts
    const query = [
      medicineQuery,
      conditionQuery,
      journalQuery,
      articleTypesQuery,
      dateQuery
    ].filter(Boolean).join(" AND ")

    console.log("Constructed PubMed query:", query)

    // Step 2-5: Call the Supabase Edge Function to handle PubMed interaction
    const { data, error } = await supabase.functions.invoke('search-pubmed', {
      body: { searchParams, query }
    })

    if (error) throw error

    return data.papers
  } catch (error) {
    console.error("Error in searchPubMed:", error)
    throw error
  }
}