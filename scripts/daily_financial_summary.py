"""
Daily Financial Summary Script
Generates a comprehensive daily financial report including:
- Income and expenses for today
- Budget status and alerts
- Upcoming recurring payments
- Portfolio analytics (stocks & mutual funds)
- Invoice status
- Complete financial analytics
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class DailyFinancialSummary:
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.user_data = self._get_user_data()
        self.user_id = self.user_data['id']
        self.user_name = self.user_data.get('name', 'User')
        self.today = datetime.now().date()
        self.two_days_later = self.today + timedelta(days=2)
        
    def _get_user_data(self) -> Dict:
        """Fetch user data by email"""
        response = supabase.table('users').select('*').eq('email', self.user_email).execute()
        if not response.data:
            raise ValueError(f"User with email {self.user_email} not found")
        return response.data[0]
    
    def get_today_transactions(self) -> Dict[str, Any]:
        """Get today's income and expenses"""
        response = supabase.table('transactions').select('*').eq(
            'user_id', self.user_id
        ).eq('date', self.today.isoformat()).execute()
        
        transactions = response.data
        income = sum(t['amount'] for t in transactions if t['type'] == 'income')
        expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        
        # Group by category
        expense_by_category = {}
        income_by_category = {}
        
        for t in transactions:
            if t['type'] == 'expense':
                expense_by_category[t['category']] = expense_by_category.get(t['category'], 0) + float(t['amount'])
            else:
                income_by_category[t['category']] = income_by_category.get(t['category'], 0) + float(t['amount'])
        
        return {
            'total_income': float(income),
            'total_expenses': float(expenses),
            'net': float(income - expenses),
            'transactions': transactions,
            'expense_by_category': expense_by_category,
            'income_by_category': income_by_category,
            'count': len(transactions)
        }
    
    def get_month_summary(self) -> Dict[str, Any]:
        """Get current month's summary"""
        first_day = self.today.replace(day=1)
        
        response = supabase.table('transactions').select('*').eq(
            'user_id', self.user_id
        ).gte('date', first_day.isoformat()).lte('date', self.today.isoformat()).execute()
        
        transactions = response.data
        income = sum(t['amount'] for t in transactions if t['type'] == 'income')
        expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        
        return {
            'total_income': float(income),
            'total_expenses': float(expenses),
            'net': float(income - expenses),
            'transaction_count': len(transactions)
        }
    
    def get_budget_status(self) -> List[Dict[str, Any]]:
        """Get budget status with alerts for over-budget categories"""
        # Get monthly budgets
        response = supabase.table('budgets').select('*').eq(
            'user_id', self.user_id
        ).eq('period', 'monthly').execute()
        
        budgets = response.data
        first_day = self.today.replace(day=1)
        
        budget_status = []
        for budget in budgets:
            category = budget['category']
            budget_amount = float(budget['budget_amount'])
            
            # Get spending for this category this month
            trans_response = supabase.table('transactions').select('amount').eq(
                'user_id', self.user_id
            ).eq('type', 'expense').eq('category', category).gte(
                'date', first_day.isoformat()
            ).lte('date', self.today.isoformat()).execute()
            
            spent = sum(float(t['amount']) for t in trans_response.data)
            remaining = budget_amount - spent
            percentage = (spent / budget_amount * 100) if budget_amount > 0 else 0
            
            status_info = {
                'category': category,
                'budget': budget_amount,
                'spent': spent,
                'remaining': remaining,
                'percentage': percentage,
                'status': 'over_budget' if spent > budget_amount else 'warning' if percentage > 80 else 'good'
            }
            budget_status.append(status_info)
        
        return budget_status
    
    def get_upcoming_recurring_payments(self) -> List[Dict[str, Any]]:
        """Get recurring payments due within 2 days"""
        response = supabase.table('recurring_payments').select('*').eq(
            'user_id', self.user_id
        ).eq('status', 'active').lte(
            'next_payment_date', self.two_days_later.isoformat()
        ).gte(
            'next_payment_date', self.today.isoformat()
        ).order('next_payment_date').execute()
        
        return response.data
    
    def get_portfolio_summary(self) -> Dict[str, Any]:
        """Get stocks and mutual funds portfolio summary"""
        # Get stocks
        stocks_response = supabase.table('stocks').select('*').eq('user_id', self.user_id).execute()
        stocks = stocks_response.data
        
        total_stock_invested = sum(float(s['total_invested']) for s in stocks)
        
        # Get mutual funds
        mf_response = supabase.table('mutual_funds').select('*').eq('user_id', self.user_id).execute()
        mutual_funds = mf_response.data
        
        total_mf_invested = sum(float(mf['total_invested']) for mf in mutual_funds)
        total_mf_value = sum(float(mf['current_value']) for mf in mutual_funds)
        total_mf_profit = total_mf_value - total_mf_invested
        
        # Get cash account
        cash_response = supabase.table('cash_account').select('balance').eq('user_id', self.user_id).execute()
        cash_balance = float(cash_response.data[0]['balance']) if cash_response.data else 0
        
        return {
            'stocks': {
                'count': len(stocks),
                'total_invested': total_stock_invested,
                'holdings': stocks
            },
            'mutual_funds': {
                'count': len(mutual_funds),
                'total_invested': total_mf_invested,
                'current_value': total_mf_value,
                'profit_loss': total_mf_profit,
                'holdings': mutual_funds
            },
            'cash_balance': cash_balance,
            'total_portfolio_value': total_stock_invested + total_mf_value + cash_balance
        }
    
    def get_invoice_summary(self) -> Dict[str, Any]:
        """Get invoice summary"""
        response = supabase.table('invoices').select('*').eq('user_id', self.user_id).execute()
        invoices = response.data
        
        pending_income = sum(float(i['total_amount']) for i in invoices if i['status'] in ['sent'] and i['type'] == 'income')
        overdue_income = sum(float(i['total_amount']) for i in invoices if i['status'] == 'overdue' and i['type'] == 'income')
        pending_expenses = sum(float(i['total_amount']) for i in invoices if i['status'] in ['sent'] and i['type'] == 'expense')
        
        return {
            'total_invoices': len(invoices),
            'pending_income': pending_income,
            'overdue_income': overdue_income,
            'pending_expenses': pending_expenses,
            'overdue_count': len([i for i in invoices if i['status'] == 'overdue'])
        }
    
    def format_currency(self, amount: float) -> str:
        """Format currency with commas"""
        return f"Rs. {amount:,.2f}"
    
    def generate_summary_message(self) -> str:
        """Generate the complete beautiful summary message"""
        # Get all data
        today_trans = self.get_today_transactions()
        month_summary = self.get_month_summary()
        budget_status = self.get_budget_status()
        recurring = self.get_upcoming_recurring_payments()
        portfolio = self.get_portfolio_summary()
        invoices = self.get_invoice_summary()
        
        # Build the message
        lines = []
        lines.append("=" * 70)
        lines.append(f"📊 DAILY FINANCIAL SUMMARY - {self.today.strftime('%B %d, %Y')}")
        lines.append("=" * 70)
        lines.append(f"\n👤 User: {self.user_name}")
        lines.append(f"📧 Email: {self.user_email}\n")
        
        # TODAY'S TRANSACTIONS
        lines.append("─" * 70)
        lines.append("💰 TODAY'S ACTIVITY")
        lines.append("─" * 70)
        lines.append(f"  ✅ Income:    {self.format_currency(today_trans['total_income'])}")
        lines.append(f"  ❌ Expenses:  {self.format_currency(today_trans['total_expenses'])}")
        lines.append(f"  📈 Net:       {self.format_currency(today_trans['net'])}")
        lines.append(f"  📝 Transactions: {today_trans['count']}")
        
        if today_trans['expense_by_category']:
            lines.append("\n  Expenses by Category:")
            for cat, amount in sorted(today_trans['expense_by_category'].items(), key=lambda x: x[1], reverse=True):
                lines.append(f"    • {cat}: {self.format_currency(amount)}")
        
        if today_trans['income_by_category']:
            lines.append("\n  Income by Category:")
            for cat, amount in sorted(today_trans['income_by_category'].items(), key=lambda x: x[1], reverse=True):
                lines.append(f"    • {cat}: {self.format_currency(amount)}")
        
        # MONTH SUMMARY
        lines.append("\n" + "─" * 70)
        lines.append(f"📅 THIS MONTH ({self.today.strftime('%B %Y')})")
        lines.append("─" * 70)
        lines.append(f"  ✅ Total Income:    {self.format_currency(month_summary['total_income'])}")
        lines.append(f"  ❌ Total Expenses:  {self.format_currency(month_summary['total_expenses'])}")
        lines.append(f"  📈 Net:             {self.format_currency(month_summary['net'])}")
        lines.append(f"  📝 Transactions:    {month_summary['transaction_count']}")
        
        # BUDGET STATUS
        if budget_status:
            lines.append("\n" + "─" * 70)
            lines.append("🎯 BUDGET STATUS")
            lines.append("─" * 70)
            
            over_budget = [b for b in budget_status if b['status'] == 'over_budget']
            warning = [b for b in budget_status if b['status'] == 'warning']
            good = [b for b in budget_status if b['status'] == 'good']
            
            if over_budget:
                lines.append("  🚨 OVER BUDGET ALERT! 🚨")
                for b in over_budget:
                    lines.append(f"    • {b['category']}: {self.format_currency(b['spent'])} / {self.format_currency(b['budget'])}")
                    lines.append(f"      Over by: {self.format_currency(abs(b['remaining']))} ({b['percentage']:.1f}%)")
            
            if warning:
                lines.append("\n  ⚠️  WARNING - High Usage:")
                for b in warning:
                    lines.append(f"    • {b['category']}: {self.format_currency(b['spent'])} / {self.format_currency(b['budget'])}")
                    lines.append(f"      Remaining: {self.format_currency(b['remaining'])} ({100-b['percentage']:.1f}% left)")
            
            if good:
                lines.append("\n  ✅ On Track:")
                for b in good:
                    lines.append(f"    • {b['category']}: {self.format_currency(b['spent'])} / {self.format_currency(b['budget'])} ({b['percentage']:.1f}%)")
        
        # RECURRING PAYMENTS
        if recurring:
            lines.append("\n" + "─" * 70)
            lines.append("🔔 UPCOMING RECURRING PAYMENTS (Next 2 Days)")
            lines.append("─" * 70)
            for payment in recurring:
                next_date = datetime.strptime(payment['next_payment_date'], '%Y-%m-%d').date()
                days_until = (next_date - self.today).days
                
                if days_until == 0:
                    urgency = "⚠️  DUE TODAY!"
                elif days_until == 1:
                    urgency = "⏰ Due Tomorrow"
                else:
                    urgency = f"📅 Due in {days_until} days"
                
                lines.append(f"  {urgency}")
                lines.append(f"    • {payment['name']} ({payment['category']})")
                lines.append(f"    • Amount: {self.format_currency(float(payment['amount']))}")
                lines.append(f"    • Frequency: {payment['frequency'].capitalize()}")
                lines.append(f"    • Due: {next_date.strftime('%B %d, %Y')}\n")
        
        # PORTFOLIO SUMMARY
        lines.append("─" * 70)
        lines.append("💼 INVESTMENT PORTFOLIO")
        lines.append("─" * 70)
        lines.append(f"  💵 Cash Balance: {self.format_currency(portfolio['cash_balance'])}")
        lines.append(f"\n  📈 Stocks:")
        lines.append(f"    • Holdings: {portfolio['stocks']['count']} stocks")
        lines.append(f"    • Total Invested: {self.format_currency(portfolio['stocks']['total_invested'])}")
        
        lines.append(f"\n  🏦 Mutual Funds:")
        lines.append(f"    • Holdings: {portfolio['mutual_funds']['count']} funds")
        lines.append(f"    • Total Invested: {self.format_currency(portfolio['mutual_funds']['total_invested'])}")
        lines.append(f"    • Current Value: {self.format_currency(portfolio['mutual_funds']['current_value'])}")
        profit_indicator = "📈" if portfolio['mutual_funds']['profit_loss'] >= 0 else "📉"
        lines.append(f"    • Profit/Loss: {profit_indicator} {self.format_currency(portfolio['mutual_funds']['profit_loss'])}")
        
        lines.append(f"\n  💎 Total Portfolio Value: {self.format_currency(portfolio['total_portfolio_value'])}")
        
        # INVOICE SUMMARY
        if invoices['total_invoices'] > 0:
            lines.append("\n" + "─" * 70)
            lines.append("🧾 INVOICES")
            lines.append("─" * 70)
            lines.append(f"  📊 Total Invoices: {invoices['total_invoices']}")
            
            if invoices['pending_income'] > 0:
                lines.append(f"  💰 Pending Income: {self.format_currency(invoices['pending_income'])}")
            
            if invoices['overdue_income'] > 0:
                lines.append(f"  🚨 OVERDUE Income: {self.format_currency(invoices['overdue_income'])} ({invoices['overdue_count']} invoices)")
            
            if invoices['pending_expenses'] > 0:
                lines.append(f"  💸 Pending Expenses: {self.format_currency(invoices['pending_expenses'])}")
        
        # FINANCIAL HEALTH SCORE
        lines.append("\n" + "─" * 70)
        lines.append("🏥 FINANCIAL HEALTH")
        lines.append("─" * 70)
        
        # Calculate savings rate
        if month_summary['total_income'] > 0:
            savings_rate = ((month_summary['total_income'] - month_summary['total_expenses']) / month_summary['total_income']) * 100
            lines.append(f"  📊 Savings Rate: {savings_rate:.1f}%")
            
            if savings_rate >= 20:
                lines.append("     ✅ Excellent! You're saving well.")
            elif savings_rate >= 10:
                lines.append("     ⚠️  Good, but try to save more.")
            elif savings_rate >= 0:
                lines.append("     ⚠️  Low savings rate. Consider reducing expenses.")
            else:
                lines.append("     🚨 WARNING: Spending more than earning!")
        
        # Budget compliance
        over_budget_count = len([b for b in budget_status if b['status'] == 'over_budget'])
        if budget_status:
            compliance = ((len(budget_status) - over_budget_count) / len(budget_status)) * 100
            lines.append(f"  🎯 Budget Compliance: {compliance:.1f}%")
            if compliance == 100:
                lines.append("     ✅ Perfect! All budgets on track.")
            elif compliance >= 80:
                lines.append("     ✅ Good budget management.")
            else:
                lines.append("     ⚠️  Need better budget control.")
        
        lines.append("\n" + "=" * 70)
        lines.append("Generated: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        lines.append("=" * 70)
        
        return "\n".join(lines)
    
    def save_to_file(self, message: str, filename: Optional[str] = None):
        """Save the summary to a file"""
        if not filename:
            filename = f"financial_summary_{self.today.isoformat()}.txt"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(message)
        
        print(f"✅ Summary saved to: {filename}")
    
    def send_to_discord(self, webhook_url: str) -> bool:
        """Send the summary to Discord via webhook"""
        try:
            # Get all data for Discord embed
            today_trans = self.get_today_transactions()
            month_summary = self.get_month_summary()
            budget_status = self.get_budget_status()
            recurring = self.get_upcoming_recurring_payments()
            portfolio = self.get_portfolio_summary()
            invoices = self.get_invoice_summary()
            
            # Create Discord embed
            embed = {
                "title": f"📊 Daily Financial Summary - {self.today.strftime('%B %d, %Y')}",
                "color": 0x00ff00 if today_trans['net'] >= 0 else 0xff0000,
                "fields": [],
                "footer": {
                    "text": f"Generated at {datetime.now().strftime('%I:%M %p')}"
                },
                "timestamp": datetime.now().isoformat()
            }
            
            # User info
            embed["description"] = f"**👤 {self.user_name}**\n📧 {self.user_email}"
            
            # Today's activity
            today_value = (
                f"✅ Income: **{self.format_currency(today_trans['total_income'])}**\n"
                f"❌ Expenses: **{self.format_currency(today_trans['total_expenses'])}**\n"
                f"📈 Net: **{self.format_currency(today_trans['net'])}**\n"
                f"📝 Transactions: {today_trans['count']}"
            )
            embed["fields"].append({
                "name": "💰 Today's Activity",
                "value": today_value,
                "inline": False
            })
            
            # Month summary
            month_value = (
                f"✅ Income: **{self.format_currency(month_summary['total_income'])}**\n"
                f"❌ Expenses: **{self.format_currency(month_summary['total_expenses'])}**\n"
                f"📈 Net: **{self.format_currency(month_summary['net'])}**"
            )
            embed["fields"].append({
                "name": f"📅 This Month ({self.today.strftime('%B %Y')})",
                "value": month_value,
                "inline": False
            })
            
            # Budget status - only show alerts
            if budget_status:
                over_budget = [b for b in budget_status if b['status'] == 'over_budget']
                warning = [b for b in budget_status if b['status'] == 'warning']
                
                budget_lines = []
                if over_budget:
                    budget_lines.append("🚨 **OVER BUDGET:**")
                    for b in over_budget[:3]:  # Limit to 3
                        budget_lines.append(f"• {b['category']}: {self.format_currency(b['spent'])} / {self.format_currency(b['budget'])}")
                
                if warning:
                    if budget_lines:
                        budget_lines.append("")
                    budget_lines.append("⚠️ **WARNING:**")
                    for b in warning[:3]:  # Limit to 3
                        budget_lines.append(f"• {b['category']}: {self.format_currency(b['spent'])} / {self.format_currency(b['budget'])}")
                
                if budget_lines:
                    embed["fields"].append({
                        "name": "🎯 Budget Alerts",
                        "value": "\n".join(budget_lines),
                        "inline": False
                    })
            
            # Recurring payments
            if recurring:
                recurring_lines = []
                for payment in recurring[:3]:  # Limit to 3
                    next_date = datetime.strptime(payment['next_payment_date'], '%Y-%m-%d').date()
                    days_until = (next_date - self.today).days
                    
                    if days_until == 0:
                        urgency = "⚠️ **DUE TODAY**"
                    elif days_until == 1:
                        urgency = "⏰ **Due Tomorrow**"
                    else:
                        urgency = f"📅 Due in {days_until} days"
                    
                    recurring_lines.append(
                        f"{urgency}\n"
                        f"• {payment['name']}: {self.format_currency(float(payment['amount']))}"
                    )
                
                embed["fields"].append({
                    "name": "🔔 Upcoming Payments (Next 2 Days)",
                    "value": "\n\n".join(recurring_lines),
                    "inline": False
                })
            
            # Portfolio summary
            portfolio_value = (
                f"💵 Cash: **{self.format_currency(portfolio['cash_balance'])}**\n"
                f"📈 Stocks: {portfolio['stocks']['count']} holdings - {self.format_currency(portfolio['stocks']['total_invested'])}\n"
                f"🏦 Mutual Funds: {portfolio['mutual_funds']['count']} funds - {self.format_currency(portfolio['mutual_funds']['current_value'])}\n"
                f"💎 **Total Value: {self.format_currency(portfolio['total_portfolio_value'])}**"
            )
            embed["fields"].append({
                "name": "💼 Investment Portfolio",
                "value": portfolio_value,
                "inline": False
            })
            
            # Invoices (only if there are alerts)
            if invoices['overdue_income'] > 0 or invoices['pending_income'] > 0:
                invoice_lines = []
                if invoices['overdue_income'] > 0:
                    invoice_lines.append(f"🚨 **Overdue**: {self.format_currency(invoices['overdue_income'])} ({invoices['overdue_count']} invoices)")
                if invoices['pending_income'] > 0:
                    invoice_lines.append(f"💰 Pending: {self.format_currency(invoices['pending_income'])}")
                
                embed["fields"].append({
                    "name": "🧾 Invoices",
                    "value": "\n".join(invoice_lines),
                    "inline": False
                })
            
            # Financial health
            if month_summary['total_income'] > 0:
                savings_rate = ((month_summary['total_income'] - month_summary['total_expenses']) / month_summary['total_income']) * 100
                
                if savings_rate >= 20:
                    health_emoji = "✅"
                    health_msg = "Excellent savings!"
                elif savings_rate >= 10:
                    health_emoji = "⚠️"
                    health_msg = "Good, but can improve"
                elif savings_rate >= 0:
                    health_emoji = "⚠️"
                    health_msg = "Low savings rate"
                else:
                    health_emoji = "🚨"
                    health_msg = "Spending exceeds income!"
                
                health_value = f"{health_emoji} Savings Rate: **{savings_rate:.1f}%**\n{health_msg}"
                
                over_budget_count = len([b for b in budget_status if b['status'] == 'over_budget'])
                if budget_status:
                    compliance = ((len(budget_status) - over_budget_count) / len(budget_status)) * 100
                    health_value += f"\n🎯 Budget Compliance: **{compliance:.1f}%**"
                
                embed["fields"].append({
                    "name": "🏥 Financial Health",
                    "value": health_value,
                    "inline": False
                })
            
            # Send to Discord
            payload = {
                "embeds": [embed],
                "username": "Fynix Financial Bot",
                "avatar_url": "https://cdn-icons-png.flaticon.com/512/2738/2738055.png"
            }
            
            response = requests.post(webhook_url, json=payload)
            
            if response.status_code == 204:
                print("✅ Summary sent to Discord successfully!")
                return True
            else:
                print(f"❌ Failed to send to Discord. Status code: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending to Discord: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main function"""
    # Get user email from environment or command line
    import sys
    
    if len(sys.argv) > 1:
        user_email = sys.argv[1]
    else:
        user_email = os.getenv("USER_EMAIL")
        if not user_email:
            print("❌ Error: Please provide user email as argument or set USER_EMAIL environment variable")
            print("Usage: python daily_financial_summary.py user@example.com")
            sys.exit(1)
    
    try:
        print(f"🔄 Generating daily financial summary for: {user_email}\n")
        
        summary = DailyFinancialSummary(user_email)
        
        # Send to Discord if webhook URL is configured
        if DISCORD_WEBHOOK_URL:
            print("🔄 Sending to Discord...")
            discord_sent = summary.send_to_discord(DISCORD_WEBHOOK_URL)
            if not discord_sent:
                # If Discord fails, print the message to console
                message = summary.generate_summary_message()
                print("\n⚠️  Discord send failed. Printing to console:\n")
                print(message)
        else:
            # If no Discord webhook, print to console and save to file
            message = summary.generate_summary_message()
            print(message)
            summary.save_to_file(message)
            print("\n⚠️  Discord webhook URL not configured. Set DISCORD_WEBHOOK_URL in .env to enable Discord notifications.")
        
        print("\n✅ Daily financial summary completed successfully!")
        
    except Exception as e:
        print(f"❌ Error generating summary: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
