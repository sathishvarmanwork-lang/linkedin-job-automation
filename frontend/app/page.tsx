"use client";

import { useState } from "react";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError("Job description is required");
      return;
    }

    setError("");

    // TODO: Wire to backend pipeline
    console.log({ jobDescription: jobDescription.trim() });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl px-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
            <p className="text-lg font-medium text-green-800 dark:text-green-200">
              Job submitted successfully
            </p>
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Processing will begin shortly.
            </p>
            <button
              onClick={() => {
                setJobDescription("");
                setSubmitted(false);
                setError("");
              }}
              className="mt-4 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              Submit another job
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
