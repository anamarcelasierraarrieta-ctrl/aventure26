// Adaptadores de pasarelas de pago. En modo demo, todas simulan un cobro exitoso.
// Ver docs/INTEGRACIONES.md

async function chargeStripe(amount, source) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log(`[Stripe:mock] Cobro simulado de $${amount}`);
    return { status: "succeeded", provider: "stripe", mocked: true };
  }
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "cop",
    payment_method: source,
    confirm: true,
  });
  return { status: intent.status, provider: "stripe", id: intent.id };
}

async function chargePayPal(amount) {
  if (!process.env.PAYPAL_CLIENT_ID) {
    console.log(`[PayPal:mock] Cobro simulado de $${amount}`);
    return { status: "COMPLETED", provider: "paypal", mocked: true };
  }
  throw new Error("Integración PayPal real no implementada — configurar SDK oficial");
}

async function chargeNequi(amount, phone) {
  if (!process.env.NEQUI_API_KEY) {
    console.log(`[Nequi:mock] Cobro simulado de $${amount} a ${phone}`);
    return { status: "APPROVED", provider: "nequi", mocked: true };
  }
  throw new Error("Integración Nequi real requiere convenio comercial — ver docs/INTEGRACIONES.md");
}

async function chargeDaviplata(amount, phone) {
  if (!process.env.DAVIPLATA_API_KEY) {
    console.log(`[Daviplata:mock] Cobro simulado de $${amount} a ${phone}`);
    return { status: "APPROVED", provider: "daviplata", mocked: true };
  }
  throw new Error("Integración Daviplata real requiere convenio comercial — ver docs/INTEGRACIONES.md");
}

module.exports = { chargeStripe, chargePayPal, chargeNequi, chargeDaviplata };
