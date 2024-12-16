import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface SearchHistory {
  id: string;
  population: string | null;
  disease: string | null;
  medicine: string | null;
  working_mechanism: string | null;
  patient_count: number | null;
  trial_type: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("search_history")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSearchHistory(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch search history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchHistory();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Search History</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            New Search
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : searchHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No search history found</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchHistory.map((search) => (
              <Card key={search.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {search.disease || "General Search"}
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    {search.population && (
                      <div>
                        <dt className="font-medium">Population:</dt>
                        <dd>{search.population}</dd>
                      </div>
                    )}
                    {search.medicine && (
                      <div>
                        <dt className="font-medium">Medicine:</dt>
                        <dd>{search.medicine}</dd>
                      </div>
                    )}
                    {search.working_mechanism && (
                      <div>
                        <dt className="font-medium">Working Mechanism:</dt>
                        <dd>{search.working_mechanism}</dd>
                      </div>
                    )}
                    {search.patient_count && (
                      <div>
                        <dt className="font-medium">Patient Count:</dt>
                        <dd>{search.patient_count}</dd>
                      </div>
                    )}
                    {search.trial_type && (
                      <div>
                        <dt className="font-medium">Trial Type:</dt>
                        <dd>{search.trial_type}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;