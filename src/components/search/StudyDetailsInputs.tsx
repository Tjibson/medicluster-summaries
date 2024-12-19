import { Input } from "@/components/ui/input"

interface StudyDetailsInputsProps {
  disease: string
  onDiseaseChange: (value: string) => void
  medicine: string
  onMedicineChange: (value: string) => void
  workingMechanism: string
  onWorkingMechanismChange: (value: string) => void
  patientCount: string
  onPatientCountChange: (value: string) => void
  trialType: string
  onTrialTypeChange: (value: string) => void
}

export function StudyDetailsInputs({
  disease,
  onDiseaseChange,
  medicine,
  onMedicineChange,
  workingMechanism,
  onWorkingMechanismChange,
  patientCount,
  onPatientCountChange,
  trialType,
  onTrialTypeChange,
}: StudyDetailsInputsProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Disease</label>
        <Input
          value={disease}
          onChange={(e) => onDiseaseChange(e.target.value)}
          placeholder="Enter disease"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Medicine</label>
        <Input
          value={medicine}
          onChange={(e) => onMedicineChange(e.target.value)}
          placeholder="Enter medicine"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Working Mechanism</label>
        <Input
          value={workingMechanism}
          onChange={(e) => onWorkingMechanismChange(e.target.value)}
          placeholder="Enter working mechanism"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Minimum Patient Count</label>
        <Input
          type="number"
          value={patientCount}
          onChange={(e) => onPatientCountChange(e.target.value)}
          placeholder="Enter minimum patient count"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Trial Type</label>
        <Input
          value={trialType}
          onChange={(e) => onTrialTypeChange(e.target.value)}
          placeholder="Enter trial type"
        />
      </div>
    </>
  )
}