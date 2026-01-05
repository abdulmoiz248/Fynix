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

// GET - List all user stocks with current values
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

    const { data: stocks, error } = await supabaseAdmin
      .from("stocks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stocks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get current prices for all symbols
    const symbols = stocks?.map((s: any) => s.symbol) || [];
    const { data: psxData } = await supabaseAdmin
      .from("psx_stocks")
      .select("symbol, current_price")
      .in("symbol", symbols);

    const priceMap = new Map(psxData?.map((p: any) => [p.symbol, p.current_price]) || []);

    const enrichedStocks = stocks?.map((stock: any) => ({
      ...stock,
      current_price: priceMap.get(stock.symbol) || 0,
      current_value: (priceMap.get(stock.symbol) || 0) * parseFloat(stock.total_shares),
      profit_loss:
        (priceMap.get(stock.symbol) || 0) * parseFloat(stock.total_shares) -
        parseFloat(stock.total_invested),
    }));

    return NextResponse.json({ stocks: enrichedStocks || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buy stock
export async function POST(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      symbol: string;
      shares: number;
      price_per_share: number;
      transaction_date?: string;
    };

    const { symbol, shares, price_per_share, transaction_date } = body;

    if (!symbol || !shares || !price_per_share) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, shares, price_per_share" },
        { status: 400 }
      );
    }

    if (shares <= 0 || price_per_share <= 0) {
      return NextResponse.json({ error: "Shares and price must be positive" }, { status: 400 });
    }

    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const totalAmount = shares * price_per_share;

    // Get cash account
    const { data: cashAccount, error: cashError } = await supabaseAdmin
      .from("cash_account")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (cashError && cashError.code !== "PGRST116") {
      throw new Error("Error fetching cash account");
    }

    // Check if user has enough balance
    if (!cashAccount || parseFloat(cashAccount.balance) < totalAmount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Get stock symbol info
    const { data: psxStock } = await supabaseAdmin
      .from("psx_stocks")
      .select("company_name")
      .eq("symbol", symbol)
      .single();

    const companyName = psxStock?.company_name || symbol;

    // Check if user already owns this stock
    const { data: existingStock } = await supabaseAdmin
      .from("stocks")
      .select("*")
      .eq("user_id", userId)
      .eq("symbol", symbol)
      .single();

    let stockId;

    if (existingStock) {
      // Update existing stock - calculate new average
      const currentShares = parseFloat(existingStock.total_shares);
      const currentInvested = parseFloat(existingStock.total_invested);
      const newTotalShares = currentShares + shares;
      const newTotalInvested = currentInvested + totalAmount;
      const newAvgPrice = newTotalInvested / newTotalShares;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("stocks")
        .update({
          total_shares: newTotalShares,
          avg_buy_price: newAvgPrice,
          total_invested: newTotalInvested,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStock.id)
        .select()
        .single();

      if (updateError) throw updateError;
      stockId = updated.id;
    } else {
      // Create new stock entry
      const { data: newStock, error: insertError } = await supabaseAdmin
        .from("stocks")
        .insert({
          user_id: userId,
          symbol,
          company_name: companyName,
          total_shares: shares,
          avg_buy_price: price_per_share,
          total_invested: totalAmount,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      stockId = newStock.id;
    }

    // Record transaction
    await supabaseAdmin.from("stock_transactions").insert({
      user_id: userId,
      stock_id: stockId,
      symbol,
      company_name: companyName,
      transaction_type: "buy",
      shares,
      price_per_share,
      total_amount: totalAmount,
      transaction_date: transaction_date || new Date().toISOString().split("T")[0],
    });

    // Update cash account
    await supabaseAdmin
      .from("cash_account")
      .update({
        balance: parseFloat(cashAccount.balance) - totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({ success: true, message: "Stock purchased successfully" });
  } catch (error) {
    console.error("Error buying stock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Sell stock
export async function PUT(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      symbol: string;
      shares: number;
      price_per_share: number;
      transaction_date?: string;
    };

    const { symbol, shares, price_per_share, transaction_date } = body;

    if (!symbol || !shares || !price_per_share) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, shares, price_per_share" },
        { status: 400 }
      );
    }

    if (shares <= 0 || price_per_share <= 0) {
      return NextResponse.json({ error: "Shares and price must be positive" }, { status: 400 });
    }

    const userId = await getUserId(session.user.email);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get user's stock
    const { data: stock, error: stockError } = await supabaseAdmin
      .from("stocks")
      .select("*")
      .eq("user_id", userId)
      .eq("symbol", symbol)
      .single();

    if (stockError || !stock) {
      return NextResponse.json({ error: "Stock not found in portfolio" }, { status: 404 });
    }

    const currentShares = parseFloat(stock.total_shares);

    if (currentShares < shares) {
      return NextResponse.json({ error: "Insufficient shares to sell" }, { status: 400 });
    }

    const totalAmount = shares * price_per_share;
    const avgCostBasis = parseFloat(stock.avg_buy_price);
    const costBasis = avgCostBasis * shares;
    const profitLoss = totalAmount - costBasis;

    const newTotalShares = currentShares - shares;
    const newTotalInvested = parseFloat(stock.total_invested) - costBasis;

    // Record transaction
    await supabaseAdmin.from("stock_transactions").insert({
      user_id: userId,
      stock_id: stock.id,
      symbol,
      company_name: stock.company_name,
      transaction_type: "sell",
      shares,
      price_per_share,
      total_amount: totalAmount,
      profit_loss: profitLoss,
      avg_cost_basis: avgCostBasis,
      transaction_date: transaction_date || new Date().toISOString().split("T")[0],
    });

    if (newTotalShares === 0) {
      // Delete stock entry if all shares sold
      await supabaseAdmin.from("stocks").delete().eq("id", stock.id);
    } else {
      // Update stock entry
      await supabaseAdmin
        .from("stocks")
        .update({
          total_shares: newTotalShares,
          total_invested: newTotalInvested,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stock.id);
    }

    // Update cash account
    const { data: cashAccount } = await supabaseAdmin
      .from("cash_account")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (cashAccount) {
      await supabaseAdmin
        .from("cash_account")
        .update({
          balance: parseFloat(cashAccount.balance) + totalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    return NextResponse.json({
      success: true,
      message: "Stock sold successfully",
      profit_loss: profitLoss,
    });
  } catch (error) {
    console.error("Error selling stock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
