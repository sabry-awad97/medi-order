// بيانات تجريبية واقعية للنظام
import { uuidv7 } from "uuidv7";
import type { Order, Supplier, OrderStatus } from "./types";
import type { CreateInventoryItemWithStock } from "@/api/inventory.api";

// أسماء عملاء واقعية
const customerNames = [
  "أحمد محمد العلي",
  "فاطمة عبدالله السالم",
  "خالد سعد الغامدي",
  "نورة حسن القحطاني",
  "عبدالرحمن علي الشهري",
  "سارة محمد الدوسري",
  "يوسف عبدالعزيز المطيري",
  "مريم سعيد الزهراني",
  "عمر فهد العتيبي",
  "هند ناصر الحربي",
];

// أرقام هواتف واقعية
const phoneNumbers = [
  "0501234567",
  "0551234568",
  "0561234569",
  "0541234570",
  "0531234571",
  "0521234572",
  "0581234573",
  "0591234574",
  "0571234575",
  "0501234576",
];

// أدوية واقعية مع تركيزاتها
const medicines = [
  { name: "أوجمنتين", concentration: "1000 مجم", form: "أقراص" },
  { name: "زيثروماكس", concentration: "500 مجم", form: "كبسولات" },
  { name: "فلاجيل", concentration: "500 مجم", form: "أقراص" },
  { name: "نيوروبيون", concentration: "B1+B6+B12", form: "أمبولات" },
  { name: "ديكلوفيناك", concentration: "75 مجم", form: "حقن" },
  { name: "أوميبرازول", concentration: "20 مجم", form: "كبسولات" },
  { name: "ميتفورمين", concentration: "850 مجم", form: "أقراص" },
  { name: "أملوديبين", concentration: "5 مجم", form: "أقراص" },
  { name: "لوسارتان", concentration: "50 مجم", form: "أقراص" },
  { name: "سيمفاستاتين", concentration: "20 مجم", form: "أقراص" },
  { name: "ليفوثيروكسين", concentration: "100 ميكروجرام", form: "أقراص" },
  { name: "مونتيلوكاست", concentration: "10 مجم", form: "أقراص" },
  { name: "سيتريزين", concentration: "10 مجم", form: "أقراص" },
  { name: "باراسيتامول", concentration: "500 مجم", form: "أقراص" },
  { name: "إيبوبروفين", concentration: "400 مجم", form: "أقراص" },
];

// حالات الطلبات
const statuses: OrderStatus[] = [
  "pending",
  "ordered",
  "arrived",
  "delivered",
  "cancelled",
];

// ملاحظات واقعية
const notes = [
  "العميل يحتاج الدواء بشكل عاجل",
  "يفضل التواصل عبر الواتساب",
  "الدواء للاستخدام المزمن",
  "العميل طلب التأكد من تاريخ الصلاحية",
  "يرجى إبلاغ العميل عند وصول الدواء",
  "",
  "",
  "",
];

// أسماء موردين واقعية
const supplierNames = [
  "شركة النهدي للأدوية",
  "مؤسسة الدواء السعودي",
  "شركة الدواء المتحدة",
  "مؤسسة الشفاء للأدوية",
  "شركة الرعاية الصحية",
  "مؤسسة الأمل للأدوية",
  "شركة الحياة الطبية",
  "مؤسسة الصحة الأولى",
];

// عناوين واقعية
const addresses = [
  "الرياض، حي النخيل",
  "جدة، حي الروضة",
  "الدمام، حي الفيصلية",
  "مكة المكرمة، حي العزيزية",
  "المدينة المنورة، حي السلام",
  "الخبر، حي الثقبة",
  "الطائف، حي الشهداء",
  "بريدة، حي الصفراء",
];

// دالة لتوليد تاريخ عشوائي في آخر 30 يوم
function randomDate(daysAgo: number = 30): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return date;
}

