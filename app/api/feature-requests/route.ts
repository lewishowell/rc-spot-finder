import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: "Feature requests are not configured" }, { status: 500 });
  }

  const body = [
    description?.trim() || "_No description provided._",
    "",
    "---",
    `Submitted by: ${session.user.name || session.user.email || "Unknown user"}`,
  ].join("\n");

  const response = await fetch(
    "https://api.github.com/repos/lewishowell/rc-spot-finder/issues",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `[Feature Request] ${title.trim()}`,
        body,
        labels: ["feature-request"],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("GitHub API error:", error);
    return NextResponse.json({ error: "Failed to submit feature request" }, { status: 500 });
  }

  const issue = await response.json();
  return NextResponse.json({ issueUrl: issue.html_url });
}
