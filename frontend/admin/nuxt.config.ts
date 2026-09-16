// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  telemetry: false,

  // SPA mode for Admin management console
  ssr: false,

  devServer: {
    host: "0.0.0.0",
    port: 3002,
  },

  css: ["~/assets/css/tailwind.css", "~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
  },

  nitro: {
    devProxy: {
      "/api": {
        target: "http://127.0.0.1:3001/api",
        changeOrigin: true,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "/api",
      useMockApi: process.env.NUXT_PUBLIC_USE_MOCK_API === "true",
    },
  },

  modules: ["shadcn-nuxt"],

  components: {
    dirs: [
      {
        path: "~/components",
        pathPrefix: false,
        extensions: [".vue"],
      },
    ],
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./app/components/ui",
  },

  app: {
    head: {
      title: "GENIUS 2026 — Admin Control Center",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Admin Control Center for GENIUS 2026 UNU Yogyakarta Gamification Platform",
        },
        { name: "theme-color", content: "#15100c" },
        { name: "msapplication-TileColor", content: "#15100c" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48x48.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Press+Start+2P&family=Silkscreen:wght@400;700&family=Pixelify+Sans:wght@400;600;700&display=swap",
        },
      ],
    },
  },
});
