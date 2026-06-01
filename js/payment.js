/** Free checkout (launch promo). Replace with Paystack when billing goes live. */

export function completeFreeCheckout({ listPrice, email }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        reference: `EL-FREE-${Date.now()}`,
        listPrice,
        amountPaid: 0,
        discountPercent: 100,
        email,
        paidAt: Date.now(),
      });
    }, 1200);
  });
}
