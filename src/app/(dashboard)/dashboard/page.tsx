import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Sparkles } from "lucide-react";
import { getNotes } from "@/actions/notes.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getNotes();
  const notes = result.success ? result.data : [];

  // Calculate stats
  const totalNotes = notes.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notesToday = notes.filter((note) => {
    const noteDate = new Date(note.createdAt);
    noteDate.setHours(0, 0, 0, 0);
    return noteDate.getTime() === today.getTime();
  }).length;

  const recentNotes = notes.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Vault. Your private idea incubator.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              Ideas captured in your vault
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesToday}</div>
            <p className="text-xs text-muted-foreground">
              Ideas captured today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Capture</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">⌘K</kbd> to capture an idea instantly
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ideas */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Ideas</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/notes">View all</Link>
          </Button>
        </div>

        {recentNotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No ideas yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">⌘K</kbd> to capture your first idea
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentNotes.map((note) => (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-base">
                      {note.title || "Untitled"}
                    </CardTitle>
                    <CardDescription>
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {note.encryptedContent.substring(0, 100)}
                      {note.encryptedContent.length > 100 ? "..." : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
