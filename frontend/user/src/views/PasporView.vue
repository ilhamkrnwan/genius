<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import { animatePageEnter, staggerFadeUp, stampSlamEffect, bouncePop } from '@/lib/gsap';
import {
  PhIdentificationBadge,
  PhTrophy,
  PhSparkle,
  PhCheckCircle,
  PhLockKey,
  PhArrowLeft,
  PhPrinter,
  PhArrowCounterClockwise,
  PhStorefront,
  PhMedal,
  PhQrCode,
  PhWarning,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhMapTrifold,
  PhCalendarCheck,
  PhUser,
} from '@phosphor-icons/vue';
import { FLOORS_DATA, BOOTHS_DATA, LEVEL_CONFIG, AVATAR_OPTIONS } from '@/data/mockData';
import { ORMAWA_STANDS } from '@/data/ormawaData';
import { useGameStore } from '@/store/gameStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import QrScannerModal from '@/components/common/QrScannerModal.vue';
import { soundEngine } from '@/lib/sound';

const gameStore = useGameStore();

const showCertificate = ref(false);
const selectedStampPreview = ref<string | null>(null);
const showOrmawaScanner = ref(false);
const ormawaScanToast = ref<{ message: string; success: boolean } | null>(null);
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

const ormawaPresets = computed(() => {
  return ORMAWA_STANDS.map((s) => ({
    label: `${s.shortName} (Lt ${s.floor})`,
    code: s.qrToken,
    description: s.name,
  }));
});

const handleOrmawaScanSuccess = (code: string) => {
  showOrmawaScanner.value = false;
  const res = gameStore.scanOrmawa(code);
  ormawaScanToast.value = {
    message: res.message,
    success: res.success,
  };
  setTimeout(() => {
    ormawaScanToast.value = null;
  }, 4500);
};

const visitedOrmawaStands = computed(() =>
  ORMAWA_STANDS.filter((s) => gameStore.isStandVisited(s.id))
);

const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const currentLevel = computed(() => gameStore.getCurrentLevel());
const currentLevelData = computed(
  () => LEVEL_CONFIG.find((l) => l.level === currentLevel.value) || LEVEL_CONFIG[0]
);
const totalStampsCollected = computed(() => gameStore.getTotalStampsCount());
const isAllCompleted = computed(() => completedFloors.value >= 6 && totalStampsCollected.value >= 9);

const selectedAvatarObj = computed(
  () => AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) || AVATAR_OPTIONS[0]
);

const showResetModal = ref(false);

const handlePrint = () => {
  safeSound(() => soundEngine.playClick?.());
  if (typeof window !== 'undefined') {
    window.print();
  }
};

const handleResetConfirm = () => {
  safeSound(() => soundEngine.playClick?.());
  showResetModal.value = true;
};

const executeResetProgress = () => {
  gameStore.resetProgress();
  showResetModal.value = false;
  safeSound(() => soundEngine.playClick?.());
};

function getFloorBooths(floor: any) {
  if (!floor || !floor.boothIds) return [];
  return floor.boothIds
    .map((id: string) => BOOTHS_DATA[id])
    .filter(Boolean);
}

function getFloorStampsCount(floor: any) {
  const booths = getFloorBooths(floor);
  const completed = booths.filter((b: any) => Boolean(gameStore.participant.stamps[b.id])).length;
  return { completed, total: booths.length };
}

function isFloorFullyCompleted(floor: any) {
  const { completed, total } = getFloorStampsCount(floor);
  return total > 0 && completed === total;
}

onMounted(() => {
  gameStore.syncWithServer();
  animatePageEnter('.paspor-header', { y: 20, duration: 0.45 });
  animatePageEnter('.paspor-id-card', { y: 25, duration: 0.5, delay: 0.1 });
  staggerFadeUp('.paspor-floor-card', 0.04, { delay: 0.2 });
});

watch(selectedStampPreview, (val) => {
  if (val) {
    nextTick(() => {
      stampSlamEffect('.paspor-modal-stamp');
    });
  }
});

