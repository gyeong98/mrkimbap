import { Link } from "react-router-dom";
import { Phone, RotateCcw, ShoppingBag, XCircle } from "lucide-react";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, PageShell } from "./PageLayout";

export default function Cancel() {
  return (
    <PageShell
      eyebrow="Checkout Canceled"
      title="Your order was not completed."
      description="No pickup order has been confirmed from this checkout session. You can return to the menu whenever you are ready."
      aside={
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-cream-100">
            <XCircle size={25} />
          </div>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-clay">No charge completed</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            If you think you were charged, contact us and we will help check the order status.
          </p>
        </div>
      }
      tone="rose"
    >
      <section className="rounded-4xl border border-ink/10 bg-cream p-6 shadow-soft md:p-10">
        <h2 className="font-serif text-2xl font-black tracking-tight text-ink">Ready to try again?</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-ink-soft">
          <p>Return to the menu, choose your pickup date, and complete checkout when you are ready.</p>
          <p>For same-day requests or payment questions, call or text us before placing another order.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/#menu"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream-100 transition hover:bg-forest-600"
          >
            <RotateCcw size={16} />
            Return to menu
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream-100 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <ShoppingBag size={16} />
            View pickups
          </Link>
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream-100 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <Phone size={16} />
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </section>
    </PageShell>
  );
}
