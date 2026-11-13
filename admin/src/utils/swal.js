// SweetAlert2-style animated modal popup utility for Admin Portal (zero external dependencies)

const STYLE_ID = "hirebuddy-admin-swal-styles";

function ensureSwalStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes hbSwalBackdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes hbSwalPopIn {
      0% { opacity: 0; transform: scale(0.84) translateY(10px); }
      70% { opacity: 1; transform: scale(1.02) translateY(0); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes hbSwalStroke {
      to { stroke-dashoffset: 0; }
    }
    .hb-swal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(15, 23, 42, 0.58);
      backdrop-filter: blur(5px);
      animation: hbSwalBackdropIn 0.16s ease-out forwards;
      font-family: inherit;
    }
    .hb-swal-card {
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      padding: 28px 26px 24px;
      text-align: center;
      animation: hbSwalPopIn 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      box-shadow: 0 25px 65px -12px rgba(15, 23, 42, 0.35);
    }
    .hb-swal-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .hb-swal-dark {
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #f8fafc;
    }
    .hb-swal-icon-wrap {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
    }
    .hb-swal-draw {
      stroke-dasharray: 180;
      stroke-dashoffset: 180;
      animation: hbSwalStroke 0.45s 0.08s ease-out forwards;
    }
    .hb-swal-btn:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }
    .hb-swal-btn:active {
      transform: translateY(0) scale(0.98);
    }
  `;
  document.head.appendChild(style);
}

function inferIcon(text = "") {
  const lower = String(text).toLowerCase();
  if (
    lower.includes("fail") ||
    lower.includes("error") ||
    lower.includes("invalid") ||
    lower.includes("unable") ||
    lower.includes("cannot")
  ) {
    return "error";
  }
  if (
    lower.includes("success") ||
    lower.includes("verified") ||
    lower.includes("updated") ||
    lower.includes("created") ||
    lower.includes("deleted successfully") ||
    lower.includes("restored") ||
    lower.includes("saved")
  ) {
    return "success";
  }
  if (
    lower.includes("rejected") ||
    lower.includes("please") ||
    lower.includes("required") ||
    lower.includes("blocked")
  ) {
    return "warning";
  }
  return "info";
}

function defaultTitleForIcon(icon) {
  switch (icon) {
    case "success":
      return "Success!";
    case "error":
      return "Action Failed";
    case "warning":
      return "Attention";
    case "question":
      return "Confirm Action";
    default:
      return "Notice";
  }
}

function getIconMarkup(icon) {
  switch (icon) {
    case "success":
      return {
        bg: "rgba(16, 185, 129, 0.12)",
        confirmBg: "#0b8a4e",
        svg: `<svg width="44" height="44" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="23" stroke="#10b981" stroke-width="3" opacity="0.35"/>
          <path class="hb-swal-draw" d="M15 27.5L22.5 35L37.5 19" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
      };
    case "error":
      return {
        bg: "rgba(239, 68, 68, 0.12)",
        confirmBg: "#dc2626",
        svg: `<svg width="44" height="44" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="23" stroke="#ef4444" stroke-width="3" opacity="0.35"/>
          <path class="hb-swal-draw" d="M18 18L34 34M34 18L18 34" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
        </svg>`,
      };
    case "warning":
      return {
        bg: "rgba(245, 158, 11, 0.14)",
        confirmBg: "#d97706",
        svg: `<svg width="44" height="44" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="23" stroke="#f59e0b" stroke-width="3" opacity="0.38"/>
          <path class="hb-swal-draw" d="M26 15V29" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
          <circle cx="26" cy="36.5" r="2.5" fill="#f59e0b"/>
        </svg>`,
      };
    case "question":
    case "info":
    default:
      return {
        bg: "rgba(59, 130, 246, 0.13)",
        confirmBg: "#2563eb",
        svg: `<svg width="44" height="44" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="23" stroke="#3b82f6" stroke-width="3" opacity="0.35"/>
          <circle cx="26" cy="17" r="2.4" fill="#3b82f6"/>
          <path class="hb-swal-draw" d="M26 24V36" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
        </svg>`,
      };
  }
}

