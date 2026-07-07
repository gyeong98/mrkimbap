import { Link } from "react-router-dom";
import { ContactAside, LastUpdated, PageShell, PolicyArticle, PolicySection } from "./PageLayout";

export default function TermsOfService() {
  return (
    <PageShell
      eyebrow="Terms of Service"
      title="The terms for ordering from MrKimbap."
      description="These terms apply when you browse the site, place a pickup order, or contact us about an order."
      aside={<ContactAside title="Order support" text="Questions about an order or pickup window? Call or text us and include your pickup date." />}
      tone="amber"
    >
      <PolicyArticle>
        <LastUpdated />

        <PolicySection title="Ordering and payment">
          <p>
            Orders placed through the website are for scheduled market pickup. You agree to provide accurate contact,
            pickup, and payment information so we can prepare and confirm your order.
          </p>
          <p>
            Menu availability, pickup dates, prices, and tax may change. Your order is not confirmed until checkout is
            completed and payment is accepted.
          </p>
        </PolicySection>

        <PolicySection title="Pickup">
          <p>
            Please pick up during the listed market window and bring the name used on the order. Fresh food is prepared
            for the selected pickup date and is not shipped.
          </p>
          <p>
            If you need to change a pickup date or pickup details, contact us as soon as possible. We will do our best
            to help, but changes depend on prep timing and availability.
          </p>
        </PolicySection>

        <PolicySection title="Food information">
          <p>
            Kimbap and other menu items may contain or come into contact with common allergens, including sesame, soy,
            egg, wheat, fish, shellfish, or other ingredients. If you have a food allergy or dietary restriction, contact
            us before ordering.
          </p>
          <p>
            Product photos and descriptions are provided for general reference. Ingredients, appearance, and availability
            may vary by market day.
          </p>
        </PolicySection>

        <PolicySection title="Refunds and cancellations">
          <p>
            Refund and cancellation requests are handled under our{" "}
            <Link to="/refund-policy" className="font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-4">
              Refund Policy
            </Link>
            . Because orders are fresh food prepared for a specific pickup date, missed pickups and late cancellations may not be refundable.
          </p>
        </PolicySection>

        <PolicySection title="Website use">
          <p>
            You agree not to misuse the website, interfere with ordering, attempt unauthorized access, submit false
            information, or use the site in a way that harms MrKimbap, customers, or service providers.
          </p>
        </PolicySection>

        <PolicySection title="Limits and updates">
          <p>
            To the fullest extent allowed by law, MrKimbap is not responsible for indirect, incidental, or consequential
            damages related to website use, ordering, pickup delays, or unavailable items.
          </p>
          <p>
            We may update these terms from time to time. Continued use of the site after changes means you accept the
            updated terms.
          </p>
        </PolicySection>
      </PolicyArticle>
    </PageShell>
  );
}
