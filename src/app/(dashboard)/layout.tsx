import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuickCaptureProvider, QuickCaptureModal } from "@/components/quick-capture";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<React.ReactElement> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <QuickCaptureProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <QuickCaptureModal />
    </QuickCaptureProvider>
  );
}
