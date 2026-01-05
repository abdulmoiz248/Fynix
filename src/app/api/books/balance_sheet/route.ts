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

    // Calculate Assets
    // 1. Cash (from transactions)
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .lte("date", endDate);

    let cash = 0;
    if (transactions) {
      cash = transactions.reduce((acc, t) => {
        return t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount);
      }, 0);
    }

    // 2. Accounts Receivable (unpaid income invoices)
    const { data: receivableInvoices } = await supabaseAdmin
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("type", "income")
      .in("status", ["sent", "overdue"])
      .lte("invoice_date", endDate);

    const accounts_receivable = receivableInvoices
      ? receivableInvoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0)
      : 0;

    // 3. Investments (stocks + mutual funds)
    const { data: stocks } = await supabaseAdmin
      .from("stock_transactions")
      .select("transaction_type, quantity, price_per_share")
      .eq("user_id", user.id)
      .lte("transaction_date", endDate);

    const { data: mutualFunds } = await supabaseAdmin
      .from("mutual_fund_transactions")
      .select("transaction_type, units, price_per_unit")
      .eq("user_id", user.id)
      .lte("transaction_date", endDate);

    let investmentValue = 0;
    
    if (stocks) {
      stocks.forEach((s) => {
        const amount = Number(s.quantity) * Number(s.price_per_share);
        if (s.transaction_type === "buy") {
          investmentValue += amount;
        } else if (s.transaction_type === "sell") {
          investmentValue -= amount;
        }
      });
    }

    if (mutualFunds) {
      mutualFunds.forEach((mf) => {
        const amount = Number(mf.units) * Number(mf.price_per_unit);
        if (mf.transaction_type === "buy") {
          investmentValue += amount;
        } else if (mf.transaction_type === "sell") {
          investmentValue -= amount;
        }
      });
    }

    // 4. Accounts Payable (unpaid expense invoices)
    const { data: payableInvoices } = await supabaseAdmin
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .in("status", ["sent", "overdue"])
      .lte("invoice_date", endDate);

    const accounts_payable = payableInvoices
      ? payableInvoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0)
      : 0;

    // Calculate totals
    const current_assets_total = cash + accounts_receivable;
    const non_current_assets_total = investmentValue;
    const total_assets = current_assets_total + non_current_assets_total;

    const current_liabilities_total = accounts_payable;
    const total_liabilities = current_liabilities_total;

    // Equity = Assets - Liabilities
    const retained_earnings = total_assets - total_liabilities;
    const total_equity = retained_earnings;

    const balanceSheet = {
      assets: {
        current_assets: {
          cash: cash,
          accounts_receivable: accounts_receivable,
          inventory: 0, // Not tracking inventory in this system
          total: current_assets_total,
        },
        non_current_assets: {
          investments: investmentValue,
          total: non_current_assets_total,
        },
        total_assets: total_assets,
      },
      liabilities: {
        current_liabilities: {
          accounts_payable: accounts_payable,
          total: current_liabilities_total,
        },
        total_liabilities: total_liabilities,
      },
      equity: {
        retained_earnings: retained_earnings,
        total_equity: total_equity,
      },
    };

    return NextResponse.json(balanceSheet);
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    return NextResponse.json(
      { error: "Failed to generate balance sheet" },
      { status: 500 }
    );
  }
}
