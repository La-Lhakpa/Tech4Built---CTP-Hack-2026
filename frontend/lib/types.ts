export type Difficulty = "Low" | "Medium" | "High";
export type ObligationType = "Assignment" | "Exam" | "Project" | "Reading" | "Other";
export type RiskLevel = "Low" | "Medium" | "High";

export interface Obligation {
  id: string;
  course: string;
  assignmentName: string;
  dueDate: string;
  estimatedHours: number;
  difficulty: Difficulty;
  type: ObligationType;
}

export interface PlannerInput {
  obligations: Obligation[];
  availableHoursPerDay?: number;
  availabilityPerDay?: Record<string, number>;  // { "2026-08-27": 2, "2026-08-28": 3, ... }
}

export interface AnalysisResult {
  totalRequiredHours: number;
  totalAvailableHours: number;
  deficitHours: number;
  planningDays: number;
  riskLevel: RiskLevel;
  utilizationPercent: number;
  message: string;
}

export interface PlanTask {
  obligationId: string;
  title: string;
  course: string;
  hours: number;
  note: string;
}

export interface PlanDay {
  date: string;
  label: string;
  totalHours: number;
  tasks: PlanTask[];
  warning?: string;
}

export interface StudyPlan {
  generatedAt: string;
  overview: string;
  reasoning: string;
  days: PlanDay[];
}
