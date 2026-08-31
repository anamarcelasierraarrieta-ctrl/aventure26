const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth.middleware");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

function signTokens(user) {
  const payload = { id: user.id, role: user.role, name: user.name, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

    const tokens = signTokens(user);
    res.json({
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken requerido" });

    try {
      const { id } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || !user.active) return res.status(401).json({ error: "Usuario inválido" });
      res.json(signTokens(user));
    } catch {
      res.status(401).json({ error: "Refresh token inválido o expirado" });
    }
  })
);

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, commissionRate: true },
    });
    res.json(user);
  })
);

// POST /api/auth/change-password — el usuario autenticado cambia su propia contraseña
router.post(
  "/change-password",
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.active) return res.status(401).json({ error: "No autenticado" });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "La contraseña actual es incorrecta" });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ ok: true });
  })
);

module.exports = router;
