import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface SearchCriteria {
  population: string;
  disease: string;
  medicine: string;
  working_mechanism: string;
  patientCount: string;
  trialType: string;
}

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    population: "",
    disease: "",
    medicine: "",
    working_mechanism: "",
    patientCount: "",
    trialType: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="population">Population</Label>
            <Input
              id="population"
              placeholder="e.g., Adults 18-65"
              value={criteria.population}
              onChange={(e) =>
                setCriteria({ ...criteria, population: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disease">Disease</Label>
            <Input
              id="disease"
              placeholder="e.g., Type 2 Diabetes"
              value={criteria.disease}
              onChange={(e) =>
                setCriteria({ ...criteria, disease: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicine">Medicine</Label>
            <Input
              id="medicine"
              placeholder="e.g., Metformin"
              value={criteria.medicine}
              onChange={(e) =>
                setCriteria({ ...criteria, medicine: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mechanism">Working Mechanism</Label>
            <Input
              id="mechanism"
              placeholder="e.g., Insulin Sensitizer"
              value={criteria.working_mechanism}
              onChange={(e) =>
                setCriteria({ ...criteria, working_mechanism: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientCount">Minimum Patient Count</Label>
            <Input
              id="patientCount"
              type="number"
              placeholder="e.g., 100"
              value={criteria.patientCount}
              onChange={(e) =>
                setCriteria({ ...criteria, patientCount: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trialType">Trial Type</Label>
            <Input
              id="trialType"
              placeholder="e.g., RCT"
              value={criteria.trialType}
              onChange={(e) =>
                setCriteria({ ...criteria, trialType: e.target.value })
              }
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Search Papers
        </Button>
      </form>
    </Card>
  );
}