watch(showCertificate, (val) => {
  if (val) {
    nextTick(() => {
      bouncePop('.paspor-certificate-card');
    });
  }
});
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-5 px-3 sm:px-6"
  >
    <!-- Fixed Background Wallpaper (Fixed in Viewport) -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="
        background-image: url('/games/background.png');
        background-size: cover;
        background-position: center bottom;
        image-rendering: pixelated;
      "
    />
    <!-- Dark Vignette Overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85 pointer-events-none z-0" />
    <CrtScanlines />

    <!-- TOP HEADER: Format standar RPG Presensi & Ormawa Expo -->
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
        <PhIdentificationBadge :size="14" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
          PROFIL PETUALANG
        </span>
      </div>

      <!-- Right: Print & Sound -->
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          @click="handlePrint"
          title="Cetak Profil"
          class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
        >
          <PhPrinter :size="13" weight="bold" />
        </button>

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

    <!-- MAIN CONTENT: Clean, Centered & Unified Layout -->
    <main class="relative z-20 w-full max-w-xl mx-auto space-y-3.5 my-auto">
      <!-- 1. Player ID Card (KTM Paspor HUD) -->
      <div class="paspor-id-card bg-[#19110a]/95 backdrop-blur-md border-2 border-[#f0d060] rounded-xl p-3.5 sm:p-4 shadow-lg space-y-3">
        <!-- Header KTM -->
        <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2.5">
          <div class="flex items-center gap-2 font-pixel text-xs text-[#f0d060]">
            <PhSparkle :size="15" weight="fill" />
            <span>KARTU PROFIL PETUALANG</span>
          </div>
          <img
            src="/unu.png"
            alt="UNU Logo"
            width="32"
            height="32"
            class="h-5 w-auto object-contain"
          />
        </div>

        <!-- Avatar & Basic Info -->
        <div class="flex items-start gap-3">
          <div class="w-14 h-14 bg-[#170f07] border-2 border-[#f0d060] rounded-xl overflow-hidden shadow shrink-0 relative">
            <img
              :src="selectedAvatarObj.avatarImage"
              :alt="selectedAvatarObj.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1 space-y-0.5">
            <h2 class="font-pixel text-xs sm:text-sm font-bold text-white leading-tight break-words">
              {{ gameStore.participant.name }}
            </h2>
            <p class="font-mono text-[11px] text-[#7ec850]">
              NIM: {{ gameStore.participant.nim }}
            </p>
            <p class="font-sans text-[11px] text-[#f0e0c0] leading-tight break-words">
              {{ gameStore.participant.prodi }}
            </p>
            <p class="font-sans text-[10px] text-[#a08060] leading-tight break-words">
              {{ gameStore.participant.faculty }}
            </p>
          </div>
        </div>

        <!-- Level & Stats Strip -->
        <div class="bg-[#120a05] p-2.5 border border-[#5a3a18] rounded-xl space-y-1.5 shadow-inner">
          <div class="flex items-center justify-between">
            <span class="font-pixel text-[8.5px] text-[#a08060] uppercase">
              Pangkat Petualang:
            </span>
            <PixelBadge
              :variant="completedFloors >= 6 ? 'gold' : 'emerald'"
              size="sm"
            >
              {{ currentLevel }}
            </PixelBadge>
          </div>
          <p class="font-sans text-[11px] text-[#c4956a] leading-tight">
            {{ currentLevelData.description }}
          </p>
          <div class="flex items-center justify-between text-[10px] font-pixel pt-1 border-t border-[#3d2b1e]">
            <span class="text-[#f0d060]">{{ gameStore.participant.totalXp }} Total XP</span>
            <span class="text-[#7ec850]">{{ totalStampsCollected }}/9 Stempel Orientasi</span>
          </div>
        </div>

        <!-- Certificate Banner (if completed) -->
        <div
          v-if="isAllCompleted"
          class="bg-[#1f3a2b] border-2 border-[#7ec850] rounded-xl p-3 shadow text-center space-y-2"
        >
          <div class="font-pixel text-xs font-bold text-[#f0d060] flex items-center justify-center gap-1.5">
            <PhTrophy :size="16" weight="fill" class="text-[#f0d060]" />
            <span>Semua Tantangan 6 Lantai Tuntas!</span>
          </div>
          <button
            type="button"
            @click="showCertificate = true"
            class="rpg-btn-primary py-2 px-4 text-xs font-pixel font-bold w-full shadow cursor-pointer"
          >
            Lihat Sertifikat Kelulusan Resmi
          </button>
        </div>
      </div>

      <!-- 2. 9-Stamp Grid (6 Floors with Official Pos) -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between px-1">
          <h3 class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060]">
            9 STEMPEL PETUALANG (6 LANTAI)
          </h3>
          <span class="text-[9px] font-pixel text-[#a08060]">
            KLIK KARTU UNTUK DETAIL
          </span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="floor in FLOORS_DATA"
            :key="floor.number"
            :class="[
              'paspor-floor-card bg-[#19110a]/95 backdrop-blur-md border rounded-xl p-3 sm:p-3.5 shadow-md',
              isFloorFullyCompleted(floor) ? 'border-[#7ec850] bg-[#1a2e1a]/95' : 'border-[#8b6f4e]'
            ]"
          >
            <!-- Floor Header -->
            <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-2 mb-2.5">
              <div class="flex items-center gap-2">
                <span class="font-pixel text-xs font-bold text-[#7ec850]">
                  Lantai {{ floor.number }}:
                </span>
                <span class="font-pixel text-xs text-white">
                  {{ floor.name.split(' - ')[1] || floor.name }}
                </span>
              </div>
              <PixelBadge
                v-if="isFloorFullyCompleted(floor)"
                variant="emerald"
                size="sm"
              >
                <PhCheckCircle :size="12" weight="bold" /> {{ getFloorStampsCount(floor).completed }}/{{ getFloorStampsCount(floor).total }} Selesai
              </PixelBadge>
              <span v-else class="font-sans text-xs text-[#a08060]">
                {{ getFloorStampsCount(floor).completed }}/{{ getFloorStampsCount(floor).total }}
              </span>
            </div>

            <!-- Dynamic Stamps Grid per Floor -->
            <div :class="['grid gap-2', getFloorBooths(floor).length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2']">
              <button
                v-for="booth in getFloorBooths(floor)"
                :key="booth.id"
                type="button"
                @click="() => {
                  safeSound(() => soundEngine.playSelect?.());
                  selectedStampPreview = booth.id;
                }"
                :class="[
                  'w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow',
                  (gameStore.participant.stamps[booth.id] || gameStore.isBoothCompleted(booth.id))
                    ? 'bg-[#1a2e1a] border-[#7ec850] hover:border-[#f0d060]'
                    : 'bg-[#170f07]/80 border-dashed border-[#5a3a18] hover:border-[#8b6f4e] opacity-75'
                ]"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    :class="[
                      'w-9 h-9 rounded-lg border flex flex-col items-center justify-center shrink-0 shadow',
                      (gameStore.participant.stamps[booth.id] || gameStore.isBoothCompleted(booth.id))
                        ? 'border-[#f0d060] bg-gradient-to-b from-[#3d7828] to-[#255018]'
                        : 'border-[#5a3a18] bg-[#23160c] text-[#5a3a18]'
                    ]"
                  >
                    <StampIcon
                      v-if="gameStore.participant.stamps[booth.id] || gameStore.isBoothCompleted(booth.id)"
                      :name="booth.stampIcon"
                      :size="18"
                      class="text-[#f0d060]"
                    />
                    <PhLockKey v-else :size="16" weight="bold" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1 mb-0.5 flex-wrap">
                      <span class="font-pixel text-[8.5px] bg-[#170f07] px-1.5 py-0.5 rounded text-[#f0d060] border border-[#5a3a18]">
                        {{ booth.code }}
                      </span>
                      <span class="font-sans text-[10px] text-[#c4956a] leading-tight">
                        {{ booth.badgeTag }}
                      </span>
                    </div>
                    <h4
                      :class="[
                        'font-pixel text-[9.5px] sm:text-[10px] leading-tight break-words',
                        (gameStore.participant.stamps[booth.id] || gameStore.isBoothCompleted(booth.id)) ? 'text-white font-bold' : 'text-[#a08060]'
                      ]"
                    >
                      {{ booth.name }}
                    </h4>
                  </div>
                </div>

                <div class="shrink-0">
                  <PhCheckCircle
                    v-if="gameStore.participant.stamps[booth.id] || gameStore.isBoothCompleted(booth.id)"
                    :size="16"
                    weight="fill"
                    class="text-[#7ec850]"
                  />
                  <span v-else class="font-pixel text-[8.5px] text-[#f0d060] bg-[#2d1b0e] px-2 py-0.5 rounded border border-[#5a3a18]">
                    Buka
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Lembar Stempel Ormawa Expo (Hari ke-3) -->
      <div class="bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-md">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060] flex items-center gap-1.5">
              <PhStorefront :size="15" class="text-[#facc15]" />
              <span>LEMBAR STEMPEL ORMAWA EXPO (HARI KE-3)</span>
            </h3>
            <p class="font-sans text-[11px] text-[#c4956a] mt-0.5">
              Perolehan: <strong>{{ gameStore.visitedOrmawaCount }}/10 Stan (+{{ gameStore.ormawaXpEarned }} XP)</strong>
            </p>
          </div>

          <button
            type="button"
            @click="() => {
              safeSound(() => soundEngine.playClick?.());
              showOrmawaScanner = true;
            }"
            class="rpg-btn-primary py-1.5 px-3 text-[10px] font-pixel font-bold flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
          >
            <PhQrCode :size="13" weight="bold" />
            <span>PINDAI QR MEJA STAN</span>
          </button>
        </div>

        <!-- Scan Feedback Toast -->
        <div
          v-if="ormawaScanToast"
          :class="[
            'p-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-sans shadow transition-all',
            ormawaScanToast.success
              ? 'bg-[#142314] border-[#22c55e] text-[#86efac]'
              : 'bg-[#291717] border-[#ef4444] text-[#fca5a5]'
          ]"
        >
          <div class="flex items-center gap-1.5">
            <PhCheckCircle v-if="ormawaScanToast.success" :size="15" weight="fill" class="text-[#4ade80]" />
            <span>{{ ormawaScanToast.message }}</span>
          </div>
          <button
            type="button"
            @click="ormawaScanToast = null"
            class="text-gray-400 hover:text-white px-1"
          >
            &times;
          </button>
        </div>

        <!-- Visited Ormawa Badges Grid -->
        <div v-if="visitedOrmawaStands.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div
            v-for="stand in visitedOrmawaStands"
            :key="stand.id"
            class="p-2 rounded-xl border border-[#7ec850] bg-gradient-to-b from-[#1c2e1c] to-[#121c12] text-center space-y-1 shadow flex flex-col justify-between"
          >
            <div class="w-7 h-7 mx-auto rounded-full bg-[#274b24] border border-[#7ec850] flex items-center justify-center text-[#f0d060] shrink-0">
              <PhMedal :size="14" weight="fill" />
            </div>
            <div>
              <span class="font-pixel text-[8px] text-[#86efac] block uppercase">
                {{ stand.badgeTitle }}
              </span>
              <h4 class="font-sans text-[10.5px] font-bold text-white line-clamp-1 mt-0.5">
                {{ stand.shortName }}
              </h4>
              <span class="text-[8.5px] text-[#a08060] font-mono block">
                Lt {{ stand.floor }}
              </span>
            </div>
            <div class="pt-0.5">
              <span class="inline-flex items-center gap-1 text-[7.5px] font-pixel text-[#86efac] bg-[#142314] px-1 py-0.5 rounded border border-[#22c55e]/40">
                <PhCheckCircle :size="8" weight="fill" />
                TERCATAT
              </span>
            </div>
          </div>
        </div>

        <!-- Empty Ormawa State -->
        <div
          v-else
          class="p-4 text-center bg-[#170f07] border border-dashed border-[#5a3a18] rounded-xl space-y-1.5"
        >
          <PhStorefront :size="24" class="text-amber-400 mx-auto opacity-50" />
          <p class="text-xs text-amber-200">Belum ada lencana stan ormawa yang terkumpul.</p>
          <p class="text-[10px] text-stone-400 max-w-sm mx-auto font-sans leading-relaxed">
            Kunjungi selasar lantai 3, 4, dan 5 saat acara Ormawa Expo dan pindai QR di stan UKM untuk menambah koleksi dan XP.
          </p>
          <RouterLink to="/ormawa">
            <button
              type="button"
              @click="() => safeSound(() => soundEngine.playClick?.())"
              class="rpg-btn-wood py-1 px-2.5 text-[9.5px] font-pixel text-[#f0d060] mt-1 cursor-pointer"
            >
              Buka Katalog Ormawa
            </button>
          </RouterLink>
        </div>
      </div>

      <!-- 4. Reset Button (Discreet) -->
      <div class="text-center pt-1">
        <button
          type="button"
          @click="handleResetConfirm"
          class="text-[9.5px] font-pixel text-[#a08060] hover:text-red-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <PhArrowCounterClockwise :size="11" />
          <span>Reset Progres Eksplorasi</span>
        </button>
      </div>

      <!-- FOOTER NAV -->
      <footer class="flex items-center justify-center pt-2 pb-1">
        <div class="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#120a05]/90 backdrop-blur-md border border-[#5a3a18] text-[8.5px] text-[#a08060] font-pixel shadow">
          <RouterLink
            to="/peta"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#60a5fa] flex items-center gap-1 transition-colors"
          >
            <PhMapTrifold :size="12" />
            <span>PETA KAMPUS</span>
          </RouterLink>
          <span>•</span>
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
            class="hover:text-[#86efac] flex items-center gap-1 transition-colors"
          >
            <PhUser :size="12" />
            <span>KTM & AKUN</span>
          </RouterLink>
        </div>
      </footer>
    </main>

    <!-- Stamp Detail Modal -->
    <div
      v-if="selectedStampPreview"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0604]/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        v-if="BOOTHS_DATA[selectedStampPreview]"
        class="w-full max-w-md bg-[#19110a] border-2 border-[#f0d060] rounded-2xl p-5 sm:p-6 text-center relative shadow-2xl"
      >
        <!-- Stamp Graphic -->
        <div class="my-3 flex justify-center">
          <div
            :class="[
              'paspor-modal-stamp w-20 h-20 border-2 rounded-xl flex flex-col items-center justify-center p-2 rotate-[-2deg] shadow-lg',
              gameStore.participant.stamps[selectedStampPreview]
                ? 'border-[#f0d060] bg-gradient-to-b from-[#3d7828] to-[#255018]'
                : 'border-[#5a3a18] bg-[#170f07] opacity-40'
            ]"
          >
            <StampIcon
              :name="BOOTHS_DATA[selectedStampPreview].stampIcon"
              :size="24"
              :class="gameStore.participant.stamps[selectedStampPreview] ? 'text-[#f0d060]' : 'text-[#8b6f4e]'"
            />
            <span class="font-pixel text-[7.5px] text-[#f0d060] font-bold uppercase mt-1">
              {{ BOOTHS_DATA[selectedStampPreview].stampTitle }}
            </span>
          </div>
        </div>

        <h3 class="font-pixel text-xs sm:text-sm font-bold text-white mb-1">
          {{ BOOTHS_DATA[selectedStampPreview].name }}
        </h3>
        <p class="font-sans text-xs text-[#c4956a] mb-4 leading-relaxed">
          {{ BOOTHS_DATA[selectedStampPreview].story }}
        </p>

        <div
          v-if="gameStore.participant.stamps[selectedStampPreview]"
          class="bg-[#120a05] p-2.5 border border-[#4a8030] rounded-lg mb-4 space-y-0.5 text-xs"
        >
          <div class="text-[#7ec850] font-pixel text-[8.5px]">
            STATUS: RESMI DISTEMPEL
          </div>
          <div class="text-[#f0d060] font-sans text-[11px]">
            Skor: {{ gameStore.participant.stamps[selectedStampPreview]?.score }}/{{ gameStore.participant.stamps[selectedStampPreview]?.totalQuestions }} Benar
          </div>
        </div>
        <div
          v-else
          class="bg-[#120a05] p-2.5 border border-[#5a3a18] rounded-lg mb-4 text-xs font-sans text-[#a08060]"
        >
          Kunjungi pos ini di Lantai {{ BOOTHS_DATA[selectedStampPreview].floorNumber }} untuk menyelesaikan tantangan.
        </div>

        <div class="flex gap-2">
          <RouterLink
            :to="`/play/floor/${BOOTHS_DATA[selectedStampPreview].floorNumber}/spot/${BOOTHS_DATA[selectedStampPreview].id}`"
            class="w-full"
          >
            <button
              type="button"
              @click="() => safeSound(() => soundEngine.playClick?.())"
              class="rpg-btn-primary py-2 px-3 text-xs font-pixel font-bold w-full shadow"
            >
              {{ gameStore.participant.stamps[selectedStampPreview] ? 'Main Ulang' : 'Mainkan' }}
            </button>
          </RouterLink>
          <button
            type="button"
            @click="() => {
              safeSound(() => soundEngine.playClick?.());
              selectedStampPreview = null;
            }"
            class="rpg-btn-wood py-2 px-3 text-xs font-pixel font-bold w-full cursor-pointer shadow"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>

    <!-- Graduation Certificate Modal -->
    <div
      v-if="showCertificate"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0604]/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div class="paspor-certificate-card w-full max-w-lg bg-gradient-to-b from-[#2d1b0e] to-[#170f07] border-4 border-[#f0d060] rounded-2xl p-5 sm:p-6 text-center relative shadow-2xl">
        <div class="border-2 border-[#8b6f4e] rounded-xl p-5 sm:p-6 bg-[#170f07]/90 space-y-3 shadow-inner">
          <div class="flex items-center justify-center gap-2">
            <img
              src="/unu.png"
              alt="UNU Logo"
              width="48"
              height="48"
              class="h-10 w-auto object-contain"
            />
          </div>

          <div class="font-pixel text-[9px] sm:text-[10px] text-[#7ec850] tracking-widest uppercase">
            UNIVERSITAS NAHDLATUL ULAMA YOGYAKARTA
          </div>

          <h2 class="font-pixel text-base sm:text-xl font-bold text-[#f0d060]">
            SERTIFIKAT KELULUSAN ORIENTASI
          </h2>

          <p class="font-sans text-xs text-[#c4956a]">
            Menyatakan bahwa:
          </p>

          <div class="text-base sm:text-lg font-pixel font-bold text-white border-b-2 border-dashed border-[#f0d060] pb-1.5 max-w-sm mx-auto">
            {{ gameStore.participant.name }}
          </div>

          <div class="font-mono text-xs text-[#7ec850]">
            NIM: {{ gameStore.participant.nim }} • {{ gameStore.participant.prodi }}
          </div>

          <p class="font-sans text-xs text-[#f0e6d2] max-w-md mx-auto leading-relaxed">
            Telah berhasil menyelesaikan seluruh rangkaian eksplorasi 6 lantai kampus dan mengumpulkan seluruh 9 stempel orientasi resmi.
          </p>

          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              @click="handlePrint"
              class="rpg-btn-primary py-2 px-5 text-xs font-pixel font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <PhPrinter :size="15" weight="bold" />
              <span>Cetak Sertifikat</span>
            </button>
            <button
              type="button"
              @click="() => {
                safeSound(() => soundEngine.playClick?.());
                showCertificate = false;
              }"
              class="rpg-btn-wood py-2 px-5 text-xs font-pixel font-bold cursor-pointer shadow"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Scanner Modal for Physical Ormawa Stand QR -->
    <QrScannerModal
      :is-open="showOrmawaScanner"
      title="SCAN QR FISIK STAN ORMAWA"
      subtitle="Arahkan kamera ke lembar QR fisik di meja stan UKM (Selasar Lantai 3-5)"
      expected-pattern="UNU-ORMAWA"
      :preset-codes="ormawaPresets"
      @close="showOrmawaScanner = false"
      @scan-success="handleOrmawaScanSuccess"
    />

    <!-- Reset Progress Confirmation Modal -->
    <div
      v-if="showResetModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="max-w-sm w-full p-5 space-y-4 border-2 border-red-500/80 bg-gradient-to-b from-[#221010] to-[#140a0a] text-[#fbf6e9] shadow-[0_0_35px_rgba(239,68,68,0.25)] rounded-xl">
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-lg bg-red-950/90 border border-red-500/60 flex items-center justify-center text-red-400 shrink-0 shadow-md">
            <PhWarning :size="22" weight="bold" />
          </div>
          <div>
            <span class="font-pixel text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-950/80 border border-red-600/50 text-red-300 font-bold">
              Reset Progres
            </span>
            <h3 class="font-sans font-bold text-base text-white mt-1">Reset Semua Stempel?</h3>
          </div>
        </div>
        <p class="font-sans text-xs text-stone-300/90 leading-relaxed">
          Apakah kamu yakin ingin mereset seluruh progres stempel dan perolehan kartu profil? Tindakan ini permanen dan tidak dapat dibatalkan.
        </p>
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-red-900/30">
          <button
            type="button"
            @click="showResetModal = false"
            class="rpg-btn-wood py-2 px-3 text-xs font-pixel cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="executeResetProgress"
            class="rpg-btn-danger py-2 px-4 text-xs font-pixel font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <PhArrowCounterClockwise :size="14" weight="bold" />
            <span>Ya, Reset</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
