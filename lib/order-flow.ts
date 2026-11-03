import type { OrderStatus } from "@/lib/orders";

/** The only stage moves an admin can make by hand. Payments move orders automatically (deposit_paid, balance_paid). */
export const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; danger?: boolean }[]>> = {
  pending_deposit: [{ to: "cancelled", label: "Cancel order", danger: true }],
  deposit_paid: [{ to: "procuring", label: "Mark as sourcing" }, { to: "refunded", label: "Refund deposit", danger: true }],
  procuring: [{ to: "shipped", label: "Mark as shipped" }, { to: "refunded", label: "Refund deposit", danger: true }],
  shipped: [{ to: "arrived_port", label: "Arrived at Lagos port" }],
  arrived_port: [{ to: "in_abuja_inspection", label: "In Abuja, start inspection" }],
  in_abuja_inspection: [{ to: "balance_due", label: "Passed inspection, request balance" }, { to: "refunded", label: "Failed inspection, refund deposit", danger: true }],
  balance_paid: [{ to: "delivered", label: "Handed over" }],
  refund_pending: [{ to: "refunded", label: "Refund sent" }],
};

/** Orders an admin should look at today. */
export const NEEDS_ACTION: OrderStatus[] = ["refund_pending", "deposit_paid", "in_abuja_inspection", "balance_due", "balance_paid"];
export const ACTIVE: OrderStatus[] = ["deposit_paid", "procuring", "shipped", "arrived_port", "in_abuja_inspection", "balance_due"];

/** What the admin should do next, in their words. */
export const ADMIN_HINT: Record<OrderStatus, string> = {
  pending_deposit: "Buyer started checkout but hasn't paid. Cancel after a day if they don't respond.",
  deposit_paid: "Deposit received. Confirm the car with the supplier, then mark as sourcing.",
  procuring: "Book the car onto a vessel, then mark as shipped.",
  shipped: "On the water. Mark arrived when it reaches Lagos.",
  arrived_port: "Clearing customs. Mark in Abuja once it's at the showroom.",
  in_abuja_inspection: "Run the pre-delivery inspection, then request the balance or refund.",
  balance_due: "Waiting for the 60% balance. Send the buyer the payment link.",
  balance_paid: "Paid in full. Book the hand-over, then mark handed over.",
  delivered: "Complete.",
  refund_pending: "Another buyer reserved this car first. Refund this deposit in Paystack, then mark refund sent.",
  cancelled: "Closed. No money taken.",
  refunded: "Closed. Deposit refunded.",
};
