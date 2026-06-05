require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, User, Category, Supplier, Medicine } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('🔄 Database direset dan disinkronkan...');

    // ── USERS ──
    await User.bulkCreate([
      { username: 'admin', email: 'admin@klinikmakmur.id', password: 'Admin@1234', role: 'Admin', fullName: 'Administrator Sistem', phone: '081200000001' },
      { username: 'apoteker', email: 'apoteker@klinikmakmur.id', password: 'Apo@12345', role: 'Apoteker', fullName: 'Dra. Siti Rahayu, Apt.', phone: '081200000002' },
      { username: 'kasir', email: 'kasir@klinikmakmur.id', password: 'Kasir@123', role: 'Kasir', fullName: 'Budi Santoso', phone: '081200000003' },
      { username: 'pasien', email: 'pasien@gmail.com', password: 'Pasien@123', role: 'Pasien', fullName: 'Andi Wijaya', phone: '081200000004', address: 'Jl. Melati No.5, Jakarta' },
      { username: 'pasien2', email: 'pasien2@gmail.com', password: 'Pasien@123', role: 'Pasien', fullName: 'Dewi Sartika', phone: '081200000005', address: 'Jl. Mawar No.12, Bandung' },
    ], { individualHooks: true });
    console.log('✅ Users berhasil dibuat (5 akun)');

    // ── SUPPLIERS ──
    const suppliers = await Supplier.bulkCreate([
      { name: 'PT. Kimia Farma', contactPerson: 'Irwan Hadi', phone: '021-5551234', email: 'sales@kimiafarma.co.id', address: 'Jl. Veteran No.9, Jakarta Pusat', npwp: '01.234.567.8-901.000' },
      { name: 'PT. Kalbe Farma', contactPerson: 'Yuni Astuti', phone: '021-5556789', email: 'sales@kalbe.co.id', address: 'Jl. Let.Jend. Suprapto Kav.4, Jakarta Pusat', npwp: '01.234.568.8-901.000' },
      { name: 'PT. Sanbe Farma', contactPerson: 'Dedy Kurniawan', phone: '022-6012345', email: 'sales@sanbe.co.id', address: 'Jl. Industri No.6, Bandung', npwp: '01.234.569.8-901.000' },
    ]);
    console.log('✅ Suppliers berhasil dibuat');

    // ── MEDICINES ──
    const today = new Date();
    const addDays = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0]; };

    await Medicine.bulkCreate([
      // Obat Resep
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Obat Resep', price: 5000, stock: 200, minStock: 50, unit: 'kapsul', expiredDate: addDays(365), description: 'Antibiotik broad-spectrum', composition: 'Amoxicillin trihydrate 500mg', dosage: '3x1 kapsul/hari', sideEffects: 'Mual, ruam kulit, diare', supplierId: suppliers[0].id, batchNumber: 'AMX-2024-001' },
      { name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Obat Resep', price: 3500, stock: 5, minStock: 30, unit: 'tablet', expiredDate: addDays(180), description: 'Obat diabetes melitus tipe 2', composition: 'Metformin HCl 500mg', dosage: '2x1 tablet bersama makan', sideEffects: 'Gangguan pencernaan, mual', supplierId: suppliers[0].id, batchNumber: 'MET-2024-005' },
      { name: 'Lisinopril 10mg', genericName: 'Lisinopril', category: 'Obat Resep', price: 8000, stock: 80, minStock: 20, unit: 'tablet', expiredDate: addDays(25), description: 'Antihipertensi ACE inhibitor', composition: 'Lisinopril 10mg', dosage: '1x1 tablet/hari', sideEffects: 'Batuk kering, hiperkalemia', supplierId: suppliers[1].id, batchNumber: 'LIS-2024-003' },
      { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', category: 'Obat Resep', price: 7500, stock: 0, minStock: 25, unit: 'tablet', expiredDate: addDays(400), description: 'Calcium channel blocker', composition: 'Amlodipine besylate 5mg', dosage: '1x1 tablet/hari', sideEffects: 'Edema kaki, flushing, palpitasi', supplierId: suppliers[1].id, batchNumber: 'AML-2024-002' },
      { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Obat Resep', price: 4000, stock: 150, minStock: 40, unit: 'kapsul', expiredDate: addDays(300), description: 'Proton pump inhibitor untuk maag', composition: 'Omeprazole 20mg', dosage: '1x1 kapsul 30 menit sebelum makan', sideEffects: 'Sakit kepala, diare, sembelit', supplierId: suppliers[2].id, batchNumber: 'OME-2024-004' },
      { name: 'Simvastatin 20mg', genericName: 'Simvastatin', category: 'Obat Resep', price: 6000, stock: 8, minStock: 20, unit: 'tablet', expiredDate: addDays(500), description: 'Statin untuk kolesterol tinggi', composition: 'Simvastatin 20mg', dosage: '1x1 tablet malam hari', sideEffects: 'Nyeri otot, gangguan hati', supplierId: suppliers[0].id, batchNumber: 'SIM-2024-007' },

      // Obat Bebas
      { name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'Obat Bebas', price: 1500, stock: 500, minStock: 100, unit: 'tablet', expiredDate: addDays(730), description: 'Analgesik dan antipiretik', composition: 'Paracetamol 500mg', dosage: '3x1 tablet, maks 8 tablet/hari', sideEffects: 'Reaksi alergi pada dosis tinggi', supplierId: suppliers[0].id, batchNumber: 'PCT-2024-010' },
      { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Obat Bebas', price: 2500, stock: 300, minStock: 60, unit: 'tablet', expiredDate: addDays(600), description: 'Anti inflamasi non steroid', composition: 'Ibuprofen 400mg', dosage: '3x1 tablet bersama makan', sideEffects: 'Gangguan lambung, pusing', supplierId: suppliers[1].id, batchNumber: 'IBU-2024-011' },
      { name: 'CTM (Chlorpheniramine)', genericName: 'Chlorpheniramine Maleate', category: 'Obat Bebas', price: 800, stock: 3, minStock: 50, unit: 'tablet', expiredDate: addDays(20), description: 'Antihistamin untuk alergi dan pilek', composition: 'Chlorpheniramine maleate 4mg', dosage: '3x1 tablet', sideEffects: 'Kantuk, mulut kering', supplierId: suppliers[2].id, batchNumber: 'CTM-2024-012' },

      // Obat Bebas Terbatas
      { name: 'Codein 10mg', genericName: 'Codeine Phosphate', category: 'Obat Bebas Terbatas', price: 12000, stock: 50, minStock: 15, unit: 'tablet', expiredDate: addDays(365), description: 'Antitusif untuk batuk berdahak', composition: 'Codeine phosphate 10mg', dosage: '3x1 tablet', sideEffects: 'Kantuk, konstipasi', supplierId: suppliers[0].id, batchNumber: 'COD-2024-013' },

      // Suplemen
      { name: 'Vitamin C 1000mg', genericName: 'Ascorbic Acid', category: 'Suplemen', price: 15000, stock: 200, minStock: 30, unit: 'tablet', expiredDate: addDays(900), description: 'Suplemen antioksidan daya tahan tubuh', composition: 'Ascorbic acid 1000mg', dosage: '1x1 tablet/hari', sideEffects: 'Gangguan lambung jika berlebihan', supplierId: suppliers[1].id, batchNumber: 'VTC-2024-020' },
      { name: 'Vitamin D3 1000 IU', genericName: 'Cholecalciferol', category: 'Suplemen', price: 20000, stock: 120, minStock: 25, unit: 'softgel', expiredDate: addDays(700), description: 'Suplemen untuk tulang dan imunitas', composition: 'Cholecalciferol 1000 IU', dosage: '1x1 softgel/hari bersama makan', sideEffects: 'Mual, hiperkalsemia jika berlebihan', supplierId: suppliers[2].id, batchNumber: 'VTD-2024-021' },
      { name: 'Zinc 20mg', genericName: 'Zinc Sulfate', category: 'Suplemen', price: 8500, stock: 90, minStock: 20, unit: 'tablet', expiredDate: addDays(800), description: 'Mineral esensial untuk sistem imun', composition: 'Zinc sulfate monohydrate 20mg', dosage: '1x1 tablet/hari', sideEffects: 'Mual jika diminum saat perut kosong', supplierId: suppliers[0].id, batchNumber: 'ZNC-2024-022' },

      // Alat Kesehatan
      { name: 'Masker Medis 3-ply', genericName: 'Masker Bedah', category: 'Alat Kesehatan', price: 3000, stock: 1000, minStock: 200, unit: 'pcs', expiredDate: addDays(1800), description: 'Masker medis 3 lapis perlindungan virus', composition: '-', dosage: '-', sideEffects: '-', supplierId: suppliers[1].id, batchNumber: 'MSK-2024-030' },
      { name: 'Alkohol 70% 100ml', genericName: 'Isopropyl Alcohol', category: 'Alat Kesehatan', price: 12000, stock: 150, minStock: 30, unit: 'botol', expiredDate: addDays(1095), description: 'Antiseptik untuk membersihkan luka', composition: 'Isopropyl alcohol 70%', dosage: 'Oleskan pada area luka', sideEffects: 'Iritasi kulit sensitif', supplierId: suppliers[2].id, batchNumber: 'ALK-2024-031' },
      { name: 'Termometer Digital', genericName: 'Thermometer', category: 'Alat Kesehatan', price: 85000, stock: 25, minStock: 5, unit: 'pcs', expiredDate: addDays(3650), description: 'Termometer digital inframerah akurasi tinggi', composition: '-', dosage: 'Arahkan ke dahi, tekan tombol', sideEffects: '-', supplierId: suppliers[0].id, batchNumber: 'TRM-2024-032' },
    ]);
    console.log('✅ Medicines berhasil dibuat (16 obat)');

    console.log('\n🎉 Seeding selesai! Akun login:');
    console.log('   Admin    → admin / Admin@1234');
    console.log('   Apoteker → apoteker / Apo@12345');
    console.log('   Kasir    → kasir / Kasir@123');
    console.log('   Pasien   → pasien / Pasien@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding gagal:', err.message);
    process.exit(1);
  }
};

seed();
