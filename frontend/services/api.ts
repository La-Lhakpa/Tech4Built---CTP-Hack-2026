import { analyzeLocally, buildFallbackPlan } from "@/lib/planner";
import type { AnalysisResult, PlannerInput, StudyPlan } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function post<T>(path: string, body: PlannerInput): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function analyzeWorkload(input: PlannerInput): Promise<AnalysisResult> {
  if (!API_BASE_URL) return analyzeLocally(input);
  try {
    return await post<AnalysisResult>("/api/analysis", input);
  } catch {
    return analyzeLocally(input);
  }
}

export async function generateStudyPlan(input: PlannerInput): Promise<StudyPlan> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return buildFallbackPlan(input);
  }
  try {
    return await post<StudyPlan>("/api/plan", input);
  } catch {
    return buildFallbackPlan(input);
  }
}
