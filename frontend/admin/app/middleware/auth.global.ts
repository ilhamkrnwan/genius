/**
 * Global authentication & role middleware for Admin, Buddy, and Ormawa Portals.
 * Protects all routes except /login.
 * Redirects authenticated users to their respective role dashboards.
 */
export default defineNuxtRouteMiddleware((to) => {
  // Normalize path by stripping trailing slash (e.g. "/login/" -> "/login")
  const cleanPath = to.path.replace(/\/+$/, "") || "/";

  // If legacy /ormawa/login is accessed, redirect to unified /login
  if (cleanPath === "/ormawa/login") {
    return navigateTo({ path: "/login", query: to.query }, { replace: true });
  }

  // Handle /login route - NEVER redirect /login to /login!
  if (cleanPath === "/login") {
    if (import.meta.client) {
      const token = localStorage.getItem("genius_admin_token");
      const userRaw = localStorage.getItem("genius_admin_user");

      if (token && userRaw) {
        try {
          const user = JSON.parse(userRaw);
          const role = user?.role;
          if (role === "BUDDY") return navigateTo("/buddy", { replace: true });
          if (role === "ORMAWA_PIC") return navigateTo("/ormawa/portal", { replace: true });
          if (role === "ADMIN") return navigateTo("/", { replace: true });
        } catch {
          // Token or user corrupted, stay on /login
          localStorage.removeItem("genius_admin_token");
          localStorage.removeItem("genius_admin_user");
        }
      }
    }
    return;
  }

  // Client-side authentication checks for protected routes
  if (import.meta.client) {
    const token = localStorage.getItem("genius_admin_token");
    const userRaw = localStorage.getItem("genius_admin_user");

    // Protected routes: redirect unauthenticated users to /login
    if (!token || !userRaw) {
      let redirectTarget = cleanPath;
      if (redirectTarget === "/login" || redirectTarget.startsWith("/login")) {
        redirectTarget = "/";
      }
      return navigateTo({
        path: "/login",
        query: redirectTarget !== "/" ? { redirect: redirectTarget } : undefined,
      }, { replace: true });
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
