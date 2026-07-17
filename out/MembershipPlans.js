import React, { useState } from "react";
import API from "../services/api";
export default function MembershipPlans({ currentPlan, onPlanUpdate }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const initiateCheckout = (plan) => {
    setCheckoutPlan(plan);
    setCardName("");
    setCardNumber("");
    setExpiry("");
    setCvc("");
  };
  const handleUpgrade = async (e) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setTimeout(async () => {
      try {
        const { data } = await API.post("/users/me/membership/upgrade", {
          plan: checkoutPlan.name,
          duration: "monthly",
          price: checkoutPlan.name === "Gold Premium" ? 12e3 : 5e3
        });
        if (data.success) {
          setSuccess(`Successfully upgraded to ${checkoutPlan.name}!`);
          if (onPlanUpdate) onPlanUpdate(data.membershipPlan);
          setCheckoutPlan(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Payment failed. Please check your card details.");
      } finally {
        setLoading(false);
      }
    }, 2e3);
  };
  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "",
      color: "#64748b",
      bg: "#f8fafc",
      border: "#e2e8f0",
      features: [
        "Pay per visit",
        "Standard booking queue",
        "Basic digital records"
      ],
      cta: "Current Plan"
    },
    {
      name: "Silver Care",
      price: "5,000",
      currency: "XAF",
      period: "/ mo",
      color: "#0ea5e9",
      bg: "#f0f9ff",
      border: "#bae6fd",
      features: [
        "1 Free Routine Cleaning/yr",
        "5% off all fillings",
        "Priority booking queue",
        "Advanced 3D Records access"
      ],
      cta: "Upgrade to Silver"
    },
    {
      name: "Gold Premium",
      price: "12,000",
      currency: "XAF",
      period: "/ mo",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      popular: true,
      features: [
        "2 Free Routine Cleanings/yr",
        "15% off all procedures",
        "Free at-home visits (2/yr)",
        "24/7 Priority SOS Video Support",
        "Premium VIP clinic lounge access"
      ],
      cta: "Upgrade to Gold"
    }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 1e3, margin: "0 auto", paddingBottom: 60, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 50 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 36, fontWeight: 900, color: "#0f172a", marginBottom: 15 } }, "ToothEase Care ", /* @__PURE__ */ React.createElement("span", { style: { color: "#0ea5e9" } }, "Memberships")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 18, color: "#64748b", maxWidth: 600, margin: "0 auto" } }, "Stop paying for unpredictable dental emergencies. Subscribe to a Care Plan and enjoy peace of mind, free routine care, and VIP perks.")), success && /* @__PURE__ */ React.createElement("div", { style: { background: "#f0fdf4", color: "#15803d", padding: 15, borderRadius: 12, marginBottom: 30, textAlign: "center", border: "1px solid #bbf7d0", fontWeight: 600 } }, "\u{1F389} ", success), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30, alignItems: "center" } }, plans.map((plan, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    background: "#fff",
    borderRadius: 24,
    padding: 40,
    boxShadow: plan.popular ? "0 25px 50px -12px rgba(217, 119, 6, 0.25)" : "0 10px 15px -3px rgba(0,0,0,0.05)",
    border: `2px solid ${plan.popular ? "#f59e0b" : plan.border}`,
    position: "relative",
    transform: plan.popular ? "scale(1.05)" : "scale(1)",
    transition: "all 0.3s ease",
    zIndex: plan.popular ? 10 : 1
  } }, plan.popular && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", padding: "6px 16px", borderRadius: 99, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", boxShadow: "0 4px 10px rgba(245,158,11,0.3)" } }, "Most Popular"), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 24, fontWeight: 800, color: plan.color, marginBottom: 10 } }, plan.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 5, marginBottom: 30 } }, plan.currency && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, fontWeight: 700, color: "#0f172a" } }, plan.currency), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 48, fontWeight: 900, color: "#0f172a", lineHeight: 1 } }, plan.price), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, color: "#64748b", fontWeight: 600 } }, plan.period)), /* @__PURE__ */ React.createElement("ul", { style: { listStyle: "none", padding: 0, margin: 0, marginBottom: 40, display: "flex", flexDirection: "column", gap: 16 } }, plan.features.map((feat, j) => /* @__PURE__ */ React.createElement("li", { key: j, style: { display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "#334155", fontWeight: 500 } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-check", style: { color: plan.color, fontSize: 18, marginTop: 2 } }), /* @__PURE__ */ React.createElement("span", null, feat)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => initiateCheckout(plan),
      disabled: currentPlan === plan.name,
      style: {
        width: "100%",
        padding: "16px 0",
        borderRadius: 16,
        border: "none",
        background: currentPlan === plan.name ? "#e2e8f0" : plan.popular ? "linear-gradient(135deg, #f59e0b, #d97706)" : plan.bg,
        color: currentPlan === plan.name ? "#94a3b8" : plan.popular ? "#fff" : plan.color,
        fontSize: 16,
        fontWeight: 800,
        cursor: currentPlan === plan.name ? "default" : "pointer",
        transition: "all 0.2s",
        boxShadow: plan.popular && currentPlan !== plan.name ? "0 10px 20px -5px rgba(245,158,11,0.4)" : "none"
      }
    },
    currentPlan === plan.name ? "Current Plan" : plan.cta
  )))), checkoutPlan && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1e3, padding: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { background: "#fff", borderRadius: 24, width: "100%", maxWidth: 450, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fafc", padding: "24px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 } }, "Subscribe to"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, color: checkoutPlan.color } }, checkoutPlan.name, " Plan")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 900, color: "#0f172a" } }, checkoutPlan.price, " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#64748b" } }, checkoutPlan.currency, "/mo"))), /* @__PURE__ */ React.createElement("form", { onSubmit: handleUpgrade, style: { padding: 30 } }, error && /* @__PURE__ */ React.createElement("div", { style: { background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600 } }, error), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 8 } }, "Card Information"), /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Card number",
      value: cardNumber,
      onChange: (e) => setCardNumber(e.target.value),
      required: true,
      style: { width: "100%", padding: "14px 16px", border: "none", borderBottom: "1px solid #cbd5e1", fontSize: 16, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "MM / YY",
      value: expiry,
      onChange: (e) => setExpiry(e.target.value),
      required: true,
      style: { flex: 1, padding: "14px 16px", border: "none", borderRight: "1px solid #cbd5e1", fontSize: 16, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "CVC",
      value: cvc,
      onChange: (e) => setCvc(e.target.value),
      required: true,
      style: { flex: 1, padding: "14px 16px", border: "none", fontSize: 16, outline: "none" }
    }
  )))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 30 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 8 } }, "Name on card"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "John Doe",
      value: cardName,
      onChange: (e) => setCardName(e.target.value),
      required: true,
      style: { width: "100%", padding: "14px 16px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 16, outline: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 15 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setCheckoutPlan(null),
      disabled: loading,
      style: { flex: 1, padding: "16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer" }
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: loading,
      style: { flex: 2, padding: "16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: loading ? "wait" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }
    },
    loading ? /* @__PURE__ */ React.createElement("i", { className: "ti ti-loader pp-spin" }) : /* @__PURE__ */ React.createElement("i", { className: "ti ti-lock" }),
    loading ? "Processing..." : `Pay ${checkoutPlan.price} ${checkoutPlan.currency}`
  )), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-shield-check" }), " Payments are secure and encrypted.")))));
}
