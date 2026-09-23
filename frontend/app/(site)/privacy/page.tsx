import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, LockKeyhole, Timer, Trash } from "lucide-react";
import { ContactLine } from "@/components/site/ContactLine";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { MAX_UPLOAD_MB, SESSION_TTL_HOURS } from "@/lib/site";

const description =
  "What MLInsights collects when you use it, how that information is used, how long it's kept, and how to delete it.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · MLInsights",
    description,
    url: "/privacy",
  },
};

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <p>
          MLInsights is a free web tool for exploring spreadsheets and training
          machine-learning models. It&apos;s designed to collect as little as
          possible: there are no accounts, no passwords, and no tracking.
        </p>
        <p>
          This policy explains what happens to the files you upload, what is
          stored in your browser, and how you can delete everything at any time.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: (
      <>
        <p>
          <strong>Files you upload.</strong> When you upload a CSV or Excel file
          (up to {MAX_UPLOAD_MB} MB), we store its contents and file name on our
          analysis server, together with anything you create from it: a cleaned
          copy of the data, model settings, metrics, and trained model files.
        </p>
        <p>
          <strong>Data stored in your browser.</strong> To remember your
          preferences and your sessions, MLInsights saves the following in your
          browser&apos;s local storage: your theme, sidebar and animation
          preferences, your workspace defaults, and a list of your sessions
          (session ID, file name, size, and timestamps). This information stays
          on your device.
        </p>
        <p>
          <strong>Technical logs.</strong> Our analysis server records basic
          request details to keep the service working: the time, the endpoint,
          the response status, how long it took, and a random request ID. These
          logs don&apos;t include your file contents or your IP address.
        </p>
        <p>
          <strong>What we don&apos;t collect.</strong> We don&apos;t ask for
          your name, email address, or payment details. MLInsights sets no
          cookies and runs no analytics, advertising, or tracking scripts.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    content: (
      <>
        <p>We use the information described above only to:</p>
        <ul>
          <li>
            Show insights about your data, clean it, and train the models you
            choose.
          </li>
          <li>Generate the reports, datasets, and model files you download.</li>
          <li>Keep the service secure, diagnose errors, and prevent abuse.</li>
        </ul>
        <p>
          Your data is never sold, never used for advertising, and never used to
          train models for anyone else.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How Long We Keep Data",
    content: (
      <>
        <p>
          Uploaded files and everything created from them expire{" "}
          {SESSION_TTL_HOURS} hours after upload. Expired data can no longer be
          opened, and it&apos;s permanently erased by automatic cleanup, which
          runs whenever the analysis server starts and regularly while it&apos;s
          in use. You can also delete your data yourself at any time.
        </p>
        <p>
          Information in your browser&apos;s local storage stays on your device
          until you clear it, either through your browser settings or with{" "}
          <strong>Delete All My Data</strong> in MLInsights Settings.
        </p>
      </>
    ),
  },
  {
    id: "deleting-your-data",
    title: "Deleting Your Data",
    content: (
      <>
        <p>
          You don&apos;t need to wait for automatic deletion. In MLInsights
          Settings you can:
        </p>
        <ul>
          <li>
            Delete a single session and all of its files, results, and models.
          </li>
          <li>
            Use <strong>Delete All My Data</strong> to remove every session
            created in your browser from our server and clear the preferences
            stored on your device.
          </li>
        </ul>
        <p>
          Deletion takes effect immediately and can&apos;t be undone.{" "}
          <Link href="/app/settings">Open Settings</Link> to manage your data.
        </p>
      </>
    ),
  },
  {
    id: "service-providers",
    title: "Service Providers",
    content: (
      <>
        <p>
          MLInsights runs on third-party infrastructure. The website is hosted
          by Vercel and the analysis server by Railway. These providers process
          requests and store data on our behalf, and may keep their own standard
          logs, such as IP addresses, under their own privacy policies.
        </p>
        <p>
          Fonts are served from our own website, so loading MLInsights
          doesn&apos;t send requests to font providers. We don&apos;t share your
          data with anyone else unless the law requires us to.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <>
        <p>
          Data is sent over encrypted HTTPS connections. Each session is
          identified by a long, random ID, and other websites can&apos;t reach
          the analysis server from your browser.
        </p>
        <p>
          A session ID works like a private link: anyone who has it can open
          that session until it expires, so don&apos;t share it. No online
          service can guarantee perfect security, so please avoid uploading
          sensitive information.
        </p>
      </>
    ),
  },
  {
    id: "sensitive-data",
    title: "Sensitive and Personal Data",
    content: (
      <p>
        MLInsights isn&apos;t designed for sensitive personal information such
        as health records, financial account numbers, or government IDs. Only
        upload data you have the right to use, and remove or anonymize personal
        details before uploading whenever you can.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: (
      <p>
        MLInsights isn&apos;t directed at children under 13, or under 16 in the
        European Economic Area, and we don&apos;t knowingly collect their
        personal information.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: (
      <p>
        Depending on where you live, you may have the right to access, correct,
        or delete personal information. Because MLInsights doesn&apos;t link
        data to your identity, the fastest way to exercise these rights is to
        delete your sessions in Settings. You can also contact us using the
        details below.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: (
      <p>
        If we change how MLInsights handles data, we&apos;ll update this page
        and the &ldquo;Last updated&rdquo; date at the top.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: <ContactLine topic="privacy or your data" />,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      description={description}
      highlights={[
        {
          icon: <LockKeyhole aria-hidden="true" />,
          title: "No Account Needed",
          description: "No sign-up, no passwords, and no personal profile.",
        },
        {
          icon: <Timer aria-hidden="true" />,
          title: `Expires After ${SESSION_TTL_HOURS} Hours`,
          description:
            "Uploaded data expires a day after upload, then is erased.",
        },
        {
          icon: <EyeOff aria-hidden="true" />,
          title: "No Tracking",
          description: "No cookies, analytics, or advertising scripts.",
        },
        {
          icon: <Trash aria-hidden="true" />,
          title: "Delete Anytime",
          description: "Remove any session, or everything, from Settings.",
        },
      ]}
      sections={sections}
    />
  );
}
