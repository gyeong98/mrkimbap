import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "./assets/logo-transparent.png";
import frontPicture from "./assets/frontpicture.jpg";
import {
  CalendarDays,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

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

const MARKET_ACCENT_CLASSES = [
  "border-emerald-700",
  "border-amber-500",
  "border-rose-500",
  "border-sky-600",
  "border-violet-600",
  "border-lime-600",
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

function formatPickupDateOption(date) {
  const pickupDate = formatPickupDate(date.pickup_date);

  return date.location_name ? `${pickupDate} - ${date.location_name}` : pickupDate;
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
        days: [],
      });
    }

    locationSchedule.months.get(monthKey).days.push(day);
  });

  return Array.from(scheduleByLocation.values()).map((locationSchedule) => ({
    ...locationSchedule,
    months: Array.from(locationSchedule.months.values()).map((monthSchedule) => ({
      ...monthSchedule,
      days: Array.from(new Set(monthSchedule.days)).sort((a, b) => a - b),
    })),
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

export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [pickupDate, setPickupDate] = useState("");
  const [selectedPickupDateId, setSelectedPickupDateId] = useState("");
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
      const response = await fetch(
        `${API_BASE_URL}/api/pickup-dates`
      );

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

  const handlePickupDateChange = (event) => {
    const nextPickupDateId = event.target.value;
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-stone-50 text-stone-950">
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MR.KIMBAP logo" className="h-12 w-12 shrink-0 object-contain" />
            <div>
              <p className="text-lg font-black tracking-tight">MR.KIMBAP</p>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Korean Rice Roll</p>
            </div>
          </div>

          <a
            href="#menu"
            className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800"
          >
            View Menu
          </a>
        </nav>
      </header>

      <main className="w-full">
        <section className="w-full bg-stone-50">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-24">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* <h1 className="max-w-3xl text-5xl font-black tracking-tight text-stone-950 md:text-7xl">
                Fresh Korean kimbap at the market.
              </h1> */}
              <div className="mt-8 max-w-2xl border-y border-stone-200 py-6">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">Upcoming pickups</p>

                {isLoadingPickupDates ? (
                  <p className="mt-4 text-lg leading-8 text-stone-600">Loading pickup dates...</p>
                ) : pickupSchedule.length > 0 ? (
                  <div className="mt-5 space-y-6">
                    {pickupSchedule.map((locationSchedule, index) => (
                      <section
                        key={locationSchedule.locationName}
                        className={`border-l-4 ${MARKET_ACCENT_CLASSES[index % MARKET_ACCENT_CLASSES.length]} pl-5`}
                      >
                        <h2 className="text-2xl font-black tracking-tight text-stone-950">
                          {locationSchedule.locationName}
                        </h2>
                        {locationSchedule.locationAddress && (
                          <p className="mt-1 text-sm font-semibold text-stone-600">
                            {locationSchedule.locationAddress}
                          </p>
                        )}
                        {locationSchedule.locationHours && (
                          <p className="mt-1 text-sm font-bold text-stone-500">{locationSchedule.locationHours}</p>
                        )}
                        <dl className="mt-3 space-y-2 text-lg leading-7 text-stone-700">
                          {locationSchedule.months.map((monthSchedule) => (
                            <div key={monthSchedule.monthKey} className="flex flex-wrap gap-x-3">
                              <dt className="font-black text-stone-950">{monthSchedule.monthName}:</dt>
                              <dd>{monthSchedule.days.join(", ")}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-lg leading-8 text-stone-600">Upcoming market dates will be posted soon.</p>
                )}
              </div>
              {/* <a
                href="#menu"
                className="mt-8 inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800"
              >
                Order for pickup
              </a> */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-[380px] sm:max-w-[420px] md:max-w-[440px]">
                <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-amber-200 via-orange-100 to-stone-200 blur-2xl" />
                <img
                  src={frontPicture}
                  alt="Fresh Korean kimbap rolls"
                  width="1290"
                  height="2293"
                  className="relative aspect-[1290/2293] w-full rounded-[2.5rem] object-cover shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="menu" className="w-full bg-white py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-stone-500">Menu</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-950 md:text-5xl">
                  Choose your{" "}
                  <span className="relative inline-block text-emerald-700">
                    <span className="relative z-10">kimbap</span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-amber-200" />
                  </span>
                </h2>
              </div>

              {/* <button
                type="button"
                onClick={fetchMenuItems}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 transition hover:-translate-y-0.5 hover:border-stone-400"
              >
                <RefreshCw size={16} />
                Refresh Menu
              </button> */}
            </div>

            {isLoadingItems ? (
              <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-8 text-center text-stone-600">
                <Loader2 className="mx-auto mb-3 animate-spin" size={26} />
                Loading menu items...
              </div>
            ) : menuItems.length === 0 ? (
              <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-8 text-center text-stone-600">
                No menu items found. Check your backend /api/items route and database rows.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
                      className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-56 shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-stone-800 shadow-sm">
                          {isSoldOut ? "Sold Out" : item.tag}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="text-xl font-black">{item.name}</h3>
                          <p className="font-black text-stone-950">{formatCurrencyFromCents(item.priceCents)}</p>
                        </div>
                        <p className="mb-5 text-sm leading-6 text-stone-600">{item.description}</p>
                        {/* <p className="mt-3 text-xs font-bold uppercase tracking-wide text-stone-400">
                          Available: {item.availableQuantity}
                        </p> */}

                        <div className="mt-auto flex items-center justify-between rounded-full border border-stone-200 bg-stone-50 p-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, quantity - 1)}
                            disabled={quantity === 0 || isSoldOut}
                            aria-label={`Decrease ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={17} />
                          </button>

                          <span className="text-lg font-black">{quantity}</span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item, quantity + 1)}
                            disabled={isSoldOut || quantity >= item.availableQuantity}
                            aria-label={`Increase ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
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

        <section id="order" className="w-full bg-stone-50 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[0.95fr_1.05fr] md:px-8">
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-emerald-950">Pickup details</h2>
                  <p className="text-sm font-semibold text-emerald-700">Required before checkout</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-stone-700">Pickup Date</span>
                  <select
                    value={selectedPickupDateId}
                    onChange={handlePickupDateChange}
                    required
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-stone-500 focus:bg-white"
                  >
                    <option value="" disabled>
                      Select pickup date
                    </option>

                    {availableDates.map((date) => (
                      <option key={date.id} value={date.id}>
                        {formatPickupDateOption(date)}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="text-sm font-semibold text-emerald-800">
                  Need a same-day order? Please contact us directly at{" "}
                  <a href="tel:6129192645" className="font-black underline decoration-emerald-300 underline-offset-4">
                    (612) 919-2645
                  </a>
                  .
                </p>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-stone-700">Customer Name</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-stone-500 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-stone-700">Customer Email</span>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-stone-500 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-stone-700">Customer Phone</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(formatPhoneNumber(event.target.value))}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-stone-500 focus:bg-white"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-white shadow-xl md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Order summary</h2>
                    <p className="text-sm text-stone-300">
                      {totalItems} item{totalItems === 1 ? "" : "s"} selected
                    </p>
                  </div>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-stone-300">
                  Your cart is empty. Add menu items above to start your order.
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between gap-4 rounded-3xl bg-white/5 p-4">
                      <div className="min-w-0 text-left">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-stone-300">{formatUnitQuantity(item.priceCents, item.quantity)}</p>
                      </div>
                      <p className="shrink-0 text-right font-black">
                        {formatCurrencyFromCents(item.priceCents * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3">
                <div className="flex justify-between text-stone-300">
                  <span>Pickup date</span>
                  {pickupSummaryDetails ? (
                    <span className="text-right font-bold text-white">
                      <span className="block">{pickupSummaryDetails.date}</span>
                      {pickupSummaryDetails.locationName && (
                        <span className="block text-sm text-stone-200">{pickupSummaryDetails.locationName}</span>
                      )}
                      {pickupSummaryDetails.locationAddress && (
                        <span className="block text-sm font-semibold text-stone-300">
                          {pickupSummaryDetails.locationAddress}
                        </span>
                      )}
                      {pickupSummaryDetails.locationHours && (
                        <span className="block text-sm font-semibold text-stone-300">
                          {pickupSummaryDetails.locationHours}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="font-bold text-white">Not selected</span>
                  )}
                </div>
                <div className="flex justify-between text-xl font-black">
                  <span>Subtotal</span>
                  <span>{formatCurrencyFromCents(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Tax ({TAX_RATE_PERCENT}%)</span>
                  <span className="font-bold text-white">{formatCurrencyFromCents(taxCents)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-2xl font-black">
                  <span>Total</span>
                  <span>{formatCurrencyFromCents(totalCents)}</span>
                </div>
              </div>

              {error && (
                <p className="mt-5 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut || isLoadingItems}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-black text-stone-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-stone-100 disabled:cursor-wait disabled:opacity-70"
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
        </section>
      </main>

      <footer className="w-full border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">

          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-stone-500">
              © {new Date().getFullYear()} MrKimbap. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Link to="/privacy-policy">Privacy Policy</Link>

              <Link to="/terms-of-service">Terms of Service</Link>      

              <Link to="/contact">Contact</Link>

              <Link to="/refund-policy">Refund Policy</Link>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
