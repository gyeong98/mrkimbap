import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HERO_SLIDES_1 from "./assets/heroslides1.jpg";
import HERO_SLIDES_2 from "./assets/heroslides2.jpg";
import HERO_SLIDES_3 from "./assets/heroslides3.jpg";
import { SiteFooter, SiteHeader } from "./pages/PageLayout";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const HERO_SLIDES = [
  { src: HERO_SLIDES_1, alt: "" },
  { src: HERO_SLIDES_2, alt: "" },
  { src: HERO_SLIDES_3, alt: "" },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TAX_RATE_PERCENT = 9.025;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGIT_COUNT = 10;

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1644864812003-8bdb7fe8e676?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1200&auto=format&fit=crop",
];

function formatCurrencyFromCents(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

function formatUnitQuantity(priceCents, quantity) {
  return `${formatCurrencyFromCents(priceCents)} x ${quantity}`;
}

function normalizeItem(item, index) {
  return {
    itemId: item.id,
    name: item.name,
    description: item.description || "Freshly prepared Korean kimbap roll.",
    priceCents: item.price_cents,
    availableQuantity: item.available_quantity ?? 0,
    image: item.image_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    tag: index === 0 ? "Best Seller" : index === 1 ? "Popular" : "Fresh",
  };
}

function normalizePickupDate(dateString) {
  const normalizedDate = typeof dateString === "string" ? dateString.slice(0, 10) : "";

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) ? normalizedDate : "";
}

function formatPickupDate(dateString) {
  const normalizedDate = normalizePickupDate(dateString);

  if (!normalizedDate) {
    return dateString || "";
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function getPhoneDigits(phoneNumber) {
  return String(phoneNumber || "").replace(/\D/g, "").slice(0, PHONE_DIGIT_COUNT);
}

function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email || "").trim());
}

