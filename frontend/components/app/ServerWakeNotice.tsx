"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { ensureAwake, onWakeState } from "@/lib/api/client";

const TOAST_ID = "server-waking";

export function ServerWakeNotice() {
  useEffect(() => {
    const unsubscribe = onWakeState((state) => {
      if (state === "waking") {
        toast.loading(
          "Waking up the analysis server. This can take up to a minute after it's been idle.",
          {
            id: TOAST_ID,
            duration: Infinity,
          },
        );
      } else if (state === "awake") {
        toast.success("The analysis server is ready.", {
          id: TOAST_ID,
          duration: 2500,
        });
      } else {
        toast.error(
          "The analysis server didn't respond. Check your connection and try again.",
          {
            id: TOAST_ID,
            duration: 7000,
          },
        );
      }
    });
    void ensureAwake().catch(() => {});
    return unsubscribe;
  }, []);
  return null;
}