// دالة لاختيار عنصر عشوائي من مصفوفة
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// دالة لاختيار عدة عناصر عشوائية من مصفوفة
function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// توليد طلبات تجريبية
export function generateSeedOrders(count: number = 15): Order[] {
  const orders: Order[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate(30);
    const updatedAt = new Date(
      createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
    );

    const medicineCount = Math.floor(Math.random() * 3) + 1; // 1-3 أدوية
    const selectedMedicines = randomItems(medicines, medicineCount);

    orders.push({
      id: crypto.randomUUID(),
      customerName: randomItem(customerNames),
      phoneNumber: randomItem(phoneNumbers),
      medicines: selectedMedicines.map((med) => ({
        id: crypto.randomUUID(),
        name: med.name,
        concentration: med.concentration,
        form: med.form,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3 علب
      })),
      status: randomItem(statuses),
      notes: randomItem(notes),
      createdAt,
      updatedAt,
    });
  }

  return orders;
}

// توليد موردين تجريبيين
export function generateSeedSuppliers(count: number = 8): Supplier[] {
  const suppliers: Supplier[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate(90);
    const phone = `05${Math.floor(Math.random() * 9)}${Math.floor(
      Math.random() * 10000000,
    )
      .toString()
      .padStart(7, "0")}`;
    const whatsapp = Math.random() > 0.3 ? phone : undefined;
    const email = Math.random() > 0.4 ? `info@supplier${i + 1}.com` : undefined;

    const medicineCount = Math.floor(Math.random() * 8) + 5; // 5-12 دواء
    const commonMedicines = randomItems(
      medicines.map((m) => m.name),
      medicineCount,
    );

    suppliers.push({
      id: crypto.randomUUID(),
      name: supplierNames[i] || `مورد ${i + 1}`,
      phone,
      whatsapp,
      email,
      address: randomItem(addresses),
      commonMedicines,
      avgDeliveryDays: Math.floor(Math.random() * 5) + 2, // 2-6 أيام
      rating: Math.floor(Math.random() * 2) + 3.5, // 3.5-5
      totalOrders: Math.floor(Math.random() * 50) + 10, // 10-60 طلب
      notes: Math.random() > 0.5 ? "مورد موثوق وسريع في التوصيل" : "",
      createdAt,
      updatedAt: createdAt,
    });
  }

  return suppliers;
}

// ============================================================================
// Inventory Seed Data
// ============================================================================

/**
 * Manufacturer seed data with UUIDs
 */
export interface SeedManufacturer {
  id: string;
  name: string;
  short_name: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  is_active: boolean;
}

/**
 * Generate manufacturer IDs - returns a map of short names to IDs
 */
export function generateManufacturerIds() {
  return {
    GSK: uuidv7(),
    PFIZER: uuidv7(),
    SANOFI: uuidv7(),
    BAYER: uuidv7(),
    ABBOTT: uuidv7(),
    NOVARTIS: uuidv7(),
    GRUNENTHAL: uuidv7(),
    MSD: uuidv7(),
    MERCK: uuidv7(),
    ASTRAZENECA: uuidv7(),
    JANSSEN: uuidv7(),
    JOHNSON_AND_JOHNSON: uuidv7(),
    ASPEN: uuidv7(),
    UCB: uuidv7(),
    ELI_LILLY: uuidv7(),
    ALCON: uuidv7(),
    LEO_PHARMA: uuidv7(),
    MUNDIPHARMA: uuidv7(),
    VARIOUS: uuidv7(),
  };
}

