import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

type JournalEntry = {
  id: string;
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
};

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

    const journalEntries: JournalEntry[] = [];

    // Transactions
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (transactions) {
      transactions.forEach((t) => {
        if (t.type === "income") {
          journalEntries.push({
            id: `txn-${t.id}`,
            date: t.date,
            description: t.description || `${t.category} income`,
            debit_account: "Cash",
            credit_account: `Revenue - ${t.category}`,
            amount: Number(t.amount),
          });
        } else {
          journalEntries.push({
            id: `txn-${t.id}`,
            date: t.date,
            description: t.description || `${t.category} expense`,
            debit_account: `Expense - ${t.category}`,
            credit_account: "Cash",
            amount: Number(t.amount),
          });
        }
      });
    }

    // Invoices
    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate)
      .order("invoice_date", { ascending: true });

    if (invoices) {
      invoices.forEach((inv) => {
        if (inv.type === "income") {
          if (inv.status === "paid") {
            journalEntries.push({
              id: `inv-${inv.id}`,
              date: inv.invoice_date,
              description: `Invoice #${inv.invoice_number} - ${inv.client_name} (Paid)`,
              debit_account: "Cash",
              credit_account: "Revenue - Invoiced",
              amount: Number(inv.total_amount),
            });
          } else {
            journalEntries.push({
              id: `inv-${inv.id}`,
              date: inv.invoice_date,
              description: `Invoice #${inv.invoice_number} - ${inv.client_name}`,
              debit_account: "Accounts Receivable",
              credit_account: "Revenue - Invoiced",
              amount: Number(inv.total_amount),
            });
          }
        } else {
          if (inv.status === "paid") {
            journalEntries.push({
              id: `inv-${inv.id}`,
              date: inv.invoice_date,
              description: `Expense Invoice #${inv.invoice_number} - ${inv.client_name} (Paid)`,
              debit_account: "Expense - Invoiced",
              credit_account: "Cash",
              amount: Number(inv.total_amount),
            });
          } else {
            journalEntries.push({
              id: `inv-${inv.id}`,
              date: inv.invoice_date,
              description: `Expense Invoice #${inv.invoice_number} - ${inv.client_name}`,
              debit_account: "Expense - Invoiced",
              credit_account: "Accounts Payable",
              amount: Number(inv.total_amount),
            });
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
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (stockTransactions) {
      stockTransactions.forEach((st) => {
        const amount = Number(st.quantity) * Number(st.price_per_share);
        if (st.transaction_type === "buy") {
          journalEntries.push({
            id: `stock-${st.id}`,
            date: st.transaction_date,
            description: `Buy ${st.quantity} shares of ${st.stock_symbol}`,
            debit_account: "Investments - Stocks",
            credit_account: "Cash",
            amount: amount,
          });
        } else if (st.transaction_type === "sell") {
          journalEntries.push({
            id: `stock-${st.id}`,
            date: st.transaction_date,
            description: `Sell ${st.quantity} shares of ${st.stock_symbol}`,
            debit_account: "Cash",
            credit_account: "Investments - Stocks",
            amount: amount,
          });
        }
      });
    }

    // Mutual fund transactions
    const { data: mutualFundTransactions } = await supabaseAdmin
      .from("mutual_fund_transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (mutualFundTransactions) {
      mutualFundTransactions.forEach((mf) => {
        const amount = Number(mf.units) * Number(mf.price_per_unit);
        if (mf.transaction_type === "buy") {
          journalEntries.push({
            id: `mf-${mf.id}`,
            date: mf.transaction_date,
            description: `Buy ${mf.units} units of ${mf.fund_name}`,
            debit_account: "Investments - Mutual Funds",
            credit_account: "Cash",
            amount: amount,
          });
        } else if (mf.transaction_type === "sell") {
          journalEntries.push({
            id: `mf-${mf.id}`,
            date: mf.transaction_date,
            description: `Sell ${mf.units} units of ${mf.fund_name}`,
            debit_account: "Cash",
            credit_account: "Investments - Mutual Funds",
            amount: amount,
          });
        }
      });
    }

    // Trading fees
    const { data: tradingFees } = await supabaseAdmin
      .from("trading_fees")
      .select("*")
      .eq("user_id", user.id)
      .gte("fee_date", startDate)
      .lte("fee_date", endDate)
      .order("fee_date", { ascending: true });

    if (tradingFees) {
      tradingFees.forEach((fee) => {
        journalEntries.push({
          id: `fee-${fee.id}`,
          date: fee.fee_date,
          description: fee.description || `Trading fee - ${fee.fee_type}`,
          debit_account: `Expense - ${fee.fee_type}`,
          credit_account: "Cash",
          amount: Number(fee.amount),
        });
      });
    }

    // Sort all entries by date
    journalEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(journalEntries);
  } catch (error) {
    console.error("Error generating journal entries:", error);
    return NextResponse.json(
      { error: "Failed to generate journal entries" },
      { status: 500 }
    );
  }
}
