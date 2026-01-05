import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

type Session = {
  user?: {
    email?: string | null;
  };
};

// GET all invoices for the user
export async function GET() {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices ?? [] });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new invoice
export async function POST(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      invoice_number,
      client_name,
      client_email,
      client_address,
      client_phone,
      invoice_date,
      due_date,
      status,
      type,
      subtotal,
      tax_rate,
      tax_amount,
      discount_amount,
      total_amount,
      notes,
      terms,
      items,
    } = body;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .insert({
        user_id: userData.id,
        invoice_number,
        client_name,
        client_email,
        client_address,
        client_phone,
        invoice_date,
        due_date,
        status: status || "draft",
        type: type || "income",
        subtotal,
        tax_rate,
        tax_amount,
        discount_amount,
        total_amount,
        notes,
        terms,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error("Error creating invoice:", invoiceError);
      return NextResponse.json({ error: invoiceError?.message || "Failed to create invoice" }, { status: 500 });
    }

    // Create invoice items
    if (items && items.length > 0) {
      const invoiceItems = items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        // Rollback invoice creation
        await supabaseAdmin.from("invoices").delete().eq("id", invoice.id);
        return NextResponse.json({ error: "Failed to create invoice items" }, { status: 500 });
      }
    }

    // Fetch the complete invoice with items
    const { data: completeInvoice } = await supabaseAdmin
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("id", invoice.id)
      .single();

    return NextResponse.json({ invoice: completeInvoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update an invoice
export async function PATCH(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, items, ...invoiceData } = body;

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Update invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .update(invoiceData)
      .eq("id", id)
      .eq("user_id", userData.id)
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error("Error updating invoice:", invoiceError);
      return NextResponse.json({ error: invoiceError?.message || "Failed to update invoice" }, { status: 500 });
    }

    // Update invoice items if provided
    if (items) {
      // Delete existing items
      await supabaseAdmin.from("invoice_items").delete().eq("invoice_id", id);

      // Insert new items
      if (items.length > 0) {
        const invoiceItems = items.map((item: any) => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from("invoice_items")
          .insert(invoiceItems);

        if (itemsError) {
          console.error("Error updating invoice items:", itemsError);
          return NextResponse.json({ error: "Failed to update invoice items" }, { status: 500 });
        }
      }
    }

    // Fetch the complete invoice with items
    const { data: completeInvoice } = await supabaseAdmin
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("id", id)
      .single();

    return NextResponse.json({ invoice: completeInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE an invoice
export async function DELETE(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.id);

    if (error) {
      console.error("Error deleting invoice:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
