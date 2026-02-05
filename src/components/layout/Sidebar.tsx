"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, MessageSquare, Lightbulb, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Idea Cloud", icon: Cloud, exact: true },
  { href: "/dashboard/chat", label: "Idea Stream", icon: MessageSquare },
  { href: "/dashboard/incubator", label: "Incubator", icon: Lightbulb },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/40 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-lg">Vault</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">⌘K</kbd> to capture
        </p>
      </div>
    </aside>
  );
}
