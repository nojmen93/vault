import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request: NextRequest): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    redirect(`/dashboard/incubator?github_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    redirect("/dashboard/incubator?github_error=no_code");
  }

  // Verify state
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      if (stateData.userId !== userId) {
        redirect("/dashboard/incubator?github_error=invalid_state");
      }
      // Check timestamp (10 minute expiry)
      if (Date.now() - stateData.timestamp > 600000) {
        redirect("/dashboard/incubator?github_error=state_expired");
      }
    } catch {
      redirect("/dashboard/incubator?github_error=invalid_state");
    }
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    redirect("/dashboard/incubator?github_error=not_configured");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      redirect(`/dashboard/incubator?github_error=${encodeURIComponent(tokenData.error)}`);
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const userData = await userResponse.json();
    const githubUsername = userData.login;

    // Store token and username in database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        github_access_token: accessToken,
        github_username: githubUsername,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to save GitHub token:", updateError);
      redirect("/dashboard/incubator?github_error=save_failed");
    }

    redirect("/dashboard/incubator?github_connected=true");
  } catch (err) {
    console.error("GitHub callback error:", err);
    redirect("/dashboard/incubator?github_error=unknown");
  }
}
