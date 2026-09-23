import type { Metadata } from "next";
import Link from "next/link";
import { Ban, FileCheck2, Gift, Timer } from "lucide-react";
import { ContactLine } from "@/components/site/ContactLine";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { REPO_URL, SESSION_TTL_HOURS } from "@/lib/site";

const description =
  "The rules for using MLInsights: what you can expect from the service, what's expected of you, and the limits of our responsibility.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service · MLInsights",
    description,
    url: "/terms",
  },
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of These Terms",
    content: (
      <p>
        By using MLInsights, you agree to these Terms of Service and to our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you don&apos;t agree,
        please don&apos;t use the service.
      </p>
    ),
  },
  {
    id: "the-service",
    title: "The Service",
    content: (
      <>
        <p>
          MLInsights is a free tool that lets you upload tabular data, explore
          and clean it, train machine-learning models, and export the results.
          No account is required.
        </p>
        <p>
          We may add, change, or remove features at any time, and we may limit
          usage to keep the service available for everyone.
        </p>
      </>
    ),
  },
  {
    id: "your-data",
    title: "Your Data and Responsibilities",
    content: (
      <>
        <p>
          You keep all rights to the data you upload and to the results you
          create. You give us permission to store and process that data only as
          needed to provide the features you use.
        </p>
        <p>By uploading data, you confirm that:</p>
        <ul>
          <li>
            You have the right to use it, including any personal information it
            contains.
          </li>
          <li>
            Uploading it doesn&apos;t break any law, contract, or
            confidentiality obligation.
          </li>
          <li>
            It doesn&apos;t contain malware or content designed to harm the
            service.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: (
      <>
        <p>When using MLInsights, you agree not to:</p>
        <ul>
          <li>
            Attempt to disrupt, overload, or gain unauthorized access to the
            service.
          </li>
          <li>Access sessions or data that don&apos;t belong to you.</li>
          <li>
            Send automated, high-volume traffic that degrades the service for
            others.
          </li>
          <li>Use the service for anything unlawful, deceptive, or harmful.</li>
        </ul>
        <p>We may block access that violates these rules.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Availability and Data Retention",
    content: (
      <>
        <p>
          MLInsights is provided on an &ldquo;as available&rdquo; basis and may
          occasionally be slow or unavailable, for example while the analysis
          server starts up after being idle.
        </p>
        <p>
          Uploaded data and results expire {SESSION_TTL_HOURS} hours after
          upload and are then permanently deleted. MLInsights isn&apos;t a
          storage service, so export anything you want to keep.
        </p>
      </>
    ),
  },
  {
    id: "model-results",
    title: "Model Results",
    content: (
      <p>
        Model metrics and recommendations are statistical estimates produced
        automatically from your data. You&apos;re responsible for how you use
        them. Read the <Link href="/disclaimer">Disclaimer</Link> for important
        limits on their accuracy.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: (
      <p>
        The MLInsights name, design, and software belong to their creator. The
        source code is published on{" "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        . Reports, cleaned datasets, and model files you export are yours to use
        however you like.
      </p>
    ),
  },
  {
    id: "warranties",
    title: "No Warranties",
    content: (
      <p>
        The service is provided &ldquo;as is&rdquo;, without warranties of any
        kind, whether express or implied, including warranties of accuracy,
        reliability, fitness for a particular purpose, or non-infringement.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: (
      <p>
        To the fullest extent permitted by law, the creator of MLInsights
        isn&apos;t liable for any indirect, incidental, or consequential
        damages, or for any loss of data, profits, or business, arising from
        your use of the service or from decisions based on its results.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    content: (
      <p>
        We may update these terms from time to time. When we do, we&apos;ll
        change the &ldquo;Last updated&rdquo; date at the top. Continuing to use
        MLInsights after an update means you accept the revised terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: <ContactLine topic="these terms" />,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      path="/terms"
      description={description}
      highlights={[
        {
          icon: <Gift aria-hidden="true" />,
          title: "Free to Use",
          description: "No account, no subscription, and no payment details.",
        },
        {
          icon: <FileCheck2 aria-hidden="true" />,
          title: "Your Data Is Yours",
          description: "You keep all rights to your uploads and exports.",
        },
        {
          icon: <Timer aria-hidden="true" />,
          title: "Temporary Storage",
          description: `Data expires after ${SESSION_TTL_HOURS} hours, so export what you need.`,
        },
        {
          icon: <Ban aria-hidden="true" />,
          title: "Fair Use",
          description:
            "Don't disrupt the service or access data that isn't yours.",
        },
      ]}
      sections={sections}
    />
  );
}
