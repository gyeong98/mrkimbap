import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  XCircle,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const ADMIN_TOKEN_STORAGE_KEY = "mrkimbap_admin_token";
const ORDER_SORT_OPTIONS = [
  { value: "order_id", label: "Order number" },
  { value: "pickup_date", label: "Pickup date" },
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCurrencyFromCents(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

function formatDate(dateString) {
  const normalizedDate = typeof dateString === "string" ? dateString.slice(0, 10) : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return dateString || "";
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const visibleCellCount = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: visibleCellCount }, (_, index) => {
    const day = index - firstDayOffset + 1;

    return day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null;
  });
}

async function parseJsonResponse(response, fallbackMessage) {
  const rawResponse = await response.text();
  const data = rawResponse ? JSON.parse(rawResponse) : {};

  if (!response.ok) {
    throw new Error(data.details || data.error || fallbackMessage);
  }

  return data;
}

export default function Admin() {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "");
  const [tokenInput, setTokenInput] = useState(adminToken);
  const [locations, setLocations] = useState([]);
  const [pickupDates, setPickupDates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newPickupDate, setNewPickupDate] = useState("");
  const [newPickupLocationId, setNewPickupLocationId] = useState("");
  const [newPickupActive, setNewPickupActive] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [orderSort, setOrderSort] = useState("order_id");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeLocations = useMemo(() => {
    return locations.filter((location) => location.active);
  }, [locations]);

  const stats = useMemo(() => {
    const activePickupDates = pickupDates.filter((date) => date.active).length;
    const paidOrders = orders.filter((order) => order.status === "paid");
    const paidRevenueCents = paidOrders.reduce((sum, order) => sum + (Number(order.total_cents) || 0), 0);
    const pendingOrders = orders.filter((order) => order.status !== "paid").length;

    return {
      activePickupDates,
      paidRevenueCents,
      pendingOrders,
      totalOrders: orders.length,
    };
  }, [orders, pickupDates]);

  const calendarDays = useMemo(() => {
    return getCalendarMonthDays(calendarMonth);
  }, [calendarMonth]);

  const calendarMonthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [calendarMonth]);

  const adminFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
        ...(options.headers || {}),
      },
    });

    return parseJsonResponse(response, "Admin request failed.");
  };

  const fetchAdminData = async () => {
    if (!adminToken) {
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const [locationsData, pickupDatesData, ordersData] = await Promise.all([
        adminFetch("/api/admin/locations"),
        adminFetch("/api/admin/pickup-dates"),
        adminFetch(`/api/admin/orders?sort=${encodeURIComponent(orderSort)}`),
      ]);

      setLocations(locationsData);
      setPickupDates(pickupDatesData);
      setOrders(ordersData);
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminToken, orderSort]);

  const handleTokenSubmit = (event) => {
    event.preventDefault();
    const trimmedToken = tokenInput.trim();

    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, trimmedToken);
    setAdminToken(trimmedToken);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setAdminToken("");
    setTokenInput("");
    setLocations([]);
    setPickupDates([]);
    setOrders([]);
  };

  const handleCreatePickupDate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!newPickupDate) {
      setError("Please choose a pickup date.");
      return;
    }

    if (!newPickupLocationId) {
      setError("Please choose a location.");
      return;
    }

    setIsSavingDate(true);

    try {
      await adminFetch("/api/admin/pickup-dates", {
        method: "POST",
        body: JSON.stringify({
          pickupDate: newPickupDate,
          locationId: newPickupLocationId,
          active: newPickupActive,
        }),
      });

      setNewPickupDate("");
      setNewPickupLocationId("");
      setNewPickupActive(true);
      setMessage("Pickup date added.");
      await fetchAdminData();
    } catch (err) {
      setError(err.message || "Failed to add pickup date.");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleCalendarMonthChange = (monthOffset) => {
    setCalendarMonth((currentMonth) => {
      return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    });
  };

  const handleCalendarDateSelect = (date) => {
    setNewPickupDate(formatDateInputValue(date));
  };

  const handleTogglePickupDate = async (date) => {
    setError("");
    setMessage("");

    try {
      await adminFetch(`/api/admin/pickup-dates/${date.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !date.active }),
      });

      setPickupDates((currentDates) =>
        currentDates.map((currentDate) =>
          currentDate.id === date.id ? { ...currentDate, active: !date.active } : currentDate
        )
      );
      setMessage(`Pickup date ${!date.active ? "activated" : "deactivated"}.`);
    } catch (err) {
      setError(err.message || "Failed to update pickup date.");
    }
  };

  if (!adminToken) {
    return (
      <main className="min-h-screen bg-stone-50 px-5 py-12 text-stone-950">
        <div className="mx-auto max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Admin access</h1>
              <p className="text-sm text-stone-500">Enter your admin token.</p>
            </div>
          </div>

          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Admin token</span>
              <input
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-stone-500 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-full bg-stone-950 px-6 py-3 font-black text-white transition hover:bg-stone-800"
            >
              Continue
            </button>
          </form>

          <Link to="/" className="mt-5 inline-flex text-sm font-bold text-stone-500 hover:text-stone-950">
            Back to storefront
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">MrKimbap</p>
            <h1 className="text-3xl font-black tracking-tight">Admin dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 transition hover:border-stone-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 transition hover:border-stone-400"
            >
              Storefront
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {(error || message) && (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm font-bold ${
              error ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-stone-500">Total orders</p>
            <p className="mt-2 text-3xl font-black">{stats.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-stone-500">Pending orders</p>
            <p className="mt-2 text-3xl font-black">{stats.pendingOrders}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-stone-500">Paid revenue</p>
            <p className="mt-2 text-3xl font-black">{formatCurrencyFromCents(stats.paidRevenueCents)}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-stone-500">Active dates</p>
            <p className="mt-2 text-3xl font-black">{stats.activePickupDates}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                <Plus size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Add pickup date</h2>
                <p className="text-sm text-stone-500">Choose a market location and date.</p>
              </div>
            </div>

            <form onSubmit={handleCreatePickupDate} className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="block text-sm font-bold text-stone-700">Date</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {newPickupDate ? formatDate(newPickupDate) : "No date selected"}
                  </span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleCalendarMonthChange(-1)}
                      aria-label="Previous month"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm transition hover:bg-stone-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <p className="text-sm font-black text-stone-950">{calendarMonthLabel}</p>
                    <button
                      type="button"
                      onClick={() => handleCalendarMonthChange(1)}
                      aria-label="Next month"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm transition hover:bg-stone-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_LABELS.map((weekday) => (
                      <div key={weekday} className="py-2 text-xs font-black uppercase tracking-wide text-stone-400">
                        {weekday}
                      </div>
                    ))}

                    {calendarDays.map((date, index) => {
                      const dateValue = date ? formatDateInputValue(date) : "";
                      const isSelected = dateValue && dateValue === newPickupDate;
                      const isToday = dateValue && dateValue === formatDateInputValue(new Date());

                      return (
                        <div key={dateValue || `blank-${index}`} className="aspect-square">
                          {date && (
                            <button
                              type="button"
                              onClick={() => handleCalendarDateSelect(date)}
                              className={`flex h-full w-full items-center justify-center rounded-xl text-sm font-black transition ${
                                isSelected
                                  ? "bg-emerald-700 text-white shadow-sm"
                                  : isToday
                                    ? "bg-white text-emerald-700 ring-2 ring-emerald-200"
                                    : "bg-white text-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              {date.getDate()}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-stone-700">Location</span>
                <select
                  value={newPickupLocationId}
                  onChange={(event) => setNewPickupLocationId(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-stone-500 focus:bg-white"
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {activeLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={newPickupActive}
                  onChange={(event) => setNewPickupActive(event.target.checked)}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span className="text-sm font-bold text-stone-700">Active immediately</span>
              </label>

              <button
                type="submit"
                disabled={isSavingDate}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-4 font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-70"
              >
                {isSavingDate && <Loader2 className="animate-spin" size={18} />}
                Add date
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
                <CalendarDays size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Pickup dates</h2>
                <p className="text-sm text-stone-500">Turn dates on or off for the storefront.</p>
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto rounded-2xl border border-stone-200">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="sticky top-0 bg-stone-100 text-left text-xs font-black uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {pickupDates.map((date) => (
                    <tr key={date.id}>
                      <td className="px-4 py-4 font-bold">{formatDate(date.pickup_date)}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-stone-950">{date.location_name || "Unknown location"}</p>
                        <p className="text-xs text-stone-500">{date.location_address}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                            date.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {date.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {date.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleTogglePickupDate(date)}
                          className="rounded-full border border-stone-300 px-4 py-2 text-xs font-black text-stone-800 transition hover:border-stone-500"
                        >
                          {date.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {pickupDates.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-stone-500">
                        No pickup dates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
                <ShoppingBag size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Orders</h2>
                <p className="text-sm text-stone-500">Customer, pickup, item, and price details.</p>
              </div>
            </div>
            <div>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-stone-500">Sort by</span>
                <select
                  value={orderSort}
                  onChange={(event) => setOrderSort(event.target.value)}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-stone-500 focus:bg-white"
                >
                  {ORDER_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="min-w-[1100px] divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-100 text-left text-xs font-black uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-black">#{order.id}</p>
                      <p className="mt-1 text-xs font-bold uppercase text-stone-500">{order.status}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-stone-950">{order.customer_name}</p>
                      <p className="text-xs text-stone-500">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-stone-950">{formatDate(order.pickup_date)}</p>
                      <p className="text-xs font-bold text-stone-600">{order.location_name || "Location unavailable"}</p>
                      {order.location_address && <p className="text-xs text-stone-500">{order.location_address}</p>}
                      {order.location_hours && <p className="text-xs text-stone-500">{order.location_hours}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <p key={`${order.id}-${item.itemId}`} className="text-xs text-stone-600">
                            <span className="font-bold text-stone-950">{item.quantity}x</span> {item.name}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-bold">{formatCurrencyFromCents(order.subtotal_cents)}</p>
                      <p className="text-xs text-stone-500">Tax {formatCurrencyFromCents(order.tax_cents)}</p>
                      <p className="mt-1 text-base font-black">{formatCurrencyFromCents(order.total_cents)}</p>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-stone-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
