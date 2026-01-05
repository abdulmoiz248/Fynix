import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Get all PSX stock symbols
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: stocks, error } = await supabaseAdmin
      .from("psx_stocks")
      .select("*")
      .order("symbol", { ascending: true });

    if (error) {
      console.error("Error fetching PSX stocks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stocks: stocks || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a new PSX stock symbol
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await request.json();
    const { symbol, company_name, sector, current_price } = body;

    // Validate required fields
    if (!symbol || !company_name) {
      return NextResponse.json(
        { error: "Symbol and company name are required" },
        { status: 400 }
      );
    }

    // Check if symbol already exists
    const { data: existingStock, error: checkError } = await supabaseAdmin
      .from("psx_stocks")
      .select("symbol")
      .eq("symbol", symbol.toUpperCase())
      .single();

    if (existingStock) {
      return NextResponse.json(
        { error: "Stock symbol already exists" },
        { status: 409 }
      );
    }

    // Insert new stock
    const { data: newStock, error } = await supabaseAdmin
      .from("psx_stocks")
      .insert({
        symbol: symbol.toUpperCase(),
        company_name,
        sector: sector || null,
        current_price: current_price || null,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding PSX stock:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stock: newStock }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
