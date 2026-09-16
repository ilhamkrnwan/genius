/**
 * Global authentication & role middleware for Admin, Buddy, and Ormawa Portals.
 * Protects all routes except /login.
 * Redirects authenticated users to their respective role dashboards.
 */
export default defineNuxtRouteMiddleware((to) => {
  // If legacy /ormawa/login is accessed, redirect to unified /login
  if (to.path === "/ormawa/login") {
    return navigateTo({ path: "/login", query: to.query }, { replace: true });
  }

  // Client-side authentication checks
  if (import.meta.client) {
    const token = localStorage.getItem("genius_admin_token");
    const userRaw = localStorage.getItem("genius_admin_user");

    // Handle /login route
    if (to.path === "/login") {
      if (token && userRaw) {
        try {
          const user = JSON.parse(userRaw);
          const role = user?.role;
          if (role === "BUDDY") return navigateTo("/buddy");
          if (role === "ORMAWA_PIC") return navigateTo("/ormawa/portal");
          if (role === "ADMIN") return navigateTo("/");
        } catch {
          // Token or user corrupted, stay on /login
          localStorage.removeItem("genius_admin_token");
          localStorage.removeItem("genius_admin_user");
        }
      }
      return;
    }

    // Protected routes: redirect unauthenticated users to /login
    if (!token || !userRaw) {
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
        return navigateTo("/login");
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
      localStorage.removeItem("genius_admin_token");
      localStorage.removeItem("genius_admin_user");
      return navigateTo("/login");
    }
  }
});
