const { PrismaClient } = require("@prisma/client");

// Cliente único compartido por toda la app (evita agotar conexiones en dev/hot-reload)
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

module.exports = prisma;
