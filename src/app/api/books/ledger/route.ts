import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { supabaseAdmin } from "@/lib/supabase";
import { authConfig } from "@/auth";

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

    const ledgerAccounts: { [key: string]: { debits: number; credits: number } } = {};

    const addToLedger = (account: string, debit: number, credit: number) => {
      if (!ledgerAccounts[account]) {
        ledgerAccounts[account] = { debits: 0, credits: 0 };
      }
      ledgerAccounts[account].debits += debit;
      ledgerAccounts[account].credits += credit;
    };

    // Transactions
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (transactions) {
      transactions.forEach((t) => {
        if (t.type === "income") {
          addToLedger("Cash", Number(t.amount), 0);
          addToLedger(`Revenue - ${t.category}`, 0, Number(t.amount));
        } else {
          addToLedger(`Expense - ${t.category}`, Number(t.amount), 0);
          addToLedger("Cash", 0, Number(t.amount));
        }
      });
    }

    // Invoices
    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    if (invoices) {
      invoices.forEach((inv) => {
        if (inv.type === "income") {
          if (inv.status === "paid") {
            addToLedger("Cash", Number(inv.total_amount), 0);
            addToLedger("Revenue - Invoiced", 0, Number(inv.total_amount));
          } else {
            addToLedger("Accounts Receivable", Number(inv.total_amount), 0);
            addToLedger("Revenue - Invoiced", 0, Number(inv.total_amount));
          }
        } else {
          if (inv.status === "paid") {
            addToLedger("Expense - Invoiced", Number(inv.total_amount), 0);
            addToLedger("Cash", 0, Number(inv.total_amount));
          } else {
            addToLedger("Expense - Invoiced", Number(inv.total_amount), 0);
            addToLedger("Accounts Payable", 0, Number(inv.total_amount));
          }
        }
      });
    }

    // Stock transactions
    const { data: stockTransactions } = await supabaseAdmin
      .from("stock_transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    if (stockTransactions) {
      stockTransactions.forEach((st) => {
        const amount = Number(st.quantity) * Number(st.price_per_share);
        if (st.transaction_type === "buy") {
          addToLedger("Investments - Stocks", amount, 0);
          addToLedger("Cash", 0, amount);
        } else if (st.transaction_type === "sell") {
          addToLedger("Cash", amount, 0);
          addToLedger("Investments - Stocks", 0, amount);
        }
      });
    }

    // Mutual fund transactions
    const { data: mutualFundTransactions } = await supabaseAdmin
      .from("mutual_fund_transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    if (mutualFundTransactions) {
      mutualFundTransactions.forEach((mf) => {
        const amount = Number(mf.units) * Number(mf.price_per_unit);
        if (mf.transaction_type === "buy") {
          addToLedger("Investments - Mutual Funds", amount, 0);
          addToLedger("Cash", 0, amount);
        } else if (mf.transaction_type === "sell") {
          addToLedger("Cash", amount, 0);
          addToLedger("Investments - Mutual Funds", 0, amount);
        }
      });
    }

    // Trading fees
    const { data: tradingFees } = await supabaseAdmin
      .from("trading_fees")
      .select("*")
      .eq("user_id", user.id)
      .gte("fee_date", startDate)
      .lte("fee_date", endDate);

    if (tradingFees) {
      tradingFees.forEach((fee) => {
        addToLedger(`Expense - ${fee.fee_type}`, Number(fee.amount), 0);
        addToLedger("Cash", 0, Number(fee.amount));
      });
    }

    // Convert to array format
    const ledgerArray = Object.entries(ledgerAccounts).map(([account, data]) => ({
      account,
      debits: data.debits,
      credits: data.credits,
      balance: data.debits - data.credits,
    }));

    // Sort by account name
    ledgerArray.sort((a, b) => a.account.localeCompare(b.account));

    return NextResponse.json(ledgerArray);
  } catch (error) {
    console.error("Error generating ledger:", error);
    return NextResponse.json(
      { error: "Failed to generate ledger" },
      { status: 500 }
    );
  }
}
