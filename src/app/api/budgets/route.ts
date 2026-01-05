import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userData.id)
      .order("category", { ascending: true });

    if (budgetsError) {
      throw budgetsError;
    }

    // Get custom categories
    const { data: customCategories, error: categoriesError } = await supabase
      .from("custom_expense_categories")
      .select("*")
      .eq("user_id", userData.id)
      .order("category_name", { ascending: true });

    if (categoriesError) {
      throw categoriesError;
    }

    // Get transactions for current period to calculate spending
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("category, amount")
      .eq("user_id", userData.id)
      .eq("type", "expense")
      .gte("date", firstDayOfMonth)
      .lte("date", lastDayOfMonth);

    if (transactionsError) {
      throw transactionsError;
    }

    // Calculate spending per category
    const spendingByCategory: Record<string, number> = {};
    transactions?.forEach((transaction) => {
      spendingByCategory[transaction.category] = 
        (spendingByCategory[transaction.category] || 0) + transaction.amount;
    });

    return NextResponse.json({
      budgets: budgets || [],
      customCategories: customCategories || [],
      spendingByCategory,
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, budget_amount, period, is_custom_category } = body;

    if (!category || budget_amount === undefined || !period) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Insert budget
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        user_id: userData.id,
        category,
        budget_amount: parseFloat(budget_amount),
        period,
        is_custom_category: is_custom_category || false,
      })
      .select()
      .single();

    if (budgetError) {
      if (budgetError.code === "23505") {
        return NextResponse.json(
          { error: "Budget already exists for this category and period" },
          { status: 400 }
        );
      }
      throw budgetError;
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, budget_amount } = body;

    if (!id || budget_amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Update budget
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .update({ budget_amount: parseFloat(budget_amount) })
      .eq("id", id)
      .eq("user_id", userData.id)
      .select()
      .single();

    if (budgetError) {
      throw budgetError;
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
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
        { error: "Budget ID is required" },
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

    // Delete budget
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
