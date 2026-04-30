"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Plus, Trash2, Save, User, Briefcase, Clock, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, DAY_NAMES } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  slug: string | null;
  serviceType: string | null;
  image: string | null;
}

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface Props {
  user: UserProfile;
  services: Service[];
  availability: Availability[];
  blockedSlots: BlockedSlot[];
}

const DURATIONS = [30, 60, 90];
const DAYS = DAY_NAMES.map((name, idx) => ({ idx, name }));

export function SettingsClient({
  user: initialUser,
  services: initialServices,
  availability: initialAvailability,
  blockedSlots: initialBlocked,
}: Props) {
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "services" | "availability" | "blocked">("profile");

  // Blocked dates
  const [blocked, setBlocked] = useState<BlockedSlot[]>(initialBlocked);
  const [newBlock, setNewBlock] = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [savingBlock, setSavingBlock] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    name: initialUser.name || "",
    bio: initialUser.bio || "",
    serviceType: initialUser.serviceType || "",
    slug: initialUser.slug || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Services
  const [services, setServices] = useState<Service[]>(initialServices);
  const [newService, setNewService] = useState({ name: "", duration: 60, price: "" });
  const [addingService, setAddingService] = useState(false);

  // Availability
  const [availability, setAvailability] = useState<Availability[]>(initialAvailability);
  const [savingAvail, setSavingAvail] = useState(false);

  // --- Profile ---
  const saveProfile = async () => {
    setSavingProfile(true);
    const res = await fetch("/api/provider/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSavingProfile(false);
    if (res.ok) {
      await update({ name: profile.name, slug: profile.slug });
      toast.success("Profile saved");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save profile");
    }
  };

  // --- Services ---
  const addService = async () => {
    if (!newService.name || !newService.price) return toast.error("Name and price required");
    setAddingService(true);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newService, price: parseFloat(newService.price as string) }),
    });
    const data = await res.json();
    setAddingService(false);
    if (res.ok) {
      setServices((prev) => [...prev, data]);
      setNewService({ name: "", duration: 60, price: "" });
      toast.success("Service added");
    } else if (data.code === "PLAN_LIMIT") {
      toast.error(data.error, { duration: 5000 });
    } else {
      toast.error(data.error || "Failed to add service");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } else {
      toast.error("Failed to delete service");
    }
  };

  // --- Availability ---
  const toggleDay = (dayIdx: number) => {
    const existing = availability.find((a) => a.dayOfWeek === dayIdx);
    if (existing) {
      setAvailability((prev) => prev.filter((a) => a.dayOfWeek !== dayIdx));
    } else {
      setAvailability((prev) => [
        ...prev,
        { id: `new-${dayIdx}`, dayOfWeek: dayIdx, startTime: "09:00", endTime: "17:00" },
      ]);
    }
  };

  const updateAvailTime = (dayIdx: number, field: "startTime" | "endTime", value: string) => {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === dayIdx ? { ...a, [field]: value } : a))
    );
  };

  const saveAvailability = async () => {
    setSavingAvail(true);
    const res = await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability }),
    });
    setSavingAvail(false);
    if (res.ok) {
      toast.success("Availability saved");
    } else {
      toast.error("Failed to save availability");
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "services" as const, label: "Services", icon: Briefcase },
    { id: "availability" as const, label: "Availability", icon: Clock },
    { id: "blocked" as const, label: "Blocked Dates", icon: CalendarOff },
  ];

  const addBlocked = async () => {
    if (!newBlock.date) return toast.error("Date required");
    setSavingBlock(true);
    const res = await fetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBlock),
    });
    const data = await res.json();
    setSavingBlock(false);
    if (res.ok) {
      setBlocked((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewBlock({ date: "", startTime: "", endTime: "", reason: "" });
      toast.success("Date blocked");
    } else {
      toast.error(data.error || "Failed to block date");
    }
  };

  const deleteBlocked = async (id: string) => {
    if (!confirm("Remove this blocked date?")) return;
    const res = await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBlocked((prev) => prev.filter((b) => b.id !== id));
      toast.success("Removed");
    } else {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Provider Profile</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <input
                value={profile.serviceType}
                onChange={(e) => setProfile((p) => ({ ...p, serviceType: e.target.value }))}
                placeholder="e.g. Hair Stylist, Therapist"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking URL Slug</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                  /book/
                </span>
                <input
                  value={profile.slug}
                  onChange={(e) => setProfile((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              placeholder="Tell clients a bit about yourself and your services…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Services</h2>
          <div className="space-y-2">
            {services.length === 0 && (
              <p className="text-sm text-gray-400">No services yet. Add your first service below.</p>
            )}
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500">{s.duration} min · {formatCurrency(s.price)}</p>
                </div>
                <button
                  onClick={() => deleteService(s.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add service form */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Add New Service</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  value={newService.name}
                  onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Haircut"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                <select
                  value={newService.duration}
                  onChange={(e) => setNewService((s) => ({ ...s, duration: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                <input
                  value={newService.price}
                  onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                  placeholder="50.00"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={addService}
              disabled={addingService}
              className="mt-3 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {addingService ? "Adding…" : "Add Service"}
            </button>
          </div>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === "availability" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Weekly Availability</h2>
          <p className="text-sm text-gray-500">Toggle days and set your working hours.</p>
          <div className="space-y-3">
            {DAYS.map(({ idx, name }) => {
              const avail = availability.find((a) => a.dayOfWeek === idx);
              const isActive = !!avail;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <button
                    onClick={() => toggleDay(idx)}
                    className={`w-24 text-sm font-medium py-1.5 px-3 rounded-lg border transition ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={avail.startTime}
                        onChange={(e) => updateAvailTime(idx, "startTime", e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={avail.endTime}
                        onChange={(e) => updateAvailTime(idx, "endTime", e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={saveAvailability}
            disabled={savingAvail}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingAvail ? "Saving…" : "Save Availability"}
          </button>
        </div>
      )}

      {/* Blocked Dates Tab */}
      {activeTab === "blocked" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold">Blocked Dates</h2>
            <p className="text-sm text-gray-500">
              Block specific dates or time ranges for vacations, breaks, or personal time.
            </p>
          </div>

          {/* Existing blocked */}
          <div className="space-y-2">
            {blocked.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No blocked dates yet.</p>
            ) : (
              blocked.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(b.date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {b.startTime && b.endTime
                        ? `${b.startTime} – ${b.endTime}`
                        : "All day"}
                      {b.reason && <span className="ml-2 text-gray-400 italic">&middot; {b.reason}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteBlocked(b.id)}
                    aria-label="Remove blocked date"
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new block */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Block a Date</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date *</label>
                <input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock((b) => ({ ...b, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                <input
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock((b) => ({ ...b, reason: e.target.value }))}
                  placeholder="Vacation, lunch break…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">From (leave blank for all day)</label>
                <input
                  type="time"
                  value={newBlock.startTime}
                  onChange={(e) => setNewBlock((b) => ({ ...b, startTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="time"
                  value={newBlock.endTime}
                  onChange={(e) => setNewBlock((b) => ({ ...b, endTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={addBlocked}
              disabled={savingBlock}
              className="mt-3 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {savingBlock ? "Adding…" : "Block Date"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