function formatPhoneNumber(phoneNumber) {
  const digits = getPhoneDigits(phoneNumber);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function buildPickupSchedule(dates) {
  const scheduleByLocation = new Map();

  dates.forEach((date) => {
    const normalizedDate = normalizePickupDate(date.pickup_date);

    if (!normalizedDate) {
      return;
    }

    const [year, month, day] = normalizedDate.split("-").map(Number);
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const monthName = new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: "long",
    });
    const locationName = date.location_name || "Pickup location";
    const locationAddress = date.location_address || "";
    const locationHours = date.location_hours || "";

    if (!scheduleByLocation.has(locationName)) {
      scheduleByLocation.set(locationName, {
        locationName,
        locationAddress,
        locationHours,
        months: new Map(),
      });
    }

    const locationSchedule = scheduleByLocation.get(locationName);

    if (!locationSchedule.locationAddress && locationAddress) {
      locationSchedule.locationAddress = locationAddress;
    }

    if (!locationSchedule.locationHours && locationHours) {
      locationSchedule.locationHours = locationHours;
    }

    if (!locationSchedule.months.has(monthKey)) {
      locationSchedule.months.set(monthKey, {
        monthKey,
        monthName,
        year,
        month,
        days: [],
      });
    }

    locationSchedule.months.get(monthKey).days.push(day);
  });

  return Array.from(scheduleByLocation.values()).map((locationSchedule) => ({
    ...locationSchedule,
    months: Array.from(locationSchedule.months.values())
      .map((monthSchedule) => ({
        ...monthSchedule,
        days: Array.from(new Set(monthSchedule.days)).sort((a, b) => a - b),
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
  }));
}

async function parseJsonResponse(response, fallbackMessage) {
  const rawResponse = await response.text();

  if (!rawResponse) {
    throw new Error("Backend returned an empty response.");
  }

  let data;
  try {
    data = JSON.parse(rawResponse);
  } catch {
    console.error("Non-JSON backend response:", rawResponse);
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(data.details || data.error || fallbackMessage);
  }

  return data;
}

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = HERO_SLIDES.length;

  const goTo = useCallback(
    (next) => setIndex((current) => (next + slideCount) % slideCount),
    [slideCount],
  );

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, slideCount]);

  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[420px]">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[3rem] border border-forest/15" />

      <div
        className="group relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] bg-herb-200 shadow-lift"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label="Kimbap photo gallery"
      >
        <AnimatePresence mode="sync">
          <motion.img
            key={index}
            src={HERO_SLIDES[index].src}
            alt={HERO_SLIDES[index].alt}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Prev / next controls */}
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream-100/85 text-forest opacity-0 shadow-soft backdrop-blur transition hover:bg-cream-100 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream-100/85 text-forest opacity-0 shadow-soft backdrop-blur transition hover:bg-cream-100 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ChevronRight size={18} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest/25 px-3 py-2 backdrop-blur">
          {HERO_SLIDES.map((slide, dotIndex) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(dotIndex)}
              aria-label={`Go to photo ${dotIndex + 1}`}
              aria-current={dotIndex === index}
              className={`h-2 rounded-full transition-all duration-300 ${
                dotIndex === index ? "w-6 bg-cream-100" : "w-2 bg-cream-100/60 hover:bg-cream-100/90"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl bg-cream-100 px-4 py-3 text-ink shadow-lift">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-cream-100">
          <Sparkles size={16} />
        </span>
        <div>
          <p className="text-sm font-black leading-none">Freshly rolled</p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">Never frozen</p>
        </div>
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function MarketCalendarCard({ locationSchedule, index }) {
  const { months } = locationSchedule;
  const [isOpen, setIsOpen] = useState(false);
  const [monthIndex, setMonthIndex] = useState(0);
  const activeMonth = months[monthIndex] || months[0];
  const totalDates = months.reduce((sum, monthSchedule) => sum + monthSchedule.days.length, 0);

  const calendarCells = useMemo(() => {
    if (!activeMonth) {
      return [];
    }

    const { year, month, days } = activeMonth;
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const pickupDays = new Set(days);
    const cells = [];

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, isPickup: pickupDays.has(day) });
    }

    return cells;
  }, [activeMonth]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="flex flex-col rounded-4xl border border-ink/10 bg-cream-100 p-6 shadow-soft"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/10 text-forest">
        <MapPin size={20} />
      </span>
      <h3 className="mt-4 font-serif text-2xl font-black tracking-tight text-ink">
        {locationSchedule.locationName}
      </h3>
      {locationSchedule.locationAddress && (
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          {locationSchedule.locationAddress}
        </p>
      )}
      {locationSchedule.locationHours && (
        <p className="mt-1 text-sm font-medium text-ink-soft/80">{locationSchedule.locationHours}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <p className="text-sm font-bold text-forest">
          {totalDates} market day{totalDates === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3.5 py-2 text-xs font-bold text-forest transition hover:bg-forest/20"
        >
          <CalendarDays size={15} />
          {isOpen ? "Hide calendar" : "See in calendar"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && activeMonth && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-3xl border border-ink/10 bg-cream p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonthIndex((current) => Math.max(0, current - 1))}
                  disabled={monthIndex === 0}
                  aria-label="Previous month"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="font-serif text-lg font-black text-ink">
                  {activeMonth.monthName} {activeMonth.year}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMonthIndex((current) => Math.min(months.length - 1, current + 1))
                  }
                  disabled={monthIndex >= months.length - 1}
                  aria-label="Next month"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {WEEKDAY_LABELS.map((label, labelIndex) => (
                  <span
                    key={`${label}-${labelIndex}`}
                    className="py-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft/60"
                  >
                    {label}
                  </span>
                ))}
                {calendarCells.map((cell, cellIndex) =>
                  cell ? (
                    <span
                      key={cellIndex}
                      className={
                        cell.isPickup
                          ? "flex aspect-square items-center justify-center rounded-full bg-forest text-sm font-black text-cream-100 shadow-soft"
                          : "flex aspect-square items-center justify-center text-sm font-semibold text-ink-soft/50"
                      }
                      aria-current={cell.isPickup ? "date" : undefined}
                    >
                      {cell.day}
                    </span>
                  ) : (
                    <span key={cellIndex} aria-hidden="true" />
                  ),
                )}
              </div>

              <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-forest" />
                Pickup available
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function PickupDatePicker({
  schedule,
  availableDates,
  selectedLocationName,
  onSelectLocation,
  selectedPickupDateId,
  onSelectDate,
}) {
  const [monthIndex, setMonthIndex] = useState(0);
  const activeLocation =
    schedule.find((location) => location.locationName === selectedLocationName) || null;

  useEffect(() => {
    setMonthIndex(0);
  }, [selectedLocationName]);

  const dateIdByKey = useMemo(() => {
    const map = new Map();
    availableDates.forEach((date) => {
      const normalized = normalizePickupDate(date.pickup_date);
      if (!normalized) {
        return;
      }
      const locationName = date.location_name || "Pickup location";
      map.set(`${locationName}|${normalized}`, String(date.id));
    });
    return map;
  }, [availableDates]);

  const months = activeLocation ? activeLocation.months : [];
  const activeMonth = months[monthIndex] || months[0] || null;

  const calendarCells = useMemo(() => {
    if (!activeLocation || !activeMonth) {
      return [];
    }

    const { year, month, days } = activeMonth;
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const pickupDays = new Set(days);
    const cells = [];

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${activeLocation.locationName}|${year}-${String(month).padStart(2, "0")}-${String(
        day,
      ).padStart(2, "0")}`;
      cells.push({ day, isPickup: pickupDays.has(day), dateId: dateIdByKey.get(key) || "" });
    }

    return cells;
  }, [activeLocation, activeMonth, dateIdByKey]);

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-bold text-ink">
          1. Choose a market <span className="text-clay">*</span>
        </span>
        {schedule.length === 0 ? (
          <p className="rounded-2xl border border-ink/10 bg-cream-100 px-4 py-3 text-sm font-semibold text-ink-soft">
            No pickup locations available right now.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {schedule.map((location) => {
              const isActive = location.locationName === selectedLocationName;
              return (
                <button
                  key={location.locationName}
                  type="button"
                  onClick={() => onSelectLocation(location.locationName)}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? "flex flex-col rounded-2xl border-2 border-forest bg-forest px-4 py-3 text-left text-cream-100 shadow-soft transition"
                      : "flex flex-col rounded-2xl border border-ink/10 bg-cream-100 px-4 py-3 text-left text-ink transition hover:border-forest/40"
                  }
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <MapPin size={15} />
                    {location.locationName}
                  </span>
                  {location.locationAddress && (
                    <span
                      className={
                        isActive
                          ? "mt-0.5 text-xs font-semibold text-cream-100/80"
                          : "mt-0.5 text-xs font-semibold text-ink-soft"
                      }
                    >
                      {location.locationAddress}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {activeLocation && activeMonth && (
          <motion.div
            key="pickup-calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <span className="mb-2 block text-sm font-bold text-ink">
              2. Pick an available date <span className="text-clay">*</span>
            </span>
            <div className="rounded-3xl border border-ink/10 bg-cream p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonthIndex((current) => Math.max(0, current - 1))}
                  disabled={monthIndex === 0}
                  aria-label="Previous month"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="font-serif text-lg font-black text-ink">
                  {activeMonth.monthName} {activeMonth.year}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMonthIndex((current) => Math.min(months.length - 1, current + 1))
                  }
                  disabled={monthIndex >= months.length - 1}
                  aria-label="Next month"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {WEEKDAY_LABELS.map((label, labelIndex) => (
                  <span
                    key={`${label}-${labelIndex}`}
                    className="py-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft/60"
                  >
                    {label}
                  </span>
                ))}
                {calendarCells.map((cell, cellIndex) => {
                  if (!cell) {
                    return <span key={cellIndex} aria-hidden="true" />;
                  }

                  if (!cell.isPickup) {
                    return (
                      <span
                        key={cellIndex}
                        className="flex aspect-square items-center justify-center text-sm font-semibold text-ink-soft/40"
                      >
                        {cell.day}
                      </span>
                    );
                  }

                  const isSelected = cell.dateId && cell.dateId === selectedPickupDateId;
                  return (
                    <button
                      key={cellIndex}
                      type="button"
                      onClick={() => onSelectDate(cell.dateId)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${activeMonth.monthName} ${cell.day}`}
                      className={
                        isSelected
                          ? "flex aspect-square items-center justify-center rounded-full bg-gold text-sm font-black text-forest ring-2 ring-forest ring-offset-2 ring-offset-cream transition"
                          : "flex aspect-square items-center justify-center rounded-full bg-forest text-sm font-black text-cream-100 shadow-soft transition hover:-translate-y-0.5 hover:bg-forest-600"
                      }
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-forest" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-gold" />
                  Selected
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [pickupDate, setPickupDate] = useState("");
  const [selectedPickupDateId, setSelectedPickupDateId] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingPickupDates, setIsLoadingPickupDates] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const cartItems = useMemo(() => {
    return menuItems
      .map((item) => ({
        ...item,
        quantity: quantities[item.itemId] || 0,
      }))
      .filter((item) => item.quantity > 0);
  }, [menuItems, quantities]);

  const subtotalCents = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  }, [cartItems]);

  const taxCents = useMemo(() => {
    return Math.round((subtotalCents * TAX_RATE_PERCENT) / 100);
  }, [subtotalCents]);

  const totalCents = subtotalCents + taxCents;

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const pickupSchedule = useMemo(() => {
    return buildPickupSchedule(availableDates);
  }, [availableDates]);

  const selectedPickupDate = useMemo(() => {
    return availableDates.find((date) => String(date.id) === selectedPickupDateId);
  }, [availableDates, selectedPickupDateId]);

  const pickupSummaryDetails = useMemo(() => {
    if (!selectedPickupDate) {
      return null;
    }

    return {
      date: formatPickupDate(selectedPickupDate.pickup_date),
      locationName: selectedPickupDate.location_name || "",
      locationAddress: selectedPickupDate.location_address || "",
      locationHours: selectedPickupDate.location_hours || "",
    };
  }, [selectedPickupDate]);

  const fetchMenuItems = async () => {
    setError("");
    setIsLoadingItems(true);

    try {
      if (!API_BASE_URL) {
        throw new Error("Missing VITE_API_BASE_URL. For local testing, add it to frontend/.env.local.");
      }

      const response = await fetch(`${API_BASE_URL}/api/items`);
      const data = await parseJsonResponse(response, "Failed to load menu items.");

      setMenuItems(data.map(normalizeItem));
    } catch (err) {
      console.error("Menu loading error:", err);
      setError(err.message || "Failed to load menu items.");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchAvailableDates = async () => {
    setIsLoadingPickupDates(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/pickup-dates`);

      const data = await parseJsonResponse(response, "Failed to load pickup dates.");

      console.log("pickup dates:", data);

      setAvailableDates(data);
    } catch (err) {
      console.error("Failed to load pickup dates", err);
    } finally {
      setIsLoadingPickupDates(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchAvailableDates();
  }, []);

  const updateQuantity = (item, nextQuantity) => {
    const safeQuantity = Math.max(0, nextQuantity);
    const cappedQuantity = Math.min(safeQuantity, item.availableQuantity);

    setQuantities((current) => ({
      ...current,
      [item.itemId]: cappedQuantity,
    }));
  };

  const handleSelectLocation = (locationName) => {
    setSelectedLocationName(locationName);
    setSelectedPickupDateId("");
    setPickupDate("");
  };

  const handleSelectPickupDate = (nextPickupDateId) => {
    const nextPickupDate = availableDates.find((date) => String(date.id) === nextPickupDateId);

    setSelectedPickupDateId(nextPickupDateId);
    setPickupDate(nextPickupDate ? normalizePickupDate(nextPickupDate.pickup_date) : "");
  };

  const handleCheckout = async () => {
    setError("");

    if (!API_BASE_URL) {
      setError("Missing VITE_API_BASE_URL. For local testing, add it to frontend/.env.local.");
      return;
    }

    if (!pickupDate) {
      setError("Please choose a pickup date.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Please add at least one item before checkout.");
      return;
    }

    const normalizedCustomerName = customerName.trim();
    const normalizedCustomerEmail = customerEmail.trim();

    if (!normalizedCustomerName) {
      setError("Please enter your name.");
      return;
    }

    if (!normalizedCustomerEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!isValidEmail(normalizedCustomerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const customerPhoneDigits = getPhoneDigits(customerPhone);

    if (customerPhoneDigits.length !== PHONE_DIGIT_COUNT) {
      setError(`Please enter a ${PHONE_DIGIT_COUNT}-digit phone number.`);
      return;
    }

    const payload = {
      customerName: normalizedCustomerName,
      customerEmail: normalizedCustomerEmail,
      customerPhone: customerPhoneDigits,
      pickupDate,
      pickupDateId: selectedPickupDateId,
      items: cartItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    };

    console.log("Checkout payload:", payload);
    setIsCheckingOut(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response, "Failed to create checkout session.");

      if (!data.url) {
        throw new Error("Checkout URL was not returned by the backend.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Something went wrong during checkout.");
      setIsCheckingOut(false);
    }
  };

  const inputClasses =
    "w-full rounded-2xl border border-ink/10 bg-cream-100 px-4 py-3 font-medium text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-forest-400 focus:bg-white focus:ring-4 focus:ring-forest/10";

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-cream text-left text-ink">
      <SiteHeader />

      <main className="w-full">
        {/* HERO */}
        <section className="relative w-full overflow-hidden bg-herb">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-forest-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-forest-400/30 bg-cream-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-forest shadow-sm">
                <Leaf size={14} />
                Hand-rolled fresh daily
              </span>

              <h1 className="mt-6 font-serif text-5xl font-black leading-[0.95] tracking-tight text-forest md:text-7xl">
                Korean kimbap,
                <span className="block italic text-clay">rolled for market day.</span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-ink-soft">
                Vibrant, seasonal rice rolls packed by hand and ready to grab at your neighborhood
                farmers market. Order online, skip the line, and pick up fresh.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#menu"
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-sm font-bold text-cream-100 shadow-lift transition hover:-translate-y-0.5 hover:bg-forest-600"
                >
                  <ShoppingBag size={17} />
                  Order for pickup
                </a>
                <a
                  href="#pickups"
                  className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-cream-100 px-6 py-3.5 text-sm font-bold text-forest shadow-sm transition hover:-translate-y-0.5 hover:border-forest/40"
                >
                  <CalendarDays size={17} />
                  See pickup dates
                </a>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-forest/15 pt-6">
                <div>
                  <dt className="text-2xl font-black text-forest">100%</dt>
                  <dd className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Made to order
                  </dd>
                </div>
                <div>
                  <dt className="text-2xl font-black text-forest">10+</dt>
                  <dd className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Fresh ingredients
                  </dd>
                </div>
                <div>
                  <dt className="text-2xl font-black text-forest">Local</dt>
                  <dd className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Market pickup
                  </dd>
                </div>
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative flex justify-center"
            >
              <HeroCarousel />
            </motion.div>
          </div>
        </section>

        {/* PICKUP SCHEDULE */}
        <section id="pickups" className="w-full scroll-mt-20 bg-cream py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-forest-500">
                Upcoming pickups
              </p>
              <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-ink md:text-5xl">
                Find us at the market
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink-soft">
                Choose a date and location below, then place your order for that market day.
              </p>
              <p className="mt-3 text-base leading-7 text-ink-soft">
                We accept catering orders and offer delivery. Call or text{" "}
                <a href="tel:6129192645" className="font-bold text-forest underline underline-offset-4">
                  (612) 919-2645
                </a>{" "}
                or email{" "}
                <a href="mailto:support@mrkimbap.com" className="font-bold text-forest underline underline-offset-4">
                  support@mrkimbap.com
                </a>
                .
              </p>
            </div>

            {isLoadingPickupDates ? (
              <div className="mx-auto mt-10 max-w-md rounded-4xl border border-ink/10 bg-cream-100 p-8 text-center text-ink-soft shadow-soft">
                <Loader2 className="mx-auto mb-3 animate-spin text-forest" size={26} />
                Loading pickup dates...
              </div>
            ) : pickupSchedule.length > 0 ? (
              <div className="mt-10 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pickupSchedule.map((locationSchedule, index) => (
                  <MarketCalendarCard
                    key={locationSchedule.locationName}
                    locationSchedule={locationSchedule}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-10 max-w-md rounded-4xl border border-ink/10 bg-cream-100 p-8 text-center text-ink-soft shadow-soft">
                Upcoming market dates will be posted soon.
              </div>
            )}
          </div>
        </section>

        {/* MENU */}
        <section id="menu" className="w-full scroll-mt-20 bg-cream-100 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-forest-500">Menu</p>
                <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-ink md:text-5xl">
                  Choose your{" "}
                  <span className="relative inline-block italic text-forest">
                    <span className="relative z-10">kimbap</span>
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-1.5 z-0 h-3 rounded-full bg-gold-200"
                    />
                  </span>
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-ink-soft md:text-right">
                Every roll is packed to order with crisp vegetables, seasoned rice, and our{' '}
                <span className="whitespace-nowrap">house-made</span> fillings.
              </p>
            </div>

            {isLoadingItems ? (
              <div className="rounded-4xl border border-ink/10 bg-cream p-8 text-center text-ink-soft shadow-soft">
                <Loader2 className="mx-auto mb-3 animate-spin text-forest" size={26} />
                Loading menu items...
              </div>
            ) : menuItems.length === 0 ? (
              <div className="rounded-4xl border border-ink/10 bg-cream p-8 text-center text-ink-soft shadow-soft">
                No menu items found. Check your backend /api/items route and database rows.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {menuItems.map((item, index) => {
                  const quantity = quantities[item.itemId] || 0;
                  const isSoldOut = item.availableQuantity <= 0;

                  return (
                    <motion.article
                      key={item.itemId}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: index * 0.05 }}
                      className="group flex h-full flex-col overflow-hidden rounded-4xl border border-ink/10 bg-cream shadow-soft transition hover:-translate-y-1.5 hover:shadow-lift"
                    >
                      <div className="relative h-56 shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span
                          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${
                            isSoldOut
                              ? "bg-ink/80 text-cream-100"
                              : "bg-cream-100/95 text-forest"
                          }`}
                        >
                          {isSoldOut ? "Sold Out" : item.tag}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="font-serif text-xl font-black text-ink">{item.name}</h3>
                          <p className="shrink-0 font-black text-forest">
                            {formatCurrencyFromCents(item.priceCents)}
                          </p>
                        </div>
                        <p className="mb-5 text-sm leading-6 text-ink-soft">{item.description}</p>

                        <div className="mt-auto flex items-center justify-between rounded-full border border-ink/10 bg-cream-100 p-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, quantity - 1)}
                            disabled={quantity === 0 || isSoldOut}
                            aria-label={`Decrease ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-ink shadow-sm transition hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={17} />
                          </button>

                          <span className="text-lg font-black text-ink">{quantity}</span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item, quantity + 1)}
                            disabled={isSoldOut || quantity >= item.availableQuantity}
                            aria-label={`Increase ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-cream-100 shadow-sm transition hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={17} />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ORDER */}
        <section id="order" className="w-full scroll-mt-20 bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-forest-500">Checkout</p>
              <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-ink md:text-5xl">
                Place your order
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-4xl border border-ink/10 bg-cream-100 p-6 shadow-soft md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-cream-100 shadow-soft">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-black text-ink">Pickup details</h3>
                    <p className="text-sm font-semibold text-forest-500">
                      Fields marked <span className="text-clay">*</span> are required
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <PickupDatePicker
                    schedule={pickupSchedule}
                    availableDates={availableDates}
                    selectedLocationName={selectedLocationName}
                    onSelectLocation={handleSelectLocation}
                    selectedPickupDateId={selectedPickupDateId}
                    onSelectDate={handleSelectPickupDate}
                  />

                  <p className="rounded-2xl bg-gold/10 px-4 py-3 text-sm font-semibold text-clay">
                    Need a same-day order? Please contact us directly at{" "}
                    <a
                      href="tel:6129192645"
                      className="font-black underline decoration-gold underline-offset-4"
                    >
                      (612) 919-2645
                    </a>
                    {" "}or email{" "}
                    <a
                      href="mailto:support@mrkimbap.com"
                      className="font-black underline decoration-gold underline-offset-4"
                    >
                      support@mrkimbap.com
                    </a>
                    .
                  </p>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-ink">
                      Customer Name <span className="text-clay">*</span>
                    </span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Enter your name"
                      required
                      aria-required="true"
                      className={inputClasses}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-ink">
                      Customer Email <span className="text-clay">*</span>
                    </span>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder="Enter your email"
                      required
                      aria-required="true"
                      className={inputClasses}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-ink">
                      Customer Phone <span className="text-clay">*</span>
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(formatPhoneNumber(event.target.value))}
                      placeholder="(555) 123-4567"
                      maxLength={14}
                      required
                      aria-required="true"
                      className={inputClasses}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-4xl border border-forest/15 bg-herb p-6 text-ink shadow-soft md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-cream-100 shadow-soft">
                      <ShoppingBag size={22} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-black text-ink">Order summary</h3>
                      <p className="text-sm font-semibold text-ink-soft">
                        {totalItems} item{totalItems === 1 ? "" : "s"} selected
                      </p>
                    </div>
                  </div>
                </div>

                {cartItems.length === 0 ? (
                  <div className="rounded-3xl border border-forest/10 bg-cream-100 p-6 text-ink-soft">
                    Your cart is empty. Add menu items above to start your order.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between gap-4 rounded-3xl bg-cream-100 p-4 shadow-sm"
                      >
                        <div className="min-w-0 text-left">
                          <p className="font-bold text-ink">{item.name}</p>
                          <p className="text-sm text-ink-soft">
                            {formatUnitQuantity(item.priceCents, item.quantity)}
                          </p>
                        </div>
                        <p className="shrink-0 text-right font-black text-forest">
                          {formatCurrencyFromCents(item.priceCents * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="my-6 h-px bg-forest/10" />

                <div className="space-y-3">
                  <div className="flex justify-between text-ink-soft">
                    <span>Pickup date</span>
                    {pickupSummaryDetails ? (
                      <span className="text-right font-bold text-ink">
                        <span className="block">{pickupSummaryDetails.date}</span>
                        {pickupSummaryDetails.locationName && (
                          <span className="block text-sm text-ink-soft">
                            {pickupSummaryDetails.locationName}
                          </span>
                        )}
                        {pickupSummaryDetails.locationAddress && (
                          <span className="block text-sm font-semibold text-ink-soft">
                            {pickupSummaryDetails.locationAddress}
                          </span>
                        )}
                        {pickupSummaryDetails.locationHours && (
                          <span className="block text-sm font-semibold text-ink-soft">
                            {pickupSummaryDetails.locationHours}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="font-bold text-ink">Not selected</span>
                    )}
                  </div>
                  <div className="flex justify-between text-xl font-black text-ink">
                    <span>Subtotal</span>
                    <span>{formatCurrencyFromCents(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>Tax ({TAX_RATE_PERCENT}%)</span>
                    <span className="font-bold text-ink">{formatCurrencyFromCents(taxCents)}</span>
                  </div>
                  <div className="flex justify-between border-t border-forest/10 pt-3 text-2xl font-black text-ink">
                    <span>Total</span>
                    <span className="text-forest">{formatCurrencyFromCents(totalCents)}</span>
                  </div>
                </div>

                {error && (
                  <p className="mt-5 rounded-2xl bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || isLoadingItems}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-4 font-black text-cream-100 shadow-lift transition hover:-translate-y-0.5 hover:bg-forest-600 disabled:cursor-wait disabled:opacity-70"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="animate-spin" size={19} />
                      Creating Checkout...
                    </>
                  ) : (
                    "Checkout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
