import express from "express";
import * as marketplaceController from "../controllers/marketplace.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public storefront endpoints
router.get("/products", marketplaceController.getPublishedProducts);

// Admin overview & actions (accessible from Admin Panel)
router.get("/admin/overview", marketplaceController.getAdminOverview);
router.patch("/admin/sellers/:sellerId/verify", marketplaceController.adminVerifySeller);
router.patch("/admin/seller/:sellerId/verify", marketplaceController.adminVerifySeller);
router.patch("/admin/products/:productId/verify", marketplaceController.adminVerifyProduct);
router.patch("/admin/product/:productId/verify", marketplaceController.adminVerifyProduct);
router.post("/admin/settlements/process-neft", marketplaceController.adminProcessNeftSettlement);
router.post("/admin/settlements/run-daily-neft", marketplaceController.adminProcessNeftSettlement);

// Authenticated Seller & Customer endpoints
router.post("/seller/onboard", authMiddleware, marketplaceController.onboardSeller);
router.get("/seller/dashboard", authMiddleware, marketplaceController.getMySellerDashboard);
router.post("/seller/products", authMiddleware, marketplaceController.addSellerProduct);

router.post("/orders", authMiddleware, marketplaceController.placeOrder);
router.get("/orders/my", authMiddleware, marketplaceController.getCustomerOrders);
router.patch("/orders/:orderId/status", authMiddleware, marketplaceController.updateOrderStatus);

export default router;
