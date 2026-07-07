import { ContactAside, LastUpdated, PageShell, PolicyArticle, PolicySection } from "./PageLayout";

export default function RefundPolicy() {
  return (
    <PageShell
      eyebrow="Refund Policy"
      title="Fresh food orders need early notice."
      description="Because each order is prepared for a scheduled pickup date, refund and cancellation requests are time-sensitive."
      aside={<ContactAside title="Refund requests" text="Call or text with your order name, pickup date, and order number if available." />}
      tone="rose"
    >
      <PolicyArticle>
        <LastUpdated />

        <PolicySection title="Cancellation window">
          <p>
            Please request cancellations, changes, or refunds at least 24 hours before your scheduled pickup date. When
            we receive enough notice, we can usually cancel the order and issue a refund to the original payment method.
          </p>
          <p>
            Orders canceled within 24 hours of pickup, after preparation has started, or after ingredients have been
            allocated may not be refundable.
          </p>
        </PolicySection>

        <PolicySection title="Missed pickups">
          <p>
            Orders are prepared for the selected market date and pickup window. Missed pickups, late arrivals after the
            market window ends, and orders abandoned at pickup are not refundable.
          </p>
        </PolicySection>

        <PolicySection title="When we will make it right">
          <p>
            If MrKimbap cancels a pickup, cannot fulfill your paid order, or gives you the wrong item, contact us as
            soon as possible. We will offer a replacement, store credit, partial refund, or full refund depending on the issue.
          </p>
          <p>
            If an item becomes unavailable after checkout, we may contact you to substitute, adjust, or refund that item.
          </p>
        </PolicySection>

        <PolicySection title="How refunds are processed">
          <p>
            Approved refunds are sent back to the original payment method used at checkout. Card refunds commonly take
            about 5-10 business days to appear, depending on the bank or card issuer.
          </p>
          <p>
            We cannot send a card refund to a different card, bank account, cash app, or person than the original payment method.
          </p>
        </PolicySection>

        <PolicySection title="How to request help">
          <p>
            Call or text us with the name used on the order, pickup date, order number if available, and a brief note
            about what happened. Photos are helpful if the issue is about an incorrect or damaged item.
          </p>
        </PolicySection>
      </PolicyArticle>
    </PageShell>
  );
}
