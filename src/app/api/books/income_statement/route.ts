import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
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

    // Revenue from income transactions
    const { data: incomeTransactions } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "income")
      .gte("date", startDate)
      .lte("date", endDate);

    const sales_revenue = incomeTransactions
      ? incomeTransactions.reduce((acc, t) => acc + Number(t.amount), 0)
      : 0;

    // Revenue from paid income invoices
    const { data: paidInvoices } = await supabaseAdmin
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("type", "income")
      .eq("status", "paid")
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    const invoice_revenue = paidInvoices
      ? paidInvoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0)
      : 0;

    // Dividend income (if you have a dividends table - checking from stocks)
    const { data: dividends } = await supabaseAdmin
      .from("stock_transactions")
      .select("quantity, price_per_share")
      .eq("user_id", user.id)
      .eq("transaction_type", "dividend")
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    const dividend_income = dividends
      ? dividends.reduce((acc, d) => acc + Number(d.quantity) * Number(d.price_per_share), 0)
      : 0;

    const total_revenue = sales_revenue + invoice_revenue + dividend_income;

    // Expenses from expense transactions
    const { data: expenseTransactions } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    const operating_expenses = expenseTransactions
      ? expenseTransactions.reduce((acc, t) => acc + Number(t.amount), 0)
      : 0;

    // Expenses from paid expense invoices
    const { data: expenseInvoices } = await supabaseAdmin
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("status", "paid")
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    const invoice_expenses = expenseInvoices
      ? expenseInvoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0)
      : 0;

    // Trading fees
    const { data: tradingFees } = await supabaseAdmin
      .from("trading_fees")
      .select("amount, fee_type")
      .eq("user_id", user.id)
      .gte("fee_date", startDate)
      .lte("fee_date", endDate);

    let broker_fees = 0;
    let cgt = 0;

    if (tradingFees) {
      tradingFees.forEach((fee) => {
        if (fee.fee_type === "cgt") {
          cgt += Number(fee.amount);
        } else {
          broker_fees += Number(fee.amount);
        }
      });
    }

    const total_expenses = operating_expenses + invoice_expenses + broker_fees + cgt;

    const net_income = total_revenue - total_expenses;

    const incomeStatement = {
      revenue: {
        sales: sales_revenue + invoice_revenue,
        dividends: dividend_income,
        total_revenue: total_revenue,
      },
      expenses: {
        operating_expenses: operating_expenses + invoice_expenses,
        trading_fees: broker_fees,
        cgt: cgt,
        total_expenses: total_expenses,
      },
      net_income: net_income,
    };

    return NextResponse.json(incomeStatement);
  } catch (error) {
    console.error("Error generating income statement:", error);
    return NextResponse.json(
      { error: "Failed to generate income statement" },
      { status: 500 }
    );
  }
}
