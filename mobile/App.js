import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { mobileApi } from "./src/api/client";

export default function App() {
  const [role, setRole] = useState("CUSTOMER"); // "CUSTOMER" | "BUDDY"
  const [activeTab, setActiveTab] = useState("TASKS"); // "TASKS" | "MARKETPLACE" | "WALLET"
  const [tasks, setTasks] = useState([]);
  const [products, setProducts] = useState([]);
  const [otpInputs, setOtpInputs] = useState({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, mktRes] = await Promise.all([
        mobileApi.getTasks().catch(() => ({ tasks: [] })),
        mobileApi.getMarketplaceProducts().catch(() => ({ products: [] })),
      ]);
      setTasks(Array.isArray(tasksRes?.tasks) ? tasksRes.tasks : Array.isArray(tasksRes) ? tasksRes : []);
      setProducts(Array.isArray(mktRes?.products) ? mktRes.products : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyTaskOtp = async (task) => {
    const otp = otpInputs[task.id] || task.completionOtp || "";
    if (otp.length !== 4) {
      Alert.alert("4-Digit OTP Required", "Please enter the customer's 4-digit Completion OTP.");
      return;
    }
    try {
      await mobileApi.updateTaskStatus(task.id, "COMPLETED", otp);
      Alert.alert("OTP Verified", `Task "${task.title}" marked COMPLETED!`);
      loadData();
    } catch (err) {
      Alert.alert("Verification Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>HireBuddy Mobile</Text>
          <Text style={styles.subtitle}>
            Local Buddies (0% Comm.) & Meerut Factory Marketplace
          </Text>
        </View>
        <TouchableOpacity
          style={styles.roleSwitch}
          onPress={() => setRole(role === "CUSTOMER" ? "BUDDY" : "CUSTOMER")}
        >
          <Text style={styles.roleSwitchText}>
            Mode: {role === "CUSTOMER" ? "Customer" : "Buddy (₹199/mo)"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom/Top Navigation Tabs */}
      <View style={styles.tabs}>
        {[
          { id: "TASKS", label: "Tasks & OTP" },
          { id: "MARKETPLACE", label: "Meerut Store" },
          { id: "WALLET", label: "Escrow & Plan" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === "TASKS" && (
          <View>
            <Text style={styles.sectionTitle}>
              {role === "CUSTOMER"
                ? "Active Hyperlocal Tasks & 4-Digit Completion PIN"
                : "Nearby Buddy Tasks & 4-Digit OTP Verification"}
            </Text>
            {tasks.map((task) => (
              <View key={task.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{task.title}</Text>
                  <Text style={styles.price}>₹{task.budget}</Text>
                </View>
                <Text style={styles.meta}>
                  📍 {task.location} • Status: {task.status}
                </Text>
                {role === "CUSTOMER" && task.completionOtp && (
                  <View style={styles.otpBadge}>
                    <Text style={styles.otpBadgeText}>
                      🔐 Customer 4-Digit Completion PIN: {task.completionOtp}
                    </Text>
                  </View>
                )}
                {role === "BUDDY" && (
                  <View style={styles.otpRow}>
                    <TextInput
                      style={styles.otpInput}
                      maxLength={4}
                      keyboardType="number-pad"
                      placeholder={task.completionOtp || "0000"}
                      placeholderTextColor="#64748b"
                      value={otpInputs[task.id] || ""}
                      onChangeText={(val) =>
                        setOtpInputs((prev) => ({ ...prev, [task.id]: val }))
                      }
                    />
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => handleVerifyTaskOtp(task)}
                    >
                      <Text style={styles.primaryBtnText}>Verify 4-Digit OTP</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === "MARKETPLACE" && (
          <View>
            <Text style={styles.sectionTitle}>
              Meerut Manufacturers Direct Storefront
            </Text>
            {products.map((prod) => (
              <View key={prod.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{prod.title}</Text>
                  <Text style={styles.price}>₹{prod.priceRupees || prod.price}</Text>
                </View>
                <Text style={styles.meta}>
                  🏭 {prod.seller?.businessName || "Meerut Verified Seller"} •{" "}
                  {prod.category}
                </Text>
                <Text style={styles.meta}>
                  🚚 {prod.deliveryByPlatform ? "+2% HireBuddy Delivery Available" : "Free Seller Delivery"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "WALLET" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {role === "BUDDY"
                ? "Buddy Pro Subscription — ₹199 / Month (0% Commission)"
                : "100% Escrow Protected Payments & Razorpay UPI"}
            </Text>
            <Text style={styles.meta}>
              • Buddies keep 100% of task earnings with a flat ₹199/month subscription.
            </Text>
            <Text style={styles.meta}>
              • Marketplace sellers receive daily NEFT settlements with full SAC 998599 GST, 0.5% TCS, and 0.1% Sec 194-O TDS statements.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050b18" },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#17294d",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { color: "#ffffff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  roleSwitch: {
    backgroundColor: "#1361f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  roleSwitchText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  tabs: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#0b1730",
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#1361f5" },
  tabText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  scrollContent: { padding: 16 },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#081225",
    borderColor: "#17294d",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "#ffffff", fontSize: 14, fontWeight: "700", flex: 1 },
  price: { color: "#34d399", fontSize: 16, fontWeight: "800" },
  meta: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  otpBadge: {
    marginTop: 10,
    backgroundColor: "#1e1b4b",
    padding: 8,
    borderRadius: 8,
  },
  otpBadgeText: { color: "#a5b4fc", fontSize: 12, fontWeight: "700" },
  otpRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  otpInput: {
    backgroundColor: "#020617",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    color: "#34d399",
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "800",
    width: 100,
    textAlign: "center",
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#059669",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  primaryBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
});
