import { useState } from "react";
import { SearchForm, type SearchCriteria } from "@/components/SearchForm";
import { ResultsList, type Paper } from "@/components/ResultsList";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsLoading(true);
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
}

export default Index;