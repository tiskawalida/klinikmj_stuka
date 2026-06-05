const { sequelize, Transaction, TransactionItem, Medicine } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');

// GET /api/laporan/penjualan
const getPenjualan = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    let groupFormat, start, end;
    const now = new Date();

    if (period === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      groupFormat = "strftime('%Y-%m-%d', createdAt)";
    } else if (period === 'weekly') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = now;
      groupFormat = "strftime('%Y-W%W', createdAt)";
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
      groupFormat = "strftime('%Y-%m', createdAt)";
    }

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate + 'T23:59:59');

    const data = await sequelize.query(`
      SELECT 
        ${groupFormat} as period,
        COUNT(*) as totalTransaksi,
        SUM(totalAmount) as totalPendapatan,
        AVG(totalAmount) as rataRata
      FROM transactions
      WHERE status != 'Dibatalkan' AND createdAt BETWEEN :start AND :end
      GROUP BY period ORDER BY period ASC
    `, { replacements: { start, end }, type: sequelize.QueryTypes.SELECT });

    // Top selling medicines
    const topMedicines = await sequelize.query(`
      SELECT ti.medicineName, SUM(ti.quantity) as totalTerjual, SUM(ti.subtotal) as totalRevenue
      FROM transaction_items ti
      JOIN transactions t ON ti.transactionId = t.id
      WHERE t.status != 'Dibatalkan' AND t.createdAt BETWEEN :start AND :end
      GROUP BY ti.medicineId ORDER BY totalTerjual DESC LIMIT 10
    `, { replacements: { start, end }, type: sequelize.QueryTypes.SELECT });

    const summary = await Transaction.findOne({
      where: { status: { [Op.ne]: 'Dibatalkan' }, createdAt: { [Op.between]: [start, end] } },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransaksi'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalPendapatan'],
      ],
    });

    res.json({ success: true, data, topMedicines, summary });
  } catch (err) { next(err); }
};

// GET /api/laporan/stok-kritis
const getStokKritis = async (req, res, next) => {
  try {
    const data = await sequelize.query(`
      SELECT name, category, stock, minStock, expiredDate,
             CASE WHEN stock = 0 THEN 'Habis' WHEN stock <= minStock THEN 'Kritis' ELSE 'Normal' END as status
      FROM medicines WHERE isActive = 1 AND stock <= minStock ORDER BY stock ASC
    `, { type: sequelize.QueryTypes.SELECT });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/laporan/kadaluarsa
const getKadaluarsa = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const data = await sequelize.query(`
      SELECT name, category, stock, expiredDate, batchNumber,
             CAST((julianday(expiredDate) - julianday('now')) AS INTEGER) as sisaHari
      FROM medicines
      WHERE isActive = 1 AND expiredDate IS NOT NULL AND expiredDate <= date('now', '+${days} days')
      ORDER BY expiredDate ASC
    `, { type: sequelize.QueryTypes.SELECT });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/laporan/export-pdf  (Background PDF generation)
const exportPdf = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-penjualan-${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 595, 120).fill('#0d9488');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('KLINIK MAKMUR JAYA', 50, 35);
    doc.fontSize(12).font('Helvetica').text('Laporan Penjualan Obat', 50, 62);
    doc.text(`Periode: ${period === 'monthly' ? 'Bulanan' : 'Harian'} — ${new Date().toLocaleDateString('id-ID')}`, 50, 80);
    doc.fillColor('#000000');

    // Summary section
    doc.moveDown(4);
    const transactions = await Transaction.findAll({ where: { status: { [Op.ne]: 'Dibatalkan' } }, include: [{ model: TransactionItem, as: 'items' }] });
    const totalRevenue = transactions.reduce((a, t) => a + parseFloat(t.totalAmount), 0);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0d9488').text('RINGKASAN LAPORAN', 50, 145);
    doc.moveTo(50, 162).lineTo(545, 162).strokeColor('#0d9488').lineWidth(2).stroke();
    doc.fillColor('#000000').fontSize(11).font('Helvetica');
    doc.text(`Total Transaksi    : ${transactions.length}`, 50, 175);
    doc.text(`Total Pendapatan   : Rp ${totalRevenue.toLocaleString('id-ID')}`, 50, 195);

    // Table header
    doc.moveDown(2);
    doc.rect(50, 235, 495, 25).fill('#0d9488');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('No.', 55, 243); doc.text('Invoice', 80, 243); doc.text('Pasien', 200, 243);
    doc.text('Total', 380, 243); doc.text('Status', 460, 243);
    doc.fillColor('#000000').font('Helvetica');

    let y = 263;
    transactions.slice(0, 20).forEach((t, i) => {
      if (y > 720) { doc.addPage(); y = 50; }
      if (i % 2 === 0) doc.rect(50, y - 3, 495, 20).fill('#f0fdfa').stroke('#e5e7eb');
      doc.fillColor('#000000').fontSize(9);
      doc.text(String(i + 1), 55, y);
      doc.text(t.invoiceNumber, 80, y);
      doc.text(`User #${t.userId}`, 200, y);
      doc.text(`Rp ${parseFloat(t.totalAmount).toLocaleString('id-ID')}`, 370, y);
      doc.text(t.status, 460, y);
      y += 22;
    });

    doc.moveDown(2).fontSize(8).fillColor('#6b7280').text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} — Sistem E-Commerce Klinik Makmur Jaya`, 50, y + 20, { align: 'center' });
    doc.end();
  } catch (err) { next(err); }
};

module.exports = { getPenjualan, getStokKritis, getKadaluarsa, exportPdf };
