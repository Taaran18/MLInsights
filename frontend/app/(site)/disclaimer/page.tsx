import type { Metadata } from "next";
import Link from "next/link";
import {
  ChartColumn,
  FlaskConical,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { ContactLine } from "@/components/site/ContactLine";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

const description =
  "Important limits on MLInsights results: why model metrics are estimates, and why they shouldn't replace professional advice.";

export const metadata: Metadata = {
  title: "Disclaimer",
  description,
  alternates: { canonical: "/disclaimer" },
  openGraph: {
    title: "Disclaimer · MLInsights",
    description,
    url: "/disclaimer",
  },
};

const sections: LegalSection[] = [
  {
    id: "no-professional-advice",
    title: "Not Professional Advice",
    content: (
      <p>
        MLInsights is an educational and exploratory tool. Nothing it produces
        is financial, medical, legal, or any other kind of professional advice.
        For decisions in those areas, consult a qualified professional.
      </p>
    ),
  },
  {
    id: "estimates",
    title: "Results Are Estimates",
    content: (
      <>
        <p>
          Model metrics are measured on a held-out portion of your data and
          checked with cross-validation where possible. They estimate how a
          model might perform, but they aren&apos;t guarantees. Real-world
          performance can be very different, especially when:
        </p>
        <ul>
          <li>
            The dataset is small, unbalanced, or doesn&apos;t represent real
            conditions.
          </li>
          <li>
            A column leaks information about the target, making scores look too
            good.
          </li>
          <li>
            The data changes over time, so patterns from the past stop holding.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "recommendations",
    title: "Automated Recommendations",
    content: (
      <p>
        Suggested target columns, task types, and recommended models are based
        on simple rules about column names, value counts, and dataset size.
        They&apos;re a helpful starting point, not an assessment of which model
        is best for your problem.
      </p>
    ),
  },
  {
    id: "data-quality",
    title: "Data Quality and Cleaning",
    content: (
      <p>
        Results depend entirely on the data you provide and the cleaning choices
        you make. Filling or dropping missing values changes your data, and
        those changes affect every result that follows. Review cleaned data
        before relying on it.
      </p>
    ),
  },
  {
    id: "exported-models",
    title: "Exported Model Files",
    content: (
      <>
        <p>
          Exported models are provided as-is for further analysis. Test them
          thoroughly on new data before using them in any real system.
        </p>
        <p>
          Model files use Python&apos;s pickle format, which can run code when
          loaded. Only load .pkl files you created yourself or that come from a
          source you trust.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability",
    content: (
      <p>
        MLInsights may be unavailable at times, and uploaded data expires
        automatically. Keep your own copies of anything important, and export
        results you want to keep.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: (
      <p>
        You use MLInsights and its results at your own risk. See the{" "}
        <Link href="/terms">Terms of Service</Link> for the full limitation of
        liability.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: <ContactLine topic="this disclaimer" />,
  },
];

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      path="/disclaimer"
      description={description}
      highlights={[
        {
          icon: <ChartColumn aria-hidden="true" />,
          title: "Estimates, Not Guarantees",
          description: "Metrics describe a test split, not the future.",
        },
        {
          icon: <Stethoscope aria-hidden="true" />,
          title: "Not Professional Advice",
          description:
            "Consult an expert for medical, legal, or financial decisions.",
        },
        {
          icon: <FlaskConical aria-hidden="true" />,
          title: "Validate Before Use",
          description:
            "Test exported models on new data before relying on them.",
        },
        {
          icon: <ShieldAlert aria-hidden="true" />,
          title: "Load Trusted Files Only",
          description:
            "Pickle files can run code, so only load ones you trust.",
        },
      ]}
      sections={sections}
    />
  );
}
