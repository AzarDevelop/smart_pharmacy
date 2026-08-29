/**
 * Seed script - fills the database with sample data so the project can be demoed.
 * Run with:  npm run seed
 * WARNING: it clears the existing collections first.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');

const categories = [
  { name: 'Pain Relief', description: 'Painkillers and fever medicines' },
  { name: 'Antibiotics', description: 'Bacterial infection medicines' },
  { name: 'Diabetes Care', description: 'Blood sugar control medicines' },
  { name: 'Heart & BP', description: 'Cardiac and blood pressure medicines' },
  { name: 'Cold & Cough', description: 'Cold, cough and allergy medicines' },
  { name: 'Gastro', description: 'Acidity, digestion and stomach medicines' },
  { name: 'Vitamins', description: 'Vitamins and nutritional supplements' },
];

const medicines = [
  ['Paracetamol', 'Dolo', 'Acetaminophen', 'Micro Labs', 'Pain Relief', '650mg', 'Tablet', false, 'Brings down fever and relieves mild to moderate pain.'],
  ['Paracetamol', 'Calpol', 'Acetaminophen', 'GSK', 'Pain Relief', '500mg', 'Tablet', false, 'Common fever and headache tablet.'],
  ['Ibuprofen', 'Brufen', 'Ibuprofen', 'Abbott', 'Pain Relief', '400mg', 'Tablet', false, 'Anti-inflammatory painkiller for body pain and sprains.'],
  ['Aceclofenac', 'Zerodol', 'Aceclofenac', 'Ipca Labs', 'Pain Relief', '100mg', 'Tablet', true, 'Prescribed for joint and muscular pain.'],
  ['Diclofenac Gel', 'Volini', 'Diclofenac Diethylamine', 'Sun Pharma', 'Pain Relief', '30g', 'Gel', false, 'Topical gel for muscle and joint pain.'],
  ['Amoxicillin', 'Mox', 'Amoxicillin Trihydrate', 'Cipla', 'Antibiotics', '500mg', 'Capsule', true, 'Broad spectrum antibiotic for bacterial infections.'],
  ['Azithromycin', 'Azithral', 'Azithromycin', 'Alembic', 'Antibiotics', '500mg', 'Tablet', true, 'Antibiotic used for throat and chest infections.'],
  ['Cefixime', 'Taxim-O', 'Cefixime', 'Alkem', 'Antibiotics', '200mg', 'Tablet', true, 'Antibiotic for typhoid and urinary infections.'],
  ['Ciprofloxacin', 'Ciplox', 'Ciprofloxacin', 'Cipla', 'Antibiotics', '500mg', 'Tablet', true, 'Antibiotic for urinary and intestinal infections.'],
  ['Metformin', 'Glycomet', 'Metformin Hydrochloride', 'USV', 'Diabetes Care', '500mg', 'Tablet', true, 'First line medicine for type 2 diabetes.'],
  ['Glimepiride', 'Amaryl', 'Glimepiride', 'Sanofi', 'Diabetes Care', '2mg', 'Tablet', true, 'Lowers blood sugar in type 2 diabetes.'],
  ['Insulin Glargine', 'Lantus', 'Insulin Glargine', 'Sanofi', 'Diabetes Care', '100IU/ml', 'Injection', true, 'Long acting insulin, needs cold storage.'],
  ['Amlodipine', 'Amlong', 'Amlodipine Besylate', 'Micro Labs', 'Heart & BP', '5mg', 'Tablet', true, 'Controls high blood pressure.'],
  ['Telmisartan', 'Telma', 'Telmisartan', 'Glenmark', 'Heart & BP', '40mg', 'Tablet', true, 'Blood pressure medicine taken once daily.'],
  ['Atorvastatin', 'Atorva', 'Atorvastatin Calcium', 'Zydus', 'Heart & BP', '10mg', 'Tablet', true, 'Lowers cholesterol levels.'],
  ['Clopidogrel', 'Clopilet', 'Clopidogrel', 'Sun Pharma', 'Heart & BP', '75mg', 'Tablet', true, 'Blood thinner prescribed after cardiac events.'],
  ['Cetirizine', 'Cetzine', 'Cetirizine Hydrochloride', 'GSK', 'Cold & Cough', '10mg', 'Tablet', false, 'Relieves sneezing, runny nose and allergies.'],
  ['Levocetirizine', 'Levocet', 'Levocetirizine', 'Torrent', 'Cold & Cough', '5mg', 'Tablet', false, 'Non drowsy antihistamine for allergy.'],
  ['Ambroxol Syrup', 'Mucolite', 'Ambroxol Hydrochloride', 'Dr Reddys', 'Cold & Cough', '100ml', 'Syrup', false, 'Loosens chest congestion and cough.'],
  ['Montelukast', 'Montair', 'Montelukast Sodium', 'Cipla', 'Cold & Cough', '10mg', 'Tablet', true, 'Prevents asthma and allergic symptoms.'],
  ['Pantoprazole', 'Pan-D', 'Pantoprazole + Domperidone', 'Alkem', 'Gastro', '40mg', 'Tablet', true, 'For acidity, reflux and gastritis.'],
  ['Omeprazole', 'Omez', 'Omeprazole', 'Dr Reddys', 'Gastro', '20mg', 'Capsule', false, 'Reduces stomach acid production.'],
  ['Ondansetron', 'Emeset', 'Ondansetron', 'Cipla', 'Gastro', '4mg', 'Tablet', true, 'Controls nausea and vomiting.'],
  ['ORS Powder', 'Electral', 'Oral Rehydration Salts', 'FDC', 'Gastro', '21.8g', 'Powder', false, 'Restores fluids lost in dehydration.'],
  ['Vitamin D3', 'Uprise D3', 'Cholecalciferol', 'Alkem', 'Vitamins', '60000IU', 'Sachet', false, 'Weekly supplement for vitamin D deficiency.'],
  ['Vitamin C', 'Limcee', 'Ascorbic Acid', 'Abbott', 'Vitamins', '500mg', 'Tablet', false, 'Chewable vitamin C for immunity.'],
  ['Iron & Folic Acid', 'Livogen', 'Ferrous Fumarate + Folic Acid', 'Merck', 'Vitamins', '152mg', 'Tablet', false, 'Supplement for iron deficiency anaemia.'],
  ['Multivitamin', 'Becosules', 'B-Complex + Vitamin C', 'Pfizer', 'Vitamins', 'Standard', 'Capsule', false, 'Daily B-complex supplement.'],
];

const pharmacyData = [
  {
    name: 'Apollo Pharmacy - T Nagar',
    email: 'apollo@pharmacy.com',
    ownerName: 'Suresh Kumar',
    licenseNumber: 'TN-PH-1001',
    phone: '9840011001',
    address: '45, Usman Road, T Nagar',
    city: 'Chennai',
    pincode: '600017',
    openingHours: '8:00 AM - 10:00 PM',
    latitude: 13.0418,
    longitude: 80.2341,
  },
  {
    name: 'MedPlus - Anna Nagar',
    email: 'medplus@pharmacy.com',
    ownerName: 'Lakshmi Narayanan',
    licenseNumber: 'TN-PH-1002',
    phone: '9840011002',
    address: '12, 2nd Avenue, Anna Nagar',
    city: 'Chennai',
    pincode: '600040',
    openingHours: '9:00 AM - 9:30 PM',
    latitude: 13.0850,
    longitude: 80.2101,
  },
  {
    name: 'Guardian Health Mart - Adyar',
    email: 'guardian@pharmacy.com',
    ownerName: 'Fathima Begum',
    licenseNumber: 'TN-PH-1003',
    phone: '9840011003',
    address: '8, Gandhi Nagar 1st Main Road, Adyar',
    city: 'Chennai',
    pincode: '600020',
    openingHours: '24 Hours',
    latitude: 13.0067,
    longitude: 80.2570,
  },
  {
    name: 'Sri Krishna Medicals - Velachery',
    email: 'srikrishna@pharmacy.com',
    ownerName: 'Rajesh Iyer',
    licenseNumber: 'TN-PH-1004',
    phone: '9840011004',
    address: '33, Velachery Main Road',
    city: 'Chennai',
    pincode: '600042',
    openingHours: '8:30 AM - 10:30 PM',
    latitude: 12.9791,
    longitude: 80.2209,
  },
];

const customers = [
  { name: 'Ravi Shankar', email: 'ravi@example.com', phone: '9791011001', address: '21, Bazaar Road, Mylapore', city: 'Chennai' },
  { name: 'Priya Menon', email: 'priya@example.com', phone: '9791011002', address: '5, Kilpauk Garden Road', city: 'Chennai' },
  { name: 'Arun Prakash', email: 'arun@example.com', phone: '9791011003', address: '77, OMR, Thoraipakkam', city: 'Chennai' },
];

const seed = async () => {
  await connectDB();
  console.log('Clearing old data...');
  await Promise.all([
    User.deleteMany(),
    Pharmacy.deleteMany(),
    Category.deleteMany(),
    Medicine.deleteMany(),
    Inventory.deleteMany(),
    Reservation.deleteMany(),
    Notification.deleteMany(),
  ]);

  // 1. Categories
  const savedCategories = await Category.insertMany(categories);
  const categoryMap = {};
  savedCategories.forEach((c) => (categoryMap[c.name] = c._id));
  console.log(`Inserted ${savedCategories.length} categories`);

  // 2. Admin
  await User.create({
    name: 'System Admin',
    email: 'admin@pharma.com',
    password: 'Admin@123',
    phone: '9840000000',
    city: 'Chennai',
    role: 'admin',
  });

  // 3. Customers
  const savedCustomers = [];
  for (const c of customers) {
    savedCustomers.push(await User.create({ ...c, password: 'User@123', role: 'user' }));
  }
  console.log(`Inserted ${savedCustomers.length} customers + 1 admin`);

  // 4. Pharmacies with their login accounts
  const savedPharmacies = [];
  for (const p of pharmacyData) {
    const owner = await User.create({
      name: p.ownerName,
      email: p.email,
      password: 'Pharma@123',
      phone: p.phone,
      address: p.address,
      city: p.city,
      role: 'pharmacy',
    });
    savedPharmacies.push(
      await Pharmacy.create({
        owner: owner._id,
        name: p.name,
        licenseNumber: p.licenseNumber,
        phone: p.phone,
        email: p.email,
        address: p.address,
        city: p.city,
        pincode: p.pincode,
        openingHours: p.openingHours,
        location: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      })
    );
  }
  console.log(`Inserted ${savedPharmacies.length} pharmacies`);

  // 5. Medicine catalogue
  const savedMedicines = [];
  for (const m of medicines) {
    const [name, brandName, genericName, manufacturer, category, strength, dosageForm, rx, description] = m;
    savedMedicines.push(
      await Medicine.create({
        name,
        brandName,
        genericName,
        manufacturer,
        category: categoryMap[category],
        strength,
        dosageForm,
        prescriptionRequired: rx,
        description,
      })
    );
  }
  console.log(`Inserted ${savedMedicines.length} medicines`);

  // 6. Inventory - each pharmacy stocks a different, overlapping subset so that
  //    price comparison and "out of stock" cases are both visible in the demo.
  const basePrices = {
    Tablet: 35, Capsule: 60, Syrup: 95, Injection: 480, Gel: 130, Powder: 22, Sachet: 65,
  };
  let inventoryCount = 0;
  for (let pi = 0; pi < savedPharmacies.length; pi++) {
    for (let mi = 0; mi < savedMedicines.length; mi++) {
      // skip a few so not every pharmacy has every medicine
      if ((mi + pi) % 4 === 3) continue;
      const med = savedMedicines[mi];
      const base = basePrices[med.dosageForm] || 40;
      const price = Number((base * (0.85 + ((pi * 7 + mi * 3) % 30) / 100)).toFixed(2));

      let stock = ((mi * 13 + pi * 29) % 120) + 5;
      if ((mi + pi) % 11 === 0) stock = 0;           // out of stock case
      else if ((mi + pi) % 7 === 0) stock = 4;       // low stock case

      await Inventory.create({
        pharmacy: savedPharmacies[pi]._id,
        medicine: med._id,
        price,
        stock,
        lowStockLimit: 10,
        batchNumber: `B${2026}${String(mi + 1).padStart(3, '0')}`,
        expiryDate: new Date(2027, (mi % 12), 28),
      });
      inventoryCount++;
    }
  }
  console.log(`Inserted ${inventoryCount} inventory records`);

  // 7. A few reservations so the dashboards are not empty
  const sampleReservations = [
    { user: 0, pharmacy: 0, medicine: 0, quantity: 2, status: 'pending' },
    { user: 1, pharmacy: 1, medicine: 9, quantity: 1, status: 'confirmed' },
    { user: 0, pharmacy: 2, medicine: 16, quantity: 3, status: 'ready' },
    { user: 2, pharmacy: 1, medicine: 20, quantity: 1, status: 'completed' },
  ];
  for (const r of sampleReservations) {
    const item = await Inventory.findOne({
      pharmacy: savedPharmacies[r.pharmacy]._id,
      medicine: savedMedicines[r.medicine]._id,
    });
    if (!item || item.stock < r.quantity) continue;

    await Reservation.create({
      user: savedCustomers[r.user]._id,
      pharmacy: savedPharmacies[r.pharmacy]._id,
      medicine: savedMedicines[r.medicine]._id,
      inventory: item._id,
      quantity: r.quantity,
      unitPrice: item.price,
      totalPrice: Number((item.price * r.quantity).toFixed(2)),
      status: r.status,
    });
    item.stock -= r.quantity;
    await item.save();
  }
  console.log('Inserted sample reservations');

  // 8. Welcome notifications
  for (const u of savedCustomers) {
    await Notification.create({
      user: u._id,
      title: 'Welcome to Smart Pharmacy',
      message: 'Search for a medicine to see which nearby pharmacy has it in stock.',
      type: 'system',
    });
  }

  console.log('\nSeeding complete. Sample logins:');
  console.log('  Admin    : admin@pharma.com    / Admin@123');
  console.log('  User     : ravi@example.com    / User@123');
  console.log('  Pharmacy : apollo@pharmacy.com / Pharma@123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.connection.close();
  process.exit(1);
});
