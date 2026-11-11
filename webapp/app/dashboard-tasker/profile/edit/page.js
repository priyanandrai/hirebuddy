"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserProfile, updateHelperProfile } from "@/app/components/services/user.service";
import { getTaskCategories } from "@/app/components/services/task.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  ArrowLeft,
  Check,
  Save,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

const DEFAULT_AVAILABLE_SERVICES = [
  "Home Cleaning",
  "Car Wash",
  "Dry Cleaning",
  "Driver Services",
  "Delivery & Pickup",
  "Plumbing",
  "Electrical",
  "Furniture Assembly",
  "Cooking",
  "Personal Care",
  "Others",
];

const PRESET_SERVICE_OPTIONS_BY_CATEGORY = {
  "Car Wash": [
    {
      category: "Car Wash",
      title: "Exterior Foam Wash & Tyre Dressing (Hatchback / Sedan)",
      description: "Snow foam pressure wash, alloy cleaning & tyre shine",
      priceRupees: 299,
      unit: "per car",
    },
    {
      category: "Car Wash",
      title: "Complete Interior Vacuum + Foam Wash (SUV / MUV)",
      description: "Full vacuuming, dashboard polish, mat wash & exterior foam wash",
      priceRupees: 499,
      unit: "per car",
    },
    {
      category: "Car Wash",
      title: "Deep Interior Dry-Cleaning & Seat Shampooing",
      description: "Stain removal for seats, roof lining & floor carpets",
      priceRupees: 799,
      unit: "per car",
    },
    {
      category: "Car Wash",
      title: "3M Machine Rubbing, Wax Polishing & Detailing",
      description: "Swirl mark removal, paint gloss restoration & wax protection",
      priceRupees: 1199,
      unit: "per car",
    },
  ],
  "Dry Cleaning": [
    {
      category: "Dry Cleaning",
      title: "Shirt / Trouser / Kurta Dry Clean & Steam Press",
      description: "Solvent dry cleaning, stain treatment & crisp steam press",
      priceRupees: 99,
      unit: "per piece",
    },
    {
      category: "Dry Cleaning",
      title: "2-Piece / 3-Piece Suit, Blazer or Sherwani Dry Clean",
      description: "Premium garment care for formal suits, blazers & ethnic wear",
      priceRupees: 349,
      unit: "per set",
    },
    {
      category: "Dry Cleaning",
      title: "Silk Saree / Embroidered Designer Lehenga Dry Clean",
      description: "Delicate zari-safe dry cleaning & roll polishing",
      priceRupees: 299,
      unit: "per piece",
    },
    {
      category: "Dry Cleaning",
      title: "Double Blanket / Heavy Quilt / Curtain Dry Clean",
      description: "Hygienic deep sanitization & odour-free dry cleaning",
      priceRupees: 399,
      unit: "per item",
    },
  ],
  "Home Cleaning": [
    {
      category: "Home Cleaning",
      title: "Standard Home Cleaning (Sweeping, Mopping & Dusting)",
      description: "General room-by-room floor cleaning & surface wiping",
      priceRupees: 249,
      unit: "per hour",
    },
    {
      category: "Home Cleaning",
      title: "Bathroom Deep Cleaning & Hard-Water Descaling",
      description: "Tile scrubbing, tap/shower descaling & sanitization",
      priceRupees: 399,
      unit: "per bathroom",
    },
    {
      category: "Home Cleaning",
      title: "Kitchen Deep Degreasing (Slabs, Tiles & Chimney)",
      description: "Oil & grease removal from cabinets, tiles & stove area",
      priceRupees: 699,
      unit: "per kitchen",
    },
    {
      category: "Home Cleaning",
      title: "Full 2BHK / 3BHK Apartment Deep Cleaning",
      description: "Complete house deep cleaning package",
      priceRupees: 1799,
      unit: "per package",
    },
  ],
  Plumbing: [
    {
      category: "Plumbing",
      title: "Tap, Mixer or Angle Valve Repair / Replacement",
      description: "Fixing dripping faucets or installing new tap fittings",
      priceRupees: 199,
      unit: "per visit",
    },
    {
      category: "Plumbing",
      title: "Kitchen Sink or Bathroom Drain Unblocking",
      description: "Clearing choked floor traps, washbasins & sink pipes",
      priceRupees: 299,
      unit: "per drain",
    },
    {
      category: "Plumbing",
      title: "Water Tank & Motor Pump Fitting",
      description: "Overhead tank plumbing & pressure motor setup",
      priceRupees: 599,
      unit: "per service",
    },
  ],
  Electrical: [
    {
      category: "Electrical",
      title: "Switchboard, Socket or MCB Tripping Repair",
      description: "Fault diagnosis, socket replacement & MCB fixing",
      priceRupees: 199,
      unit: "per visit",
    },
    {
      category: "Electrical",
      title: "Ceiling Fan / Exhaust Fan / Light Installation",
      description: "Safe mounting, capacitor change & wiring connection",
      priceRupees: 249,
      unit: "per unit",
    },
    {
      category: "Electrical",
      title: "Inverter & Battery Wiring Setup",
      description: "Single/double battery inverter setup with backup line",
      priceRupees: 449,
      unit: "per service",
    },
  ],
};

