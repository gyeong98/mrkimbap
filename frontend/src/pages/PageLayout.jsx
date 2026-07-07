import { Link } from "react-router-dom";
import { ArrowLeft, Home, Phone, ShoppingBag } from "lucide-react";
import logo from "../assets/logo-transparent.png";

export const BRAND_NAME = "MrKimbap";
export const CONTACT_PHONE_DISPLAY = "(612) 919-2645";
export const CONTACT_PHONE_HREF = "tel:6129192645";
export const LAST_UPDATED = "July 7, 2026";

const toneClasses = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
};

function isHomePage() {
  return window.location.pathname === "/";
}

function scrollToPageTop() {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
}

function scrollToMenu() {
  document.getElementById("menu")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function handleHomeClick(event) {
  if (!isHomePage()) {
    return;
  }

  event.preventDefault();

  if (window.location.hash) {
    window.history.pushState(null, "", "/");
  }

  scrollToPageTop();
}

function handleOrderClick(event) {
  if (!isHomePage()) {
    return;
  }

  const menuSection = document.getElementById("menu");

  if (!menuSection) {
    return;
  }

  event.preventDefault();

  if (window.location.hash !== "#menu") {
    window.history.pushState(null, "", "/#menu");
  }

  scrollToMenu();
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link to="/" onClick={handleHomeClick} className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="MR.KIMBAP logo" className="h-11 w-11 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-base font-black tracking-tight">MR.KIMBAP</p>
            <p className="truncate text-xs uppercase tracking-[0.22em] text-stone-500">Korean Rice Roll</p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/"
            onClick={handleHomeClick}
            aria-label="Home"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-100"
          >
            <Home size={17} />
          </Link>
          <Link
            to="/#menu"
            onClick={handleOrderClick}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-stone-800"
          >
            <ShoppingBag size={16} />
            Order
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between md:px-8">
        <p>Copyright {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-stone-700">
          <Link to="/privacy-policy" className="hover:text-stone-950">
            Privacy
          </Link>
          <Link to="/terms-of-service" className="hover:text-stone-950">
            Terms
          </Link>
          <Link to="/refund-policy" className="hover:text-stone-950">
            Refunds
          </Link>
          <Link to="/contact" className="hover:text-stone-950">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ eyebrow, title, description, children, aside, tone = "emerald" }) {
  const badgeClassName = toneClasses[tone] || toneClasses.emerald;

  return (
    <div className="min-h-screen w-full bg-stone-50 text-left text-stone-950">
      <SiteHeader />

      <main>
        <section className="border-b border-stone-200 bg-stone-50">
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 transition hover:text-stone-950"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
              <div>
                <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${badgeClassName}`}>
                  {eyebrow}
                </p>
                <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-stone-950 md:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">{description}</p>
              </div>

              {aside && <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">{aside}</aside>}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">{children}</div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export function PolicyArticle({ children }) {
  return <article className="rounded-lg border border-stone-200 bg-stone-50 p-6 shadow-sm md:p-8">{children}</article>;
}

export function PolicySection({ title, children }) {
  return (
    <section className="border-b border-stone-200 py-7 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="text-2xl font-black tracking-tight text-stone-950">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-stone-700">{children}</div>
    </section>
  );
}

export function LastUpdated() {
  return <p className="mb-7 text-sm font-bold uppercase tracking-[0.18em] text-stone-500">Last updated {LAST_UPDATED}</p>;
}

export function ContactAside({ title = "Need help?", text = "Call or text us with your name, pickup date, and order number if you have one." }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
      <a
        href={CONTACT_PHONE_HREF}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
      >
        <Phone size={16} />
        {CONTACT_PHONE_DISPLAY}
      </a>
    </div>
  );
}
