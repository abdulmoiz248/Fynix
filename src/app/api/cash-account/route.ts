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

// GET - Get cash account balance
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

    const { data: cashAccount, error } = await supabaseAdmin
      .from("cash_account")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Account doesn't exist, create it
      const { data: newAccount, error: insertError } = await supabaseAdmin
        .from("cash_account")
        .insert({
          user_id: userId,
          balance: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating cash account:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ cashAccount: newAccount });
    }

    if (error) {
      console.error("Error fetching cash account:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cashAccount });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update cash account balance (deposit/withdraw)
export async function PUT(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      amount: number;
      type: "deposit" | "withdraw";
    };

    const { amount, type } = body;

    if (!amount || !type) {
      return NextResponse.json(
        { error: "Missing required fields: amount, type" },
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

    const { data: cashAccount, error: fetchError } = await supabaseAdmin
      .from("cash_account")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      // Create account if doesn't exist
      const { data: newAccount, error: insertError } = await supabaseAdmin
        .from("cash_account")
        .insert({
          user_id: userId,
          balance: type === "deposit" ? amount : 0,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ cashAccount: newAccount });
    }

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const currentBalance = parseFloat(cashAccount.balance);
    let newBalance;

    if (type === "deposit") {
      newBalance = currentBalance + amount;
    } else {
      // withdraw
      if (currentBalance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      newBalance = currentBalance - amount;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("cash_account")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create transaction record
    const transactionType = type === "deposit" ? "income" : "expense";
    const transactionCategory = type === "deposit" ? "Cash Deposit" : "Cash Withdrawal";
    
    const { error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        type: transactionType,
        category: transactionCategory,
        amount: amount,
        description: `${type === "deposit" ? "Deposited" : "Withdrew"} Rs. ${amount.toFixed(2)} ${type === "deposit" ? "to" : "from"} PSX account`,
        date: new Date().toISOString().split('T')[0], // Use 'date' column in DATE format
      });

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError);
      // Don't fail the request if transaction record fails
    }

    return NextResponse.json({ cashAccount: updated });
  } catch (error) {
    console.error("Error updating cash account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
