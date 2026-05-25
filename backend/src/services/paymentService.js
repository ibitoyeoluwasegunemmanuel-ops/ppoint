import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Subscription from '../models/Subscription.js';
import crypto from 'crypto';

class PaymentService {
  static tierPricing = {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 9999, annual: 99990 }, // in kobo/cents
    enterprise: { monthly: 49999, annual: 499990 }
  };

  static async processPayment(data) {
    const {
      developerId, amount, currency = 'NGN', method = 'card',
      reference, description
    } = data;

    if (!developerId || !amount || amount <= 0) {
      throw new Error('Invalid payment data');
    }

    const payment = await Payment.create({
      developerId,
      amount,
      currency,
      method,
      reference: reference || this.generateReference(),
      description,
      status: 'pending'
    });

    return {
      id: payment.id,
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.created_at
    };
  }

  static async confirmPayment(reference, transactionId = null) {
    const payment = await Payment.findByReference(reference);
    if (!payment) throw new Error('Payment not found');

    const updated = await Payment.updateStatus(
      payment.id,
      'completed',
      transactionId
    );

    return updated;
  }

  static async createInvoice(developerId, items, dueDate = null) {
    if (!items || items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }

    const amount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const invoiceNumber = this.generateInvoiceNumber();
    const due = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      developerId,
      invoiceNumber,
      amount,
      currency: 'NGN',
      status: 'draft',
      dueDate: due,
      items
    });

    return invoice;
  }

  static async sendInvoice(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const updated = await Invoice.updateStatus(invoiceId, 'sent');
    // TODO: Send email notification
    return updated;
  }

  static async createSubscription(developerId, tier, billingCycle = 'monthly') {
    if (!this.tierPricing[tier]) {
      throw new Error('Invalid tier');
    }

    const amount = this.tierPricing[tier][billingCycle];
    const startDate = new Date();
    const nextDate = new Date(startDate);
    
    if (billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    const subscription = await Subscription.create({
      developerId,
      tier,
      billingCycle,
      amount,
      status: 'active',
      startDate,
      nextBillingDate: nextDate
    });

    return subscription;
  }

  static async upgradeTier(developerId, newTier, billingCycle = 'monthly') {
    const current = await Subscription.findByDeveloperId(developerId);
    if (!current) throw new Error('No subscription found');

    const newAmount = this.tierPricing[newTier][billingCycle];
    const upgraded = await Subscription.updateTier(current.id, newTier, newAmount);

    // Create credit note for unused portion
    const daysUsed = Math.floor(
      (Date.now() - new Date(current.next_billing_date)) / (24 * 60 * 60 * 1000)
    );
    const credit = Math.round((current.amount * daysUsed) / 30);

    return {
      subscription: upgraded,
      credit
    };
  }

  static async processSubscriptionRenewal(subscriptionId) {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) throw new Error('Subscription not found');

    const payment = await Payment.create({
      developerId: sub.developer_id,
      amount: sub.amount,
      currency: 'NGN',
      method: 'subscription',
      reference: this.generateReference(),
      description: `Subscription renewal - ${sub.tier} tier`,
      status: 'pending'
    });

    return payment;
  }

  static async getPaymentMetrics(developerId = null) {
    const stats = await Payment.getStats();
    const monthlyRevenue = await Payment.getMonthlyRevenue(12);
    const subscriptionStats = await Subscription.getStats();
    const invoiceStats = await Invoice.getStats();

    return {
      payments: {
        totalTransactions: stats.total_transactions,
        totalRevenue: (stats.total_revenue || 0) / 100, // Convert from kobo to Naira
        avgTransaction: (stats.avg_transaction || 0) / 100,
        failedCount: stats.failed_count,
        pendingCount: stats.pending_count
      },
      subscriptions: {
        totalActive: subscriptionStats.active_count,
        totalCancelled: subscriptionStats.cancelled_count,
        mrr: (subscriptionStats.monthly_recurring_revenue || 0) / 100,
        uniqueDevelopers: subscriptionStats.unique_developers
      },
      invoices: {
        total: invoiceStats.total_invoices,
        paidAmount: (invoiceStats.paid_amount || 0) / 100,
        pendingAmount: (invoiceStats.pending_amount || 0) / 100,
        overdueAmount: (invoiceStats.overdue_amount || 0) / 100
      },
      monthlyTrend: monthlyRevenue.map(m => ({
        month: m.month,
        revenue: (m.revenue || 0) / 100,
        transactions: m.transactions
      }))
    };
  }

  static generateReference() {
    return 'PPT_' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  static generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `INV-${year}${month}-${random}`;
  }
}

export default PaymentService;
