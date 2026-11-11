import * as marketplaceService from "../services/marketplace.service.js";

export const getPublishedProducts = async (req, res) => {
  try {
    const result = await marketplaceService.searchPublishedProducts(req.query);
    res.json(result);
  } catch (error) {
    console.error("getPublishedProducts error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPublishedProductDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await marketplaceService.getPublishedProductBySlug(slug);
    if (!result) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("getPublishedProductDetail error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const onboardSeller = async (req, res) => {
  try {
    const profile = await marketplaceService.onboardOrUpdateSeller(req.user.id, req.body);
    res.json({ success: true, profile });
  } catch (error) {
    console.error("onboardSeller error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getMySellerDashboard = async (req, res) => {
  try {
    const data = await marketplaceService.getMySellerDashboard(req.user.id);
    res.json(data);
  } catch (error) {
    console.error("getMySellerDashboard error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const addSellerProduct = async (req, res) => {
  try {
    const product = await marketplaceService.createSellerProduct(req.user.id, req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("addSellerProduct error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const placeOrder = async (req, res) => {
  try {
    const result = await marketplaceService.placeMarketplaceOrder(req.user.id, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error("placeOrder error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await marketplaceService.getCustomerMarketplaceOrders(req.user.id);
    res.json({ orders });
  } catch (error) {
    console.error("getCustomerOrders error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, otp } = req.body;
    const updated = await marketplaceService.updateMarketplaceOrderStatus(orderId, orderStatus, {
      otp,
    });
    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updated = await marketplaceService.rateMarketplaceOrder(req.user.id, orderId, req.body);
    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("rateOrder error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Admin endpoints
export const getAdminOverview = async (req, res) => {
  try {
    const data = await marketplaceService.getAdminMarketplaceOverview();
    res.json(data);
  } catch (error) {
    console.error("getAdminOverview error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const adminVerifySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const updated = await marketplaceService.adminVerifySeller(sellerId, req.body);
    res.json({ success: true, seller: updated });
  } catch (error) {
    console.error("adminVerifySeller error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const adminVerifyProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updated = await marketplaceService.adminVerifyAndPublishProduct(productId, req.body);
    res.json({ success: true, product: updated });
  } catch (error) {
    console.error("adminVerifyProduct error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const adminProcessNeftSettlement = async (req, res) => {
  try {
    const result = await marketplaceService.processDailyNeftSettlement(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("adminProcessNeftSettlement error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getPromotionalPopupAd = async (req, res) => {
  try {
    const result = await marketplaceService.getActivePromotionalPopupAd();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("getPromotionalPopupAd error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const adminUpdatePromotionalPopupAd = async (req, res) => {
  try {
    const updated = await marketplaceService.adminUpdatePromotionalPopupAd(req.body);
    res.json({ success: true, promoAd: updated });
  } catch (error) {
    console.error("adminUpdatePromotionalPopupAd error:", error);
    res.status(400).json({ error: error.message });
  }
};
