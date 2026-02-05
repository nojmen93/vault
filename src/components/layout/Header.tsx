import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header(): React.ReactElement {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Vault
        </Link>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
