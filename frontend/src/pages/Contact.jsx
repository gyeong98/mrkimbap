import { Link } from "react-router-dom";
import { CalendarDays, MessageSquareText, Phone, ShoppingBag } from "lucide-react";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, PageShell } from "./PageLayout";

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
      title="Call or text us for order help."
      description="For the fastest response, reach out by phone with your name, pickup date, and order number if available."
      aside={
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Fastest contact</p>
          <a
            href={CONTACT_PHONE_HREF}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            <Phone size={16} />
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        {helpTopics.map(({ title, text, Icon }) => (
          <article key={title} className="rounded-lg border border-stone-200 bg-stone-50 p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Icon size={21} />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight text-stone-950">{title}</h2>
            <p className="mt-3 leading-7 text-stone-600">{text}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-lg border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black tracking-tight text-stone-950">Before you message</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-stone-700">
          <p>For order support, include the name used at checkout, the selected pickup date, and the best phone number for a reply.</p>
          <p>For same-day order requests, call or text first so we can confirm availability before you head to the market.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:bg-stone-800"
          >
            <Phone size={16} />
            Call or text
          </a>
          <Link
            to="/#menu"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 transition hover:border-stone-400 hover:bg-stone-50"
          >
            <ShoppingBag size={16} />
            Order pickup
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
