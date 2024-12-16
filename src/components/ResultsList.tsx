import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Star, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  abstract: string;
  pdfUrl?: string;
}

interface ResultsListProps {
  papers: Paper[];
  isLoading: boolean;
  searchCriteria?: {
    population?: string;
    disease?: string;
    medicine?: string;
    working_mechanism?: string;
    patientCount?: string;
    trialType?: string;
    journal?: string;
  };
}

export function ResultsList({ papers, isLoading, searchCriteria }: ResultsListProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const handleSavePaper = async (paper: Paper) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save papers",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("saved_papers").insert({
        user_id: userId,
        paper_id: paper.id,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Paper saved to your list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save paper",
        variant: "destructive",
      });
    }
  };

  const handleLikePaper = async (paper: Paper) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to like papers",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("saved_papers").insert({
        user_id: userId,
        paper_id: paper.id,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
        is_liked: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Paper added to likes",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like paper",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 relative overflow-hidden">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No papers found matching your criteria.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {searchCriteria && (
        <Card className="p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Search Criteria:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {searchCriteria.population && (
              <div>
                <span className="font-medium">Demographics:</span> {searchCriteria.population}
              </div>
            )}
            {searchCriteria.disease && (
              <div>
                <span className="font-medium">Disease:</span> {searchCriteria.disease}
              </div>
            )}
            {searchCriteria.medicine && (
              <div>
                <span className="font-medium">Medicine:</span> {searchCriteria.medicine}
              </div>
            )}
            {searchCriteria.working_mechanism && (
              <div>
                <span className="font-medium">Mechanism:</span> {searchCriteria.working_mechanism}
              </div>
            )}
            {searchCriteria.patientCount && (
              <div>
                <span className="font-medium">Min. Patients:</span> {searchCriteria.patientCount}
              </div>
            )}
            {searchCriteria.trialType && (
              <div>
                <span className="font-medium">Trial Type:</span> {searchCriteria.trialType}
              </div>
            )}
            {searchCriteria.journal && (
              <div>
                <span className="font-medium">Journal:</span> {searchCriteria.journal}
              </div>
            )}
          </div>
        </Card>
      )}
      {papers.map((paper) => (
        <Card key={paper.id} className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{paper.title}</h3>
              <p className="text-sm text-gray-600">
                {paper.authors.join(", ")} • {paper.journal} • {paper.year}
              </p>
              <p className="text-sm text-gray-500">
                Citations: {paper.citations}
              </p>
              <p className="mt-2 text-gray-700">{paper.abstract}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSavePaper(paper)}
                title="Add to List"
              >
                <List className="h-4 w-4" />
              </Button>
              {paper.pdfUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(paper.pdfUrl, '_blank')}
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleLikePaper(paper)}
                title="Like Paper"
              >
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}