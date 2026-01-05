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
