"use client";

import { useState } from "react";

type ViewState = "form" | "loading" | "results" | "processing" | "process-results";

interface EvaluationResult {
  result: string;
  score: number;
  decision: string;
}

interface ProcessResult {
  skillsGap: string;
  cvDocUrl: string;
  pdfBase64: string;
  pdfFilename: string;
  companyName: string;
  jobTitle: string;
  clickUpTaskUrl: string | null;
}

export default function Home() {
  const [view, setView] = useState<ViewState>("form");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);

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
    setProcessResult(null);
  }

  function handleDownloadPdf() {
    if (!processResult?.pdfBase64) return;
    const byteCharacters = atob(processResult.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = processResult.pdfFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleProcess() {
    setView("processing");

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDescription.trim(), jobUrl: jobUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Processing failed");
      }

      setProcessResult(data);
      setView("process-results");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setView("results");
    }
  }

  if (view === "process-results" && processResult) {
    return (
      <div className="flex flex-1 justify-center py-10">
        <div className="w-full max-w-2xl px-6">
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              CV created: {processResult.companyName} - {processResult.jobTitle}
            </p>
            <div className="mt-2 flex gap-3">
              <a
                href={processResult.cvDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
              >
                Open CV in Google Docs
              </a>
              <button
                onClick={handleDownloadPdf}
                className="text-sm font-medium text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
              >
                Download PDF
              </button>
            </div>
          </div>

          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Skills Gap Analysis
          </h2>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {processResult.skillsGap}
            </pre>
          </div>

          <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-400 dark:text-zinc-500">
            <p>Skills gap logged to Upskilling Tracker</p>
            {processResult.clickUpTaskUrl ? (
              <p>
                ClickUp task created:{" "}
                <a
                  href={processResult.clickUpTaskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  View task
                </a>
              </p>
            ) : (
              <p>ClickUp task: skipped (no job URL provided)</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setView("results")}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={() => {
                setView("form");
                setJobDescription("");
                setJobUrl("");
                setError("");
                setEvaluation(null);
                setProcessResult(null);
              }}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "processing") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl px-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Analyzing skills gap and generating CV...
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
              onClick={handleProcess}
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
            <label htmlFor="jobUrl" className="block text-sm font-medium mb-1.5">
              Job URL <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              id="jobUrl"
              type="url"
              placeholder="https://linkedin.com/jobs/view/..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100"
            />
          </div>

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
