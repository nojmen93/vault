import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectTo(path: string): Response {
  return NextResponse.redirect(new URL(path, BASE_URL));
}

export async function GET(request: NextRequest): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return redirectTo("/sign-in");
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return redirectTo(`/dashboard/incubator?github_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return redirectTo("/dashboard/incubator?github_error=no_code");
  }

  // Verify state
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      if (stateData.userId !== userId) {
        return redirectTo("/dashboard/incubator?github_error=invalid_state");
      }
      // Check timestamp (10 minute expiry)
      if (Date.now() - stateData.timestamp > 600000) {
        return redirectTo("/dashboard/incubator?github_error=state_expired");
      }
    } catch {
      return redirectTo("/dashboard/incubator?github_error=invalid_state");
    }
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error("GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
    return redirectTo("/dashboard/incubator?github_error=not_configured");
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
      console.error("GitHub token exchange error:", tokenData.error, tokenData.error_description);
      return redirectTo(`/dashboard/incubator?github_error=${encodeURIComponent(tokenData.error)}`);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("No access token received from GitHub");
      return redirectTo("/dashboard/incubator?github_error=no_token");
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to get GitHub user info:", userResponse.status);
      return redirectTo("/dashboard/incubator?github_error=user_fetch_failed");
    }

    const userData = await userResponse.json();
    const githubUsername = userData.login;

    // Store token and username in database - use upsert to handle case where user row doesn't exist
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: userId,
          github_access_token: accessToken,
          github_username: githubUsername,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (updateError) {
      console.error("Failed to save GitHub token:", updateError);
      return redirectTo("/dashboard/incubator?github_error=save_failed");
    }

    return redirectTo("/dashboard/incubator?github_connected=true");
  } catch (err) {
    console.error("GitHub callback error:", err);
    return redirectTo("/dashboard/incubator?github_error=unknown");
  }
}
