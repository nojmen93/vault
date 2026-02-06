import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`
  : "http://localhost:3000/api/github/callback";

export async function GET(): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  if (!GITHUB_CLIENT_ID) {
    console.error("GITHUB_CLIENT_ID is not configured");
    return NextResponse.redirect(
      new URL("/dashboard/incubator?github_error=not_configured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
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

  return NextResponse.redirect(githubAuthUrl);
}
