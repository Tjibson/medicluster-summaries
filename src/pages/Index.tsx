import { useState } from "react";
import { SearchForm, type SearchCriteria } from "@/components/SearchForm";
import { ResultsList, type Paper } from "@/components/ResultsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const { toast } = useToast();

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // Save search to history
      const { error } = await supabase.from("search_history").insert({
        user_id: session.user.id,
        population: criteria.population || null,
        disease: criteria.disease || null,
        medicine: criteria.medicine || null,
        working_mechanism: criteria.working_mechanism || null,
        patient_count: criteria.patientCount ? parseInt(criteria.patientCount) : null,
        trial_type: criteria.trialType || null
      });

      if (error) {
        console.error("Error saving search:", error);
        toast({
          title: "Error",
          description: "Failed to save search history",
          variant: "destructive",
        });
      }

      // This will be replaced with actual API call once backend is connected
      setTimeout(() => {
        setPapers([
          {
            id: "1",
            title: "Example Medical Research Paper",
            authors: ["John Doe", "Jane Smith"],
            journal: "Medical Journal",
            year: 2023,
            citations: 150,
            abstract:
              "This is a placeholder abstract for demonstration purposes. It will be replaced with real PubMed data once the backend is connected.",
            pdfUrl: "#",
          },
        ]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your search",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-primary">
              Medical Research Portal
            </h1>
            <p className="text-gray-600">
              Find relevant medical research papers based on your specific criteria
            </p>
          </div>
          <SearchForm onSearch={handleSearch} />
          <ResultsList papers={papers} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;