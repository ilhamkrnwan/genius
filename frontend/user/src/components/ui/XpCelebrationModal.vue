<script setup lang="ts">
import { computed, watch } from 'vue';
import confetti from 'canvas-confetti';
import {
  PhSparkle,
  PhTrophy,
  PhCheckCircle,
  PhStorefront,
  PhUserCheck,
  PhArrowRight,
  PhStar,
  PhX,
} from '@phosphor-icons/vue';
import PixelButton from './PixelButton.vue';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';

const gameStore = useGameStore();

const celebration = computed(() => gameStore.currentCelebration);
const isOpen = computed(() => Boolean(celebration.value));
const remainingQueueCount = computed(() => gameStore.celebrationQueue.length);

// Fire confetti and play fanfare sound whenever a new celebration appears
watch(
  () => celebration.value?.id,
  (newId) => {
    if (!newId || !celebration.value) return;

    // Launch multi-stage confetti blast
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#f0d060', '#7ec850', '#60a8d8', '#facc15', '#ffffff', '#e879f9'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.65 },
          colors: ['#f0d060', '#7ec850', '#ffffff'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.65 },
          colors: ['#f0d060', '#60a8d8', '#ffffff'],
        });
      }, 250);
    } catch {
      // Ignore if canvas-confetti cannot run in environment
    }

    if (gameStore.soundEnabled) {
      if (celebration.value.type === 'DAY_3' || celebration.value.xp >= 150) {
        soundEngine.playLevelUp();
      } else {
        soundEngine.playStampSlam();
      }
    }
  },
  { immediate: true }
);

const handleClose = () => {
  gameStore.dismissCelebration();
};

