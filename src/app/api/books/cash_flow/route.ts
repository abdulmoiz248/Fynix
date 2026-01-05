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

    // Calculate beginning cash (all transactions before start date)
    const { data: transactionsBeforeStart } = await supabaseAdmin
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .lt("date", startDate);

    let beginning_cash = 0;
    if (transactionsBeforeStart) {
      beginning_cash = transactionsBeforeStart.reduce((acc, t) => {
        return t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount);
      }, 0);
    }

    // Operating Activities - Cash from operations (transactions in period)
    const { data: incomeTransactions } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "income")
      .gte("date", startDate)
      .lte("date", endDate);

    const { data: expenseTransactions } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    const cash_inflow = incomeTransactions
      ? incomeTransactions.reduce((acc, t) => acc + Number(t.amount), 0)
      : 0;

    const cash_outflow = expenseTransactions
      ? expenseTransactions.reduce((acc, t) => acc + Number(t.amount), 0)
      : 0;

    // Paid invoices
    const { data: paidIncomeInvoices } = await supabaseAdmin
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("type", "income")
      .eq("status", "paid")
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    const { data: paidExpenseInvoices } = await supabaseAdmin
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("status", "paid")
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    const invoice_cash_inflow = paidIncomeInvoices
      ? paidIncomeInvoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0)
      : 0;

    const invoice_cash_outflow = paidExpenseInvoices
      ? paidExpenseInvoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0)
      : 0;

    const cash_from_operations = cash_inflow + invoice_cash_inflow - cash_outflow - invoice_cash_outflow;

    // Investing Activities - Stock and mutual fund purchases/sales
    const { data: stockTransactions } = await supabaseAdmin
      .from("stock_transactions")
      .select("transaction_type, quantity, price_per_share")
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    const { data: mutualFundTransactions } = await supabaseAdmin
      .from("mutual_fund_transactions")
      .select("transaction_type, units, price_per_unit")
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    let investments_purchased = 0;
    let investments_sold = 0;

    if (stockTransactions) {
      stockTransactions.forEach((s) => {
        const amount = Number(s.quantity) * Number(s.price_per_share);
        if (s.transaction_type === "buy") {
          investments_purchased += amount;
        } else if (s.transaction_type === "sell") {
          investments_sold += amount;
        }
      });
    }

    if (mutualFundTransactions) {
      mutualFundTransactions.forEach((mf) => {
        const amount = Number(mf.units) * Number(mf.price_per_unit);
        if (mf.transaction_type === "buy") {
          investments_purchased += amount;
        } else if (mf.transaction_type === "sell") {
          investments_sold += amount;
        }
      });
    }

    const cash_from_investing = investments_sold - investments_purchased;

    // Financing Activities - Not tracked in current system
    const cash_from_financing = 0;

    // Calculate net cash flow
    const net_cash_flow = cash_from_operations + cash_from_investing + cash_from_financing;
    const ending_cash = beginning_cash + net_cash_flow;

    const cashFlow = {
      operating_activities: {
        cash_from_operations: cash_from_operations,
        total: cash_from_operations,
      },
      investing_activities: {
        investments_purchased: -investments_purchased,
        investments_sold: investments_sold,
        total: cash_from_investing,
      },
      financing_activities: {
        total: cash_from_financing,
      },
      net_cash_flow: net_cash_flow,
      beginning_cash: beginning_cash,
      ending_cash: ending_cash,
    };

    return NextResponse.json(cashFlow);
  } catch (error) {
    console.error("Error generating cash flow statement:", error);
    return NextResponse.json(
      { error: "Failed to generate cash flow statement" },
      { status: 500 }
    );
  }
}
