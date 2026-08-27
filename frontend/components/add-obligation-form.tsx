"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Plus } from "lucide-react";
import type { Difficulty, Obligation, ObligationType } from "@/lib/types";

interface Props { onAdd: (obligation: Obligation) => void; }

const initialForm = { course: "", assignmentName: "", dueDate: "", estimatedHours: "", difficulty: "Medium" as Difficulty, type: "Assignment" as ObligationType };

export default function AddObligationForm({ onAdd }: Props) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.course.trim()) nextErrors.course = "Enter a course name.";
    if (!form.assignmentName.trim()) nextErrors.assignmentName = "Enter an assignment name.";
    if (!form.dueDate) nextErrors.dueDate = "Choose a due date.";
    if (!form.estimatedHours || Number(form.estimatedHours) <= 0) nextErrors.estimatedHours = "Enter at least 0.5 hours.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onAdd({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      ...form,
      course: form.course.trim(),
      assignmentName: form.assignmentName.trim(),
      estimatedHours: Number(form.estimatedHours),
    });
    setForm(initialForm);
  }

  const set = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <form onSubmit={submit} className="surface-card grid gap-5 p-6 sm:grid-cols-2 sm:p-8" noValidate>
      <Field label="Course" error={errors.course}><input className="field-input" value={form.course} onChange={(e) => set("course", e.target.value)} placeholder="e.g. Computer Science 101" /></Field>
      <Field label="Assignment name" error={errors.assignmentName}><input className="field-input" value={form.assignmentName} onChange={(e) => set("assignmentName", e.target.value)} placeholder="e.g. Algorithms project" /></Field>
      <Field label="Due date" error={errors.dueDate}><div className="input-icon"><CalendarDays size={17} /><input className="field-input pl-10" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></div></Field>
      <Field label="Estimated hours" error={errors.estimatedHours}><div className="relative"><input className="field-input pr-16" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(e) => set("estimatedHours", e.target.value)} placeholder="4" /><span className="input-suffix">hours</span></div></Field>
      <Field label="Difficulty"><select className="field-input" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></Field>
      <Field label="Type"><select className="field-input" value={form.type} onChange={(e) => set("type", e.target.value)}><option>Assignment</option><option>Exam</option><option>Project</option><option>Reading</option><option>Other</option></select></Field>
      <button className="primary-button mt-1 sm:col-span-2" type="submit"><Plus size={18} /> Add obligation</button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="field-label">{label}{children}{error && <span className="text-xs font-medium text-[#b33a2f]" role="alert">{error}</span>}</label>;
}
