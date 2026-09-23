function normalizeUrl(value: string | undefined, fallback: string): string {
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

export const SITE_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
);
export const API_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:8000",
);
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";

export const SITE_NAME = "MLInsights";
export const APP_VERSION = "2.0.0";
export const SITE_TAGLINE = "Automated Machine Learning for Any Spreadsheet";
export const SITE_DESCRIPTION =
  "Upload a CSV or Excel file to explore it, clean it, and train and compare 68 machine-learning models side by side. Export a PDF report, the cleaned dataset, and trained models. No code and no account needed.";
export const AUTHOR_NAME = "Taaran Jain";
export const REPO_URL = "https://github.com/Taaran18/MLInsights";

export const MODEL_COUNTS = {
  classification: 30,
  regression: 28,
  clustering: 10,
} as const;
export const TOTAL_MODELS =
  MODEL_COUNTS.classification +
  MODEL_COUNTS.regression +
  MODEL_COUNTS.clustering;

export const MAX_UPLOAD_MB = 50;
export const SESSION_TTL_HOURS = 24;
export const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

export const LEGAL_UPDATED = "September 23, 2026";
export const LEGAL_UPDATED_ISO = "2026-09-23";
