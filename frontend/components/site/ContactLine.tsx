import { CONTACT_EMAIL, REPO_URL } from "@/lib/site";

export function ContactLine({ topic }: { topic: string }) {
  if (CONTACT_EMAIL) {
    return (
      <p>
        Questions about {topic}? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&apos;ll
        respond as soon as we can.
      </p>
    );
  }
  return (
    <p>
      Questions about {topic}? Open an issue on the{" "}
      <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">
        MLInsights GitHub repository
      </a>{" "}
      and we&apos;ll respond as soon as we can.
    </p>
  );
}