export function fireSwal(options = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve({ isConfirmed: false, isDismissed: true, value: null });
  }

  ensureSwalStyles();

  const normalized =
    typeof options === "string" ? { text: options } : { ...options };

  const icon = normalized.icon || inferIcon(normalized.text || normalized.title || "");
  const title = normalized.title || defaultTitleForIcon(icon);
  const text = normalized.text || "";
  const showCancelButton = Boolean(normalized.showCancelButton);
  const confirmButtonText = normalized.confirmButtonText || "OK";
  const cancelButtonText = normalized.cancelButtonText || "Cancel";
  const hasInput = Boolean(normalized.input);
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark";

  const iconSpec = getIconMarkup(icon);
  const confirmColor =
    normalized.confirmButtonColor ||
    (normalized.danger ? "#dc2626" : iconSpec.confirmBg);

  return new Promise((resolve) => {
    const existing = document.getElementById("hb-swal-active-root");
    if (existing) {
      existing.remove();
    }

    const backdrop = document.createElement("div");
    backdrop.id = "hb-swal-active-root";
    backdrop.className = "hb-swal-backdrop";

    const card = document.createElement("div");
    card.className = `hb-swal-card ${isDark ? "hb-swal-dark" : "hb-swal-light"}`;
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");

    const iconWrap = document.createElement("div");
    iconWrap.className = "hb-swal-icon-wrap";
    iconWrap.style.background = iconSpec.bg;
    iconWrap.innerHTML = iconSpec.svg;
    card.appendChild(iconWrap);

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.style.cssText =
      "margin: 0; font-size: 20px; font-weight: 800; line-height: 1.3; letter-spacing: -0.01em;";
    card.appendChild(titleEl);

    if (text) {
      const textEl = document.createElement("p");
      textEl.textContent = text;
      textEl.style.cssText = `margin: 10px 0 0; font-size: 14px; line-height: 1.55; white-space: pre-line; color: ${
        isDark ? "#cbd5e1" : "#475569"
      };`;
      card.appendChild(textEl);
    }

    let inputEl = null;
    if (hasInput) {
      inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.value = normalized.inputValue ?? "";
      inputEl.placeholder = normalized.inputPlaceholder || "";
      inputEl.style.cssText = `margin-top: 16px; width: 100%; box-sizing: border-box; border-radius: 12px; padding: 11px 14px; font-size: 14px; outline: none; border: 1.5px solid ${
        isDark ? "#334155" : "#cbd5e1"
      }; background: ${isDark ? "#020617" : "#f8fafc"}; color: ${
        isDark ? "#f8fafc" : "#0f172a"
      };`;
      card.appendChild(inputEl);
    }

    const actions = document.createElement("div");
    actions.style.cssText =
      "margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 10px;";

    let settled = false;
    const cleanup = (result) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKeyDown);
      backdrop.remove();
      resolve(result);
    };

    if (showCancelButton) {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "hb-swal-btn";
      cancelBtn.textContent = cancelButtonText;
      cancelBtn.style.cssText = `flex: 1; border-radius: 12px; padding: 11px 18px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; border: 1px solid ${
        isDark ? "#334155" : "#cbd5e1"
      }; background: ${isDark ? "#1e293b" : "#f1f5f9"}; color: ${
        isDark ? "#e2e8f0" : "#334155"
      };`;
      cancelBtn.onclick = () =>
        cleanup({ isConfirmed: false, isDismissed: true, value: null });
      actions.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "hb-swal-btn";
    confirmBtn.textContent = confirmButtonText;
    confirmBtn.style.cssText = `${
      showCancelButton ? "flex: 1;" : "min-width: 130px;"
    } border: none; border-radius: 12px; padding: 11px 22px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; background: ${confirmColor}; color: #ffffff; box-shadow: 0 8px 20px -6px ${confirmColor}88;`;
    confirmBtn.onclick = () =>
      cleanup({
        isConfirmed: true,
        isDismissed: false,
        value: inputEl ? inputEl.value : true,
      });
    actions.appendChild(confirmBtn);

    card.appendChild(actions);
    backdrop.appendChild(card);

    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop && normalized.allowOutsideClick !== false) {
        cleanup({ isConfirmed: false, isDismissed: true, value: null });
      }
    });

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup({ isConfirmed: false, isDismissed: true, value: null });
      } else if (e.key === "Enter") {
        e.preventDefault();
        cleanup({
          isConfirmed: true,
          isDismissed: false,
          value: inputEl ? inputEl.value : true,
        });
      }
    };
    document.addEventListener("keydown", onKeyDown);

    document.body.appendChild(backdrop);

    if (inputEl) {
      inputEl.focus();
      inputEl.select();
    } else {
      confirmBtn.focus();
    }
  });
}

export function swalAlert(message, iconOrOptions) {
  const cleanMessage = String(message ?? "").trim();
  if (typeof iconOrOptions === "string") {
    return fireSwal({ text: cleanMessage, icon: iconOrOptions });
  }
  return fireSwal({
    text: cleanMessage,
    ...(iconOrOptions || {}),
  });
}

export async function swalConfirm({
  title = "Are you sure?",
  text = "",
  icon = "warning",
  confirmButtonText = "Yes, Confirm",
  cancelButtonText = "Cancel",
  danger = false,
} = {}) {
  const res = await fireSwal({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    danger,
  });
  return Boolean(res.isConfirmed);
}

export async function swalPrompt({
  title = "Enter Details",
  text = "",
  inputPlaceholder = "",
  inputValue = "",
  confirmButtonText = "Submit",
  cancelButtonText = "Cancel",
  icon = "question",
} = {}) {
  const res = await fireSwal({
    title,
    text,
    icon,
    input: "text",
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });
  return res.isConfirmed ? String(res.value ?? "") : null;
}

const Swal = {
  fire: fireSwal,
  alert: swalAlert,
  confirm: swalConfirm,
  prompt: swalPrompt,
};

export default Swal;
