import express from 'express';
import PaymentService from '../services/paymentService.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// Process payment
router.post('/payments', async (req, res) => {
  try {
    const { developerId, amount, currency, method, description } = req.body;
    if (!developerId || !amount) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'developerId and amount are required'
      });
    }

    const payment = await PaymentService.processPayment({
      developerId, amount, currency, method, description
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Payment initiated',
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Confirm payment
router.post('/payments/:reference/confirm', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const payment = await PaymentService.confirmPayment(req.params.reference, transactionId);
    res.json({
      status: 'success',
      success: true,
      message: 'Payment confirmed',
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get payment
router.get('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Payment not found'
      });
    }
    res.json({
      status: 'success',
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get developer payments
router.get('/developers/:id/payments', async (req, res) => {
  try {
    const payments = await Payment.findByDeveloperId(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const { developerId, items, dueDate } = req.body;
    const invoice = await PaymentService.createInvoice(developerId, items, dueDate);
    res.status(201).json({
      status: 'success',
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Send invoice
router.post('/invoices/:id/send', async (req, res) => {
  try {
    const invoice = await PaymentService.sendInvoice(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get developer invoices
router.get('/developers/:id/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.findByDeveloperId(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Create subscription
router.post('/subscriptions', async (req, res) => {
  try {
    const { developerId, tier, billingCycle } = req.body;
    const subscription = await PaymentService.createSubscription(developerId, tier, billingCycle);
    res.status(201).json({
      status: 'success',
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Upgrade tier
router.post('/subscriptions/:id/upgrade', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    const { newTier, billingCycle } = req.body;
    const result = await PaymentService.upgradeTier(subscription.developer_id, newTier, billingCycle);
    res.json({
      status: 'success',
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get payment metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await PaymentService.getPaymentMetrics();
    res.json({
      status: 'success',
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

export default router;
