import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Fill } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Deposit terms · Cars Direct", description: "How the 40% deposit, the 60% balance and refunds work." };

export default function DepositTerms() {
  return (
    <LegalPage title="Deposit terms" updated="3 November 2026">
      <p>These terms apply when you reserve a vehicle from <Fill>Cars Direct Ltd, RC number</Fill> (&ldquo;Cars Direct&rdquo;, &ldquo;we&rdquo;) by paying a deposit on this website. Version: deposit-terms-v1.</p>

      <h2>1. The deposit</h2>
      <ol>
        <li>You reserve a vehicle by paying 40% of its listed price (the &ldquo;deposit&rdquo;). The price and deposit are shown in naira and are fixed on the day you pay.</li>
        <li>Paying the deposit reserves that vehicle for you. For a vehicle on ground in Abuja or in transit, no one else can reserve it. For a factory order, we place an order with the manufacturer in your name.</li>
        <li>USD amounts on the website are for reference only. You always pay in naira.</li>
      </ol>

      <h2>2. The balance</h2>
      <ol>
        <li>The remaining 60% (the &ldquo;balance&rdquo;) is due only after the vehicle has arrived in Abuja and passed our pre-delivery inspection.</li>
        <li>We will notify you when the balance is due. Please pay within <Fill>7</Fill> days of that notice.</li>
        <li>The balance is fixed in naira on the day you pay the deposit and will not change with the exchange rate.</li>
        <li>We hand over the vehicle, keys and documents only after the full price has been paid.</li>
      </ol>

      <h2>3. Delivery estimate</h2>
      <p>When you pay, we show an estimated window for the vehicle to be ready in Abuja. It is an estimate based on typical factory, shipping and customs times. We will keep you updated through your order tracking page.</p>

      <h2>4. When you get a full refund</h2>
      <p>We refund your deposit in full if:</p>
      <ul>
        <li>the vehicle fails our pre-delivery inspection in Abuja and we cannot fix the fault to your satisfaction;</li>
        <li>the vehicle is not ready in Abuja within <Fill>30</Fill> days after the end of the estimated window, and you choose to cancel;</li>
        <li>the vehicle was reserved by another buyer moments before your payment arrived; or</li>
        <li>we cancel the order for any reason.</li>
      </ul>
      <p>Refunds go back to the account or card you paid from within <Fill>10 working days</Fill>.</p>

      <h2>5. If you cancel</h2>
      <ul>
        <li>Before we have paid the supplier: we refund your deposit less a cancellation fee of <Fill>5% of the deposit</Fill>.</li>
        <li>After we have paid the supplier or the vehicle has shipped: we refund your deposit less the costs we cannot recover, up to <Fill>a maximum of 50% of the deposit</Fill>. We will show you these costs.</li>
        <li>If you do not pay the balance within <Fill>30</Fill> days of it falling due, we may cancel the order on the same basis.</li>
      </ul>

      <h2>6. Inspection and hand-over</h2>
      <p>Every vehicle is inspected before shipping and again in Abuja. You are welcome to attend the Abuja inspection. Vehicles not collected within <Fill>14</Fill> days of full payment may incur storage of <Fill>₦ amount per day</Fill>.</p>

      <h2>7. Contact</h2>
      <p>Questions about an order: message us on WhatsApp with your order number, or email <Fill>support email</Fill>. Our address is <Fill>showroom address, Abuja</Fill>.</p>
      <p>See also our <Link href="/privacy" className="text-emerald-700 underline">privacy policy</Link>.</p>
    </LegalPage>
  );
}
