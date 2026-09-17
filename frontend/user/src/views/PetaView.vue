<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhMapTrifold,
  PhArrowLeft,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhIdentificationBadge,
  PhUser,
  PhCalendarCheck,
} from '@phosphor-icons/vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import BuildingMap from '@/components/map/BuildingMap.vue';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';

const gameStore = useGameStore();
const isMuted = ref(gameStore.soundEnabled === false);

function safeSound(fn: () => void) {
  try {
    if (!isMuted.value && gameStore.soundEnabled) {
      fn();
    }
  } catch {
    // ignore
  }
}

function toggleSound() {
  isMuted.value = !isMuted.value;
  gameStore.soundEnabled = !isMuted.value;
  if (!isMuted.value) {
    soundEngine.playClick();
  }
}
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-5 px-3 sm:px-6"
  >
    <!-- Fixed Background Wallpaper (Fixed in Viewport) -->
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
    <CrtScanlines />

    <!-- TOP HEADER: Sesuai format Presensi & Ormawa Expo -->
    <header class="relative z-20 w-full max-w-xl mx-auto flex items-center justify-between gap-2 pb-2 shrink-0">
      <!-- Left: Back to Menu -->
      <RouterLink
        to="/play"
        @click="() => safeSound(() => soundEngine.playClick?.())"
        class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all text-[9.5px] sm:text-[10px] flex items-center gap-1.5 cursor-pointer active:scale-95 shadow shrink-0"
        title="Kembali ke Menu Utama"
      >
        <PhArrowLeft :size="13" weight="bold" />
        <span class="font-pixel">MENU</span>
      </RouterLink>

      <!-- Center: Title Badge -->
      <div class="px-3 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e] rounded-full shadow flex items-center gap-1.5 shrink-0">
        <PhMapTrifold :size="14" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
          PETA KAMPUS
        </span>
      </div>

      <!-- Right: Sound Toggle -->
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          @click="toggleSound"
          class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
          :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
        >
          <PhSpeakerHigh v-if="!isMuted" :size="13" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="13" weight="bold" />
        </button>
      </div>
    </header>

    <!-- MAIN CONTENT: Focused & Clean Layout -->
    <main class="relative z-20 w-full max-w-xl mx-auto space-y-3 my-auto">
      <BuildingMap />

      <!-- FOOTER NAV -->
      <footer class="flex items-center justify-center pt-2 pb-1">
        <div class="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#120a05]/90 backdrop-blur-md border border-[#5a3a18] text-[8.5px] text-[#a08060] font-pixel shadow">
          <RouterLink
            to="/presensi"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#60a5fa] flex items-center gap-1 transition-colors"
          >
            <PhCalendarCheck :size="12" />
            <span>PRESENSI</span>
          </RouterLink>
          <span>•</span>
          <RouterLink
            to="/profile"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#facc15] flex items-center gap-1 transition-colors"
          >
            <PhIdentificationBadge :size="12" />
            <span>PROFIL & STEMPEL</span>
          </RouterLink>
          <span>•</span>
          <RouterLink
            to="/team"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#38bdf8] flex items-center gap-1 transition-colors"
          >
            <PhUser :size="12" />
            <span>REGU</span>
          </RouterLink>
        </div>
      </footer>
    </main>
  </div>
</template>
