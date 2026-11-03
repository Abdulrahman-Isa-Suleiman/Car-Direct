import type { Metadata } from "next";
import { LegalPage, Fill } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy policy · Cars Direct", description: "What personal data Cars Direct collects and how it is used." };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="3 November 2026">
      <p><Fill>Cars Direct Ltd, RC number</Fill> is the data controller for personal data collected on this website. This policy is written to meet the Nigeria Data Protection Act 2023.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>When you reserve a vehicle:</b> your name, phone number and email address.</li>
        <li><b>Payments:</b> the amount, date and a payment reference. Card and bank details are handled by Paystack; we never see or store them.</li>
        <li><b>Technical data:</b> your IP address when you start a checkout, used to prevent fraud and abuse.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To process your order and payments, and to keep you updated by email and WhatsApp (to perform our contract with you).</li>
        <li>To keep financial records required by Nigerian law (legal obligation).</li>
        <li>To prevent fraud and misuse of the website (legitimate interest).</li>
      </ul>
      <p>We do not sell your data or use it for advertising.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>Paystack, to take payments.</li>
        <li>Our hosting, database and email providers, who process it on our behalf.</li>
        <li>Customs, clearing and vehicle registration agents, only as needed to deliver and register your vehicle.</li>
      </ul>
      <p>Some of these providers store data outside Nigeria. We use providers that protect it to a standard consistent with the Act.</p>

      <h2>How long we keep it</h2>
      <p>Order and payment records for <Fill>6 years</Fill> for tax and accounting. Checkout attempts that never became an order for <Fill>12 months</Fill>.</p>

      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete your personal data, or object to how we use it, by emailing <Fill>privacy email</Fill>. We reply within 30 days. Some records must be kept by law even if you ask us to delete them. You can also complain to the Nigeria Data Protection Commission.</p>
    </LegalPage>
  );
}
