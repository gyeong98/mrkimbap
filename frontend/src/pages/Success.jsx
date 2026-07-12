import { Link } from "react-router-dom";
import { CheckCircle2, Home, Mail, Phone, ShoppingBag } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, PageShell } from "./PageLayout";

export default function Success() {
  return (
    <PageShell
      eyebrow="Payment Successful"
      title="Your pickup order is confirmed."
      description="Thank you for ordering from MrKimbap. Keep an eye on your email or text messages for order and pickup details."
      aside={
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-cream-100">
            <CheckCircle2 size={25} />
          </div>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-forest-500">Paid order</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            We will have your order ready at the selected market pickup.
          </p>
        </div>
      }
    >
      <section className="rounded-4xl border border-ink/10 bg-cream p-6 shadow-soft md:p-10">
        <h2 className="font-serif text-2xl font-black tracking-tight text-ink">What happens next</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-ink-soft">
          <p>Your confirmation message includes the pickup date, location, and order details.</p>
          <p>For the freshest kimbap, we recommend arriving about 2 hours after the market opens.</p>
          <p>If something looks wrong with the order details, contact us as soon as possible.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream-100 transition hover:bg-forest-600"
          >
            <Home size={16} />
            Back home
          </Link>
          <Link
            to="/#menu"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream-100 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <ShoppingBag size={16} />
            Order again
          </Link>
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream-100 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <Phone size={16} />
            {CONTACT_PHONE_DISPLAY}
          </a>
          <a
            href={CONTACT_EMAIL_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream-100 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <Mail size={16} />
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>
    </PageShell>
  );
}
