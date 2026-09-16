import { ref, computed } from "vue";
import { navigateTo, useRuntimeConfig, useRoute } from "#app";
import { useConfirm } from "./useConfirm";
import { useToast } from "./useToast";
import { resolveApiBase } from "~/utils/api-base";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "BUDDY" | "PARTICIPANT" | "ORMAWA_PIC";
  status?: string;
  characterClass?: string;
  characterTitle?: string;
  characterTier?: number;
  unlockedTitles?: string[];
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  buddyRole?: "PRIMARY" | "ASSISTANT";
  assignedFloor?: number;
  prodi?: string;
  faculty?: string;
  gender?: "MALE" | "FEMALE";
  avatarUrl?: string;
  boothId?: string;
  boothName?: string;
  boothCode?: string;
  category?: string;
}

const token = ref<string | null>(null);
const user = ref<User | null>(null);
const loading = ref(false);

// Hydrate from localStorage on client-side
if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("genius_admin_token");
  const storedUser = localStorage.getItem("genius_admin_user");
  if (storedToken && storedUser) {
    try {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
    } catch {
      token.value = null;
      user.value = null;
    }
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "ADMIN");
  const isBuddy = computed(() => user.value?.role === "BUDDY");
  const isOrmawaPic = computed(() => user.value?.role === "ORMAWA_PIC");

  const userInitials = computed(() => {
    if (!user.value?.fullName) return "GM";
    return user.value.fullName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  });

  /**
   * Real Authentication via Backend REST API (/api/auth/login)
   * Automatically routes to the matching dashboard based on user.role:
   * - ADMIN -> /
   * - BUDDY -> /buddy
   * - ORMAWA_PIC -> /ormawa/portal
   */
  async function login(
    usernameInput: string,
    passwordInput: string,
    customRedirect?: string
  ): Promise<{ success: boolean; role?: User["role"]; user?: User; error?: string }> {
    loading.value = true;
    try {
      const config = useRuntimeConfig();
      const baseUrl = resolveApiBase(config.public?.apiBase as string | undefined);

      const res = await $fetch<{
        success: boolean;
        data?: {
          token: string;
          user: User;
        };
        error?: {
          code: string;
          message: string;
        };
        message?: string;
      }>(`${baseUrl}/auth/login`, {
        method: "POST",
        body: {
          username: usernameInput.trim(),
          password: passwordInput,
        },
      });

      if (!res.success || !res.data?.token || !res.data?.user) {
        return {
          success: false,
          error: res.error?.message || res.message || "Gagal masuk. Periksa username dan password.",
        };
      }

      // Verify that user is Panitia (ADMIN, BUDDY, ORMAWA_PIC)
      if (res.data.user.role !== "ADMIN" && res.data.user.role !== "BUDDY" && res.data.user.role !== "ORMAWA_PIC") {
        return {
          success: false,
          error: "Akses ditolak: Akun Anda terdaftar sebagai Peserta, bukan Panitia atau Ormawa.",
        };
      }

      token.value = res.data.token;
      user.value = res.data.user;

      if (typeof window !== "undefined") {
        localStorage.setItem("genius_admin_token", res.data.token);
        localStorage.setItem("genius_admin_user", JSON.stringify(res.data.user));
      }

      let redirectTarget = customRedirect;
      if (!redirectTarget) {
        try {
          const route = useRoute();
          if (route?.query?.redirect && typeof route.query.redirect === "string") {
            redirectTarget = route.query.redirect;
          }
        } catch {}
      }

      // Role-based routing
      if (res.data.user.role === "BUDDY") {
        if (redirectTarget && redirectTarget.startsWith("/buddy")) {
          navigateTo(redirectTarget);
        } else {
          navigateTo("/buddy");
        }
      } else if (res.data.user.role === "ORMAWA_PIC") {
        if (redirectTarget && (redirectTarget.startsWith("/ormawa") || redirectTarget.startsWith("/qr-center"))) {
          navigateTo(redirectTarget);
        } else {
          navigateTo("/ormawa/portal");
        }
      } else {
        // ADMIN
        if (redirectTarget && !redirectTarget.startsWith("/login") && !redirectTarget.startsWith("/ormawa/login")) {
          navigateTo(redirectTarget);
        } else {
          navigateTo("/");
        }
      }

      return { success: true, role: res.data.user.role, user: res.data.user };
    } catch (err: any) {
      const errMsg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "Gagal terhubung ke server backend GENIUS.";
      return { success: false, error: errMsg };
    } finally {
      loading.value = false;
    }
  }

  async function loginAsPreset(presetUser: User, password?: string) {
    const defaultPassword = password || (presetUser.role === "ADMIN" ? "admin2026" : presetUser.role === "BUDDY" ? "buddy2026" : (presetUser.role === "ORMAWA_PIC" ? "genius2026" : "genius2026"));
    return await login(presetUser.username, defaultPassword);
  }
  async function switchRole(targetRole: "ADMIN" | "BUDDY" | "ORMAWA_PIC") {
    if (targetRole === "BUDDY") {
      navigateTo("/buddy");
    } else if (targetRole === "ORMAWA_PIC") {
      navigateTo("/ormawa/portal");
    } else {
      navigateTo("/");
    }
  }

  async function logout() {
    try {
      const config = useRuntimeConfig();
      const baseUrl = resolveApiBase(config.public?.apiBase as string | undefined);
      if (token.value) {
        await $fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token.value}` },
        }).catch(() => {});
      }
    } finally {
      token.value = null;
      user.value = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("genius_admin_token");
        localStorage.removeItem("genius_admin_user");
        // Hard redirect to guarantee clean navigation back to unified login
        window.location.href = "/login";
      } else {
        navigateTo("/login");
      }
    }
  }

  async function confirmLogout() {
    const isBuddy = user.value?.role === "BUDDY";
    const isPic = user.value?.role === "ORMAWA_PIC";
    const { show } = useConfirm();
    const confirmed = await show({
      title: isBuddy
        ? "Keluar dari Sesi Buddy?"
        : isPic
        ? "Keluar dari Portal Stan Ormawa?"
        : "Keluar dari Portal Admin?",
      description: isBuddy
        ? "Sesi aktif bimbingan Anda akan diakhiri. Pastikan seluruh penilaian dan presensi maba telah tersimpan."
        : isPic
        ? "Sesi aktif stan Anda akan diakhiri. Pastikan semua verifikasi stempel telah selesai."
        : "Sesi aktif Anda akan diakhiri. Pastikan semua perubahan data telah tersimpan sebelum keluar.",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      variant: "danger",
      icon: "logout",
    });

    if (confirmed) {
      const toast = useToast();
      toast.info(
        "Sampai Jumpa!",
        isBuddy
          ? "Anda telah keluar dari sesi pendamping buddy."
          : isPic
          ? "Anda telah keluar dari sesi stan ormawa."
          : "Anda telah keluar dari sesi admin."
      );
      await logout();
    }
  }

  async function verify(): Promise<boolean> {
    if (!token.value) return false;
    try {
      const config = useRuntimeConfig();
      const baseUrl = resolveApiBase(config.public?.apiBase as string | undefined);
      const res = await $fetch<{ success: boolean; data: User }>(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });

      if (res.success && res.data) {
        user.value = res.data;
        if (typeof window !== "undefined") {
          localStorage.setItem("genius_admin_user", JSON.stringify(res.data));
        }
        return true;
      }
      return false;
    } catch {
      await logout();
      return false;
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isBuddy,
    isOrmawaPic,
    userInitials,
    login,
    loginAsPreset,
    switchRole,
    logout,
    confirmLogout,
    verify,
  };
}
