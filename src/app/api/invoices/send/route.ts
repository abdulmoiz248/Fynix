import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

type Session = {
  user?: {
    email?: string | null;
  };
};

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
      .select("id, email, name, access_token")
      .eq("email", session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { invoiceId, message } = body;

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

    // Check if Gmail API is configured
    if (!userData.access_token) {
      return NextResponse.json(
        { error: "Gmail not connected. Please connect your Gmail account first." },
        { status: 400 }
      );
    }

    // Generate PDF HTML content
    const pdfHtml = generateInvoiceHTML(invoice, invoice.invoice_items);

    // Send email via Gmail API
    const emailSent = await sendEmailViaGmail(
      userData.access_token,
      invoice.client_email,
      userData.email,
      `Invoice ${invoice.invoice_number}`,
      message || `Please find attached invoice ${invoice.invoice_number}.`,
      pdfHtml,
      invoice.invoice_number
    );

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Update invoice status to sent
    await supabaseAdmin
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);

    return NextResponse.json({ success: true, message: "Invoice sent successfully" });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: any, items: any[]): string {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(item.unit_price).toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(item.amount).toFixed(2)}</td>
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
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
    .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; }
    .totals { text-align: right; }
    .totals-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .totals-label { width: 150px; font-weight: bold; }
    .totals-value { width: 150px; text-align: right; }
    .total { font-size: 20px; font-weight: bold; color: #2563eb; margin-top: 10px; padding-top: 10px; border-top: 2px solid #2563eb; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">FYNIX</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <div>#${invoice.invoice_number}</div>
    </div>
  </div>

  <div class="invoice-details">
    <div style="display: flex; justify-content: space-between;">
      <div>
        <h3>Bill To:</h3>
        <p><strong>${invoice.client_name}</strong></p>
        <p>${invoice.client_email}</p>
        ${invoice.client_phone ? `<p>${invoice.client_phone}</p>` : ""}
        ${invoice.client_address ? `<p>${invoice.client_address}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Quantity</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Amount</th>
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

  ${invoice.notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><p>${invoice.notes}</p></div>` : ""}
  ${invoice.terms ? `<div style="margin-top: 20px;"><strong>Terms & Conditions:</strong><p>${invoice.terms}</p></div>` : ""}
</body>
</html>
  `;
}

async function sendEmailViaGmail(
  accessToken: string,
  to: string,
  from: string,
  subject: string,
  message: string,
  htmlContent: string,
  invoiceNumber: string
): Promise<boolean> {
  try {
    const boundary = "invoice_boundary_" + Date.now();
    
    const emailContent = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      message,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      `Content-Disposition: attachment; filename="invoice-${invoiceNumber}.html"`,
      "",
      htmlContent,
      "",
      `--${boundary}--`,
    ].join("\r\n");

    const encodedEmail = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending email via Gmail:", error);
    return false;
  }
}
