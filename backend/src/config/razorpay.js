import Razorpay from "razorpay";

let razorpayInstance = null;

/**
 * Get or initialize the Razorpay client instance
 * @returns {Razorpay}
 */
export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials missing. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }

  return razorpayInstance;
};

/**
 * Get the public Razorpay Key ID
 * Safe to send to the client for Razorpay Checkout
 */
export const getRazorpayKeyId = () => {
  return process.env.RAZORPAY_KEY_ID || "";
};

