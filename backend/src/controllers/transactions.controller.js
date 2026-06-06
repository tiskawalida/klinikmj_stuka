const { sequelize, Transaction, TransactionItem, Medicine, User } = require('../models');
const { Op } = require('sequelize');

// Helper: generate invoice number
const generateInvoice = () => {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-KMJ-${ts}-${rand}`;
};

// POST /api/transactions/checkout  — ACID Transaction
const checkout = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    let { items, paymentMethod, amountPaid, notes, resepImageUrl, deliveryMethod } = req.body;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) { items = []; }
    }
    if (!items || !Array.isArray(items) || items.length === 0)
      throw Object.assign(new Error('Keranjang belanja kosong.'), { statusCode: 400 });

    // ─── VALIDASI RESEP: jika Pasien membeli Obat Resep ───
    const medicineIds = items.map(i => i.medicineId);
    const medicines = await Medicine.findAll({ where: { id: { [Op.in]: medicineIds } }, transaction: t });
    const medMap = {};
    medicines.forEach(m => { medMap[m.id] = m; });

    const hasObatResep = items.some(item => medMap[item.medicineId]?.category === 'Obat Resep');
    if (req.user.role === 'Pasien' && hasObatResep && !resepImageUrl) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Resep dokter wajib dilampirkan untuk pembelian Obat Resep.',
      });
    }

    // ─── CEK DAN KURANGI STOK (FIFO) ───
    let totalAmount = 0;
    const transactionItems = [];

    for (const item of items) {
      const med = medMap[item.medicineId];
      if (!med) throw Object.assign(new Error(`Obat ID ${item.medicineId} tidak ditemukan.`), { statusCode: 404 });
      if (!med.isActive) throw Object.assign(new Error(`Obat "${med.name}" tidak tersedia.`), { statusCode: 400 });
      if (med.stock < item.quantity)
        throw Object.assign(new Error(`Stok "${med.name}" tidak mencukupi. Tersedia: ${med.stock}`), { statusCode: 400 });

      const subtotal = parseFloat(med.price) * item.quantity;
      totalAmount += subtotal;

      await med.update({ stock: med.stock - item.quantity }, { transaction: t });

      transactionItems.push({
        medicineId: med.id,
        medicineName: med.name,
        category: med.category,
        quantity: item.quantity,
        pricePerUnit: parseFloat(med.price),
        subtotal,
      });
    }

    const changeAmount = amountPaid ? parseFloat(amountPaid) - totalAmount : 0;

    const trx = await Transaction.create({
      invoiceNumber: generateInvoice(),
      userId: req.user.id,
      totalAmount,
      paymentMethod: paymentMethod || 'Tunai',
      amountPaid: parseFloat(amountPaid) || totalAmount,
      changeAmount: changeAmount > 0 ? changeAmount : 0,
      status: req.user.role === 'Kasir' ? 'Selesai' : 'Dikonfirmasi',
      resepImageUrl: resepImageUrl || null,
      resepVerified: req.user.role === 'Kasir' ? true : !!resepImageUrl,
      deliveryMethod: deliveryMethod || 'Ambil di Klinik',
      notes,
      processedBy: req.user.id,
    }, { transaction: t });

    const itemsWithTrxId = transactionItems.map(i => ({ ...i, transactionId: trx.id }));
    await TransactionItem.bulkCreate(itemsWithTrxId, { transaction: t });
    await t.commit();

    // Emit real-time update via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('new-transaction', { invoiceNumber: trx.invoiceNumber, totalAmount, userId: req.user.id });
    }

    res.status(201).json({
      success: true, message: 'Transaksi berhasil.',
      data: { ...trx.toJSON(), items: itemsWithTrxId },
    });
  } catch (err) {
    if (t && !t.finished) await t.rollback();
    next(err);
  }
};

// GET /api/transactions
const getAll = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const where = {};
    if (req.user.role === 'Pasien') where.userId = req.user.id;
    if (status) where.status = status;
    if (startDate && endDate) where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'fullName'] },
        { model: TransactionItem, as: 'items' },
      ],
      order: [['createdAt', 'DESC']], limit: parseInt(limit), offset,
    });
    res.json({ success: true, data: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

// GET /api/transactions/:id
const getById = async (req, res, next) => {
  try {
    const trx = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'email'] },
        { model: TransactionItem, as: 'items', include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'imageUrl'] }] },
      ],
    });
    if (!trx) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    if (req.user.role === 'Pasien' && trx.userId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    res.json({ success: true, data: trx });
  } catch (err) { next(err); }
};

// PATCH /api/transactions/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const trx = await Transaction.findByPk(req.params.id);
    if (!trx) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    await trx.update({ status });

    const io = req.app.get('io');
    if (io) io.to(`user-${trx.userId}`).emit('order-status-update', { invoiceNumber: trx.invoiceNumber, status });

    res.json({ success: true, message: 'Status transaksi diperbarui.', data: trx });
  } catch (err) { next(err); }
};

module.exports = { checkout, getAll, getById, updateStatus };
