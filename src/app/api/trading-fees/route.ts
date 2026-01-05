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

// GET - Get all trading fees for user
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

    const { data: fees, error } = await supabaseAdmin
      .from("trading_fees")
      .select("*")
      .eq("user_id", userId)
      .order("fee_date", { ascending: false });

    if (error) {
      console.error("Error fetching trading fees:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate totals by type
    const brokerTotal = fees?.filter(f => f.fee_type === "broker_charge")
      .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0) || 0;
    
    const cgtTotal = fees?.filter(f => f.fee_type === "cgt")
      .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0) || 0;
    
    const otherTotal = fees?.filter(f => f.fee_type === "other")
      .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0) || 0;
    
    const totalFees = brokerTotal + cgtTotal + otherTotal;

    return NextResponse.json({
      fees: fees || [],
      summary: {
        broker_charges: brokerTotal,
        cgt: cgtTotal,
        other_fees: otherTotal,
        total_fees: totalFees,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add new trading fee
export async function POST(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fee_type: "broker_charge" | "cgt" | "other";
      amount: number;
      description?: string;
      fee_date?: string;
    };

    const { fee_type, amount, description, fee_date } = body;

    if (!fee_type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: fee_type, amount" },
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

    const { data: newFee, error } = await supabaseAdmin
      .from("trading_fees")
      .insert({
        user_id: userId,
        fee_type,
        amount,
        description,
        fee_date: fee_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding trading fee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Trading fee added successfully",
      fee: newFee,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove trading fee
export async function DELETE(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const feeId = searchParams.get("id");

    if (!feeId) {
      return NextResponse.json({ error: "Fee ID required" }, { status: 400 });
    }

    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("trading_fees")
      .delete()
      .eq("id", feeId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting trading fee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Trading fee deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
