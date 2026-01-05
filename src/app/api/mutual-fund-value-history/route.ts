import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

type Session = {
  user?: {
    email?: string | null;
  };
};

async function getUserId(email: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not configured");
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error("User not found");
  }

  return data.id;
}

// GET - List mutual fund value history
export async function GET(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const fundId = searchParams.get("fund_id");

    let query = supabaseAdmin
      .from("mutual_fund_value_history")
      .select("*")
      .eq("user_id", userId);

    if (fundId) {
      query = query.eq("mutual_fund_id", fundId);
    }

    const { data: history, error } = await query.order("update_date", { ascending: false });

    if (error) {
      console.error("Error fetching mutual fund value history:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
