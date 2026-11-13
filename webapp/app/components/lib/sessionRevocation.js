import { fireSwal } from "./swal";

let revokingInProgress = false;

export async function handleRevokedSession({
  code = "ACCOUNT_DELETED",
  message = "Your session is no longer valid. Please log in again.",
} = {}) {
  if (typeof window === "undefined" || revokingInProgress) {
    return;
  }
  revokingInProgress = true;

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("just_registered_helper");
  } catch {}

  try {
    window.dispatchEvent(new Event("userProfileUpdated"));
    window.dispatchEvent(
      new CustomEvent("hirebuddy:account-revoked", { detail: { code, message } })
    );
  } catch {}

  try {
    const { disconnectSocket } = await import("../config/socketClient");
    disconnectSocket();
  } catch {}

  try {
    const { signOut } = await import("next-auth/react");
    await signOut({ redirect: false });
  } catch {}

  const isBlocked = code === "ACCOUNT_BLOCKED";
  const pathname = window.location.pathname || "";

  if (pathname !== "/login") {
    await fireSwal({
      icon: "error",
      title: isBlocked ? "Account Blocked" : "Account Logged Out",
      text: message,
      confirmButtonText: "Back to Login",
      allowOutsideClick: false,
    });
    window.location.replace("/login");
  } else {
    revokingInProgress = false;
  }
}
