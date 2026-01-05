import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { createClient } from "@supabase/supabase-js";
import { authConfig } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category_name, description } = body;

    if (!category_name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Insert custom category
    const { data: category, error: categoryError } = await supabase
      .from("custom_expense_categories")
      .insert({
        user_id: userData.id,
        category_name,
        description: description || null,
      })
      .select()
      .single();

    if (categoryError) {
      if (categoryError.code === "23505") {
        return NextResponse.json(
          { error: "Custom category already exists" },
          { status: 400 }
        );
      }
      throw categoryError;
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error creating custom category:", error);
    return NextResponse.json(
      { error: "Failed to create custom category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete custom category
    const { error: deleteError } = await supabase
      .from("custom_expense_categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting custom category:", error);
    return NextResponse.json(
      { error: "Failed to delete custom category" },
      { status: 500 }
    );
  }
}
