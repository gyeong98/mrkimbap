import { Link } from "react-router-dom";
import { ArrowLeft, Home, Phone, ShoppingBag } from "lucide-react";
import logo from "../assets/logo-transparent.png";

export const BRAND_NAME = "MrKimbap";
export const CONTACT_PHONE_DISPLAY = "(612) 919-2645";
export const CONTACT_PHONE_HREF = "tel:6129192645";
export const LAST_UPDATED = "July 7, 2026";

const toneClasses = {
  emerald: "border-forest-400/40 bg-forest/5 text-forest",
  amber: "border-gold-400/50 bg-gold/10 text-clay",
  rose: "border-clay/30 bg-clay/5 text-clay",
  sky: "border-forest-400/40 bg-forest/5 text-forest",
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
    <header className="sticky top-0 z-40 w-full border-b border-ink/10 bg-cream/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link to="/" onClick={handleHomeClick} className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest shadow-soft">
            <img src={logo} alt="MR.KIMBAP logo" className="h-8 w-8 object-contain" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-black leading-none tracking-tight text-ink">
              MR.KIMBAP
            </p>
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-soft">
              Korean Rice Roll
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/"
            onClick={handleHomeClick}
            aria-label="Home"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-cream-100 text-ink-soft shadow-sm transition hover:border-ink/20 hover:text-ink sm:inline-flex"
          >
            <Home size={17} />
          </Link>
          <Link
            to="/#menu"
            onClick={handleOrderClick}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream-100 shadow-soft transition hover:-translate-y-0.5 hover:bg-forest-600"
          >
            <ShoppingBag size={16} />
            Order pickup
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-forest/10 bg-herb text-ink">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest shadow-soft">
                <img src={logo} alt="" className="h-8 w-8 object-contain" />
              </span>
              <div>
                <p className="font-serif text-lg font-black leading-none text-ink">MR.KIMBAP</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-soft">
                  Korean Rice Roll
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              Hand-rolled Korean kimbap, made fresh for market day. Order online and pick up at your
              neighborhood farmers market.
            </p>
            <a
              href={CONTACT_PHONE_HREF}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-forest/20 bg-cream-100 px-4 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:border-forest/40"
            >
              <Phone size={15} />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-500">Explore</p>
              <div className="mt-4 flex flex-col gap-3 font-semibold text-ink-soft">
                <Link to="/#menu" className="transition hover:text-forest">
                  Menu
                </Link>
                <Link to="/#order" className="transition hover:text-forest">
                  Order
                </Link>
                <Link to="/contact" className="transition hover:text-forest">
                  Contact
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-500">Legal</p>
              <div className="mt-4 flex flex-col gap-3 font-semibold text-ink-soft">
                <Link to="/privacy-policy" className="transition hover:text-forest">
                  Privacy
                </Link>
                <Link to="/terms-of-service" className="transition hover:text-forest">
                  Terms
                </Link>
                <Link to="/refund-policy" className="transition hover:text-forest">
                  Refunds
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-forest/10 pt-6 text-xs text-ink-soft">
          Copyright {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ eyebrow, title, description, children, aside, tone = "emerald" }) {
  const badgeClassName = toneClasses[tone] || toneClasses.emerald;

  return (
    <div className="min-h-screen w-full bg-cream text-left text-ink">
      <SiteHeader />

      <main>
        <section className="border-b border-ink/10 bg-cream">
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft transition hover:text-ink"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
              <div>
                <p
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${badgeClassName}`}
                >
                  {eyebrow}
                </p>
                <h1 className="mt-5 max-w-3xl font-serif text-4xl font-black tracking-tight text-ink md:text-6xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-soft">{description}</p>
              </div>

              {aside && (
                <aside className="rounded-4xl border border-ink/10 bg-cream-100 p-6 shadow-soft">{aside}</aside>
              )}
            </div>
          </div>
        </section>

        <section className="bg-cream-100">
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">{children}</div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export function PolicyArticle({ children }) {
  return (
    <article className="rounded-4xl border border-ink/10 bg-cream p-6 shadow-soft md:p-10">{children}</article>
  );
}

export function PolicySection({ title, children }) {
  return (
    <section className="border-b border-ink/10 py-7 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="font-serif text-2xl font-black tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-ink-soft">{children}</div>
    </section>
  );
}

export function LastUpdated() {
  return (
    <p className="mb-7 text-sm font-bold uppercase tracking-[0.18em] text-ink-soft">
      Last updated {LAST_UPDATED}
    </p>
  );
}

export function ContactAside({
  title = "Need help?",
  text = "Call or text us with your name, pickup date, and order number if you have one.",
}) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-forest-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p>
      <a
        href={CONTACT_PHONE_HREF}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-bold text-cream-100 transition hover:bg-forest-600"
      >
        <Phone size={16} />
        {CONTACT_PHONE_DISPLAY}
      </a>
    </div>
  );
}
