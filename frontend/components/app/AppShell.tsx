"use client";

import type { ReactNode } from "react";
import { AppTopBar, SessionGate } from "@/components/app/AppChrome";
import { ServerWakeNotice } from "@/components/app/ServerWakeNotice";
import { Sidebar } from "@/components/app/Sidebar";
import { TrainingModal } from "@/components/app/TrainingModal";
import { SessionProvider } from "@/lib/session";
import { TrainingProvider } from "@/lib/training";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TrainingProvider>
        <Sidebar />
        <div className="app-content flex min-h-dvh flex-col">
          <AppTopBar />
          <main
            id="main"
            tabIndex={-1}
            className="container-app flex-1 py-8 outline-none sm:py-10 lg:py-12"
          >
            <SessionGate>{children}</SessionGate>
          </main>
        </div>
        <TrainingModal />
        <ServerWakeNotice />
      </TrainingProvider>
    </SessionProvider>
  );
}
