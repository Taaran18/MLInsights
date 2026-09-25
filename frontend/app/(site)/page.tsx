import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ChartColumn,
  ChevronDown,
  CloudUpload,
  Database,
  Download,
  EyeOff,
  FileBraces,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitCompareArrows,
  Layers,
  LockKeyhole,
  Package,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash,
  WandSparkles,
} from "lucide-react";
import { CountUp } from "@/components/site/CountUp";
import { HeroPreview } from "@/components/site/HeroPreview";
import { ButtonLink } from "@/components/ui/Button";
import { revealDelay, SectionHeading } from "@/components/ui/Layout";
import {
  AUTHOR_NAME,
  MAX_UPLOAD_MB,
  MODEL_COUNTS,
  REPO_URL,
  SESSION_TTL_HOURS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TOTAL_MODELS,
} from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: "MLInsights: Train and Compare ML Models From Any Spreadsheet",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const STATS = [
  { value: TOTAL_MODELS, suffix: "", label: "Built-In Models" },
  { value: 3, suffix: "", label: "Learning Tasks" },
  { value: 4, suffix: "", label: "Export Formats" },
  { value: 0, suffix: "", label: "Lines of Code Needed" },
];

const FEATURES = [
  {
    icon: Database,
    title: "Instant Dataset Insights",
    description:
      "See rows, columns, data types, summary statistics, value counts, and a correlation heatmap the moment your file finishes uploading.",
  },
  {
    icon: WandSparkles,
    title: "Smart Data Cleaning",
    description:
      "Find missing values column by column, preview exactly what a fix will change, and apply it in one step. Your original data is always kept.",
  },
  {
    icon: BrainCircuit,
    title: `${TOTAL_MODELS} Models, Recommended for You`,
    description:
      "Pick classification, regression, or clustering and get a shortlist tuned to your dataset's size, from Logistic Regression to XGBoost.",
  },
  {
    icon: Gauge,
    title: "Honest Training Progress",
    description:
      "Watch each model train with real, measured timings. Stop after the current model at any time, and see exactly why a model failed.",
  },
  {
    icon: GitCompareArrows,
    title: "Side-by-Side Comparison",
    description:
      "Rank models on any metric in a leaderboard, bar chart, or radar chart, with the best score in every column highlighted for you.",
  },
  {
    icon: Download,
    title: "One-Click Export",
    description:
      "Download a PDF report, the cleaned dataset, session metadata, and every trained model as a ready-to-load .pkl file.",
  },
];

const STEPS = [
  {
    icon: CloudUpload,
    title: "Upload Your Data",
    description: `Drop in a CSV or Excel file up to ${MAX_UPLOAD_MB} MB, or try a bundled sample dataset. No sign-up required.`,
  },
  {
    icon: ChartColumn,
    title: "Explore and Clean",
    description:
      "Review statistics and missing values, then preview and apply cleaning until your data is ready to model.",
  },
  {
    icon: BrainCircuit,
    title: "Train and Compare",
    description:
      "Choose a target column, accept the recommended models or pick your own, and compare every result side by side.",
  },
  {
    icon: Download,
    title: "Export Everything",
    description:
      "Download the full PDF report, the cleaned dataset, and trained models to use in your own projects.",
  },
];

const MODEL_GROUPS = [
  {
    icon: Layers,
    label: "Classification",
    count: MODEL_COUNTS.classification,
    description:
      "Predict a category, such as churn or no churn, spam or not spam.",
    items: [
      "Logistic Regression",
      "Random Forest",
      "XGBoost",
      "LightGBM",
      "CatBoost",
      "SVM",
      "KNN",
      "Naive Bayes",
      "MLP",
      "Stacking",
    ],
  },
  {
    icon: ChartColumn,
    label: "Regression",
    count: MODEL_COUNTS.regression,
    description:
      "Predict a number, such as a price, a demand forecast, or a score.",
    items: [
      "Linear",
      "Ridge",
      "Lasso",
      "ElasticNet",
      "Random Forest",
      "Gradient Boosting",
      "XGBoost",
      "LightGBM",
      "SVR",
      "Huber",
    ],
  },
  {
    icon: Sparkles,
    label: "Clustering",
    count: MODEL_COUNTS.clustering,
    description: "Discover natural groups in data that has no labels at all.",
    items: [
      "K-Means",
      "Mini-Batch K-Means",
      "DBSCAN",
      "Agglomerative",
      "Spectral",
      "BIRCH",
      "OPTICS",
      "Gaussian Mixture",
    ],
  },
];

