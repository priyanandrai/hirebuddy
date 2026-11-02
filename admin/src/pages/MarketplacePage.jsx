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
} from 'lucide-react';
import { adminApi } from '../services/api';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'sellers' | 'orders' | 'support'
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    stats: {},
    sellers: [],
    products: [],
    orders: [],
    settlements: [],
  });
  const [tickets, setTickets] = useState([]);
  const [commissionEdits, setCommissionEdits] = useState({});
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
      const initialCommissions = {};
      products.forEach((p) => {
        initialCommissions[p.id] = p.commissionPct ?? 15;
      });
      setCommissionEdits((prev) => ({ ...initialCommissions, ...prev }));

      setOverview({
        stats: mktData?.stats || {},
        sellers: Array.isArray(mktData?.sellers) ? mktData.sellers : [],
        products,
        orders: Array.isArray(mktData?.orders) ? mktData.orders : [],
        settlements: Array.isArray(mktData?.settlements) ? mktData.settlements : [],
      });
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
      alert(err.message || 'Failed to update product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifySeller = async (seller, verificationStatus, bankVerified = true) => {
    setActionLoading(`seller-${seller.id}`);
    setBannerMsg(null);
    try {
      await adminApi.verifySeller(seller.id, {
        verificationStatus,
        bankVerified,
      });
      setBannerMsg(`Seller "${seller.businessName}" marked as ${verificationStatus}.`);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to verify seller');
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
      alert(err.message || 'Failed to run NEFT settlement batch');
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
      alert(err.message || 'Failed to update support ticket');
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
                        Delivery:{' '}
                        <strong className="text-amber-300">
                          {product.allowPlatformDelivery
                            ? 'Seller Self + HireBuddy Partner (+2% Auto-Task)'
                            : 'Seller Self-Delivery Only'}
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
                    <div className="flex items-center gap-2">
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
                    </div>
                    <h3 className="mt-1.5 text-lg font-extrabold text-white">
                      {seller.businessName} ({seller.businessCategory})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Contact Person: <strong className="text-slate-200">{seller.contactPersonName}</strong> •{' '}
                      {seller.contactPhone} {seller.contactEmail ? `• ${seller.contactEmail}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifySeller(seller, 'APPROVED', true)}
                      disabled={actionLoading === `seller-${seller.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve KYC & Verify Bank
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

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs space-y-1 min-w-[270px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="text-white font-semibold">₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Platform Commission:</span>
                      <span className="font-bold">₹{order.platformCommissionTotal}</span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>Seller Portion (NEFT):</span>
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
    </div>
  );
}
