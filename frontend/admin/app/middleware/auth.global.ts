/**
 * Global authentication & role middleware for Admin & Buddy Control Center.
 * Protects all routes except /login.
 * Separates access between Superadmin and Buddy roles.
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on login pages to avoid redirect loops
  if (to.path === "/login" || to.path === "/ormawa/login") return;

  // Check authentication status (client-side only)
  if (import.meta.client) {
    const token = localStorage.getItem("genius_admin_token");
    const userRaw = localStorage.getItem("genius_admin_user");

    if (!token || !userRaw) {
      if (to.path.startsWith("/ormawa")) {
        return navigateTo({
          path: "/ormawa/login",
          query: { redirect: to.fullPath },
        });
      }
      return navigateTo({
        path: "/login",
        query: { redirect: to.fullPath },
      });
    }

    try {
      const user = JSON.parse(userRaw);
      const role = user?.role;

      if (role !== "ADMIN" && role !== "BUDDY" && role !== "ORMAWA_PIC") {
        localStorage.removeItem("genius_admin_token");
        localStorage.removeItem("genius_admin_user");
        return navigateTo(to.path.startsWith("/ormawa") ? "/ormawa/login" : "/login");
      }

      // If Ormawa PIC accesses superadmin or buddy routes, redirect them to /ormawa/portal
      if (role === "ORMAWA_PIC") {
        const allowedOrmawaPaths = ["/ormawa", "/qr-center"];
        const isAllowed = allowedOrmawaPaths.some((p) => to.path.startsWith(p));
        if (!isAllowed) {
          return navigateTo("/ormawa/portal");
        }
      }

      // If Buddy accesses root dashboard or superadmin pages, route them to /buddy portal
      if (role === "BUDDY") {
        const adminOnlyPrefixes = [
          "/settings",
          "/floors",
          "/routes",
          "/missions",
          "/stages",
          "/ai-studio",
          "/games",
          "/questions",
          "/achievements",
          "/audit-logs",
          "/scores",
          "/users",
          "/participants",
        ];

        if (to.path === "/" || adminOnlyPrefixes.some((p) => to.path.startsWith(p))) {
          return navigateTo("/buddy");
        }
      }
    } catch {
      return navigateTo(to.path.startsWith("/ormawa") ? "/ormawa/login" : "/login");
    }
  }
});
