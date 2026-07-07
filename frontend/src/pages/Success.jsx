import { Link } from "react-router-dom";
import { CheckCircle2, Home, Phone, ShoppingBag } from "lucide-react";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, PageShell } from "./PageLayout";

export default function Success() {
  return (
    <PageShell
      eyebrow="Payment Successful"
      title="Your pickup order is confirmed."
      description="Thank you for ordering from MrKimbap. Keep an eye on your email or text messages for order and pickup details."
      aside={
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <CheckCircle2 size={25} />
          </div>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Paid order</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">We will have your order ready at the selected market pickup.</p>
        </div>
      }
    >
      <section className="rounded-lg border border-stone-200 bg-stone-50 p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black tracking-tight text-stone-950">What happens next</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-stone-700">
          <p>Your confirmation message includes the pickup date, location, and order details.</p>
          <p>For the freshest kimbap, we recommend arriving about 2 hours after the market opens.</p>
          <p>If something looks wrong with the order details, contact us as soon as possible.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:bg-stone-800"
          >
            <Home size={16} />
            Back home
          </Link>
          <Link
            to="/#menu"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 transition hover:border-stone-400 hover:bg-white"
          >
            <ShoppingBag size={16} />
            Order again
          </Link>
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 transition hover:border-stone-400 hover:bg-white"
          >
            <Phone size={16} />
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </section>
    </PageShell>
  );
}
