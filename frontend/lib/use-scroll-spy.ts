import { useEffect, useState } from "react";

interface ScrollSpyOptions {
  offset?: number | "40%";
  mode?: "inside" | "passed";
  fallbackToFirst?: boolean;
  watch?: string;
}

export function useScrollSpy(
  ids: string[],
  options: ScrollSpyOptions = {},
): string | null {
  const {
    offset = 120,
    mode = "passed",
    fallbackToFirst = false,
    watch = "",
  } = options;
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|").filter(Boolean);
    let frame = 0;

    const compute = () => {
      frame = 0;
      const line = offset === "40%" ? window.innerHeight * 0.4 : offset;
      let current: string | null = null;
      for (const id of list) {
        const element = document.getElementById(id);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top > line) break;
        current = mode === "inside" && rect.bottom <= line ? null : id;
      }
      setActive(current ?? (fallbackToFirst ? (list[0] ?? null) : null));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key, offset, mode, fallbackToFirst, watch]);

  return active ?? (fallbackToFirst ? (ids[0] ?? null) : null);
}
