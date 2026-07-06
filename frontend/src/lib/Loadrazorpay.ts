declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Injects the Razorpay checkout script once and resolves true/false
 * depending on whether it loaded. Safe to call multiple times.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    if (document.getElementById("razorpay-checkout-js")) {
      // Script tag exists but may still be loading — poll briefly.
      const check = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(check);
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        resolve(!!window.Razorpay);
      }, 5000);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export {};