const MARQUEE = [
  "Logistic Regression",
  "Random Forest",
  "Gradient Boosting",
  "HistGradient Boosting",
  "XGBoost",
  "LightGBM",
  "CatBoost",
  "Support Vector Machines",
  "K-Nearest Neighbors",
  "Naive Bayes",
  "Linear Discriminant Analysis",
  "Gaussian Process",
  "MLP Neural Network",
  "Stacking Ensembles",
  "Voting Ensembles",
  "Ridge and Lasso",
  "ElasticNet",
  "Huber and RANSAC",
  "K-Means",
  "DBSCAN",
  "Spectral Clustering",
  "BIRCH",
  "OPTICS",
];

const EXPORTS = [
  {
    icon: FileText,
    title: "PDF Report",
    format: ".pdf",
    description:
      "Dataset overview, missing values, and every model's metrics in one shareable document.",
  },
  {
    icon: FileSpreadsheet,
    title: "Cleaned Dataset",
    format: ".csv / .xlsx",
    description:
      "Your data after cleaning, in the same format you uploaded, ready for other tools.",
  },
  {
    icon: FileBraces,
    title: "Session Metadata",
    format: ".json",
    description:
      "Settings, features, targets, and results for every model, in a machine-readable file.",
  },
  {
    icon: Package,
    title: "Trained Models",
    format: ".zip of .pkl",
    description:
      "Every fitted model, including its scaler, plus a manifest describing the expected inputs.",
  },
];

const PRIVACY_POINTS = [
  {
    icon: LockKeyhole,
    title: "No Account, No Tracking",
    description:
      "There's nothing to sign up for, and the site runs no analytics or advertising trackers.",
  },
  {
    icon: Timer,
    title: `Expires After ${SESSION_TTL_HOURS} Hours`,
    description: `Uploaded files are kept only so you can keep working. After ${SESSION_TTL_HOURS} hours they expire and are permanently erased.`,
  },
  {
    icon: Trash,
    title: "Delete Anytime",
    description:
      "Remove one dataset or all of them instantly from Settings, without waiting for expiry.",
  },
  {
    icon: EyeOff,
    title: "Never Sold or Shared",
    description:
      "Your data is used only to run the analysis you ask for. It's never sold or used to train anything else.",
  },
];

