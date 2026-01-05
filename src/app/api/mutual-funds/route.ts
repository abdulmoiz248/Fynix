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

// GET - List all user mutual funds
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

    const { data: funds, error } = await supabaseAdmin
      .from("mutual_funds")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching mutual funds:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ funds: funds || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Invest in mutual fund
export async function POST(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fund_name: string;
      fund_type?: string;
      amount: number;
      units?: number;
      nav?: number;
      transaction_date?: string;
      description?: string;
    };

    const { fund_name, fund_type, amount, units, nav, transaction_date, description } = body;

    if (!fund_name || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: fund_name, amount" },
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

    // Check if user already has this fund
    const { data: existingFund } = await supabaseAdmin
      .from("mutual_funds")
      .select("*")
      .eq("user_id", userId)
      .eq("fund_name", fund_name)
      .single();

    let fundId;

    if (existingFund) {
      // Update existing fund
      const newTotalInvested = parseFloat(existingFund.total_invested) + amount;
      const newCurrentValue = parseFloat(existingFund.current_value) + amount;
      const newUnits = units
        ? parseFloat(existingFund.units || "0") + units
        : existingFund.units;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("mutual_funds")
        .update({
          total_invested: newTotalInvested,
          current_value: newCurrentValue,
          units: newUnits,
          nav: nav || existingFund.nav,
          profit_loss: newCurrentValue - newTotalInvested,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFund.id)
        .select()
        .single();

      if (updateError) throw updateError;
      fundId = updated.id;
    } else {
      // Create new fund entry
      const { data: newFund, error: insertError } = await supabaseAdmin
        .from("mutual_funds")
        .insert({
          user_id: userId,
          fund_name,
          fund_type: fund_type || null,
          total_invested: amount,
          current_value: amount,
          units: units || null,
          nav: nav || null,
          profit_loss: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      fundId = newFund.id;
    }

    // Record transaction
    await supabaseAdmin.from("mutual_fund_transactions").insert({
      user_id: userId,
      mutual_fund_id: fundId,
      fund_name,
      transaction_type: "invest",
      amount,
      units: units || null,
      nav: nav || null,
      transaction_date: transaction_date || new Date().toISOString().split("T")[0],
      description: description || null,
    });

    // Create expense transaction in main transactions table
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "expense",
      amount,
      category: "Mutual Fund Investment",
      description: `Investment in ${fund_name}${description ? ` - ${description}` : ""}`,
      date: transaction_date || new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ success: true, message: "Investment recorded successfully" });
  } catch (error) {
    console.error("Error investing in mutual fund:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Withdraw from mutual fund
export async function PUT(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fund_id: string;
      amount: number;
      units?: number;
      nav?: number;
      transaction_date?: string;
      description?: string;
    };

    const { fund_id, amount, units, nav, transaction_date, description } = body;

    if (!fund_id || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: fund_id, amount" },
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

    // Get fund details
    const { data: fund, error: fundError } = await supabaseAdmin
      .from("mutual_funds")
      .select("*")
      .eq("id", fund_id)
      .eq("user_id", userId)
      .single();

    if (fundError || !fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    const currentValue = parseFloat(fund.current_value);
    const totalInvested = parseFloat(fund.total_invested);

    if (amount > currentValue) {
      return NextResponse.json({ error: "Withdrawal amount exceeds current value" }, { status: 400 });
    }

    // Calculate proportional invested amount and profit/loss
    const proportionWithdrawn = amount / currentValue;
    const investedPortionWithdrawn = totalInvested * proportionWithdrawn;
    const profitLoss = amount - investedPortionWithdrawn;

    const newCurrentValue = currentValue - amount;
    const newTotalInvested = totalInvested - investedPortionWithdrawn;
    const newUnits = units
      ? parseFloat(fund.units || "0") - units
      : fund.units;

    // Record transaction
    await supabaseAdmin.from("mutual_fund_transactions").insert({
      user_id: userId,
      mutual_fund_id: fund_id,
      fund_name: fund.fund_name,
      transaction_type: "withdraw",
      amount,
      units: units || null,
      nav: nav || fund.nav,
      profit_loss: profitLoss,
      transaction_date: transaction_date || new Date().toISOString().split("T")[0],
      description: description || null,
    });

    // Create income transaction in main transactions table
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "income",
      amount,
      category: "Mutual Fund Withdrawal",
      description: `Withdrawal from ${fund.fund_name}${description ? ` - ${description}` : ""} (P&L: Rs. ${profitLoss.toFixed(2)})`,
      date: transaction_date || new Date().toISOString().split("T")[0],
    });

    if (newCurrentValue === 0 || newTotalInvested <= 0.01) {
      // Delete fund entry if fully withdrawn
      await supabaseAdmin.from("mutual_funds").delete().eq("id", fund_id);
    } else {
      // Update fund entry
      await supabaseAdmin
        .from("mutual_funds")
        .update({
          total_invested: newTotalInvested,
          current_value: newCurrentValue,
          units: newUnits,
          nav: nav || fund.nav,
          profit_loss: newCurrentValue - newTotalInvested,
          updated_at: new Date().toISOString(),
        })
        .eq("id", fund_id);
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal recorded successfully",
      profit_loss: profitLoss,
    });
  } catch (error) {
    console.error("Error withdrawing from mutual fund:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update current value of mutual fund
export async function PATCH(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fund_id: string;
      new_value: number;
      nav?: number;
      update_date?: string;
      notes?: string;
    };

    const { fund_id, new_value, nav, update_date, notes } = body;

    if (!fund_id || new_value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: fund_id, new_value" },
        { status: 400 }
      );
    }

    if (new_value < 0) {
      return NextResponse.json({ error: "Value cannot be negative" }, { status: 400 });
    }

    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get current fund details
    const { data: fund, error: fundError } = await supabaseAdmin
      .from("mutual_funds")
      .select("*")
      .eq("id", fund_id)
      .eq("user_id", userId)
      .single();

    if (fundError || !fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    const previousValue = parseFloat(fund.current_value);
    const totalInvested = parseFloat(fund.total_invested);
    const valueChange = new_value - previousValue;
    const valueChangePercentage = previousValue > 0 ? (valueChange / previousValue) * 100 : 0;
    const newProfitLoss = new_value - totalInvested;

    // Record value history
    await supabaseAdmin.from("mutual_fund_value_history").insert({
      user_id: userId,
      mutual_fund_id: fund_id,
      fund_name: fund.fund_name,
      previous_value: previousValue,
      new_value,
      value_change: valueChange,
      value_change_percentage: valueChangePercentage,
      total_invested: totalInvested,
      profit_loss: newProfitLoss,
      update_date: update_date || new Date().toISOString().split("T")[0],
      notes: notes || null,
    });

    // Update fund current value
    await supabaseAdmin
      .from("mutual_funds")
      .update({
        current_value: new_value,
        nav: nav || fund.nav,
        profit_loss: newProfitLoss,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fund_id);

    return NextResponse.json({
      success: true,
      message: "Fund value updated successfully",
      value_change: valueChange,
      value_change_percentage: valueChangePercentage,
      profit_loss: newProfitLoss,
    });
  } catch (error) {
    console.error("Error updating mutual fund value:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
