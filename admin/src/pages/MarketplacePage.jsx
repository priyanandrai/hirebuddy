import React, { useEffect, useState } from 'react';
import {
  Store,
  Package,
  ShoppingBag,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  Percent,
  RefreshCw,
  MessageSquare,
  MapPin,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/api';
import { swalAlert } from '../utils/swal';

const PRESET_SERVICES = [
  {
    slug: 'home-cleaning',
    title: 'Deep Home Cleaning & Sanitization',
    subtitle: 'Book verified background-checked cleaning professionals in Noida, Ghaziabad, Delhi & Meerut with instant scheduling.',
    offerPriceRupees: 499,
    mrpRupees: 799,
    discountText: 'FLAT 38% OFF',
    ctaText: 'Book Home Cleaning →',
    ctaUrl: '/services/home-cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80',
  },
  {
    slug: 'car-wash',
    title: 'Doorstep Foam Car Wash & Interior Detailing',
    subtitle: 'Multi-package doorstep car wash (Hatchback, Sedan & SUV) by verified helpers at your home.',
    offerPriceRupees: 299,
    mrpRupees: 499,
    discountText: 'SAVE ₹200 TODAY',
    ctaText: 'Book Car Wash →',
    ctaUrl: '/dashboard/helpers',
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=900&q=80',
  },
  {
    slug: 'plumber',
    title: '24×7 Expert Plumbing & Leak Repair',
    subtitle: 'Instant tap, pipe, bathroom fitting & water tank repair by verified local plumbers.',
    offerPriceRupees: 199,
    mrpRupees: 349,
    discountText: 'INSTANT VISIT OFFER',
    ctaText: 'Book Plumber Now →',
    ctaUrl: '/services/plumber',
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=900&q=80',
  },
  {
    slug: 'electrician',
    title: 'Certified Electrician & Appliance Service',
    subtitle: 'Safe wiring, MCB, fan, inverter & switchboard repairs with upfront transparent pricing.',
    offerPriceRupees: 199,
    mrpRupees: 349,
    discountText: '43% OFF VISIT',
    ctaText: 'Book Electrician →',
    ctaUrl: '/services/electrician',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80',
  },
  {
    slug: 'driver',
    title: 'On-Demand Verified Driver Services',
    subtitle: 'Hire hourly, daily or outstation professional drivers for your car anytime.',
    offerPriceRupees: 399,
    mrpRupees: 599,
    discountText: 'SPECIAL DAILY RATE',
    ctaText: 'Hire a Driver →',
    ctaUrl: '/services/driver',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&q=80',
  },
];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'sellers' | 'orders' | 'support' | 'promo'
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    stats: {},
    sellers: [],
    products: [],
    orders: [],
    settlements: [],
  });
  const [promoForm, setPromoForm] = useState({
    adType: 'PRODUCT',
    targetProductId: '',
    targetServiceSlug: '',
    badgeText: '✨ Featured Spotlight of the Day',
    title: 'Authentic Meerut Special Gajak & Rewari Gift Box',
    subtitle: 'Direct from verified Meerut manufacturers & local sellers. Freshly packed with doorstep delivery.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=80',
    offerPriceRupees: 380,
    mrpRupees: 460,
    discountText: '17% OFF TODAY',
    ctaText: 'Explore & Buy Now →',
    ctaUrl: '/marketplace',
    delaySeconds: 6,
    isActive: true,
  });
  const [tickets, setTickets] = useState([]);
  const [commissionEdits, setCommissionEdits] = useState({});
  const [sellerCommissionEdits, setSellerCommissionEdits] = useState({});
  const [replyText, setReplyText] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [bannerMsg, setBannerMsg] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [mktData, supportData] = await Promise.all([
        adminApi.getMarketplaceOverview().catch(() => ({})),
        adminApi.getSupportTickets().catch(() => ({ tickets: [] })),
      ]);

      const products = Array.isArray(mktData?.products) ? mktData.products : [];
      const sellersList = Array.isArray(mktData?.sellers) ? mktData.sellers : [];
      const initialCommissions = {};
      products.forEach((p) => {
        initialCommissions[p.id] = p.commissionPct ?? 15;
      });
      setCommissionEdits((prev) => ({ ...initialCommissions, ...prev }));

      const initialSellerCommissions = {};
      sellersList.forEach((s) => {
        initialSellerCommissions[s.id] = s.commissionPct ?? s.commissionRate ?? 15;
      });
      setSellerCommissionEdits((prev) => ({ ...initialSellerCommissions, ...prev }));

      setOverview({
        stats: mktData?.stats || {},
        sellers: sellersList,
        products,
        orders: Array.isArray(mktData?.orders) ? mktData.orders : [],
        settlements: Array.isArray(mktData?.settlements) ? mktData.settlements : [],
      });
      if (mktData?.promoAd) {
        setPromoForm((prev) => ({
          ...prev,
          ...mktData.promoAd,
          targetProductId: mktData.promoAd.targetProductId || '',
          targetServiceSlug: mktData.promoAd.targetServiceSlug || '',
          offerPriceRupees: mktData.promoAd.offerPriceRupees ?? '',
          mrpRupees: mktData.promoAd.mrpRupees ?? '',
          discountText: mktData.promoAd.discountText || '',
          imageUrl: mktData.promoAd.imageUrl || '',
        }));
      }
      setTickets(Array.isArray(supportData?.tickets) ? supportData.tickets : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleVerifyProduct = async (product, status) => {
    setActionLoading(`product-${product.id}`);
    setBannerMsg(null);
    try {
      const commissionPct = Number(commissionEdits[product.id] ?? product.commissionPct ?? 15);
      await adminApi.verifyAndPublishProduct(product.id, {
        status,
        commissionPct,
      });
      setBannerMsg(
        status === 'PUBLISHED'
          ? `Published "${product.title}" with ${commissionPct}% platform commission (${100 - commissionPct}% to seller).`
          : `Updated product "${product.title}" to ${status}.`
      );
      await loadAll();
    } catch (err) {
      await swalAlert(err.message || 'Failed to update product', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifySeller = async (seller, verificationStatus, bankVerified = true) => {
    setActionLoading(`seller-${seller.id}`);
    setBannerMsg(null);
    try {
      const commissionPct = Number(
        sellerCommissionEdits[seller.id] ?? seller.commissionPct ?? seller.commissionRate ?? 15
      );
      await adminApi.verifySeller(seller.id, {
        verificationStatus,
        bankVerified,
        commissionPct,
        commissionRate: commissionPct,
      });
      setBannerMsg(
        `Seller "${seller.businessName}" marked as ${verificationStatus} with ${commissionPct}% platform commission (${100 - commissionPct}% seller portion).`
      );
      await loadAll();
    } catch (err) {
      await swalAlert(err.message || 'Failed to verify seller', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessDailyNeft = async () => {
    setActionLoading('neft-batch');
    setBannerMsg(null);
    try {
      const res = await adminApi.processDailyNeftSettlement({});
      setBannerMsg(
        res?.message ||
          `Processed ${res?.batches?.length || 0} Daily NEFT settlement batches for Meerut sellers.`
      );
      await loadAll();
    } catch (err) {
      await swalAlert(err.message || 'Failed to run NEFT settlement batch', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplySupport = async (ticket, status = 'RESOLVED') => {
    setActionLoading(`ticket-${ticket.id}`);
    try {
      await adminApi.replySupportTicket(ticket.id, {
        status,
        adminReply: replyText[ticket.id] ?? ticket.adminReply ?? 'Resolved by HireBuddy Support Team.',
      });
      setBannerMsg(`Updated support ticket "${ticket.subject}".`);
      await loadAll();
    } catch (err) {
      await swalAlert(err.message || 'Failed to update support ticket', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSavePromoAd = async (e) => {
    if (e) e.preventDefault();
    setActionLoading('promo-save');
    setBannerMsg(null);
    try {
      const res = await adminApi.updatePromotionalPopupAd(promoForm);
      setBannerMsg(
        res?.message ||
          `Saved Daily Promotional Popup Ad (${promoForm.adType}: "${promoForm.title}" — ${
            promoForm.isActive ? `Active, shows once/day after ${promoForm.delaySeconds}s` : 'Paused'
          }).`
      );
      await loadAll();
    } catch (err) {
      await swalAlert(err.message || 'Failed to save promotional popup ad', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const { stats, sellers, products, orders, settlements } = overview;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
            <Store className="h-3.5 w-3.5" />
            Meerut Manufacturers Direct Marketplace & Support
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Marketplace, Commission Split & Daily NEFT Hub
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Verify Meerut manufacturers (FSSAI/GSTIN/Bank), configure 10%–20% product commission before publishing, and settle seller portions daily via NEFT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessDailyNeft}
            disabled={actionLoading === 'neft-batch'}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
          >
            <Landmark className="h-4 w-4" />
            {actionLoading === 'neft-batch' ? 'Processing NEFT...' : 'Run Daily NEFT Settlement'}
          </button>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
          {bannerMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400">Meerut Sellers</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats.totalSellers || sellers.length}</p>
          <p className="mt-1 text-[11px] text-amber-400">{stats.pendingSellers || 0} pending KYC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400">Products</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats.totalProducts || products.length}</p>
          <p className="mt-1 text-[11px] text-amber-400">{stats.pendingProducts || 0} awaiting Admin publish</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400">Platform Commission Earned</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            ₹{Number(stats.totalPlatformCommission || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">10%–20% configurable split</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400">Seller Portion Volume</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-400">
            ₹{Number(stats.totalSellerPayoutVolume || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-[11px] text-amber-400">
            ₹{Number(stats.pendingNeftAmount || 0).toLocaleString('en-IN')} pending Daily NEFT
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400">Support Tickets</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{tickets.length}</p>
          <p className="mt-1 text-[11px] text-rose-400">
            {tickets.filter((t) => t.status === 'OPEN').length} open tickets
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'products', label: `Product Verification & Commission (${products.length})`, icon: Package },
          { id: 'sellers', label: `Seller KYC, FSSAI & Bank (${sellers.length})`, icon: ShieldCheck },
          { id: 'orders', label: `Orders, Split & Daily NEFT (${orders.length})`, icon: ShoppingBag },
          { id: 'support', label: `Customer Support (${tickets.length})`, icon: MessageSquare },
          { id: 'promo', label: `Popup Ad (Product / Service)`, icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTS APPROVAL & CONFIGURABLE 10-20% COMMISSION */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
              No manufacturer products submitted yet.
            </div>
          ) : (
            products.map((product) => {
              const comm = Number(commissionEdits[product.id] ?? product.commissionPct ?? 15);
              const sellerSharePct = Math.max(0, 100 - comm);
              const platformAmt = Math.round(((product.price || 0) * comm) / 100);
              const sellerAmt = Math.round((product.price || 0) - platformAmt);

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          product.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : product.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {product.status}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                        {product.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        Seller: <strong className="text-slate-200">{product.seller?.businessName || 'Meerut Seller'}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{product.title}</h3>
                    <p className="text-xs text-slate-400 max-w-2xl">{product.description}</p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
                      <span>
                        Factory Price: <strong className="text-white">₹{product.price}</strong> / {product.unit}
                      </span>
                      <span>Stock: {product.stock}</span>
                      <span>
                        Seller Delivery Option:{' '}
                        <strong className="text-amber-300">
                          {product.allowPlatformDelivery
                            ? '🚚 Need HireBuddy Delivery Help (+2% Auto-Task)'
                            : '🏭 Seller Self-Delivery (By Seller)'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Commission Configurator & Publish Controls */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 min-w-[320px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-blue-400" />
                        Platform Commission (10%–20%)
                      </span>
                      <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-xs font-extrabold text-blue-300">
                        {comm}% Platform / {sellerSharePct}% Seller
                      </span>
                    </div>

                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={comm}
                      onChange={(e) =>
                        setCommissionEdits((prev) => ({
                          ...prev,
                          [product.id]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-500"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Platform gets: ₹{platformAmt}/{product.unit}</span>
                      <span>Seller NEFT gets: ₹{sellerAmt}/{product.unit}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleVerifyProduct(product, 'PUBLISHED')}
                        disabled={actionLoading === `product-${product.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {product.status === 'PUBLISHED' ? 'Update Commission' : 'Verify & Publish'}
                      </button>
                      {product.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleVerifyProduct(product, 'REJECTED')}
                          disabled={actionLoading === `product-${product.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600/20 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-600/30"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: SELLER KYC, FSSAI, PICKUP POINT & BANK VERIFICATION */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          {sellers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
              No Meerut manufacturers onboarded yet.
            </div>
          ) : (
            sellers.map((seller) => (
              <div
                key={seller.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          seller.verificationStatus === 'APPROVED' ||
                          seller.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : seller.verificationStatus === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        KYC: {seller.verificationStatus}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          seller.bankVerified
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {seller.bankVerified ? 'Bank Verified for NEFT' : 'Bank Unverified'}
                      </span>
                      <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-300">
                        Commission: {sellerCommissionEdits[seller.id] ?? seller.commissionPct ?? 15}% (Seller gets {100 - Number(sellerCommissionEdits[seller.id] ?? seller.commissionPct ?? 15)}%)
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-extrabold text-white">
                      {seller.businessName} ({seller.businessCategory})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Contact Person: <strong className="text-slate-200">{seller.contactPersonName}</strong> •{' '}
                      {seller.contactPhone} {seller.contactEmail ? `• ${seller.contactEmail}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs">
                      <span className="font-bold text-slate-300">Seller Comm %:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={sellerCommissionEdits[seller.id] ?? seller.commissionPct ?? 15}
                        onChange={(e) =>
                          setSellerCommissionEdits((prev) => ({
                            ...prev,
                            [seller.id]: Number(e.target.value),
                          }))
                        }
                        className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-extrabold text-blue-300 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleVerifySeller(seller, 'APPROVED', true)}
                      disabled={actionLoading === `seller-${seller.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve KYC & Save Comm %
                    </button>
                    <button
                      onClick={() => handleVerifySeller(seller, 'REJECTED', false)}
                      disabled={actionLoading === `seller-${seller.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-xs">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <p className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      Compliance Documents
                    </p>
                    <p className="text-slate-400">FSSAI: <span className="text-slate-200">{seller.fssaiNumber || 'N/A'}</span></p>
                    <p className="text-slate-400">GSTIN: <span className="text-slate-200">{seller.gstin || 'N/A'}</span></p>
                    <p className="text-slate-400">PAN: <span className="text-slate-200">{seller.panNumber || 'N/A'}</span></p>
                    <p className="text-slate-400">MSME/Udyam: <span className="text-slate-200">{seller.msmeNumber || 'N/A'}</span></p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <p className="font-bold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      Factory Pickup Point
                    </p>
                    <p className="text-slate-200">{seller.pickupAddress}</p>
                    <p className="text-slate-400">
                      {seller.pickupCity} - {seller.pickupPincode}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <p className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                      NEFT Settlement Bank Account
                    </p>
                    <p className="text-slate-400">Holder: <span className="text-slate-200">{seller.bankAccountName}</span></p>
                    <p className="text-slate-400">A/C No: <span className="text-slate-200">{seller.bankAccountNumber}</span></p>
                    <p className="text-slate-400">IFSC: <span className="text-slate-200">{seller.bankIfsc}</span> ({seller.bankName || 'Bank'})</p>
                    <p className="text-slate-400">Mode: <span className="text-emerald-300 font-bold">{seller.settlementPreference}</span></p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MARKETPLACE ORDERS, PORTION SPLIT & DAILY NEFT BATCHES */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-extrabold text-white mb-3">
              Recent Daily NEFT Settlement Batches ({settlements.length})
            </h3>
            {settlements.length === 0 ? (
              <p className="text-xs text-slate-400">
                No NEFT batches generated yet. Click "Run Daily NEFT Settlement" above to settle pending seller portions.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {settlements.slice(0, 6).map((b) => (
                  <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-400">₹{b.totalSellerPayout}</span>
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {b.status}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-200">
                      Seller: {b.seller?.businessName || b.sellerId}
                    </p>
                    <p className="text-slate-400">UTR: {b.neftUtrNumber}</p>
                    <p className="text-[11px] text-slate-500">
                      Orders Settled: {b.orderCount} • {new Date(b.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
                No marketplace orders placed yet.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-400">{order.orderNumber}</span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-200">
                        Order: {order.orderStatus}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          order.settlementStatus === 'SETTLED' ||
                          order.settlementStatus === 'SETTLED_NEFT'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        Seller Payout: {order.settlementStatus}
                      </span>
                      {order.pickupOtp && (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                          Pickup OTP: {order.pickupOtp}
                        </span>
                      )}
                      {order.deliveryOtp && (
                        <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                          Delivery OTP: {order.deliveryOtp}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white">
                      Seller: {order.seller?.businessName} → Customer: {order.shippingName} ({order.shippingPhone})
                    </p>
                    <p className="text-xs text-slate-400">
                      Delivery Address: {order.shippingAddress}, {order.shippingCity} - {order.shippingPincode}
                    </p>
                    {order.deliveryMode === 'PLATFORM_HELPER' && (
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Truck className="h-3.5 w-3.5" />
                        HireBuddy Partner Delivery (+2% Fee: ₹{order.deliveryFee}) • Auto-Task ID: {order.deliveryTaskId || 'Created'}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs space-y-1 min-w-[295px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="text-white font-semibold">₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Platform Commission:</span>
                      <span className="font-bold">₹{order.platformCommissionTotal}</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>18% GST on Comm. (SAC 998599):</span>
                      <span className="font-semibold">
                        ₹{order.taxBreakdown?.gstOnCommission18PctRupees ?? Number(((order.platformCommissionTotal || 0) * 0.18).toFixed(2))}
                      </span>
                    </div>
                    <div className="flex justify-between text-cyan-300">
                      <span>TCS (0.5%) + TDS 194-O (0.1%):</span>
                      <span className="font-semibold">
                        ₹{(
                          (order.taxBreakdown?.gstTcs0_5PctRupees ?? Number(((order.subtotal || 0) * 0.005).toFixed(2))) +
                          (order.taxBreakdown?.tds194O_0_1PctRupees ?? Number(((order.subtotal || 0) * 0.001).toFixed(2)))
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>Gross Seller Share (NEFT):</span>
                      <span className="font-bold">₹{order.sellerPayoutTotal}</span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>2% Delivery Fee:</span>
                      <span className="font-bold">₹{order.deliveryFee}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1 flex justify-between text-white font-extrabold">
                      <span>Total Paid:</span>
                      <span>₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER & BUDDY SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
              No support tickets submitted yet.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {ticket.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {ticket.name} ({ticket.email} {ticket.phone ? `• ${ticket.phone}` : ''})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(ticket.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-white">{ticket.subject}</h4>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{ticket.message}</p>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <input
                    type="text"
                    value={replyText[ticket.id] ?? ticket.adminReply ?? ''}
                    onChange={(e) =>
                      setReplyText((prev) => ({
                        ...prev,
                        [ticket.id]: e.target.value,
                      }))
                    }
                    placeholder="Write official support reply..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleReplySupport(ticket, 'RESOLVED')}
                    disabled={actionLoading === `ticket-${ticket.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-500"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Reply & Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: DAILY PROMOTIONAL POPUP AD (PRODUCT OR SERVICE) */}
      {activeTab === 'promo' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Admin Configuration Form */}
          <form
            onSubmit={handleSavePromoAd}
            className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Daily Promotional Popup Ad Configurator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Advertise any Marketplace Product or Platform Service. Appears smoothly after login with a configurable delay, strictly once per day per user.
                </p>
              </div>
              <label className="inline-flex items-center gap-2.5 cursor-pointer rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2">
                <input
                  type="checkbox"
                  checked={!!promoForm.isActive}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span
                  className={`text-xs font-extrabold ${
                    promoForm.isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {promoForm.isActive ? '🟢 Popup Ad Active' : '⏸️ Popup Ad Paused'}
                </span>
              </label>
            </div>

            {/* Ad Type Switcher + Quick Auto-Fill */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  What do you want to advertise?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PRODUCT', label: '🛍️ Product Ad' },
                    { id: 'SERVICE', label: '🛠️ Service Ad' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setPromoForm((prev) => ({
                          ...prev,
                          adType: t.id,
                          ctaText:
                            t.id === 'SERVICE'
                              ? 'Book Service Now →'
                              : 'Explore & Buy Now →',
                          ctaUrl: t.id === 'SERVICE' ? '/services' : '/marketplace',
                        }))
                      }
                      className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${
                        promoForm.adType === t.id
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {promoForm.adType === 'PRODUCT' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Quick-Fill from Marketplace Product (Optional)
                  </label>
                  <select
                    value={promoForm.targetProductId || ''}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const prod = products.find((p) => p.id === pid);
                      if (prod) {
                        const discPct =
                          prod.mrp && prod.mrp > prod.price
                            ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)
                            : 15;
                        setPromoForm((prev) => ({
                          ...prev,
                          adType: 'PRODUCT',
                          targetProductId: prod.id,
                          badgeText: `✨ Featured ${prod.category || 'Marketplace'} Spotlight`,
                          title: prod.title,
                          subtitle: prod.description || 'Direct from verified Meerut seller with doorstep delivery.',
                          imageUrl:
                            (Array.isArray(prod.images) && prod.images[0]) ||
                            prev.imageUrl,
                          offerPriceRupees: prod.price,
                          mrpRupees: prod.mrp || Math.round(prod.price * 1.2),
                          discountText: `${discPct}% OFF TODAY`,
                          ctaText: 'View & Buy Direct →',
                          ctaUrl: `/marketplace/${prod.slug}`,
                        }));
                      } else {
                        setPromoForm((prev) => ({ ...prev, targetProductId: '' }));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">— Custom Product or Select from Catalog —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (₹{p.price} • {p.seller?.businessName || 'Seller'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Quick-Fill from Platform Service (Optional)
                  </label>
                  <select
                    value={promoForm.targetServiceSlug || ''}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const svc = PRESET_SERVICES.find((s) => s.slug === slug);
                      if (svc) {
                        setPromoForm((prev) => ({
                          ...prev,
                          adType: 'SERVICE',
                          targetServiceSlug: svc.slug,
                          badgeText: '⚡ Verified Home Service Spotlight',
                          title: svc.title,
                          subtitle: svc.subtitle,
                          imageUrl: svc.imageUrl,
                          offerPriceRupees: svc.offerPriceRupees,
                          mrpRupees: svc.mrpRupees,
                          discountText: svc.discountText,
                          ctaText: svc.ctaText,
                          ctaUrl: svc.ctaUrl,
                        }));
                      } else {
                        setPromoForm((prev) => ({ ...prev, targetServiceSlug: '' }));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">— Custom Service or Select Preset —</option>
                    {PRESET_SERVICES.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.title} (Starts ₹{s.offerPriceRupees})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Badge & Delay */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Top Spotlight Badge Text
                </label>
                <input
                  type="text"
                  value={promoForm.badgeText || ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, badgeText: e.target.value }))
                  }
                  placeholder="✨ Featured Spotlight of the Day"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Popup Delay (Seconds after Login)
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={promoForm.delaySeconds ?? 6}
                  onChange={(e) =>
                    setPromoForm((prev) => ({
                      ...prev,
                      delaySeconds: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-emerald-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Headline & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ad Headline / Title
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.title || ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter product or service headline..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={promoForm.subtitle || ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="Short compelling value proposition..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Pricing & Discount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Offer Price (₹)
                </label>
                <input
                  type="number"
                  value={promoForm.offerPriceRupees ?? ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({
                      ...prev,
                      offerPriceRupees: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  placeholder="380"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Original MRP (₹)
                </label>
                <input
                  type="number"
                  value={promoForm.mrpRupees ?? ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({
                      ...prev,
                      mrpRupees: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  placeholder="460"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Discount Tag
                </label>
                <input
                  type="text"
                  value={promoForm.discountText || ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, discountText: e.target.value }))
                  }
                  placeholder="20% OFF TODAY"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-amber-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Image & CTA */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={promoForm.imageUrl || ''}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={promoForm.ctaText || ''}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, ctaText: e.target.value }))
                    }
                    placeholder="Explore & Buy Now →"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Destination URL / Route
                  </label>
                  <input
                    type="text"
                    value={promoForm.ctaUrl || ''}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, ctaUrl: e.target.value }))
                    }
                    placeholder="/marketplace or /services/home-cleaning"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-blue-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <p className="text-[11px] text-slate-400">
                Frequency cap: <strong className="text-slate-200">Once per day per logged-in user</strong> after {promoForm.delaySeconds || 6}s delay.
              </p>
              <button
                type="submit"
                disabled={actionLoading === 'promo-save'}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {actionLoading === 'promo-save'
                  ? 'Saving Popup Ad...'
                  : 'Save Promotional Popup Ad'}
              </button>
            </div>
          </form>

          {/* Right Column: Live Customer Screen Preview */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Live Customer Screen Popup Preview
                </span>
                <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                  Shows {promoForm.delaySeconds || 6}s after login • 1×/day
                </span>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-[#1e325c] bg-gradient-to-b from-[#0b152b] via-[#081022] to-[#060c1a] shadow-2xl">
                <div className="relative h-48 w-full overflow-hidden bg-[#0f1d3a]">
                  {promoForm.imageUrl && (
                    <img
                      src={promoForm.imageUrl}
                      alt={promoForm.title || 'Preview'}
                      className="h-full w-full object-cover opacity-85"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081022] via-[#081022]/30 to-transparent" />
                  <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300">
                      {promoForm.badgeText || '✨ Featured Spotlight'}
                    </span>
                    <span className="rounded-full border border-blue-400/40 bg-blue-950/80 px-2 py-0.5 text-[9px] font-extrabold uppercase text-blue-200">
                      {promoForm.adType === 'SERVICE' ? '🛠️ Service' : '🛍️ Product'}
                    </span>
                  </div>
                  {promoForm.discountText && (
                    <div className="absolute bottom-3 right-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950 shadow-lg">
                      {promoForm.discountText}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h4 className="text-base font-extrabold text-white leading-snug">
                    {promoForm.title || 'Ad Headline Preview'}
                  </h4>
                  {promoForm.subtitle && (
                    <p className="mt-1.5 text-xs text-slate-300 line-clamp-2">
                      {promoForm.subtitle}
                    </p>
                  )}

                  {(promoForm.offerPriceRupees || promoForm.mrpRupees) && (
                    <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#19294b] bg-[#0a1326] px-3.5 py-2.5">
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400">
                          Special Spotlight Offer
                        </span>
                        <div className="flex items-baseline gap-2">
                          {promoForm.offerPriceRupees && (
                            <span className="text-lg font-black text-white">
                              ₹{promoForm.offerPriceRupees}
                            </span>
                          )}
                          {promoForm.mrpRupees && (
                            <span className="text-xs text-slate-500 line-through">
                              ₹{promoForm.mrpRupees}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">
                        ✓ Verified Quality
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 rounded-xl bg-gradient-to-r from-[#1361f5] to-[#10b981] px-4 py-2.5 text-center text-xs font-extrabold text-white">
                      {promoForm.ctaText || 'Explore Now →'}
                    </div>
                    <div className="rounded-xl border border-[#1d2d4e] bg-[#0a1326] px-3 py-2.5 text-[11px] font-bold text-slate-300">
                      Maybe Later
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-200">UX & Non-Intrusive Guarantee:</p>
              <p>• Smooth fade + scale animation after {promoForm.delaySeconds || 6} seconds of login.</p>
              <p>• Stored per user per calendar day so the user never sees it twice on the same day.</p>
              <p>• Instant dismiss via ESC key, backdrop click, or "Maybe Later".</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