const PRICING_UNITS = [
  "per service",
  "per hour",
  "per visit",
  "per car",
  "per piece",
  "per set",
  "per item",
  "per package",
  "per bathroom",
  "per kitchen",
  "per day",
];

export default function EditTaskerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [availableServices, setAvailableServices] = useState(DEFAULT_AVAILABLE_SERVICES);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    experience: "",
    hourlyRate: "",
    services: [],
    serviceOfferings: [],
  });

  useEffect(() => {
    // Attempt local storage cache first
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        populateForm(u);
      }
    } catch (e) {}

    // Fetch fresh profile from API
    getUserProfile()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          populateForm(res.user);
          try {
            const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...currentStored, ...res.user }));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.error("Failed to load user profile", err);
      })
      .finally(() => {
        setFetching(false);
      });

    const loadCategories = () => {
      getTaskCategories()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          const names = list
            .map((c) => (typeof c === "string" ? c : c?.name))
            .filter(Boolean);
          if (names.length > 0) {
            setAvailableServices(names);
          }
        })
        .catch(() => {});
    };

    loadCategories();
    if (typeof window !== "undefined") {
      window.addEventListener("categoriesUpdated", loadCategories);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("categoriesUpdated", loadCategories);
      }
    };
  }, []);

  function populateForm(u) {
    if (!u) return;
    setCurrentUser(u);

    const skills = (() => {
      if (!u.skills) return [];
      if (Array.isArray(u.skills)) return u.skills.filter(Boolean);
      if (typeof u.skills === "string") {
        return u.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    })();

    const existingOfferings = Array.isArray(u.serviceOfferings)
      ? u.serviceOfferings.map((item, idx) => ({
          id: item.id || `opt-${idx}`,
          category: item.category || skills[0] || "Home Cleaning",
          title: item.title || "",
          description: item.description || "",
          priceRupees: Number(item.priceRupees ?? item.price ?? 249),
          unit: item.unit || "per service",
        }))
      : [];

    setForm({
      name: u.name || "",
      phone: u.phone ? u.phone.replace(/^\+91/, "").trim() : "",
      city: u.city || "",
      address: u.address || "",
      experience: u.experience !== null && u.experience !== undefined ? String(u.experience) : "",
      hourlyRate: u.hourlyRate ? String(u.hourlyRate / 100) : "",
      services: skills.length > 0 ? skills : ["Home Cleaning", "Delivery & Pickup"],
      serviceOfferings: existingOfferings,
    });
  }

  function handleLoadPresetsForSelectedServices() {
    const selected = form.services.length > 0 ? form.services : ["Home Cleaning"];
    const nextOfferings = [...(form.serviceOfferings || [])];
    const existingTitles = new Set(nextOfferings.map((o) => o.title.toLowerCase()));

    for (const cat of selected) {
      const presets = PRESET_SERVICE_OPTIONS_BY_CATEGORY[cat] || [
        {
          category: cat,
          title: `Standard ${cat} Service`,
          description: `Verified ${cat.toLowerCase()} service with transparent pricing`,
          priceRupees: Number(form.hourlyRate) || 249,
          unit: "per visit",
        },
        {
          category: cat,
          title: `Complete ${cat} Package`,
          description: `Full ${cat.toLowerCase()} package including inspection & completion`,
          priceRupees: Math.round((Number(form.hourlyRate) || 249) * 1.6),
          unit: "per package",
        },
      ];
      for (const p of presets) {
        if (!existingTitles.has(p.title.toLowerCase())) {
          nextOfferings.push({
            ...p,
            id: `${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,
          });
          existingTitles.add(p.title.toLowerCase());
        }
      }
    }
    setForm((prev) => ({ ...prev, serviceOfferings: nextOfferings }));
  }

  function handleAddServiceOffering() {
    const defaultCat = form.services[0] || "Car Wash";
    setForm((prev) => ({
      ...prev,
      serviceOfferings: [
        ...(prev.serviceOfferings || []),
        {
          id: `custom-${Date.now()}`,
          category: defaultCat,
          title: "",
          description: "",
          priceRupees: Number(prev.hourlyRate) || 299,
          unit: defaultCat === "Car Wash" ? "per car" : defaultCat === "Dry Cleaning" ? "per piece" : "per service",
        },
      ],
    }));
  }

  function handleOfferingChange(idx, field, value) {
    setForm((prev) => {
      const updated = [...(prev.serviceOfferings || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, serviceOfferings: updated };
    });
  }

  function handleRemoveOffering(idx) {
    setForm((prev) => ({
      ...prev,
      serviceOfferings: (prev.serviceOfferings || []).filter((_, i) => i !== idx),
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleService(service) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanPhone = form.phone.trim();
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setError("Mobile number must be 10 digits.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one type of work you can do.");
      return;
    }

    setLoading(true);
    try {
      const validOfferings = (form.serviceOfferings || [])
        .filter((o) => o && String(o.title || "").trim())
        .map((o) => ({
          ...o,
          title: String(o.title).trim(),
          category: String(o.category || form.services[0] || "General").trim(),
          description: String(o.description || "").trim(),
          priceRupees: Math.max(1, Number(o.priceRupees || 199)),
          pricePaise: Math.max(100, Math.round(Number(o.priceRupees || 199) * 100)),
          unit: o.unit || "per service",
        }));

      const payload = {
        name: form.name.trim(),
        phone: cleanPhone || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        skills: form.services,
        serviceOfferings: validOfferings,
        experience: form.experience ? Number(form.experience) : undefined,
        hourlyRate: form.hourlyRate ? Math.round(Number(form.hourlyRate) * 100) : undefined,
      };

      const updatedUser = await updateHelperProfile(payload);

      // Merge into localStorage
      const stored = localStorage.getItem("user");
      const prevUser = stored ? JSON.parse(stored) : {};
      const mergedUser = {
        ...prevUser,
        ...updatedUser,
        skills: form.services.join(", "),
      };
      localStorage.setItem("user", JSON.stringify(mergedUser));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userProfileUpdated"));
      }

      alert("Profile updated successfully!");
      router.push("/dashboard-tasker/profile");
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 py-6 sm:py-8 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard-tasker/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Profile</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Edit Profile
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Update your details shown to customers
            </p>
          </div>
        </section>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl space-y-6"
        >
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Mobile Number
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Phone className="h-4 w-4" />
              </div>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                placeholder="10-digit mobile number"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Customers will coordinate with you on this number
            </p>
          </div>

          {/* City / Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                City / Region
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Meerut, Bangalore"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Local Area / Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. Modipuram, Indiranagar"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Experience & Hourly Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Experience (Years)
              </label>
              <input
                name="experience"
                value={form.experience}
                onChange={handleChange}
                type="number"
                min="0"
                max="50"
                placeholder="e.g. 2"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Hourly Rate (₹)
              </label>
              <input
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                type="number"
                min="0"
                placeholder="e.g. 200"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Services / Work I Can Do */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Work I Can Do
              </label>
              <span className="text-xs text-blue-400 font-medium">
                {form.services.length} selected
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Tap services to toggle them on or off for your public profile
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Array.from(new Set([...availableServices, ...(form.services || [])])).map((service) => {
                const isSelected = form.services.includes(service);
                return (
                  <button
                    type="button"
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-semibold transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-md shadow-blue-950/40"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span>{service}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Service & Multi-Option Rate Card (Car Wash, Dry Cleaning, Home Cleaning, etc.) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Multi-Service Menu & Package Pricing (Rate Card)
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Offer multiple options with different prices (e.g., Car Wash: Hatchback Foam Wash ₹299, SUV Deep Clean ₹499; Dry Cleaning: Shirt ₹99, Suit ₹349).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleLoadPresetsForSelectedServices}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  ✨ Load Preset Options
                </button>
                <button
                  type="button"
                  onClick={handleAddServiceOffering}
                  className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                >
                  + Add Custom Option
                </button>
              </div>
            </div>

            {(!form.serviceOfferings || form.serviceOfferings.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                No custom service packages added yet. Click <strong>"✨ Load Preset Options"</strong> to auto-populate multi-price options for your selected categories ({form.services.join(", ") || "Car Wash, Dry Cleaning, etc."}) or click <strong>"+ Add Custom Option"</strong>.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {form.serviceOfferings.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400">
                          Category
                        </label>
                        <select
                          value={opt.category}
                          onChange={(e) => handleOfferingChange(idx, "category", e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
                        >
                          {Array.from(
                            new Set([...availableServices, ...(form.services || []), opt.category])
                          )
                            .filter(Boolean)
                            .map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400">
                          Service / Option Name
                        </label>
                        <input
                          type="text"
                          value={opt.title}
                          onChange={(e) => handleOfferingChange(idx, "title", e.target.value)}
                          placeholder="e.g. SUV Interior + Foam Wash / Suit Dry Clean"
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={opt.priceRupees}
                          onChange={(e) => handleOfferingChange(idx, "priceRupees", e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold text-emerald-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400">
                          Unit
                        </label>
                        <select
                          value={opt.unit || "per service"}
                          onChange={(e) => handleOfferingChange(idx, "unit", e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"
                        >
                          {PRICING_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.description || ""}
                        onChange={(e) => handleOfferingChange(idx, "description", e.target.value)}
                        placeholder="Short description of what is included in this option..."
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOffering(idx)}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Verification Callout */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Identity & Address Documents</p>
                <p className="text-[11px] text-slate-400">
                  Status: {currentUser?.idVerificationStatus || "UNVERIFIED"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              Manage Documents
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3.5 px-6 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
            </button>

            <Link
              href="/dashboard-tasker/profile"
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-800 py-3.5 px-6 text-center text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Helper 3-Step Document Verification Modal */}
      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          setShowVerificationModal(false);
        }}
        user={currentUser}
      />
    </main>
  );
}
