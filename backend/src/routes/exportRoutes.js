import express from 'express';
import ExportService from '../services/exportService.js';

const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const { tier, status, format = 'csv' } = req.query;
    const data = await ExportService.exportUserData({ tier, status });

    if (format === 'csv') {
      const csv = ExportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${ExportService.getCSVFilename('users')}"`);
      res.send(csv);
    } else {
      res.json({
        status: 'success',
        success: true,
        data: {
          count: data.length,
          records: data
        }
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/addresses', async (req, res) => {
  try {
    const { country, status, format = 'csv' } = req.query;
    const data = await ExportService.exportAddressData({ country, status });

    if (format === 'csv') {
      const csv = ExportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${ExportService.getCSVFilename('addresses')}"`);
      res.send(csv);
    } else {
      res.json({
        status: 'success',
        success: true,
        data: {
          count: data.length,
          records: data
        }
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const { status, method, dateFrom, dateTo, format = 'csv' } = req.query;
    const data = await ExportService.exportTransactionData({ status, method, dateFrom, dateTo });

    if (format === 'csv') {
      const csv = ExportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${ExportService.getCSVFilename('transactions')}"`);
      res.send(csv);
    } else {
      res.json({
        status: 'success',
        success: true,
        data: {
          count: data.length,
          records: data
        }
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/report', async (req, res) => {
  try {
    const { reportType, filters, format = 'csv' } = req.body;

    if (!reportType) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'reportType is required'
      });
    }

    const report = await ExportService.generateReport(reportType, filters);

    if (format === 'csv') {
      const csv = ExportService.convertToCSV(report.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${ExportService.getCSVFilename(reportType)}"`);
      res.send(csv);
    } else {
      res.json({
        status: 'success',
        success: true,
        data: report
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const { userId, reportType, filters, recurrence } = req.body;

    if (!userId || !reportType) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId and reportType are required'
      });
    }

    const scheduled = await ExportService.scheduleReport(
      userId,
      reportType,
      filters || {},
      recurrence || 'once'
    );

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Report scheduled',
      data: scheduled
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/scheduled/:userId', async (req, res) => {
  try {
    const scheduled = await ExportService.getScheduledReports(req.params.userId);
    res.json({
      status: 'success',
      success: true,
      data: scheduled
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

export default router;
