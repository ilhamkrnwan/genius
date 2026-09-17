<template>
  <div class="h-full w-full min-h-screen">
    <!-- Buddy Mobile-First Dedicated Layout (Pixel Stardew Valley Theme with Game Background) -->
    <div
      v-if="isBuddyView"
      class="relative min-h-[100dvh] text-[#f0e0c0] flex flex-col font-sans selection:bg-[#f0d060] selection:text-[#2d1b0e]"
    >
      <!-- Fixed Background Wallpaper (Peserta Game BG) -->
      <div
        class="fixed inset-0 pointer-events-none z-0"
        style="
          background-image: url('/games/background.avif');
          background-size: cover;
          background-position: center bottom;
          image-rendering: pixelated;
        "
      />
      <!-- Dark Vignette Overlay -->
      <div class="fixed inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85 pointer-events-none z-0" />

      <BuddyHeader />
      <main class="relative z-10 flex-1 w-full max-w-6xl mx-auto pb-24 custom-scrollbar flex flex-col min-h-0 px-3 md:px-6 lg:px-8 pt-4 md:pt-6">
        <slot />
      </main>
      <BuddyBottomNav />
    </div>

    <!-- Dedicated Ormawa PIC Portal Layout (Mobile-first, Game Wallpaper, OrmawaHeader & OrmawaBottomNav, NO ADMIN SIDEBAR) -->
    <div
      v-else-if="isOrmawaPicView"
      class="relative min-h-[100dvh] text-[#f0e0c0] flex flex-col font-sans selection:bg-[#f0d060] selection:text-[#2d1b0e]"
    >
      <!-- Fixed Background Wallpaper (Peserta Game BG) -->
      <div
        class="fixed inset-0 pointer-events-none z-0"
        style="
          background-image: url('/games/background.avif');
          background-size: cover;
          background-position: center bottom;
          image-rendering: pixelated;
        "
      />
      <!-- Dark Vignette Overlay -->
      <div class="fixed inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85 pointer-events-none z-0" />

      <OrmawaHeader />
      <main class="relative z-10 flex-1 w-full max-w-xl mx-auto pb-24 custom-scrollbar flex flex-col min-h-0 px-3 pt-3">
        <slot />
      </main>
      <OrmawaBottomNav />
    </div>

    <!-- Super Admin Control Center Layout -->
    <div
      v-else
      :class="[
        'relative flex min-h-screen text-[#f0e0c0] selection:bg-[#f0d060]/30 selection:text-[#fef08a]',
        isOrmawaView ? 'bg-[#150d07]' : 'bg-[#24160c]'
      ]"
    >
      <!-- Game Background Wallpaper for Ormawa Pages (Peserta Game Style) -->
      <template v-if="isOrmawaView">
        <div
          class="fixed inset-0 pointer-events-none z-0"
          style="
            background-image: url('/games/background.avif');
            background-size: cover;
            background-position: center bottom;
            image-rendering: pixelated;
          "
        />
        <div class="fixed inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 pointer-events-none z-0" />
      </template>

      <!-- Ambient Background Lighting Orbs (Warm Amber & Green RPG Glow) -->
      <div v-else class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div class="absolute -left-[20%] -top-[10%] h-[500px] w-[500px] rounded-full bg-amber-600/12 blur-[130px]" />
        <div class="absolute -right-[15%] -bottom-[10%] h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[140px]" />
        <div class="absolute left-[40%] top-[40%] h-[400px] w-[400px] rounded-full bg-yellow-600/08 blur-[150px]" />
      </div>

      <!-- Desktop Sidebar (Sticky Top-0, H-Screen, Scrollable navigation & Bottom User Profile) -->
      <AppSidebar class="relative z-30" />

      <!-- Mobile Drawer Sidebar -->
      <MobileSidebar />

      <!-- Main Content Area -->
      <div class="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- Topbar Header -->
        <AppHeader />

        <!-- Page Content View with self-managed padding per page -->
        <main class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col w-full">
          <slot />
        </main>
      </div>
    </div>

    <!-- Global Toast Notification Container & Modal -->
    <ToastContainer />
    <ConfirmationModal />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import MobileSidebar from "@/components/layout/MobileSidebar.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import BuddyHeader from "@/components/buddy/BuddyHeader.vue";
import BuddyBottomNav from "@/components/buddy/BuddyBottomNav.vue";
import OrmawaHeader from "@/components/ormawa/OrmawaHeader.vue";
import OrmawaBottomNav from "@/components/ormawa/OrmawaBottomNav.vue";
import { ToastContainer } from "~/components/ui/toast";
import { ConfirmationModal } from "~/components/ui/confirmation-modal";
import { useAuth } from "~/composables/useAuth";

const route = useRoute();
const { isBuddy, isOrmawaPic, isAdmin } = useAuth();

const isBuddyView = computed(() => {
  return isBuddy.value || route.path.startsWith("/buddy");
});

const isOrmawaPicView = computed(() => {
  return isOrmawaPic.value || route.path.startsWith("/ormawa/portal") || (route.path === "/ormawa/scan" && !isAdmin.value);
});

const isOrmawaView = computed(() => {
  return route.path.startsWith("/ormawa");
});

useHead(() => ({
  title: isBuddyView.value
    ? "GENIUS 2026 — Buddy Portal"
    : isOrmawaPicView.value
    ? "GENIUS 2026 — Ormawa PIC Portal"
    : isOrmawaView.value
    ? "GENIUS 2026 — Ormawa Expo Center"
    : "GENIUS 2026 — Admin Control Center",
}));
</script>