export function generateSeedManufacturers(
  manufacturerIds: ReturnType<typeof generateManufacturerIds>,
): SeedManufacturer[] {
  return [
    {
      id: manufacturerIds.GSK,
      name: "GlaxoSmithKline",
      short_name: "GSK",
      country: "United Kingdom",
      phone: "+44-20-8047-5000",
      email: "contact@gsk.com",
      website: "https://www.gsk.com",
      notes: "Global pharmaceutical company",
      is_active: true,
    },
    {
      id: manufacturerIds.PFIZER,
      name: "Pfizer",
      short_name: "Pfizer",
      country: "United States",
      phone: "+1-212-733-2323",
      email: "info@pfizer.com",
      website: "https://www.pfizer.com",
      notes: "Leading pharmaceutical manufacturer",
      is_active: true,
    },
    {
      id: manufacturerIds.SANOFI,
      name: "Sanofi",
      short_name: "Sanofi",
      country: "France",
      phone: "+33-1-53-77-40-00",
      email: "contact@sanofi.com",
      website: "https://www.sanofi.com",
      notes: "Global healthcare leader",
      is_active: true,
    },
    {
      id: manufacturerIds.BAYER,
      name: "Bayer",
      short_name: "Bayer",
      country: "Germany",
      phone: "+49-214-30-1",
      email: "info@bayer.com",
      website: "https://www.bayer.com",
      notes: "Pharmaceutical and life sciences company",
      is_active: true,
    },
    {
      id: manufacturerIds.ABBOTT,
      name: "Abbott",
      short_name: "Abbott",
      country: "United States",
      phone: "+1-224-667-6100",
      email: "contact@abbott.com",
      website: "https://www.abbott.com",
      notes: "Healthcare products manufacturer",
      is_active: true,
    },
    {
      id: manufacturerIds.NOVARTIS,
      name: "Novartis",
      short_name: "Novartis",
      country: "Switzerland",
      phone: "+41-61-324-1111",
      email: "info@novartis.com",
      website: "https://www.novartis.com",
      notes: "Multinational pharmaceutical corporation",
      is_active: true,
    },
    {
      id: manufacturerIds.GRUNENTHAL,
      name: "Grünenthal",
      short_name: "Grünenthal",
      country: "Germany",
      phone: "+49-241-569-0",
      email: "contact@grunenthal.com",
      website: "https://www.grunenthal.com",
      notes: "Pain management specialist",
      is_active: true,
    },
    {
      id: manufacturerIds.MSD,
      name: "MSD",
      short_name: "MSD",
      country: "United States",
      phone: "+1-908-740-4000",
      email: "info@msd.com",
      website: "https://www.msd.com",
      notes: "Merck Sharp & Dohme",
      is_active: true,
    },
    {
      id: manufacturerIds.MERCK,
      name: "Merck",
      short_name: "Merck",
      country: "Germany",
      phone: "+49-6151-72-0",
      email: "contact@merck.com",
      website: "https://www.merck.com",
      notes: "Science and technology company",
      is_active: true,
    },
    {
      id: manufacturerIds.ASTRAZENECA,
      name: "AstraZeneca",
      short_name: "AstraZeneca",
      country: "United Kingdom",
      phone: "+44-20-3749-5000",
      email: "info@astrazeneca.com",
      website: "https://www.astrazeneca.com",
      notes: "Biopharmaceutical company",
      is_active: true,
    },
    {
      id: manufacturerIds.JANSSEN,
      name: "Janssen",
      short_name: "Janssen",
      country: "Belgium",
      phone: "+32-14-60-21-11",
      email: "contact@janssen.com",
      website: "https://www.janssen.com",
      notes: "Johnson & Johnson pharmaceutical division",
      is_active: true,
    },
    {
      id: manufacturerIds.JOHNSON_AND_JOHNSON,
      name: "Johnson & Johnson",
      short_name: "J&J",
      country: "United States",
      phone: "+1-732-524-0400",
      email: "info@jnj.com",
      website: "https://www.jnj.com",
      notes: "Healthcare products manufacturer",
      is_active: true,
    },
    {
      id: manufacturerIds.ASPEN,
      name: "Aspen",
      short_name: "Aspen",
      country: "South Africa",
      phone: "+27-31-580-8600",
      email: "info@aspenpharma.com",
      website: "https://www.aspenpharma.com",
      notes: "Pharmaceutical manufacturer",
      is_active: true,
    },
    {
      id: manufacturerIds.UCB,
      name: "UCB",
      short_name: "UCB",
      country: "Belgium",
      phone: "+32-2-559-99-99",
      email: "contact@ucb.com",
      website: "https://www.ucb.com",
      notes: "Biopharmaceutical company",
      is_active: true,
    },
    {
      id: manufacturerIds.ELI_LILLY,
      name: "Eli Lilly",
      short_name: "Lilly",
      country: "United States",
      phone: "+1-317-276-2000",
      email: "info@lilly.com",
      website: "https://www.lilly.com",
      notes: "Pharmaceutical company",
      is_active: true,
    },
    {
      id: manufacturerIds.ALCON,
      name: "Alcon",
      short_name: "Alcon",
      country: "Switzerland",
      phone: "+41-58-911-8111",
      email: "contact@alcon.com",
      website: "https://www.alcon.com",
      notes: "Eye care products specialist",
      is_active: true,
    },
    {
      id: manufacturerIds.LEO_PHARMA,
      name: "Leo Pharma",
      short_name: "Leo",
      country: "Denmark",
      phone: "+45-44-94-58-88",
      email: "info@leo-pharma.com",
      website: "https://www.leo-pharma.com",
      notes: "Dermatology specialist",
      is_active: true,
    },
    {
      id: manufacturerIds.MUNDIPHARMA,
      name: "Mundipharma",
      short_name: "Mundipharma",
      country: "United Kingdom",
      phone: "+44-1223-397-500",
      email: "contact@mundipharma.com",
      website: "https://www.mundipharma.com",
      notes: "Healthcare company",
      is_active: true,
    },
    {
      id: manufacturerIds.VARIOUS,
      name: "Various",
      short_name: "Various",
      country: "Multiple",
      notes: "Generic manufacturers",
      is_active: true,
    },
  ];
}

