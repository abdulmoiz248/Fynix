import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { supabaseAdmin } from "@/lib/supabase";
import { authConfig } from "@/auth";

// Convert a recurring payment to a transaction (expense)
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
    const { recurring_payment_id } = body;

    if (!recurring_payment_id) {
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

    // Get recurring payment
    const { data: recurringPayment, error: fetchError } = await supabaseAdmin
      .from("recurring_payments")
      .select("*")
      .eq("id", recurring_payment_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !recurringPayment) {
      return NextResponse.json(
        { error: "Recurring payment not found" },
        { status: 404 }
      );
    }

    // Create a transaction (expense) from the recurring payment
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "expense",
        amount: recurringPayment.amount,
        category: recurringPayment.category,
        description: `${recurringPayment.name} - Recurring payment`,
        date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    // Calculate next payment date based on frequency
    const currentNextDate = new Date(recurringPayment.next_payment_date);
    let newNextDate = new Date(currentNextDate);

    switch (recurringPayment.frequency) {
      case "daily":
        newNextDate.setDate(newNextDate.getDate() + 1);
        break;
      case "weekly":
        newNextDate.setDate(newNextDate.getDate() + 7);
        break;
      case "monthly":
        newNextDate.setMonth(newNextDate.getMonth() + 1);
        break;
      case "quarterly":
        newNextDate.setMonth(newNextDate.getMonth() + 3);
        break;
      case "yearly":
        newNextDate.setFullYear(newNextDate.getFullYear() + 1);
        break;
    }

    // Update recurring payment with new next_payment_date and last_payment_date
    const { error: updateError } = await supabaseAdmin
      .from("recurring_payments")
      .update({
        next_payment_date: newNextDate.toISOString().split("T")[0],
        last_payment_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", recurring_payment_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating recurring payment:", updateError);
      // Transaction was created, but we couldn't update the recurring payment
      // Still return success but log the error
    }

    return NextResponse.json({
      message: "Transaction created successfully",
      transaction,
      next_payment_date: newNextDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error in POST /api/recurring-payments/convert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
