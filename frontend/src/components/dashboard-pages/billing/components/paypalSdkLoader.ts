// PayPal JS SDK loader. Caches the promise so repeated modal opens
// don't re-inject the script tag. currency is ALWAYS "USD" — PayPal
// cannot receive INR, see PaypalCheckoutModal.
let paypalSdkPromise: Promise<boolean> | null = null;

export function loadPaypalScript(clientId: string, currency: string): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).paypal) {
    return Promise.resolve(true);
  }
  if (paypalSdkPromise) return paypalSdkPromise;

  paypalSdkPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${encodeURIComponent(currency)}&intent=capture`;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      paypalSdkPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return paypalSdkPromise;
}