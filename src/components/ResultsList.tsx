import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Star } from "lucide-react";

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
}

export function ResultsList({ papers, isLoading }: ResultsListProps) {
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
              {paper.pdfUrl && (
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon">
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}