import { Link } from "react-router-dom";
import { CalendarDays, Mail, MessageSquareText, Phone, ShoppingBag } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, PageShell } from "./PageLayout";

const helpTopics = [
  {
    title: "Order changes",
    text: "Include your name, pickup date, and order number if you have it.",
    Icon: ShoppingBag,
  },
  {
    title: "Pickup questions",
    text: "Ask about market location, pickup timing, or same-day availability.",
    Icon: CalendarDays,
  },
  {
    title: "Food details",
    text: "Contact us before ordering if you have allergy or ingredient questions.",
    Icon: MessageSquareText,
  },
];

export default function Contact() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Call, text, or email us."
      description="We accept catering orders and offer delivery. Contact us with your name, requested date, and order details if available."
      aside={
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-forest-500">Fastest contact</p>
          <a
            href={CONTACT_PHONE_HREF}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-bold text-cream-100 transition hover:bg-forest-600"
          >
            <Phone size={16} />
            {CONTACT_PHONE_DISPLAY}
          </a>
          <a
            href={CONTACT_EMAIL_HREF}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-forest/20 bg-cream px-4 py-3 text-sm font-bold text-forest transition hover:border-forest/40"
          >
            <Mail size={16} />
            {CONTACT_EMAIL}
          </a>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        {helpTopics.map(({ title, text, Icon }) => (
          <article key={title} className="rounded-4xl border border-ink/10 bg-cream p-6 shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-cream-100">
              <Icon size={21} />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-black tracking-tight text-ink">{title}</h2>
            <p className="mt-3 leading-7 text-ink-soft">{text}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-4xl border border-ink/10 bg-cream-100 p-6 shadow-soft md:p-10">
        <h2 className="font-serif text-2xl font-black tracking-tight text-ink">Before you message</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-ink-soft">
          <p>
            For order support, include the name used at checkout, the selected pickup date, and the best
            phone number for a reply.
          </p>
          <p>
            For same-day order requests, call or text first so we can confirm availability before you head
            to the market.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream-100 transition hover:bg-forest-600"
          >
            <Phone size={16} />
            Call or text
          </a>
          <a
            href={CONTACT_EMAIL_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <Mail size={16} />
            {CONTACT_EMAIL}
          </a>
          <Link
            to="/#menu"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/25"
          >
            <ShoppingBag size={16} />
            Order pickup
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
