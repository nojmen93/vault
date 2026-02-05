import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`
  : "http://localhost:3000/api/github/callback";

export async function GET(): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 500 });
  }

  // Generate a state parameter for CSRF protection
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString("base64");

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo user:email",
    state,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  redirect(githubAuthUrl);
}
