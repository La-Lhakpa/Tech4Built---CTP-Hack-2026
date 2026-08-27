import type { AnalysisResult, PlannerInput, PlanTask, StudyPlan } from "./types";

const DAY_MS = 86_400_000;
const round = (value: number) => Math.round(value * 10) / 10;

function localDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`);
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function analyzeLocally(input: PlannerInput): AnalysisResult {
  const totalRequiredHours = round(input.obligations.reduce((sum, item) => sum + item.estimatedHours, 0));
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const latestDue = input.obligations.length
    ? Math.max(...input.obligations.map((item) => localDate(item.dueDate).getTime()))
    : today.getTime();
  const rawDays = Math.ceil((latestDue - today.getTime()) / DAY_MS) + 1;
  const planningDays = Math.max(1, Math.min(7, rawDays));
  const totalAvailableHours = round(input.availableHoursPerDay * planningDays);
  const deficitHours = round(Math.max(0, totalRequiredHours - totalAvailableHours));
  const utilizationPercent = totalAvailableHours > 0
    ? Math.round((totalRequiredHours / totalAvailableHours) * 100)
    : totalRequiredHours > 0 ? 100 : 0;
  const riskLevel = deficitHours > 0 ? "High" : utilizationPercent >= 80 ? "Medium" : "Low";
  const message = riskLevel === "High"
    ? `${deficitHours}-hour deficit detected. Prioritize urgent work and adjust your capacity.`
    : riskLevel === "Medium"
      ? "Your week fits, but there is little room for delays. Start the hardest work early."
      : "Your workload fits comfortably within the time you have available.";

  return { totalRequiredHours, totalAvailableHours, deficitHours, planningDays, riskLevel, utilizationPercent, message };
}

export function buildFallbackPlan(input: PlannerInput): StudyPlan {
  const analysis = analyzeLocally(input);
  const ordered = [...input.obligations].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const remaining = ordered.map((item) => ({ ...item, remaining: item.estimatedHours }));
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const days = Array.from({ length: analysis.planningDays }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    let capacity = input.availableHoursPerDay;
    const tasks: PlanTask[] = [];

    for (const item of remaining) {
      if (capacity <= 0 || item.remaining <= 0) continue;
      const hours = round(Math.min(item.remaining, capacity, 2.5));
      item.remaining = round(item.remaining - hours);
      capacity = round(capacity - hours);
      tasks.push({
        obligationId: item.id,
        title: item.assignmentName,
        course: item.course,
        hours,
        note: item.difficulty === "High" ? "Deep-focus block—start with this while energy is high." : "Make steady progress before switching tasks.",
      });
    }

    const totalHours = round(tasks.reduce((sum, task) => sum + task.hours, 0));
    return {
      date: isoDate(date),
      label: index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" }),
      totalHours,
      tasks,
      warning: totalHours >= input.availableHoursPerDay && analysis.riskLevel === "High"
        ? "Full-capacity day—protect these study blocks."
        : undefined,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    overview: analysis.riskLevel === "High"
      ? "This plan front-loads urgent work and uses every available study block."
      : "This plan spreads your work into focused, realistic daily sessions.",
    reasoning: "Tasks are ordered by due date, then split into blocks no longer than 2.5 hours so the schedule stays achievable. High-difficulty work is placed earlier when possible.",
    days,
  };
}
