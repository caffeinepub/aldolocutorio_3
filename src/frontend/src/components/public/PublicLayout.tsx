import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { SidePanel } from "./SidePanel";

export function PublicLayout() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader onMenuToggle={() => setIsPanelOpen(true)} />
      <SidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
