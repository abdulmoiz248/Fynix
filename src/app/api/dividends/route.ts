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

// GET - List all dividends
export async function GET() {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: dividends, error } = await supabaseAdmin
      .from("dividends")
      .select("*")
      .eq("user_id", userId)
      .order("dividend_date", { ascending: false });

    if (error) {
      console.error("Error fetching dividends:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ dividends: dividends || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add dividend
export async function POST(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      symbol: string;
      amount: number;
      dividend_date?: string;
      description?: string;
    };

    const { symbol, amount, dividend_date, description } = body;

    if (!symbol || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, amount" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get stock info
    const { data: stock } = await supabaseAdmin
      .from("stocks")
      .select("id, company_name")
      .eq("user_id", userId)
      .eq("symbol", symbol)
      .single();

    // Get PSX stock info if not in user portfolio
    const { data: psxStock } = await supabaseAdmin
      .from("psx_stocks")
      .select("company_name")
      .eq("symbol", symbol)
      .single();

    const companyName = stock?.company_name || psxStock?.company_name || symbol;

    // Insert dividend
    const { data, error } = await supabaseAdmin
      .from("dividends")
      .insert({
        user_id: userId,
        stock_id: stock?.id || null,
        symbol,
        company_name: companyName,
        amount,
        dividend_date: dividend_date || new Date().toISOString().split("T")[0],
        description: description || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding dividend:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update cash account
    const { data: cashAccount } = await supabaseAdmin
      .from("cash_account")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (cashAccount) {
      await supabaseAdmin
        .from("cash_account")
        .update({
          balance: parseFloat(cashAccount.balance) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    return NextResponse.json({ dividend: data }, { status: 201 });
  } catch (error) {
    console.error("Error adding dividend:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
