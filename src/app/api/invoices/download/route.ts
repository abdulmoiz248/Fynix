import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

type Session = {
  user?: {
    email?: string | null;
  };
};

export async function GET(request: NextRequest) {
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
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("id", invoiceId)
      .eq("user_id", userData.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(invoice, invoice.invoice_items);

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: any, items: any[]): string {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${parseFloat(item.unit_price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${parseFloat(item.amount).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1f2937;
      background: #ffffff;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo { 
      font-size: 36px; 
      font-weight: 800; 
      color: #2563eb;
      letter-spacing: -1px;
    }
    .invoice-title { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 8px;
      color: #1f2937;
    }
    .invoice-number {
      font-size: 16px;
      color: #6b7280;
    }
    .invoice-details { 
      display: flex;
      justify-content: space-between;
      background: #f9fafb;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 40px;
      border: 1px solid #e5e7eb;
    }
    .detail-section h3 {
      margin: 0 0 15px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .detail-section p {
      margin: 6px 0;
      font-size: 15px;
      line-height: 1.6;
    }
    .detail-section strong {
      color: #1f2937;
    }
    table { 
      width: 100%; 
      border-collapse: collapse;
      margin-bottom: 40px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    th { 
      background: #2563eb;
      color: white;
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:nth-child(2), td:nth-child(2) { text-align: center; }
    th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) { text-align: right; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #f9fafb; }
    .totals { 
      max-width: 400px;
      margin-left: auto;
      background: #f9fafb;
      padding: 25px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .totals-row { 
      display: flex; 
      justify-content: space-between;
      padding: 8px 0;
      font-size: 15px;
    }
    .totals-label { 
      font-weight: 500;
      color: #6b7280;
    }
    .totals-value { 
      font-weight: 600;
      color: #1f2937;
    }
    .total { 
      font-size: 22px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #2563eb;
    }
    .notes-section {
      margin-top: 40px;
      padding: 25px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .notes-section h4 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .notes-section p {
      margin: 0;
      line-height: 1.7;
      color: #4b5563;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-draft { background: #e5e7eb; color: #4b5563; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .no-print {
      margin: 20px 0;
      padding: 15px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      text-align: center;
    }
    .print-button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .print-button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print">
      <button class="print-button" onclick="window.print()">Print Invoice</button>
    </div>

    <div class="header">
      <div class="logo-section">
        <div class="logo">FYNIX</div>
      </div>
      <div style="text-align: right;">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">#${invoice.invoice_number}</div>
      </div>
    </div>

    <div class="invoice-details">
      <div class="detail-section">
        <h3>Bill To</h3>
        <p><strong>${invoice.client_name}</strong></p>
        <p>${invoice.client_email}</p>
        ${invoice.client_phone ? `<p>${invoice.client_phone}</p>` : ""}
        ${invoice.client_address ? `<p>${invoice.client_address}</p>` : ""}
      </div>
      <div class="detail-section" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Due:</strong> ${new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
        <p><strong>Type:</strong> ${invoice.type.toUpperCase()}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <div class="totals-label">Subtotal:</div>
        <div class="totals-value">$${parseFloat(invoice.subtotal).toFixed(2)}</div>
      </div>
      ${
        invoice.discount_amount > 0
          ? `
      <div class="totals-row">
        <div class="totals-label">Discount:</div>
        <div class="totals-value">-$${parseFloat(invoice.discount_amount).toFixed(2)}</div>
      </div>
      `
          : ""
      }
      ${
        invoice.tax_amount > 0
          ? `
      <div class="totals-row">
        <div class="totals-label">Tax (${invoice.tax_rate}%):</div>
        <div class="totals-value">$${parseFloat(invoice.tax_amount).toFixed(2)}</div>
      </div>
      `
          : ""
      }
      <div class="totals-row total">
        <div class="totals-label">Total:</div>
        <div class="totals-value">$${parseFloat(invoice.total_amount).toFixed(2)}</div>
      </div>
    </div>

    ${
      invoice.notes
        ? `
    <div class="notes-section">
      <h4>Notes</h4>
      <p>${invoice.notes}</p>
    </div>
    `
        : ""
    }
    
    ${
      invoice.terms
        ? `
    <div class="notes-section" style="margin-top: 20px;">
      <h4>Terms & Conditions</h4>
      <p>${invoice.terms}</p>
    </div>
    `
        : ""
    }
  </div>
</body>
</html>
  `;
}
