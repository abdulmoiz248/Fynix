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

    const trialBalanceAccounts: { [key: string]: { debit: number; credit: number } } = {};

    const addToTrialBalance = (account: string, debit: number, credit: number) => {
      if (!trialBalanceAccounts[account]) {
        trialBalanceAccounts[account] = { debit: 0, credit: 0 };
      }
      trialBalanceAccounts[account].debit += debit;
      trialBalanceAccounts[account].credit += credit;
    };

    // Transactions
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .lte("date", endDate);

    if (transactions) {
      transactions.forEach((t) => {
        if (t.type === "income") {
          addToTrialBalance("Cash", Number(t.amount), 0);
          addToTrialBalance(`Revenue - ${t.category}`, 0, Number(t.amount));
        } else {
          addToTrialBalance(`Expense - ${t.category}`, Number(t.amount), 0);
          addToTrialBalance("Cash", 0, Number(t.amount));
        }
      });
    }

    // Invoices
    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .lte("invoice_date", endDate);

    if (invoices) {
      invoices.forEach((inv) => {
        if (inv.type === "income") {
          if (inv.status === "paid") {
            addToTrialBalance("Cash", Number(inv.total_amount), 0);
            addToTrialBalance("Revenue - Invoiced", 0, Number(inv.total_amount));
          } else if (inv.status !== "cancelled") {
            addToTrialBalance("Accounts Receivable", Number(inv.total_amount), 0);
            addToTrialBalance("Revenue - Invoiced", 0, Number(inv.total_amount));
          }
        } else {
          if (inv.status === "paid") {
            addToTrialBalance("Expense - Invoiced", Number(inv.total_amount), 0);
            addToTrialBalance("Cash", 0, Number(inv.total_amount));
          } else if (inv.status !== "cancelled") {
            addToTrialBalance("Expense - Invoiced", Number(inv.total_amount), 0);
            addToTrialBalance("Accounts Payable", 0, Number(inv.total_amount));
          }
        }
      });
    }

    // Stock transactions
    const { data: stockTransactions } = await supabaseAdmin
      .from("stock_transactions")
      .select("*")
      .eq("user_id", user.id)
      .lte("transaction_date", endDate);

    if (stockTransactions) {
      stockTransactions.forEach((st) => {
        const amount = Number(st.quantity) * Number(st.price_per_share);
        if (st.transaction_type === "buy") {
          addToTrialBalance("Investments - Stocks", amount, 0);
          addToTrialBalance("Cash", 0, amount);
        } else if (st.transaction_type === "sell") {
          addToTrialBalance("Cash", amount, 0);
          addToTrialBalance("Investments - Stocks", 0, amount);
        }
      });
    }

    // Mutual fund transactions
    const { data: mutualFundTransactions } = await supabaseAdmin
      .from("mutual_fund_transactions")
      .select("*")
      .eq("user_id", user.id)
      .lte("transaction_date", endDate);

    if (mutualFundTransactions) {
      mutualFundTransactions.forEach((mf) => {
        const amount = Number(mf.units) * Number(mf.price_per_unit);
        if (mf.transaction_type === "buy") {
          addToTrialBalance("Investments - Mutual Funds", amount, 0);
          addToTrialBalance("Cash", 0, amount);
        } else if (mf.transaction_type === "sell") {
          addToTrialBalance("Cash", amount, 0);
          addToTrialBalance("Investments - Mutual Funds", 0, amount);
        }
      });
    }

    // Trading fees
    const { data: tradingFees } = await supabaseAdmin
      .from("trading_fees")
      .select("*")
      .eq("user_id", user.id)
      .lte("fee_date", endDate);

    if (tradingFees) {
      tradingFees.forEach((fee) => {
        addToTrialBalance(`Expense - ${fee.fee_type}`, Number(fee.amount), 0);
        addToTrialBalance("Cash", 0, Number(fee.amount));
      });
    }

    // Convert to array format - only showing non-zero balances
    const trialBalanceArray = Object.entries(trialBalanceAccounts)
      .map(([account, data]) => {
        // Net the debits and credits for trial balance
        const netDebit = data.debit > data.credit ? data.debit - data.credit : 0;
        const netCredit = data.credit > data.debit ? data.credit - data.debit : 0;
        
        return {
          account,
          debit: netDebit,
          credit: netCredit,
        };
      })
      .filter(entry => entry.debit > 0 || entry.credit > 0);

    // Sort by account name
    trialBalanceArray.sort((a, b) => a.account.localeCompare(b.account));

    return NextResponse.json(trialBalanceArray);
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return NextResponse.json(
      { error: "Failed to generate trial balance" },
      { status: 500 }
    );
  }
}
