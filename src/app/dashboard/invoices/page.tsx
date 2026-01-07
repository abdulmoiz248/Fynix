"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Download, 
  Mail, 
  Edit, 
  Trash2, 
  X, 
  DollarSign,
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  Check,
  ArrowLeft,
  Loader2,
  Receipt
} from "lucide-react";

type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address?: string;
  client_phone?: string;
  invoice_date: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  type: "income" | "expense";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  invoice_items: InvoiceItem[];
  created_at: string;
};

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [sending, setSending] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    invoice_number: string;
    client_name: string;
    client_email: string;
    client_address: string;
    client_phone: string;
    invoice_date: string;
    due_date: string;
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
    type: "income" | "expense";
    tax_rate: number;
    discount_amount: number;
    notes: string;
    terms: string;
    items: InvoiceItem[];
  }>({
    invoice_number: "",
    client_name: "",
    client_email: "",
    client_address: "",
    client_phone: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "draft",
    type: "income",
    tax_rate: 0,
    discount_amount: 0,
    notes: "",
    terms: "",
    items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchInvoices();
    }
  }, [status, router]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV-${year}${month}-${random}`;
  };

  const handleOpenModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_address: invoice.client_address || "",
        client_phone: invoice.client_phone || "",
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        status: invoice.status,
        type: invoice.type,
        tax_rate: invoice.tax_rate,
        discount_amount: invoice.discount_amount,
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        items: invoice.invoice_items.length > 0 
          ? invoice.invoice_items 
          : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        invoice_number: generateInvoiceNumber(),
        client_name: "",
        client_email: "",
        client_address: "",
        client_phone: "",
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "draft",
        type: "income",
        tax_rate: 0,
        discount_amount: 0,
        notes: "",
        terms: "",
        items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit_price: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount
    if (field === "quantity" || field === "unit_price") {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal - formData.discount_amount) * (formData.tax_rate / 100);
    const total = subtotal - formData.discount_amount + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, taxAmount, total } = calculateTotals();
    
    const invoiceData = {
      ...formData,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
    };

    try {
      let response;
      if (editingInvoice) {
        response = await fetch("/api/invoices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...invoiceData, id: editingInvoice.id }),
        });
      } else {
        response = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceData),
        });
      }

      if (response.ok) {
        await fetchInvoices();
        handleCloseModal();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`/api/invoices?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchInvoices();
      } else {
        alert("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/download?id=${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${id}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download invoice");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice");
    }
  };

  const handleSendEmail = async (id: string, clientEmail: string) => {
    const message = prompt(
      `Send invoice to ${clientEmail}?\n\nEnter a custom message (optional):`,
      "Please find attached your invoice. Thank you for your business!"
    );
    
    if (message === null) return; // User cancelled

    setSending(true);
    try {
      const response = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id, message }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Invoice sent successfully!");
        await fetchInvoices();
      } else {
        alert(data.error || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      alert("Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  const handleAddToTransaction = async (id: string, type: string) => {
    if (!confirm(`Add this invoice as ${type}?`)) return;

    setAddingTransaction(id);
    try {
      const response = await fetch("/api/invoices/add-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Invoice added as ${type} successfully!`);
      } else {
        alert(data.error || "Failed to add to transactions");
      }
    } catch (error) {
      console.error("Error adding to transactions:", error);
      alert("Failed to add to transactions");
    } finally {
      setAddingTransaction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
      case "sent": return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
      case "paid": return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "overdue": return "bg-red-500/20 text-red-300 border border-red-500/30";
      case "cancelled": return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      default: return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-40 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 rounded-lg hover:bg-slate-800/50 transition text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Invoices
                </h1>
                <p className="text-sm text-slate-400">Create and manage your invoices</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={20} />
              New Invoice
            </button>
          </div>
        </div>
      </header>

      {/* Decorative Separator */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center py-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Invoices List */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">No invoices yet</h3>
              <p className="text-slate-400 mb-6">Create your first invoice to get started</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <Plus size={20} />
                Create Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-700/20 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-200">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-200">
                          {invoice.client_name}
                        </div>
                        <div className="text-sm text-slate-400">{invoice.client_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.type === "income" 
                            ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}>
                          {invoice.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">
                        ${invoice.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAddToTransaction(invoice.id, invoice.type)}
                            disabled={addingTransaction === invoice.id}
                            className="text-slate-400 hover:text-purple-400 p-2 hover:bg-purple-500/10 rounded-lg transition disabled:opacity-50"
                            title={`Add as ${invoice.type}`}
                          >
                            {addingTransaction === invoice.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Receipt size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownload(invoice.id)}
                            className="text-slate-400 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition"
                            title="Download"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleSendEmail(invoice.id, invoice.client_email)}
                            disabled={sending}
                            className="text-slate-400 hover:text-green-400 p-2 hover:bg-green-500/10 rounded-lg transition disabled:opacity-50"
                            title="Send Email"
                          >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                          </button>
                          <button
                            onClick={() => handleOpenModal(invoice)}
                            className="text-slate-400 hover:text-orange-400 p-2 hover:bg-orange-500/10 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10 rounded-t-xl">
              <h2 className="text-2xl font-bold text-slate-100">
                {editingInvoice ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-700/50 transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <User size={16} className="inline mr-1" />
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  />
                </div>

                {/* Client Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  />
                </div>

                {/* Client Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Phone size={16} className="inline mr-1" />
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  />
                </div>

                {/* Client Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Client Address
                  </label>
                  <input
                    type="text"
                    value={formData.client_address}
                    onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  />
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Invoice Items *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 transition"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start bg-slate-900/30 border border-slate-700/50 p-4 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Description"
                            required
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Qty"
                            required
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Price"
                            required
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200 min-w-[80px] text-right">
                          ${item.amount.toFixed(2)}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="mb-6 bg-slate-900/30 border border-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Subtotal:</span>
                  <span className="text-sm font-medium text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                {formData.discount_amount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Discount:</span>
                    <span className="text-sm font-medium text-slate-200">-${formData.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {formData.tax_rate > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Tax ({formData.tax_rate}%):</span>
                    <span className="text-sm font-medium text-slate-200">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-lg font-bold text-slate-100">Total:</span>
                  <span className="text-lg font-bold text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  placeholder="Additional notes for the client..."
                />
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                  placeholder="Payment terms and conditions..."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700/50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition shadow-lg shadow-orange-500/20"
                >
                  <Check size={20} />
                  {editingInvoice ? "Update Invoice" : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