const categoryBadge = computed(() => {
  const type = celebration.value?.type;
  switch (type) {
    case 'ATTENDANCE_IN':
      return { label: 'PRESENSI MASUK', color: '#7ec850', bg: '#142612' };
    case 'ATTENDANCE_OUT':
      return { label: 'PRESENSI PULANG', color: '#60a8d8', bg: '#0e1e2d' };
    case 'FGD':
      return { label: 'NILAI FGD SANTRI', color: '#f0d060', bg: '#2d2208' };
    case 'DAY_3':
      return { label: 'PENILAIAN HARI KE-3', color: '#e879f9', bg: '#2d0e2d' };
    case 'ORMAWA':
      return { label: 'STAN ORMAWA EXPO', color: '#facc15', bg: '#261c0a' };
    default:
      return { label: 'REWARD XP SPESIAL', color: '#f0d060', bg: '#261c0a' };
  }
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="isOpen && celebration"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0604]/85 backdrop-blur-md select-none"
    >
      <!-- Modal Container -->
      <div
        class="w-full max-w-md bg-gradient-to-b from-[#2d1b0e] via-[#201309] to-[#140a04] border-[3.5px] border-[#f0d060] rounded-2xl p-5 sm:p-7 text-center relative overflow-hidden shadow-[0_0_35px_rgba(240,208,96,0.3)] animate-in fade-in"
      >
        <!-- Corner Pixel Screws -->
        <div class="absolute top-2 left-2 w-2.5 h-2.5 rounded-sm bg-[#5a3a18] border border-[#f0d060]/60 pointer-events-none" />
        <div class="absolute top-2 right-2 w-2.5 h-2.5 rounded-sm bg-[#5a3a18] border border-[#f0d060]/60 pointer-events-none" />
        <div class="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-sm bg-[#5a3a18] border border-[#f0d060]/60 pointer-events-none" />
        <div class="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-sm bg-[#5a3a18] border border-[#f0d060]/60 pointer-events-none" />

        <!-- Close button top right -->
        <button
          type="button"
          @click="handleClose"
          class="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-[#3d2412] hover:bg-[#523218] border border-[#f0d060]/50 text-[#f0d060] flex items-center justify-center cursor-pointer active:scale-90 transition-all z-10"
          aria-label="Tutup"
        >
          <PhX :size="16" weight="bold" />
        </button>

        <!-- Top Category Pill -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-3.5 shadow-sm"
          :style="{
            backgroundColor: categoryBadge.bg,
            borderColor: categoryBadge.color,
            color: categoryBadge.color
          }"
        >
          <PhSparkle :size="14" weight="fill" />
          <span class="font-pixel text-[9px] uppercase tracking-wider font-bold">
            {{ categoryBadge.label }}
          </span>
        </div>

        <!-- Main Announcement Headline -->
        <h2 class="font-pixel text-lg sm:text-xl text-[#fef08a] font-bold tracking-wide uppercase leading-tight drop-shadow">
          Selamat! Kamu Dapat XP!
        </h2>
        <p class="text-xs text-[#d5b088] font-mono mt-1">
          {{ celebration.title }}
        </p>

        <!-- Big Shiny Gold XP Award Plaque -->
        <div class="my-4.5 py-4 px-4 bg-gradient-to-b from-[#3a2211] to-[#1d1007] border-2 border-[#f0d060] rounded-xl shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <!-- Ambient Shimmer Ribbon -->
          <div class="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 pointer-events-none animate-pulse" />

          <div class="flex items-center justify-center gap-2">
            <PhStar :size="28" weight="fill" class="text-[#facc15] animate-spin" style="animation-duration: 8s;" />
            <span class="font-pixel text-4xl sm:text-5xl font-black text-[#fef08a] tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              +{{ celebration.xp }}
            </span>
            <span class="font-pixel text-xl sm:text-2xl text-[#f0d060] font-bold self-end mb-1">
              XP
            </span>
            <PhStar :size="28" weight="fill" class="text-[#facc15] animate-spin" style="animation-duration: 8s; animation-direction: reverse;" />
          </div>

          <p v-if="celebration.totalXp" class="text-[10px] text-[#a08060] font-mono mt-1">
            Total Akumulasi XP Kamu: <strong class="text-[#86efac]">{{ celebration.totalXp }} XP</strong>
          </p>
        </div>

        <!-- Giver Information Card (DARI SIAPA) -->
        <div class="bg-[#180e07] border border-[#5a3a18] rounded-xl p-3 sm:p-3.5 mb-4 text-left flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-[#2b180d] border border-[#f0d060] flex items-center justify-center shrink-0 text-[#facc15] shadow-inner mt-0.5">
            <PhStorefront v-if="celebration.type === 'ORMAWA'" :size="22" weight="fill" />
            <PhCheckCircle v-else-if="celebration.type.startsWith('ATTENDANCE')" :size="22" weight="fill" />
            <PhTrophy v-else-if="celebration.type === 'DAY_3'" :size="22" weight="fill" />
            <PhUserCheck v-else :size="22" weight="fill" />
          </div>

          <div class="min-w-0 flex-1">
            <span class="text-[9px] font-pixel text-[#a08060] uppercase block tracking-wider">
              Diberikan Oleh:
            </span>
            <h3 class="font-pixel text-xs sm:text-sm text-[#86efac] font-bold truncate">
              {{ celebration.giverName || 'Panitia Resmi PKKMB' }}
            </h3>
            <p v-if="celebration.giverRole" class="text-[10px] text-[#c4956a] font-mono leading-tight mt-0.5 truncate">
              {{ celebration.giverRole }}
            </p>
            <p v-if="celebration.message" class="text-[10px] text-gray-300 font-mono leading-tight mt-1 pt-1 border-t border-[#3a2414]">
              {{ celebration.message }}
            </p>
          </div>
        </div>

        <!-- Remaining Queue Badge (if multiple celebrations queued) -->
        <div v-if="remainingQueueCount > 0" class="mb-3">
          <span class="text-[9.5px] font-mono text-[#facc15] bg-[#2d1b0e] border border-[#f0d060]/50 px-2.5 py-0.5 rounded-full">
            +{{ remainingQueueCount }} notifikasi penghargaan lainnya
          </span>
        </div>

        <!-- Action Button -->
        <div class="flex justify-center">
          <PixelButton
            variant="primary"
            size="md"
            className="w-full justify-center shadow-lg"
            @click="handleClose"
          >
            <span>KLAIM & LANJUT</span>
            <PhArrowRight :size="16" weight="bold" />
          </PixelButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
