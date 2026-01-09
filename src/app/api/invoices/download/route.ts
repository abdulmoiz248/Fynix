import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/auth"
import { supabaseAdmin } from "@/lib/supabase"

type Session = {
  user?: {
    email?: string | null
  }
}

export async function GET(request: NextRequest) {
  const session = (await getServerSession(authConfig)) as Session | null

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("id")

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
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
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(invoice, invoice.invoice_items)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any, items: any[]): string {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">${item.description}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">${item.quantity}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: right;">Rs.${Number.parseFloat(item.unit_price).toFixed(2)}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: right;">Rs.${Number.parseFloat(item.amount).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("")

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
      color: #e5e7eb;
      background: rgb(10, 10, 10);
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo { 
      font-size: 36px; 
      font-weight: 800; 
      color: #ffffff;
      letter-spacing: -1px;
    }
    .invoice-title { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 8px;
      color: #ffffff;
    }
    .invoice-number {
      font-size: 16px;
      color: #9ca3af;
    }
    .invoice-details { 
      display: flex;
      justify-content: space-between;
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(12px);
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 40px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .detail-section h3 {
      margin: 0 0 15px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #9ca3af;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .detail-section p {
      margin: 6px 0;
      font-size: 15px;
      line-height: 1.6;
      color: #e5e7eb;
    }
    .detail-section strong {
      color: #ffffff;
    }
    table { 
      width: 100%; 
      border-collapse: collapse;
      margin-bottom: 40px;
      background: rgba(20, 20, 20, 0.4);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th { 
      background: rgba(0, 0, 0, 0.4);
      color: #ffffff;
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }
    th:nth-child(2), td:nth-child(2) { text-align: center; }
    th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) { text-align: right; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: rgba(30, 30, 30, 0.5); }
    .totals { 
      max-width: 400px;
      margin-left: auto;
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(12px);
      padding: 25px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .totals-row { 
      display: flex; 
      justify-content: space-between;
      padding: 8px 0;
      font-size: 15px;
    }
    .totals-label { 
      font-weight: 500;
      color: #9ca3af;
    }
    .totals-value { 
      font-weight: 600;
      color: #e5e7eb;
    }
    .total { 
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid rgba(255, 255, 255, 0.1);
    }
    .notes-section {
      margin-top: 40px;
      padding: 25px;
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 8px;
      border-left: 4px solid rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .notes-section h4 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    }
    .notes-section p {
      margin: 0;
      line-height: 1.7;
      color: #d1d5db;
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
    .status-draft { background: rgba(107, 114, 128, 0.3); color: #d1d5db; }
    .status-sent { background: rgba(30, 58, 138, 0.3); color: #93c5fd; }
    .status-paid { background: rgba(5, 46, 22, 0.3); color: #86efac; }
    .status-overdue { background: rgba(127, 29, 29, 0.3); color: #fca5a5; }
    .no-print {
      margin: 20px 0;
      padding: 15px;
      background: rgba(30, 58, 138, 0.2);
      border: 1px solid rgba(147, 197, 253, 0.3);
      border-radius: 8px;
      text-align: center;
      backdrop-filter: blur(8px);
    }
    .print-button {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .print-button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
   

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
        <p><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Due:</strong> ${new Date(invoice.due_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
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
        <div class="totals-value">Rs.${Number.parseFloat(invoice.subtotal).toFixed(2)}</div>
      </div>
      ${
        invoice.discount_amount > 0
          ? `
      <div class="totals-row">
        <div class="totals-label">Discount:</div>
        <div class="totals-value">-Rs.${Number.parseFloat(invoice.discount_amount).toFixed(2)}</div>
      </div>
      `
          : ""
      }
      ${
        invoice.tax_amount > 0
          ? `
      <div class="totals-row">
        <div class="totals-label">Tax (${invoice.tax_rate}%):</div>
        <div class="totals-value">Rs.${Number.parseFloat(invoice.tax_amount).toFixed(2)}</div>
      </div>
      `
          : ""
      }
      <div class="totals-row total">
        <div class="totals-label">Total:</div>
        <div class="totals-value">Rs.${Number.parseFloat(invoice.total_amount).toFixed(2)}</div>
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
  `
}