const FAQS = [
  {
    question: "Do I need to write any code?",
    answer:
      "No. Everything happens in a visual interface: upload a spreadsheet, review insights, clean the data, and train models with a few clicks. No Python or notebooks required.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Each upload creates a private session linked to your browser. You can manage or delete your sessions at any time from Settings.",
  },
  {
    question: "What file formats and sizes are supported?",
    answer: `CSV, XLSX, and XLS files up to ${MAX_UPLOAD_MB} MB. Comma, semicolon, tab, and pipe-separated CSV files are all detected automatically.`,
  },
  {
    question: "How long is my data kept?",
    answer: `Your data expires ${SESSION_TTL_HOURS} hours after upload. Expired data can't be opened again and is permanently erased by automatic cleanup. You can delete it sooner at any time from Settings.`,
  },
  {
    question: "How does MLInsights choose which models to recommend?",
    answer:
      "Recommendations depend on the task you pick and the size of your dataset. Small datasets get models that work well with less data; large datasets get models that scale, such as LightGBM and XGBoost.",
  },
  {
    question: "Can I use the trained models outside MLInsights?",
    answer:
      "Yes. Export the models ZIP to get each fitted model as a .pkl file you can load with joblib in Python, plus a manifest listing the columns each model expects.",
  },
  {
    question: "Are the results reliable enough for real decisions?",
    answer:
      "Metrics are measured on a held-out test split and checked with cross-validation, but they're estimates. Treat them as a strong starting point and validate important decisions with a domain expert.",
  },
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-US",
        publisher: { "@id": `${SITE_URL}/#author` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#author`,
        name: AUTHOR_NAME,
        sameAs: [REPO_URL],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: `${SITE_URL}/app`,
        description: SITE_DESCRIPTION,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Machine Learning",
        operatingSystem: "Web browser",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: FEATURES.map((feature) => feature.title),
        author: { "@id": `${SITE_URL}/#author` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />

      <section
        className="relative -mt-16 overflow-hidden pt-16"
        aria-labelledby="hero-title"
      >
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 size-168 -translate-x-[70%] animate-float rounded-full bg-[var(--glow)] blur-[120px]" />
        <div className="pointer-events-none absolute -top-24 left-1/2 size-136 translate-x-[5%] animate-float rounded-full bg-[var(--glow-2)] blur-[120px] [animation-delay:-7s]" />
        <div className="pointer-events-none absolute top-112 left-1/2 size-120 -translate-x-1/2 rounded-full bg-[var(--glow-3)] blur-[130px]" />

        <div className="container-wide relative pt-16 pb-20 text-center sm:pt-24 lg:pt-28 lg:pb-28">
          <div data-reveal="fade" className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-surface/70 px-4 py-1.5 text-sm font-medium text-fg-muted shadow-card backdrop-blur">
              <Sparkles className="size-4 text-brand" aria-hidden="true" />
              No Code · No Account · {TOTAL_MODELS} Models
            </span>
          </div>

          <h1
            id="hero-title"
            data-reveal
            style={revealDelay(1)}
            className="mx-auto mt-7 max-w-6xl text-hero font-extrabold text-fg"
          >
            Turn Raw Spreadsheets Into{" "}
            <span className="text-gradient">Trained ML Models</span> in Minutes
          </h1>

          <p
            data-reveal
            style={revealDelay(2)}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-fg-muted sm:text-xl"
          >
            Upload a CSV or Excel file, explore and clean it, then train and
            compare up to {TOTAL_MODELS} machine-learning models side by side.
            Export the full report when you&apos;re done.
          </p>

          <div
            data-reveal
            style={revealDelay(3)}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <ButtonLink href="/app" size="lg" className="w-full sm:w-auto">
              <CloudUpload aria-hidden="true" />
              Analyze Your Data
            </ButtonLink>
            <ButtonLink
              href="/#how-it-works"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              See How It Works
            </ButtonLink>
          </div>

          <ul
            data-reveal
            style={revealDelay(4)}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-fg-muted"
          >
            {[
              { icon: ShieldCheck, text: "No account needed" },
              {
                icon: Timer,
                text: `Data expires after ${SESSION_TTL_HOURS} hours`,
              },
              { icon: Download, text: "Export PDF, data, and models" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2">
                <Icon className="size-4 text-success" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <div
            data-reveal="scale"
            style={revealDelay(5)}
            className="mx-auto mt-16 max-w-5xl lg:mt-20"
          >
            <HeroPreview />
          </div>
        </div>
      </section>

      <section
        className="section-alt border-y border-border"
        aria-label="MLInsights at a glance"
      >
        <div className="container-wide">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                data-reveal
                style={revealDelay(index)}
                className="flex flex-col items-center gap-1 border-b border-border px-4 py-10 text-center odd:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
              >
                <dt className="order-2 text-sm font-medium text-fg-muted">
                  {stat.label}
                </dt>
                <dd className="order-1 text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="features"
        className="py-24 lg:py-32"
        aria-labelledby="features-title"
      >
        <div className="container-wide">
          <SectionHeading
            id="features-title"
            eyebrow="Features"
            title="Everything You Need to Go From Data to Decisions"
            description="A complete machine-learning workflow in your browser: insights, cleaning, training, comparison, and export, all in one place."
          />
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-6">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <div key={title} data-reveal style={revealDelay(index % 3)}>
                <article className="group h-full rounded-2xl border border-border bg-surface p-7 shadow-card transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-1 hover:border-brand-line hover:shadow-card-hover">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-fg">
                    {title}
                  </h3>
                  <p className="mt-2.5 leading-relaxed text-fg-muted">
                    {description}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="section-alt border-y border-border py-24 lg:py-32"
        aria-labelledby="how-title"
      >
        <div className="container-wide">
          <SectionHeading
            id="how-title"
            eyebrow="How It Works"
            title="From Upload to Insight in Four Steps"
            description="No setup, no installs, and no notebooks. Every step explains what it's doing and what to do next."
          />
          <div className="relative mt-16 lg:mt-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-12 right-[12%] left-[12%] hidden h-px bg-linear-to-r from-transparent via-brand-line to-transparent lg:block"
            />
            <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <li
                  key={title}
                  data-reveal
                  style={revealDelay(index, 120)}
                  className="relative"
                >
                  <div className="h-full rounded-2xl border border-border bg-surface p-7 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className="num inline-flex size-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-on-primary shadow-[0_8px_20px_-8px_rgb(234_88_12/0.8)]">
                        {index + 1}
                      </span>
                      <Icon className="size-5 text-brand" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold tracking-tight text-fg">
                      {title}
                    </h3>
                    <p className="mt-2.5 leading-relaxed text-fg-muted">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        id="models"
        className="py-24 lg:py-32"
        aria-labelledby="models-title"
      >
        <div className="container-wide">
          <SectionHeading
            id="models-title"
            eyebrow="Model Library"
            title={`${TOTAL_MODELS} Models, Recommended for Your Data`}
            description="Choose what you want to predict and MLInsights suggests the models most likely to work well for a dataset of your size."
          />
          <div className="mt-16 grid gap-5 lg:mt-20 lg:grid-cols-3 lg:gap-6">
            {MODEL_GROUPS.map(
              ({ icon: Icon, label, count, description, items }, index) => (
                <div key={label} data-reveal style={revealDelay(index, 120)}>
                  <article className="h-full rounded-2xl border border-border bg-surface p-7 shadow-card">
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex size-12 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
                        <Icon className="size-5.5" aria-hidden="true" />
                      </span>
                      <span className="num text-4xl font-extrabold tracking-tight text-fg">
                        {count}
                      </span>
                    </div>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-fg">
                      {label}
                    </h3>
                    <p className="mt-2 leading-relaxed text-fg-muted">
                      {description}
                    </p>
                    <ul
                      className="mt-6 flex flex-wrap gap-2"
                      aria-label={`Example ${label.toLowerCase()} models`}
                    >
                      {items.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-fg-muted"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              ),
            )}
          </div>
          <div className="marquee mt-12 overflow-hidden" aria-hidden="true">
            <div className="marquee-track">
              {[...MARQUEE, ...MARQUEE].map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium whitespace-nowrap text-fg-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="section-alt border-y border-border py-24 lg:py-32"
        aria-labelledby="exports-title"
      >
        <div className="container-wide">
          <SectionHeading
            id="exports-title"
            eyebrow="Exports"
            title="Take Every Result With You"
            description="Everything you create in MLInsights can be downloaded and reused, from a polished report to production-ready model files."
          />
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-6">
            {EXPORTS.map(
              ({ icon: Icon, title, format, description }, index) => (
                <div key={title} data-reveal style={revealDelay(index)}>
                  <article className="h-full rounded-2xl border border-border bg-surface p-7 shadow-card">
                    <span className="inline-flex size-12 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
                      <Icon className="size-5.5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-xl font-bold tracking-tight text-fg">
                      {title}
                    </h3>
                    <p className="num mt-1 text-sm font-semibold text-brand">
                      {format}
                    </p>
                    <p className="mt-3 leading-relaxed text-fg-muted">
                      {description}
                    </p>
                  </article>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="privacy"
        className="py-24 lg:py-32"
        aria-labelledby="privacy-title"
      >
        <div className="container-wide">
          <SectionHeading
            id="privacy-title"
            eyebrow="Privacy by Design"
            title="Your Data Stays Yours"
            description="MLInsights collects only what it needs to run your analysis, and keeps it only as long as you need it."
          />
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-6">
            {PRIVACY_POINTS.map(({ icon: Icon, title, description }, index) => (
              <div key={title} data-reveal style={revealDelay(index)}>
                <article className="h-full rounded-2xl border border-border bg-surface p-7 shadow-card">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl border border-success-line bg-success-soft text-success">
                    <Icon className="size-5.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-fg">
                    {title}
                  </h3>
                  <p className="mt-2.5 leading-relaxed text-fg-muted">
                    {description}
                  </p>
                </article>
              </div>
            ))}
          </div>
          <p data-reveal className="mt-10 text-center text-sm text-fg-muted">
            Read the full{" "}
            <Link
              href="/privacy"
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            to see exactly what&apos;s stored, where, and for how long.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="section-alt border-y border-border py-24 lg:py-32"
        aria-labelledby="faq-title"
      >
        <div className="container-wide">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Quick answers about how MLInsights works, what it supports, and how your data is handled."
          />
          <div className="mx-auto mt-14 max-w-3xl space-y-3 lg:mt-16">
            {FAQS.map((item, index) => (
              <div
                key={item.question}
                data-reveal
                style={revealDelay(index % 4, 60)}
              >
                <details className="faq-item group rounded-2xl border border-border bg-surface shadow-card transition-colors open:border-brand-line">
                  <summary className="flex list-none items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-fg sm:text-lg">
                    {item.question}
                    <ChevronDown
                      className="size-5 shrink-0 text-fg-subtle transition-transform duration-300 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-6 pb-6 leading-relaxed text-fg-muted">
                    {item.answer}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32" aria-labelledby="cta-title">
        <div className="container-wide">
          <div
            data-reveal="scale"
            className="relative overflow-hidden rounded-3xl border border-brand-line bg-linear-to-br from-orange-600 via-orange-700 to-red-800 px-6 py-16 text-center shadow-[0_40px_80px_-40px_rgb(234_88_12/0.7)] sm:px-12 lg:py-24"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(255_255_255/0.18),transparent)]" />
            <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] [background-size:48px_48px]" />
            <div className="relative">
              <h2
                id="cta-title"
                className="mx-auto max-w-3xl text-section font-extrabold text-white"
              >
                Ready to See What Your Data Can Do?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-orange-50">
                Upload a dataset and get insights, trained models, and a full
                report in minutes. No account and no setup.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-orange-800 shadow-lg transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Start Your First Analysis
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-white/30 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  Read the Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
