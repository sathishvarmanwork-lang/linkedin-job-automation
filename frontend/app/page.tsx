"use client";

import { useState } from "react";

type ViewState = "form" | "loading" | "results" | "skills-loading" | "skills-results";

interface EvaluationResult {
  result: string;
  score: number;
  decision: string;
}

export default function Home() {
  const [view, setView] = useState<ViewState>("form");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [skillsGap, setSkillsGap] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError("Job description is required");
      return;
    }

    setError("");
    setView("loading");

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDescription.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setEvaluation(data);
      setView("results");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setView("form");
    }
  }

  function handleBack() {
    setView("form");
    setEvaluation(null);
    setSkillsGap(null);
  }

  async function handleSkillsGap() {
    setView("skills-loading");

    try {
      const res = await fetch("/api/skills-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDescription.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Skills gap analysis failed");
      }

      setSkillsGap(data.result);
      setView("skills-results");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setView("results");
    }
  }

  if (view === "skills-results" && skillsGap) {
    return (
      <div className="flex flex-1 justify-center py-10">
        <div className="w-full max-w-2xl px-6">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Skills Gap Analysis
          </h2>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {skillsGap}
            </pre>
          </div>

          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            Logged to Upskilling Tracker
          </p>

          <div className="mt-6">
            <button
              onClick={() => setView("results")}
              className="w-full rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "skills-loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl px-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Analyzing skills gap against your database...
          </p>
        </div>
      </div>
    );
  }

  if (view === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl px-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Evaluating job against your parameters...
          </p>
        </div>
      </div>
    );
  }

  if (view === "results" && evaluation) {
    const isApply = evaluation.decision === "APPLY";

    return (
      <div className="flex flex-1 justify-center py-10">
        <div className="w-full max-w-2xl px-6">
          <div
            className={`mb-6 rounded-lg border p-4 text-center ${
              isApply
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                isApply
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {evaluation.decision}
            </p>
            <p
              className={`mt-1 text-lg ${
                isApply
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              Score: {evaluation.score}/100
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {evaluation.result}
            </pre>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={handleSkillsGap}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Write CV & Log Skill Gap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-2xl px-6">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          LinkedIn Job Automation
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium mb-1.5">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              rows={12}
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (error) setError("");
              }}
              className={`w-full resize-y rounded-md border px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 dark:bg-zinc-900 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100 ${
                error
                  ? "border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Evaluate Job
          </button>
        </form>
      </div>
    </div>
  );
}
