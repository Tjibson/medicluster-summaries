import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface SearchCriteria {
  population: string;
  disease: string;
  medicine: string;
  working_mechanism: string;
  patientCount: string;
  trialType: string;
  journal: string;
}

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
}

interface Journal {
  id: string;
  name: string;
}

interface TrialType {
  id: string;
  name: string;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    population: "",
    disease: "",
    medicine: "",
    working_mechanism: "",
    patientCount: "",
    trialType: "",
    journal: "",
  });

  const [journals, setJournals] = useState<Journal[]>([]);
  const [trialTypes, setTrialTypes] = useState<TrialType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: journalData } = await supabase
        .from("medical_journals")
        .select("*")
        .order("name");
      
      const { data: trialTypeData } = await supabase
        .from("trial_types")
        .select("*")
        .order("name");

      if (journalData) setJournals(journalData);
      if (trialTypeData) setTrialTypes(trialTypeData);
    };

    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="population">Demographic Characteristics</Label>
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
            <Select
              value={criteria.trialType}
              onValueChange={(value) =>
                setCriteria({ ...criteria, trialType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trial type" />
              </SelectTrigger>
              <SelectContent>
                {trialTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="journal">Medical Journal</Label>
            <Select
              value={criteria.journal}
              onValueChange={(value) =>
                setCriteria({ ...criteria, journal: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select journal" />
              </SelectTrigger>
              <SelectContent>
                {journals.map((journal) => (
                  <SelectItem key={journal.id} value={journal.name}>
                    {journal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" className="w-full">
          Search Papers
        </Button>
      </form>
    </Card>
  );
}