"use client";

import { UserButton } from "@clerk/nextjs";
import { QuickCaptureHint } from "@/components/quick-capture";

export function Header(): React.ReactElement {
  return (
    <header className="border-b">
      <div className="flex h-14 items-center justify-between px-6">
        <QuickCaptureHint />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
