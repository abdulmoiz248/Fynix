import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

type ExtendedSession = {
  accessToken?: string;
  error?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
};

type GmailHeader = { name: string; value: string };
type GmailMessage = {
  id: string;
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
};

function extractHeader(headers: GmailHeader[] = [], name: string) {
  return headers.find((header) => header.name === name)?.value ?? "";
}

export async function GET() {
  const session = (await getServerSession(authConfig)) as ExtendedSession | null;

  console.log("Session debug:", { 
    hasSession: !!session, 
    hasAccessToken: !!session?.accessToken,
    error: session?.error,
    user: session?.user?.email 
  });

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listResponse = await fetch(`${GMAIL_API_BASE}/messages?maxResults=5&labelIds=INBOX`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (listResponse.status === 401) {
      return NextResponse.json({ error: "Re-authentication required" }, { status: 401 });
    }

    if (!listResponse.ok) {
      return NextResponse.json({ error: "Failed to list messages" }, { status: listResponse.status });
    }

    const { messages }: { messages?: { id: string }[] } = await listResponse.json();

    if (!messages?.length) {
      return NextResponse.json({ messages: [] });
    }

    const details = await Promise.all(
      messages.map(async (message) => {
        const detailResponse = await fetch(
          `${GMAIL_API_BASE}/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            cache: "no-store",
          }
        );

        if (!detailResponse.ok) {
          return null;
        }

        const detail = (await detailResponse.json()) as GmailMessage;
        const headers = detail.payload?.headers ?? [];

        return {
          id: message.id,
          subject: extractHeader(headers, "Subject") || "(No subject)",
          from: extractHeader(headers, "From"),
          date: extractHeader(headers, "Date"),
          snippet: detail.snippet ?? "",
        };
      })
    );

    return NextResponse.json({ messages: details.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching Gmail messages", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
