import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface SearchCriteria {
  population: string;
  continent: string;
  region: string;
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

const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

const REGIONS = {
  Africa: ["North Africa", "West Africa", "East Africa", "Southern Africa"],
  Asia: ["East Asia", "South Asia", "Southeast Asia", "Central Asia", "Middle East"],
  Europe: ["Western Europe", "Eastern Europe", "Northern Europe", "Southern Europe"],
  "North America": ["Northern America", "Central America", "Caribbean"],
  "South America": ["Northern South America", "Southern South America"],
  Oceania: ["Australia and New Zealand", "Melanesia", "Micronesia", "Polynesia"],
};

const DISEASES_MEDICINE_MAP = {
  "Type 2 Diabetes": {
    medicines: ["Metformin", "Sulfonylureas", "DPP-4 inhibitors"],
    mechanisms: ["Insulin Sensitizer", "Insulin Secretagogue", "Incretin Enhancer"],
  },
  Hypertension: {
    medicines: ["ACE inhibitors", "Beta blockers", "Calcium channel blockers"],
    mechanisms: ["ACE inhibition", "Beta-adrenergic blocking", "Calcium channel blocking"],
  },
  // Add more disease-medicine mappings as needed
};

export function SearchForm({ onSearch }: SearchFormProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    population: "",
    continent: "",
    region: "",
    disease: "",
    medicine: "",
    working_mechanism: "",
    patientCount: "",
    trialType: "",
    journal: "",
  });

  const [journals, setJournals] = useState<Journal[]>([]);
  const [trialTypes, setTrialTypes] = useState<TrialType[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

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

  useEffect(() => {
    if (criteria.continent) {
      setAvailableRegions(REGIONS[criteria.continent as keyof typeof REGIONS] || []);
    }
  }, [criteria.continent]);

  useEffect(() => {
    if (criteria.disease && DISEASES_MEDICINE_MAP[criteria.disease as keyof typeof DISEASES_MEDICINE_MAP]) {
      const diseaseInfo = DISEASES_MEDICINE_MAP[criteria.disease as keyof typeof DISEASES_MEDICINE_MAP];
      if (!criteria.medicine) {
        setCriteria(prev => ({
          ...prev,
          working_mechanism: diseaseInfo.mechanisms[0],
        }));
      }
    }
  }, [criteria.disease]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="continent">Continent</Label>
            <Select
              value={criteria.continent}
              onValueChange={(value) =>
                setCriteria({ ...criteria, continent: value, region: "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select continent" />
              </SelectTrigger>
              <SelectContent>
                {CONTINENTS.map((continent) => (
                  <SelectItem key={continent} value={continent}>
                    {continent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select
              value={criteria.region}
              onValueChange={(value) =>
                setCriteria({ ...criteria, region: value })
              }
              disabled={!criteria.continent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disease">Disease</Label>
            <Select
              value={criteria.disease}
              onValueChange={(value) =>
                setCriteria({ ...criteria, disease: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disease" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(DISEASES_MEDICINE_MAP).map((disease) => (
                  <SelectItem key={disease} value={disease}>
                    {disease}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine">Medicine</Label>
            <Select
              value={criteria.medicine}
              onValueChange={(value) =>
                setCriteria({ ...criteria, medicine: value })
              }
              disabled={!criteria.disease}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {criteria.disease &&
                  DISEASES_MEDICINE_MAP[criteria.disease as keyof typeof DISEASES_MEDICINE_MAP]?.medicines.map(
                    (medicine) => (
                      <SelectItem key={medicine} value={medicine}>
                        {medicine}
                      </SelectItem>
                    )
                  )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mechanism">Working Mechanism</Label>
            <Select
              value={criteria.working_mechanism}
              onValueChange={(value) =>
                setCriteria({ ...criteria, working_mechanism: value })
              }
              disabled={!criteria.disease}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mechanism" />
              </SelectTrigger>
              <SelectContent>
                {criteria.disease &&
                  DISEASES_MEDICINE_MAP[criteria.disease as keyof typeof DISEASES_MEDICINE_MAP]?.mechanisms.map(
                    (mechanism) => (
                      <SelectItem key={mechanism} value={mechanism}>
                        {mechanism}
                      </SelectItem>
                    )
                  )}
              </SelectContent>
            </Select>
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
