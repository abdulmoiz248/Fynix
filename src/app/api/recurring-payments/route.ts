import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { supabaseAdmin } from "@/lib/supabase";
import { authConfig } from "@/auth";

// GET all recurring payments for the user
export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all recurring payments
    const { data: recurringPayments, error } = await supabaseAdmin
      .from("recurring_payments")
      .select("*")
      .eq("user_id", user.id)
      .order("next_payment_date", { ascending: true });

    if (error) {
      console.error("Error fetching recurring payments:", error);
      return NextResponse.json(
        { error: "Failed to fetch recurring payments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recurringPayments });
  } catch (error) {
    console.error("Error in GET /api/recurring-payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new recurring payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, category, amount, frequency, next_payment_date, notes } = body;

    // Validate required fields
    if (!name || !category || !amount || !frequency || !next_payment_date) {
      console.error("Missing required fields in request body: ", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create recurring payment
    const { data: recurringPayment, error } = await supabaseAdmin
      .from("recurring_payments")
      .insert({
        user_id: user.id,
        name,
        category,
        amount,
        frequency,
        next_payment_date,
        notes,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating recurring payment:", error);
      return NextResponse.json(
        { error: "Failed to create recurring payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recurringPayment }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/recurring-payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update recurring payment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, name, category, amount, frequency, next_payment_date, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recurring payment ID is required" },
        { status: 400 }
      );
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update recurring payment
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (next_payment_date !== undefined) updateData.next_payment_date = next_payment_date;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: recurringPayment, error } = await supabaseAdmin
      .from("recurring_payments")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating recurring payment:", error);
      return NextResponse.json(
        { error: "Failed to update recurring payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recurringPayment });
  } catch (error) {
    console.error("Error in PUT /api/recurring-payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE recurring payment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Recurring payment ID is required" },
        { status: 400 }
      );
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete recurring payment
    const { error } = await supabaseAdmin
      .from("recurring_payments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting recurring payment:", error);
      return NextResponse.json(
        { error: "Failed to delete recurring payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Recurring payment deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/recurring-payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
