import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import { env } from "@config/env";
import { ApiError } from "@utils/ApiError";

/**
 * ------------------------------------------------------------------
 * DEVELOPMENT MODE NOTICE
 * ------------------------------------------------------------------
 * Both gateways below are wired to read TEST/SANDBOX credentials from
 * env vars. Nothing here talks to real money until you swap keys.
 *
 *   Razorpay test keys look like:  rzp_test_xxxxxxxxxxxx
 *   Stripe test keys look like:    sk_test_xxxx / pk_test_xxxx
 *
 * Required env vars (add to your .env / env.ts):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   STRIPE_SECRET_KEY
 *   STRIPE_PUBLISHABLE_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   FRONTEND_URL   (e.g. http://localhost:5173)
 * ------------------------------------------------------------------
 */

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID as string,
  key_secret: env.RAZORPAY_KEY_SECRET as string,
});

export const stripe = new Stripe(env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia",
});

/**
 * Creates a Razorpay order. Amount is expected in the plan's base
 * currency unit (e.g. rupees) — Razorpay requires the smallest unit
 * (paise), so we multiply by 100 here.
 */
export async function createRazorpayOrder(amount: number, currency: string, receipt: string) {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: { environment: "development" },
    });
    return order;
  } catch (err: any) {
    throw ApiError.badRequest(err?.error?.description || "Failed to create Razorpay order");
  }
}

/**
 * Verifies the HMAC SHA256 signature Razorpay sends back after checkout.
 * This MUST be done server-side — never trust the client's word that a
 * payment succeeded.
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest("hex");
  return expected === signature;
}

/**
 * Creates a Stripe Checkout Session (hosted payment page). Redirect the
 * user's browser to `session.url` to complete payment.
 */
export async function createStripeCheckoutSession(params: {
  planName: string;
  amount: number;
  currency: string;
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: params.planName },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { userId: params.userId, planId: params.planId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return session;
}

/**
 * Verifies + parses an incoming Stripe webhook event. `rawBody` must be
 * the untouched request buffer (see ENV_SETUP.md — the webhook route
 * cannot go through express.json()).
 */
export function constructStripeEvent(rawBody: Buffer, signature: string) {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET as string);
}