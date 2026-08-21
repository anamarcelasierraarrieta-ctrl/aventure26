const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SERVICES = [
  { name: "Blower", price: 45000, durationMinutes: 45, category: "Peinado" },
  { name: "Hidratación", price: 60000, durationMinutes: 60, category: "Tratamiento" },
  { name: "Aminoácidos", price: 90000, durationMinutes: 90, category: "Tratamiento" },
  { name: "Keratina", price: 180000, durationMinutes: 150, category: "Tratamiento" },
  { name: "Reductor de volumen", price: 150000, durationMinutes: 120, category: "Tratamiento" },
  { name: "Balayage", price: 220000, durationMinutes: 180, category: "Color" },
  { name: "Iluminaciones", price: 200000, durationMinutes: 150, category: "Color" },
  { name: "Rayitos", price: 130000, durationMinutes: 120, category: "Color" },
  { name: "Peinado de novia", price: 250000, durationMinutes: 120, category: "Eventos" },
  { name: "Peinado para niña", price: 35000, durationMinutes: 30, category: "Eventos" },
];

const PRODUCTS = [
  { name: "Shampoo hidratante", sku: "SHP-001", stock: 20, minStock: 5, costPrice: 18000, unit: "botella" },
  { name: "Keratina profesional", sku: "KER-001", stock: 8, minStock: 3, costPrice: 65000, unit: "litro" },
  { name: "Decolorante", sku: "DEC-001", stock: 12, minStock: 4, costPrice: 22000, unit: "kg" },
  { name: "Papel aluminio", sku: "ALU-001", stock: 3, minStock: 5, costPrice: 15000, unit: "rollo" },
  { name: "Ampolla de aminoácidos", sku: "AMI-001", stock: 15, minStock: 5, costPrice: 12000, unit: "unidad" },
  { name: "Tinte rubio ceniza", sku: "TIN-010", stock: 10, minStock: 4, costPrice: 19000, unit: "tubo" },
];

async function main() {
  console.log("🌱 Sembrando datos demo de Aventure 26...");

  const passwordHash = await bcrypt.hash("Aventure26!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aventure26.demo" },
    update: {},
    create: {
      name: "Administrador Aventure 26",
      email: "admin@aventure26.demo",
      passwordHash,
      role: "ADMIN",
      phone: "+573000000000",
    },
  });

  const stylist1 = await prisma.user.upsert({
    where: { email: "valentina@aventure26.demo" },
    update: {},
    create: {
      name: "Valentina Ríos",
      email: "valentina@aventure26.demo",
      passwordHash,
      role: "STYLIST",
      commissionRate: 15,
      phone: "+573001112233",
    },
  });

  const stylist2 = await prisma.user.upsert({
    where: { email: "camila@aventure26.demo" },
    update: {},
    create: {
      name: "Camila Torres",
      email: "camila@aventure26.demo",
      passwordHash,
      role: "STYLIST",
      commissionRate: 12,
      phone: "+573004445566",
    },
  });

  await prisma.user.upsert({
    where: { email: "recepcion@aventure26.demo" },
    update: {},
    create: {
      name: "Recepción",
      email: "recepcion@aventure26.demo",
      passwordHash,
      role: "RECEPTION",
    },
  });

  const services = {};
  for (const s of SERVICES) {
    services[s.name] = await prisma.service.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  const products = {};
  for (const p of PRODUCTS) {
    products[p.sku] = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // Consumo estimado de insumos por servicio
  const consumption = [
    { service: "Keratina", sku: "KER-001", qty: 0.3 },
    { service: "Keratina", sku: "SHP-001", qty: 0.1 },
    { service: "Balayage", sku: "DEC-001", qty: 0.15 },
    { service: "Balayage", sku: "ALU-001", qty: 0.5 },
    { service: "Iluminaciones", sku: "DEC-001", qty: 0.2 },
    { service: "Rayitos", sku: "TIN-010", qty: 1 },
    { service: "Aminoácidos", sku: "AMI-001", qty: 2 },
    { service: "Hidratación", sku: "SHP-001", qty: 0.1 },
  ];
  for (const c of consumption) {
    await prisma.serviceProductConsumption.upsert({
      where: { serviceId_productId: { serviceId: services[c.service].id, productId: products[c.sku].id } },
      update: {},
      create: {
        serviceId: services[c.service].id,
        productId: products[c.sku].id,
        quantityUsed: c.qty,
      },
    });
  }

  const client1 = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ana Marcela Sierra",
      phone: "+573007778899",
      email: "ana@example.com",
    },
  });

  await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Laura Gómez",
      phone: "+573009990011",
    },
  });

  // Cita demo para hoy
  const start = new Date();
  start.setHours(15, 0, 0, 0);
  const end = new Date(start.getTime() + services["Balayage"].durationMinutes * 60000);

  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      stylistId: stylist1.id,
      serviceId: services["Balayage"].id,
      startTime: start,
      endTime: end,
      status: "CONFIRMED",
      confirmationSent: true,
    },
  });

  // Venta demo (ayer)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.sale.create({
    data: {
      date: yesterday,
      clientId: client1.id,
      stylistId: stylist2.id,
      paymentMethod: "CARD_STRIPE",
      total: Number(services["Hidratación"].price),
      commissionAmount: Number(services["Hidratación"].price) * 0.12,
      items: { create: [{ serviceId: services["Hidratación"].id, price: services["Hidratación"].price, quantity: 1 }] },
    },
  });

  // Gasto demo
  await prisma.expense.create({
    data: { category: "Arriendo", description: "Arriendo local agosto", amount: 3500000, type: "FIXED" },
  });
  await prisma.expense.create({
    data: { category: "Insumos", description: "Compra de tintes", amount: 420000, type: "VARIABLE" },
  });

  console.log("✅ Seed completo.");
  console.log("──────────────────────────────────────────");
  console.log(" Usuario demo (ADMIN):  admin@aventure26.demo");
  console.log(" Contraseña:            Aventure26!");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
