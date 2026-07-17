import { env } from "@config/env";
import { ApiError } from "@utils/ApiError";

/**
 * ------------------------------------------------------------------
 * PAYPAL — SANDBOX BY DEFAULT
 * ------------------------------------------------------------------
 * Required env vars (add to your .env / env.ts):
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_MODE            ("sandbox" | "live", defaults to sandbox)
 *   PAYPAL_WEBHOOK_ID      (from PayPal Developer Dashboard > Webhooks)
 *   FRONTEND_URL
 *
 * NEVER hardcode CLIENT_SECRET anywhere outside env vars / your
 * secrets manager. It must not be exposed to the frontend.
 * ------------------------------------------------------------------
 */

const PAYPAL_BASE_URL =
  env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString(
    "base64"
  );

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw ApiError.internal("Failed to authenticate with PayPal");
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  cachedToken = {
    token: data.access_token,
    // refresh a minute early to avoid edge-of-expiry failures
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Creates a PayPal order (intent = CAPTURE). Returns the order id the
 * frontend PayPal Buttons SDK needs to render the approval flow.
 */
export async function createPaypalOrder(amount: number, currency: string, referenceId: string) {
  const accessToken = await getAccessToken();

  // PayPal does not support receiving payments in INR. Force USD (or
  // whatever currency your PayPal business account actually supports)
  // for the PayPal-facing call regardless of the plan's display currency.
  const paypalCurrency = currency === "INR" ? "USD" : currency;

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          amount: {
            currency_code: paypalCurrency,
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Your App",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${env.FRONTEND_URL}/dashboard/billing?paypal=success`,
        cancel_url: `${env.FRONTEND_URL}/dashboard/billing?paypal=cancelled`,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Log PayPal's actual error body so this doesn't stay a mystery.
    console.error("PayPal create-order failed:", JSON.stringify(data, null, 2));
    const detail = (data as any)?.details?.[0]?.issue || (data as any)?.message;
    throw ApiError.badRequest(detail || "Failed to create PayPal order");
  }

  return data as { id: string; status: string };
}

/**
 * Captures a previously-approved PayPal order. This MUST happen
 * server-side — never trust the client's word that payment succeeded.
 */
export async function capturePaypalOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw ApiError.badRequest((data as any)?.message || "Failed to capture PayPal order");
  }

  return data as {
    id: string;
    status: string;
    purchase_units: Array<{
      payments: { captures: Array<{ id: string; status: string }> };
    }>;
  };
}

/**
 * Verifies an incoming PayPal webhook against PayPal's own verification
 * endpoint. Used by the webhook route as a defense-in-depth backstop
 * to the client-driven create/capture flow.
 */
export async function verifyPaypalWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  body: any
) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    }),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}