/**
 * Comprehensive pharmaceutical inventory seed data
 * Covers all cases: in-stock, low-stock, out-of-stock, controlled substances, etc.
 */
export function generateSeedInventory(
  manufacturerIds: ReturnType<typeof generateManufacturerIds>,
): CreateInventoryItemWithStock[] {
  return [
    // ========== Antibiotics (مضادات حيوية) ==========
    {
      name: "Augmentin",
      generic_name: "Amoxicillin + Clavulanic Acid",
      concentration: "1000mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.GSK,
      barcodes: [{ barcode: "6221155000101", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature (15-25°C)",
      notes: "Take with food to reduce stomach upset",
      stock_quantity: 150,
      min_stock_level: 50,
      unit_price: 45.5,
    },
    {
      name: "Zithromax",
      generic_name: "Azithromycin",
      concentration: "500mg",
      form: "Capsules",
      manufacturer_id: manufacturerIds.PFIZER,
      barcodes: [{ barcode: "6221155000202", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Take on empty stomach, 1 hour before or 2 hours after meals",
      stock_quantity: 80,
      min_stock_level: 40,
      unit_price: 65.0,
    },
    {
      name: "Flagyl",
      generic_name: "Metronidazole",
      concentration: "500mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.SANOFI,
      barcodes: [{ barcode: "6221155000303", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature, protect from light",
      notes: "Avoid alcohol during treatment and for 48 hours after",
      stock_quantity: 25, // Low stock
      min_stock_level: 30,
      unit_price: 28.75,
    },
    {
      name: "Cipro",
      generic_name: "Ciprofloxacin",
      concentration: "500mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.BAYER,
      barcodes: [{ barcode: "6221155000404", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Avoid dairy products and antacids within 2 hours",
      stock_quantity: 0, // Out of stock
      min_stock_level: 40,
      unit_price: 52.0,
    },

    // ========== Pain Relief & Anti-inflammatory (مسكنات ومضادات التهاب) ==========
    {
      name: "Panadol",
      generic_name: "Paracetamol",
      concentration: "500mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.GSK,
      barcodes: [{ barcode: "6221155000505", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Maximum 4g per day for adults",
      stock_quantity: 500,
      min_stock_level: 100,
      unit_price: 12.5,
    },
    {
      name: "Brufen",
      generic_name: "Ibuprofen",
      concentration: "400mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.ABBOTT,
      barcodes: [{ barcode: "6221155000606", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Take with food or milk to reduce stomach irritation",
      stock_quantity: 320,
      min_stock_level: 80,
      unit_price: 18.0,
    },
    {
      name: "Voltaren",
      generic_name: "Diclofenac Sodium",
      concentration: "75mg",
      form: "Injection",
      manufacturer_id: manufacturerIds.NOVARTIS,
      barcodes: [{ barcode: "6221155000707", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at 2-8°C (refrigerate)",
      notes: "For intramuscular injection only",
      stock_quantity: 45,
      min_stock_level: 30,
      unit_price: 35.0,
    },
    {
      name: "Tramadol",
      generic_name: "Tramadol HCl",
      concentration: "50mg",
      form: "Capsules",
      manufacturer_id: manufacturerIds.GRUNENTHAL,
      barcodes: [{ barcode: "6221155000808", is_primary: true }],
      requires_prescription: true,
      is_controlled: true, // Controlled substance
      storage_instructions: "Store at room temperature in locked cabinet",
      notes:
        "Schedule IV controlled substance - requires special documentation",
      stock_quantity: 60,
      min_stock_level: 20,
      unit_price: 42.0,
    },

    // ========== Cardiovascular (أدوية القلب والأوعية الدموية) ==========
    {
      name: "Norvasc",
      generic_name: "Amlodipine",
      concentration: "5mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.PFIZER,
      barcodes: [{ barcode: "6221155000909", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "For hypertension and angina - take once daily",
      stock_quantity: 180,
      min_stock_level: 60,
      unit_price: 38.5,
    },
    {
      name: "Cozaar",
      generic_name: "Losartan Potassium",
      concentration: "50mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.MSD,
      barcodes: [{ barcode: "6221155001010", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "ARB for hypertension - monitor potassium levels",
      stock_quantity: 140,
      min_stock_level: 50,
      unit_price: 55.0,
    },
    {
      name: "Plavix",
      generic_name: "Clopidogrel",
      concentration: "75mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.SANOFI,
      barcodes: [{ barcode: "6221155001111", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Antiplatelet - do not stop without consulting doctor",
      stock_quantity: 15, // Low stock
      min_stock_level: 40,
      unit_price: 125.0,
    },
    {
      name: "Zocor",
      generic_name: "Simvastatin",
      concentration: "20mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.MSD,
      barcodes: [{ barcode: "6221155001212", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Statin for cholesterol - take in the evening",
      stock_quantity: 200,
      min_stock_level: 70,
      unit_price: 48.0,
    },

    // ========== Diabetes (أدوية السكري) ==========
    {
      name: "Glucophage",
      generic_name: "Metformin HCl",
      concentration: "850mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.MERCK,
      barcodes: [{ barcode: "6221155001313", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Take with meals to reduce GI side effects",
      stock_quantity: 250,
      min_stock_level: 80,
      unit_price: 32.0,
    },
    {
      name: "Januvia",
      generic_name: "Sitagliptin",
      concentration: "100mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.MSD,
      barcodes: [{ barcode: "6221155001414", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "DPP-4 inhibitor - can be taken with or without food",
      stock_quantity: 90,
      min_stock_level: 40,
      unit_price: 185.0,
    },
    {
      name: "Lantus",
      generic_name: "Insulin Glargine",
      concentration: "100 units/mL",
      form: "Injection",
      manufacturer_id: manufacturerIds.SANOFI,
      barcodes: [{ barcode: "6221155001515", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions:
        "Refrigerate unopened vials (2-8°C). Once opened, can be kept at room temperature for 28 days",
      notes: "Long-acting insulin - inject subcutaneously once daily",
      stock_quantity: 35,
      min_stock_level: 25,
      unit_price: 245.0,
    },

    // ========== Respiratory (أدوية الجهاز التنفسي) ==========
    {
      name: "Ventolin",
      generic_name: "Salbutamol",
      concentration: "100mcg/dose",
      form: "Inhaler",
      manufacturer_id: manufacturerIds.GSK,
      barcodes: [{ barcode: "6221155001616", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature, do not freeze",
      notes: "Bronchodilator - shake well before use",
      stock_quantity: 75,
      min_stock_level: 40,
      unit_price: 38.0,
    },
    {
      name: "Singulair",
      generic_name: "Montelukast",
      concentration: "10mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.MSD,
      barcodes: [{ barcode: "6221155001717", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "For asthma and allergic rhinitis - take in the evening",
      stock_quantity: 110,
      min_stock_level: 50,
      unit_price: 95.0,
    },
    {
      name: "Zyrtec",
      generic_name: "Cetirizine",
      concentration: "10mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.UCB,
      barcodes: [{ barcode: "6221155001818", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Antihistamine - may cause drowsiness",
      stock_quantity: 180,
      min_stock_level: 60,
      unit_price: 22.5,
    },

    // ========== Gastrointestinal (أدوية الجهاز الهضمي) ==========
    {
      name: "Nexium",
      generic_name: "Esomeprazole",
      concentration: "40mg",
      form: "Capsules",
      manufacturer_id: manufacturerIds.ASTRAZENECA,
      barcodes: [{ barcode: "6221155001919", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "PPI - take 30 minutes before meals",
      stock_quantity: 95,
      min_stock_level: 50,
      unit_price: 78.0,
    },
    {
      name: "Motilium",
      generic_name: "Domperidone",
      concentration: "10mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.JANSSEN,
      barcodes: [{ barcode: "6221155002020", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Antiemetic - take 15-30 minutes before meals",
      stock_quantity: 8, // Low stock
      min_stock_level: 30,
      unit_price: 32.0,
    },
    {
      name: "Imodium",
      generic_name: "Loperamide",
      concentration: "2mg",
      form: "Capsules",
      manufacturer_id: manufacturerIds.JOHNSON_AND_JOHNSON,
      barcodes: [{ barcode: "6221155002121", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "For acute diarrhea - do not exceed 8mg per day",
      stock_quantity: 120,
      min_stock_level: 40,
      unit_price: 28.0,
    },

    // ========== Thyroid & Hormones (أدوية الغدة الدرقية والهرمونات) ==========
    {
      name: "Eltroxin",
      generic_name: "Levothyroxine Sodium",
      concentration: "100mcg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.ASPEN,
      barcodes: [{ barcode: "6221155002222", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions:
        "Store at room temperature, protect from light and moisture",
      notes:
        "For hypothyroidism - take on empty stomach, 30-60 minutes before breakfast",
      stock_quantity: 160,
      min_stock_level: 60,
      unit_price: 42.0,
    },

    // ========== Vitamins & Supplements (فيتامينات ومكملات) ==========
    {
      name: "Neurobion",
      generic_name: "Vitamin B Complex (B1+B6+B12)",
      concentration: "B1 100mg + B6 200mg + B12 200mcg",
      form: "Ampoules",
      manufacturer_id: manufacturerIds.MERCK,
      barcodes: [{ barcode: "6221155002323", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature, protect from light",
      notes: "For vitamin B deficiency - intramuscular injection",
      stock_quantity: 85,
      min_stock_level: 40,
      unit_price: 55.0,
    },
    {
      name: "Vitamin D3",
      generic_name: "Cholecalciferol",
      concentration: "50,000 IU",
      form: "Capsules",
      manufacturer_id: manufacturerIds.VARIOUS,
      barcodes: [{ barcode: "6221155002424", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "For vitamin D deficiency - usually taken weekly",
      stock_quantity: 200,
      min_stock_level: 70,
      unit_price: 35.0,
    },
    {
      name: "Calcium + D",
      generic_name: "Calcium Carbonate + Vitamin D3",
      concentration: "600mg + 400 IU",
      form: "Tablets",
      manufacturer_id: manufacturerIds.VARIOUS,
      barcodes: [{ barcode: "6221155002525", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "For bone health - take with food",
      stock_quantity: 0, // Out of stock
      min_stock_level: 50,
      unit_price: 28.0,
    },

    // ========== Antibacterial Creams & Topicals (كريمات ومراهم) ==========
    {
      name: "Fucidin",
      generic_name: "Fusidic Acid",
      concentration: "2%",
      form: "Cream",
      manufacturer_id: manufacturerIds.LEO_PHARMA,
      barcodes: [{ barcode: "6221155002626", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "Topical antibiotic - apply thin layer 2-3 times daily",
      stock_quantity: 65,
      min_stock_level: 30,
      unit_price: 45.0,
    },
    {
      name: "Betadine",
      generic_name: "Povidone-Iodine",
      concentration: "10%",
      form: "Solution",
      manufacturer_id: manufacturerIds.MUNDIPHARMA,
      barcodes: [{ barcode: "6221155002727", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature, protect from light",
      notes: "Antiseptic - for external use only",
      stock_quantity: 140,
      min_stock_level: 50,
      unit_price: 32.0,
    },

    // ========== Psychiatric Medications (أدوية نفسية) ==========
    {
      name: "Xanax",
      generic_name: "Alprazolam",
      concentration: "0.5mg",
      form: "Tablets",
      manufacturer_id: manufacturerIds.PFIZER,
      barcodes: [{ barcode: "6221155002828", is_primary: true }],
      requires_prescription: true,
      is_controlled: true, // Controlled substance
      storage_instructions: "Store at room temperature in locked cabinet",
      notes: "Schedule IV controlled substance - for anxiety disorders",
      stock_quantity: 40,
      min_stock_level: 20,
      unit_price: 65.0,
    },
    {
      name: "Prozac",
      generic_name: "Fluoxetine",
      concentration: "20mg",
      form: "Capsules",
      manufacturer_id: manufacturerIds.ELI_LILLY,
      barcodes: [{ barcode: "6221155002929", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "SSRI antidepressant - may take 4-6 weeks for full effect",
      stock_quantity: 70,
      min_stock_level: 30,
      unit_price: 95.0,
    },

    // ========== Eye & Ear Drops (قطرات العين والأذن) ==========
    {
      name: "Systane",
      generic_name: "Artificial Tears",
      concentration: "Lubricant Eye Drops",
      form: "Eye Drops",
      manufacturer_id: manufacturerIds.ALCON,
      barcodes: [{ barcode: "6221155003030", is_primary: true }],
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "Store at room temperature",
      notes: "For dry eyes - use as needed",
      stock_quantity: 95,
      min_stock_level: 40,
      unit_price: 48.0,
    },
    {
      name: "Tobradex",
      generic_name: "Tobramycin + Dexamethasone",
      concentration: "0.3% + 0.1%",
      form: "Eye Drops",
      manufacturer_id: manufacturerIds.ALCON,
      barcodes: [{ barcode: "6221155003131", is_primary: true }],
      requires_prescription: true,
      is_controlled: false,
      storage_instructions:
        "Store at room temperature, discard 28 days after opening",
      notes: "Antibiotic + steroid combination - shake well before use",
      stock_quantity: 12, // Low stock
      min_stock_level: 25,
      unit_price: 85.0,
    },
  ];
}
