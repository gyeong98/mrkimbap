import { ContactAside, LastUpdated, PageShell, PolicyArticle, PolicySection } from "./PageLayout";

export default function PrivacyPolicy() {
  return (
    <PageShell
      eyebrow="Privacy Policy"
      title="How we handle order information."
      description="This policy explains what we collect when you use MrKimbap online ordering, how we use it, and how to reach us with privacy questions."
      aside={<ContactAside title="Privacy questions" text="Call or text us if you want to update, correct, or ask about order information." />}
    >
      <PolicyArticle>
        <LastUpdated />

        <PolicySection title="Information we collect">
          <p>
            When you place or attempt to place an order, we collect the information needed to prepare your pickup:
            name, email address, phone number, selected pickup date, pickup location, order items, and order status.
          </p>
          <p>
            Payments are processed through Stripe. We do not receive or store your full card number. Stripe may collect
            payment, device, fraud-prevention, and transaction information according to its own privacy practices.
          </p>
        </PolicySection>

        <PolicySection title="How we use information">
          <p>We use order information to accept payment, prepare orders, manage pickup dates, send confirmations, answer support questions, and keep basic business records.</p>
          <p>We may also use information to prevent fraud, troubleshoot the website, comply with legal duties, and improve the ordering experience.</p>
        </PolicySection>

        <PolicySection title="How we share information">
          <p>
            We share information with service providers that help run ordering, payments, hosting, email, text messages,
            and customer support. These providers are allowed to use the information only as needed to provide their services.
          </p>
          <p>
            We may disclose information if required by law, to protect customers or our business, or in connection with
            a business transfer. We do not sell customer personal information.
          </p>
        </PolicySection>

        <PolicySection title="Retention and security">
          <p>
            We keep order records for as long as needed to fulfill orders, resolve questions, maintain accounting and tax
            records, and meet legal obligations. We use reasonable safeguards, but no website or payment system can be
            guaranteed completely secure.
          </p>
        </PolicySection>

        <PolicySection title="Your choices">
          <p>
            You can contact us to ask for access, correction, or deletion of information associated with your order. Some
            information may need to be retained for legitimate business, tax, safety, or legal reasons.
          </p>
          <p>Our website is not directed to children under 13, and we do not knowingly collect personal information from children.</p>
        </PolicySection>
      </PolicyArticle>
    </PageShell>
  );
}
