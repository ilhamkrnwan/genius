<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { animatePageEnter, staggerFadeUp, stampSlamEffect, bouncePop } from '@/lib/gsap';
import {
  FLOORS_DATA,
  BOOTHS_DATA,
  LEVEL_CONFIG,
  AVATAR_OPTIONS,
  UNU_FACULTIES,
} from '@/data/mockData';
import { ORMAWA_STANDS } from '@/data/ormawaData';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import QrScannerModal from '@/components/common/QrScannerModal.vue';
import LogoutConfirmModal from '@/components/auth/LogoutConfirmModal.vue';
import {
  PhArrowLeft,
  PhHouse,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhIdentificationBadge,
  PhSparkle,
  PhTrophy,
  PhCalendarCheck,
  PhMapTrifold,
  PhStorefront,
  PhGameController,
  PhPencilSimple,
  PhCheckCircle,
  PhGenderMale,
  PhGenderFemale,
  PhSignOut,
  PhLockKey,
  PhPrinter,
  PhArrowCounterClockwise,
  PhMedal,
  PhQrCode,
  PhWarning,
  PhUsersThree,
} from '@phosphor-icons/vue';

const router = useRouter();
const gameStore = useGameStore();

// Navigation Tabs in Profile
type ProfileTab = 'stamps' | 'ormawa' | 'ktm';
const activeTab = ref<ProfileTab>('stamps');

// Audio & Modals
const isMuted = ref(gameStore.soundEnabled === false);
const isLogoutModalOpen = ref(false);
const showCertificate = ref(false);
const selectedStampPreview = ref<string | null>(null);
const showOrmawaScanner = ref(false);
const ormawaScanToast = ref<{ message: string; success: boolean } | null>(null);
const showResetModal = ref(false);

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
  gameStore.soundEnabled = !gameStore.soundEnabled;
  isMuted.value = !gameStore.soundEnabled;
  soundEngine.setMuted(isMuted.value);
  if (!isMuted.value) soundEngine.playClick();
}

function handleBack() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push('/play');
}

function handleGoHome() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push('/');
}

function handlePrint() {
  safeSound(() => soundEngine.playClick?.());
  if (typeof window !== 'undefined') {
    window.print();
  }
}


function handleLogout() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  isLogoutModalOpen.value = true;
}

// Character & Level Stats
const isFemale = computed(() => {
  const g = (gameStore.participant.gender || '').toUpperCase();
  return (
    g === 'FEMALE' ||
    g === 'P' ||
    g === 'PEREMPUAN' ||
    gameStore.participant.avatar === 'character_cewek'
  );
});

const characterFullImage = computed(() => {
  return isFemale.value
    ? '/mascots/character-cewek.avif'
    : '/mascots/character-cowok.avif';
});

const currentLevelStr = computed(() => gameStore.getCurrentLevel());
const levelInfo = computed(() => {
  return LEVEL_CONFIG.find((l) => l.level === currentLevelStr.value) || LEVEL_CONFIG[0];
});
const totalStamps = computed(() => gameStore.getTotalStampsCount());
const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const attendedSessions = computed(() => gameStore.getAttendedSessionsCount());
const isAllCompleted = computed(() => completedFloors.value >= 6 && totalStamps.value >= 9);

const currentXp = computed(() => gameStore.participant.totalXp || 0);
const nextTierXp = computed(() => {
  if (currentXp.value < 200) return 200;
  if (currentXp.value < 500) return 500;
  if (currentXp.value < 1000) return 1000;
  return 1500;
});
const xpProgressPercent = computed(() => {
  return Math.min(100, Math.round((currentXp.value / nextTierXp.value) * 100));
});

// Ormawa Expo Logic
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

// Floors & Booths Helper
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

const handleResetConfirm = () => {
  safeSound(() => soundEngine.playClick?.());
  showResetModal.value = true;
};

const executeResetProgress = () => {
  gameStore.resetProgress();
  showResetModal.value = false;
  safeSound(() => soundEngine.playClick?.());
};

onMounted(() => {
  gameStore.syncWithServer();
  animatePageEnter('.profile-header', { y: -15, duration: 0.4 });
  animatePageEnter('.profile-ktm-card', { y: 20, duration: 0.45, delay: 0.1 });
  staggerFadeUp('.profile-floor-card', 0.04, { delay: 0.2 });
});

watch(selectedStampPreview, (val) => {
  if (val) {
    nextTick(() => {
      stampSlamEffect('.profile-modal-stamp');
    });
  }
});

watch(showCertificate, (val) => {
  if (val) {
    nextTick(() => {
      bouncePop('.profile-certificate-card');
    });
  }
});
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-6 px-3 sm:px-6"
  >
    <!-- Fixed Background Wallpaper -->
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

    <!-- ================================================================= -->
    <!-- TOP HEADER: Navigation, Title & Quick Controls                   -->
    <!-- ================================================================= -->
    <header class="profile-header relative z-20 w-full max-w-4xl mx-auto flex items-center justify-between gap-2 pb-3">
      <!-- Back to Menu Button -->
      <button
        type="button"
        @click="handleBack"
        class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all shadow flex items-center gap-1.5 text-[9px] sm:text-[10px] cursor-pointer active:scale-95"
      >
        <PhArrowLeft :size="14" weight="bold" />
        <span>MENU LOBBY</span>
      </button>

      <!-- Center Title Badge -->
      <div class="px-3 sm:px-5 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e]/80 rounded-full shadow-lg flex items-center gap-2">
        <PhIdentificationBadge :size="16" weight="fill" class="text-[#facc15]" />
        <span class="text-[9px] sm:text-[11px] text-[#facc15] font-bold tracking-wider uppercase">
          PROFIL & STEMPEL PETUALANG
        </span>
      </div>

      <!-- Right Controls: Print, Sound & Home -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="handlePrint"
          title="Cetak Halaman Profil"
          class="p-1.5 sm:p-2 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all shadow cursor-pointer active:scale-95"
        >
          <PhPrinter :size="15" weight="bold" />
        </button>

        <button
          type="button"
          @click="toggleSound"
          class="p-1.5 sm:p-2 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all shadow cursor-pointer active:scale-95"
          :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
        >
          <PhSpeakerHigh v-if="!isMuted" :size="15" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="15" weight="bold" />
        </button>

        <button
          type="button"
          @click="handleGoHome"
          class="p-1.5 sm:p-2 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all shadow cursor-pointer active:scale-95 flex items-center gap-1 text-[9px]"
          title="Ke Beranda Utama"
        >
          <PhHouse :size="15" weight="bold" />
          <span class="hidden sm:inline">BERANDA</span>
        </button>
      </div>
    </header>

    <!-- ================================================================= -->
    <!-- MAIN CONTENT CONTAINER                                            -->
    <!-- ================================================================= -->
    <main class="relative z-20 w-full max-w-4xl mx-auto flex-1 flex flex-col gap-4 my-auto">
      
      <!-- ------------------------------------------------------------- -->
      <!-- SECTION 1: KARTU TANDA MAHASISWA (KTM) DIGITAL RPG            -->
      <!-- ------------------------------------------------------------- -->
      <div class="profile-ktm-card w-full backdrop-blur-md bg-[#23150b]/95 border-2 border-[#8b6f4e] rounded-2xl shadow-2xl overflow-hidden">
        <!-- KTM Header Ribbon -->
        <div class="bg-gradient-to-r from-[#170e07] via-[#2f1c0f] to-[#170e07] border-b border-[#8b6f4e] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <img
              src="/logo/unu.avif"
              alt="Logo UNU"
              class="h-7 sm:h-8 w-auto object-contain brightness-110 drop-shadow"
            />
            <div>
              <div class="text-[9px] sm:text-[10.5px] text-[#facc15] font-bold tracking-wider leading-tight">
                UNIVERSITAS NAHDLATUL ULAMA YOGYAKARTA
              </div>
              <div class="text-[7.5px] sm:text-[8.5px] text-[#a89279] font-sans">
                KTM Digital Orientasi GENIUS New You 2026
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full bg-[#162713] border border-[#22c55e]/70 text-[#86efac] text-[7.5px] sm:text-[8px] font-pixel flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              TERDAFTAR RESMI
            </span>
          </div>
        </div>

        <!-- KTM Body Grid (Left: Character Sprite, Right: Identity Details) -->
        <div class="p-3.5 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
          <!-- Left: Character Avatar & Selector (5 cols) -->
          <div class="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-[#170e08]/90 border border-[#5a3a18] text-center">
            <!-- Level Ribbon Badge -->
            <div
              class="mb-2 px-3 py-0.5 rounded-full text-[8px] sm:text-[8.5px] font-pixel font-bold uppercase tracking-wider border shadow"
              :style="{ color: levelInfo.color, borderColor: levelInfo.color, backgroundColor: 'rgba(0,0,0,0.5)' }"
            >
              ✦ {{ levelInfo.title }} ({{ currentLevelStr }}) ✦
            </div>

            <!-- Full Body Character Sprite Display -->
            <div class="relative w-full h-44 sm:h-52 flex items-center justify-center my-1">
              <img
                :src="characterFullImage"
                :alt="gameStore.participant.name"
                class="h-full w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] filter"
                style="image-rendering: pixelated;"
              />
              <!-- Ground Shadow -->
              <div class="absolute bottom-0 w-24 h-4 bg-black/60 rounded-[100%] blur-[2px] pointer-events-none" />

              <!-- Cute Graduation Cat mascot chilling with student -->
              <div
                class="absolute bottom-1 right-2 sm:right-5 z-10 cursor-pointer group"
                title="Meow! Kucing Sarjana UNU"
                @click="() => gameStore.soundEnabled && soundEngine.playClick()"
              >
                <img
                  src="/cat.png"
                  alt="Kucing Sarjana UNU"
                  class="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md group-hover:scale-125 group-hover:-rotate-6 transition-all duration-300"
                />
              </div>
            </div>

            <!-- Locked Character Badge (Based on Registered Gender) -->
            <div class="w-full mt-2 pt-2 border-t border-[#3a2210] flex items-center justify-center gap-1.5">
              <span class="text-[7.5px] text-[#a89279] uppercase">Karakter:</span>
              <div class="px-2.5 py-0.5 rounded-full text-[8px] font-pixel flex items-center gap-1.5 border bg-[#1e130a] border-[#5a3a18] text-[#fef08a] shadow-inner">
                <PhGenderFemale v-if="isFemale" :size="11" weight="bold" class="text-[#f472b6]" />
                <PhGenderMale v-else :size="11" weight="bold" class="text-[#38bdf8]" />
                <span class="font-bold">{{ isFemale ? 'Mahasiswi (Cewek)' : 'Mahasiswa (Cowok)' }}</span>
                <span class="text-[7px] text-[#86efac] font-sans border-l border-[#5a3a18] pl-1.5 uppercase font-medium">Terkunci Sesuai CSV</span>
              </div>
            </div>
          </div>

          <!-- Right: Identity Details & Academic Data (7 cols) -->
          <div class="md:col-span-7 flex flex-col justify-between gap-3 text-left">
            <div>
              <div class="text-[7.5px] sm:text-[8px] text-[#a89279] uppercase tracking-wider">
                Nama Lengkap Petualang:
              </div>
              <div class="text-base sm:text-xl font-bold text-[#86efac] flex items-center gap-2 flex-wrap">
                <span>{{ gameStore.participant.name || 'Mahasiswa Baru' }}</span>
                <span class="text-[8px] px-2 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] border border-[#0284c7]/50 font-pixel">
                  MABA UNU 2026
                </span>
              </div>
            </div>

            <!-- Detail Grid -->
            <div class="grid grid-cols-2 gap-2 sm:gap-3 text-[8.5px] sm:text-[9.5px]">
              <!-- NIM -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Nomor Induk Mahasiswa:</div>
                <div class="font-mono text-[#fde047] font-bold text-xs sm:text-sm mt-0.5">
                  {{ gameStore.participant.nim || '-' }}
                </div>
              </div>

              <!-- Kelompok Buddy / Regu -->
              <RouterLink
                to="/team"
                @click="() => safeSound(() => soundEngine.playClick?.())"
                class="p-2 rounded-lg bg-[#191009] hover:bg-[#25180e] border border-[#4a2e14] hover:border-[#f0d060] transition-colors group/team block cursor-pointer"
                title="Buka Halaman Regu & Daftar Anggota"
              >
                <div class="text-[7.5px] text-[#a89279] flex items-center justify-between">
                  <span>Kelompok Pendamping:</span>
                  <span class="text-[7px] text-[#86efac] group-hover/team:text-[#fde047] font-pixel">Buka Regu →</span>
                </div>
                <div class="text-[#fbf6e9] group-hover/team:text-[#f0d060] font-bold mt-0.5 truncate flex items-center gap-1.5">
                  <PhUsersThree :size="13" weight="fill" class="text-[#f0d060] shrink-0" />
                  <span>{{ gameStore.participant.groupName || 'Regu Maba' }}</span>
                </div>
              </RouterLink>

              <!-- Fakultas -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Fakultas:</div>
                <div class="text-[#fbf6e9] font-sans font-medium mt-0.5 truncate">
                  {{ gameStore.participant.faculty || '-' }}
                </div>
              </div>

              <!-- Program Studi -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Program Studi:</div>
                <div class="text-[#86efac] font-sans font-semibold mt-0.5 truncate">
                  {{ gameStore.participant.prodi || '-' }}
                </div>
              </div>
            </div>

            <!-- XP Progress Bar -->
            <div class="p-2.5 rounded-lg bg-[#191009] border border-[#4a2e14]">
              <div class="flex items-center justify-between text-[8px] mb-1">
                <span class="text-[#facc15] font-bold flex items-center gap-1">
                  <PhSparkle :size="11" weight="fill" />
                  TOTAL PENGALAMAN: {{ currentXp }} XP
                </span>
                <span class="text-[#a89279] font-sans">
                  Target Tier: {{ nextTierXp }} XP ({{ xpProgressPercent }}%)
                </span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-black/60 border border-[#5a3a18] overflow-hidden p-0.5">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#22c55e] transition-all duration-500 shadow-sm"
                  :style="{ width: `${xpProgressPercent}%` }"
                />
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="flex items-center gap-2 pt-1">
              <div
                class="flex-1 py-2 px-3 rounded-xl bg-[#162713]/80 border border-[#22c55e]/60 text-[#86efac] text-[8.5px] sm:text-[9.5px] font-pixel flex items-center justify-center gap-1.5 shadow"
              >
                <PhCheckCircle :size="13" weight="fill" class="text-[#22c55e]" />
                <span>BIODATA RESMI TERVERIFIKASI</span>
              </div>

              <button
                type="button"
                @click="handleLogout"
                class="py-2 px-3 rounded-xl bg-[#2e1111]/80 hover:bg-[#451616] border border-[#7f1d1d] hover:border-[#ef4444] text-[#fca5a5] text-[8.5px] sm:text-[9.5px] flex items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
                title="Keluar / Ganti Akun Mahasiswa"
              >
                <PhSignOut :size="13" weight="bold" />
                <span class="hidden sm:inline">GANTI AKUN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ------------------------------------------------------------- -->
      <!-- SECTION 2: TAB SWITCHER (STEMPEL POS | ORMAWA EXPO | STATS)  -->
      <!-- ------------------------------------------------------------- -->
      <div class="flex items-center justify-center gap-2 border-b border-[#5a3a18] pb-2 overflow-x-auto">
        <button
          type="button"
          @click="() => { safeSound(() => soundEngine.playClick?.()); activeTab = 'stamps'; }"
          :class="[
            'px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-pixel transition-all cursor-pointer flex items-center gap-1.5 border shrink-0',
            activeTab === 'stamps'
              ? 'bg-[#3b7829] text-white border-[#f0d060] shadow font-bold'
              : 'bg-[#23150b]/80 text-[#a89279] border-[#4a2e14] hover:border-[#8b6f4e] hover:text-[#f0d060]'
          ]"
        >
          <PhIdentificationBadge :size="15" weight="bold" />
          <span>STEMPEL POS LANTAI ({{ totalStamps }}/9)</span>
        </button>

        <button
          type="button"
          @click="() => { safeSound(() => soundEngine.playClick?.()); activeTab = 'ormawa'; }"
          :class="[
            'px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-pixel transition-all cursor-pointer flex items-center gap-1.5 border shrink-0',
            activeTab === 'ormawa'
              ? 'bg-[#3b7829] text-white border-[#f0d060] shadow font-bold'
              : 'bg-[#23150b]/80 text-[#a89279] border-[#4a2e14] hover:border-[#8b6f4e] hover:text-[#f0d060]'
          ]"
        >
          <PhStorefront :size="15" weight="fill" />
          <span>ORMAWA EXPO ({{ gameStore.visitedOrmawaCount }}/10)</span>
        </button>

        <button
          type="button"
          @click="() => { safeSound(() => soundEngine.playClick?.()); activeTab = 'ktm'; }"
          :class="[
            'px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-pixel transition-all cursor-pointer flex items-center gap-1.5 border shrink-0',
            activeTab === 'ktm'
              ? 'bg-[#3b7829] text-white border-[#f0d060] shadow font-bold'
              : 'bg-[#23150b]/80 text-[#a89279] border-[#4a2e14] hover:border-[#8b6f4e] hover:text-[#f0d060]'
          ]"
        >
          <PhCalendarCheck :size="15" weight="bold" />
          <span>RINGKASAN & PORTAL</span>
        </button>
      </div>

      <!-- ------------------------------------------------------------- -->
      <!-- TAB 1: 9 STEMPEL POS ORIENTASI (6 LANTAI)                     -->
      <!-- ------------------------------------------------------------- -->
      <div v-show="activeTab === 'stamps'" class="space-y-3 animate-in fade-in duration-200">
        <!-- Certificate Banner (if completed) -->
        <div
          v-if="isAllCompleted"
          class="bg-gradient-to-r from-[#1b3323] via-[#24452f] to-[#1b3323] border-2 border-[#7ec850] rounded-2xl p-4 shadow-xl text-center space-y-2.5"
        >
          <div class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060] flex items-center justify-center gap-2">
            <PhTrophy :size="20" weight="fill" class="text-[#facc15] animate-bounce" />
            <span>Selamat! Semua Tantangan 6 Lantai Berhasil Dituntaskan!</span>
          </div>
          <p class="font-sans text-xs text-[#86efac] max-w-md mx-auto">
            Kamu telah membuktikan semangat juang petualang sejati. Unduh atau cetak sertifikat kelulusan orientasi resmimu sekarang!
          </p>
          <button
            type="button"
            @click="showCertificate = true"
            class="rpg-btn-primary py-2.5 px-6 text-xs font-pixel font-bold shadow-lg cursor-pointer max-w-sm mx-auto flex items-center justify-center gap-2"
          >
            <PhSparkle :size="16" weight="fill" />
            <span>Buka Sertifikat Kelulusan Resmi</span>
          </button>
        </div>

        <div class="flex items-center justify-between px-1">
          <h3 class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060]">
            9 STEMPEL PETUALANG (6 LANTAI KAMPUS)
          </h3>
          <span class="text-[9px] font-pixel text-[#a08060]">
            KLIK KARTU UNTUK DETAIL POS
          </span>
        </div>

        <!-- Dynamic Floors Grid -->
        <div class="space-y-3">
          <div
            v-for="floor in FLOORS_DATA"
            :key="floor.number"
            :class="[
              'profile-floor-card bg-[#19110a]/95 backdrop-blur-md border rounded-xl p-3 sm:p-4 shadow-md transition-all',
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
                {{ getFloorStampsCount(floor).completed }}/{{ getFloorStampsCount(floor).total }} Stempel
              </span>
            </div>

            <!-- Floor Booths Stamp Grid -->
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
                  'w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow hover:scale-[1.01]',
                  (gameStore.participant.stamps[booth.id] || gameStore.isBoothCompleted(booth.id))
                    ? 'bg-[#1a2e1a] border-[#7ec850] hover:border-[#f0d060]'
                    : 'bg-[#170f07]/80 border-dashed border-[#5a3a18] hover:border-[#8b6f4e] opacity-80'
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

      <!-- ------------------------------------------------------------- -->
      <!-- TAB 2: LEMBAR STEMPEL ORMAWA EXPO                             -->
      <!-- ------------------------------------------------------------- -->
      <div v-show="activeTab === 'ormawa'" class="space-y-3 animate-in fade-in duration-200">
        <div class="bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060] flex items-center gap-2">
                <PhStorefront :size="18" class="text-[#facc15]" />
                <span>LEMBAR STEMPEL ORMAWA EXPO (HARI KE-3)</span>
              </h3>
              <p class="font-sans text-xs text-[#c4956a] mt-1">
                Koleksi Stan Dikunjungi: <strong class="text-white">{{ gameStore.visitedOrmawaCount }}/10 Stan</strong> 
                <span class="text-[#86efac] ml-1.5 font-pixel">(+{{ gameStore.ormawaXpEarned }} XP)</span>
              </p>
            </div>

            <button
              type="button"
              @click="() => {
                safeSound(() => soundEngine.playClick?.());
                showOrmawaScanner = true;
              }"
              class="rpg-btn-primary py-2 px-4 text-xs font-pixel font-bold flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95 shrink-0"
            >
              <PhQrCode :size="16" weight="bold" />
              <span>PINDAI QR MEJA STAN</span>
            </button>
          </div>

          <!-- Scan Feedback Toast -->
          <div
            v-if="ormawaScanToast"
            :class="[
              'p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-sans shadow transition-all',
              ormawaScanToast.success
                ? 'bg-[#142314] border-[#22c55e] text-[#86efac]'
                : 'bg-[#291717] border-[#ef4444] text-[#fca5a5]'
            ]"
          >
            <div class="flex items-center gap-2">
              <PhCheckCircle v-if="ormawaScanToast.success" :size="16" weight="fill" class="text-[#4ade80]" />
              <PhWarning v-else :size="16" weight="fill" class="text-[#f87171]" />
              <span>{{ ormawaScanToast.message }}</span>
            </div>
            <button
              type="button"
              @click="ormawaScanToast = null"
              class="text-gray-400 hover:text-white px-1.5 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <!-- Visited Ormawa Badges Grid -->
          <div v-if="visitedOrmawaStands.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            <div
              v-for="stand in visitedOrmawaStands"
              :key="stand.id"
              class="p-2.5 rounded-xl border border-[#7ec850] bg-gradient-to-b from-[#1c2e1c] to-[#121c12] text-center space-y-1.5 shadow flex flex-col justify-between"
            >
              <div class="w-8 h-8 mx-auto rounded-full bg-[#274b24] border border-[#7ec850] flex items-center justify-center text-[#f0d060] shrink-0 shadow">
                <PhMedal :size="16" weight="fill" />
              </div>
              <div>
                <span class="font-pixel text-[8px] text-[#86efac] block uppercase tracking-wider">
                  {{ stand.badgeTitle }}
                </span>
                <h4 class="font-sans text-xs font-bold text-white line-clamp-1 mt-0.5">
                  {{ stand.shortName }}
                </h4>
                <span class="text-[9px] text-[#a08060] font-mono block">
                  Lantai {{ stand.floor }}
                </span>
              </div>
              <div class="pt-1">
                <span class="inline-flex items-center gap-1 text-[8px] font-pixel text-[#86efac] bg-[#142314] px-1.5 py-0.5 rounded border border-[#22c55e]/40">
                  <PhCheckCircle :size="9" weight="fill" />
                  TERCATAT
                </span>
              </div>
            </div>
          </div>

          <!-- Empty Ormawa State -->
          <div
            v-else
            class="p-6 text-center bg-[#170f07] border border-dashed border-[#5a3a18] rounded-xl space-y-2"
          >
            <PhStorefront :size="28" class="text-[#facc15] mx-auto opacity-60" />
            <p class="text-xs text-amber-200 font-bold">Belum ada lencana stan ormawa yang terkumpul.</p>
            <p class="text-[11px] text-stone-400 max-w-sm mx-auto font-sans leading-relaxed">
              Kunjungi selasar lantai 3, 4, dan 5 saat acara Ormawa Expo dan pindai QR di meja stan UKM untuk menambah lencana dan XP.
            </p>
            <RouterLink to="/ormawa">
              <button
                type="button"
                @click="() => safeSound(() => soundEngine.playClick?.())"
                class="rpg-btn-wood py-1.5 px-3 text-[10px] font-pixel text-[#f0d060] mt-1 cursor-pointer"
              >
                Buka Katalog Lengkap Ormawa
              </button>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- ------------------------------------------------------------- -->
      <!-- TAB 3: RINGKASAN PROGRES & PORTAL CEPAT                       -->
      <!-- ------------------------------------------------------------- -->
      <div v-show="activeTab === 'ktm'" class="space-y-4 animate-in fade-in duration-200">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Card 1: Presensi Buddy -->
          <RouterLink
            to="/presensi"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="p-3.5 rounded-xl bg-[#23150b]/90 hover:bg-[#321e10] border border-[#8b6f4e] hover:border-[#86efac] transition-all flex flex-col justify-between group shadow cursor-pointer"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-[8px] text-[#86efac] font-bold uppercase">PRESENSI BUDDY</span>
              <PhCalendarCheck :size="20" weight="fill" class="text-[#86efac] group-hover:scale-110 transition-transform" />
            </div>
            <div class="text-xl font-bold text-white font-mono">
              {{ attendedSessions }} <span class="text-xs text-[#a89279]">/ 6 Sesi</span>
            </div>
            <div class="text-[8.5px] text-[#a0d870] mt-2 font-sans flex items-center justify-between">
              <span>Validasi Kakak Buddy</span>
              <span class="group-hover:translate-x-1 transition-transform">Cek Presensi →</span>
            </div>
          </RouterLink>

          <!-- Card 2: Ormawa Expo -->
          <RouterLink
            to="/ormawa"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="p-3.5 rounded-xl bg-[#23150b]/90 hover:bg-[#321e10] border border-[#8b6f4e] hover:border-[#c084fc] transition-all flex flex-col justify-between group shadow cursor-pointer"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-[8px] text-[#c084fc] font-bold uppercase">ORMAWA EXPO</span>
              <PhStorefront :size="20" weight="fill" class="text-[#c084fc] group-hover:scale-110 transition-transform" />
            </div>
            <div class="text-xl font-bold text-white font-mono">
              {{ gameStore.visitedOrmawaCount }} <span class="text-xs text-[#a89279]">/ 18 UKM</span>
            </div>
            <div class="text-[8.5px] text-[#d8b4fe] mt-2 font-sans flex items-center justify-between">
              <span>Eksplorasi Ormawa</span>
              <span class="group-hover:translate-x-1 transition-transform">Buka Stand →</span>
            </div>
          </RouterLink>

          <!-- Card 3: Regu & Tim -->
          <RouterLink
            to="/team"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="p-3.5 rounded-xl bg-[#23150b]/90 hover:bg-[#321e10] border border-[#8b6f4e] hover:border-[#38bdf8] transition-all flex flex-col justify-between group shadow cursor-pointer"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-[8px] text-[#38bdf8] font-bold uppercase">REGU & BUDDY</span>
              <PhUsersThree :size="20" weight="fill" class="text-[#38bdf8] group-hover:scale-110 transition-transform" />
            </div>
            <div class="text-lg font-bold text-white font-mono truncate">
              {{ gameStore.participant.groupName || 'Genius 01' }}
            </div>
            <div class="text-[8.5px] text-[#7dd3fc] mt-2 font-sans flex items-center justify-between">
              <span>Kakak Buddy & Maba</span>
              <span class="group-hover:translate-x-1 transition-transform">Lihat Tim →</span>
            </div>
          </RouterLink>
        </div>

        <!-- Reset Progress Area -->
        <div class="p-3.5 rounded-xl bg-[#1a0f0a] border border-[#5a3a18] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div>
            <div class="text-white font-bold">Mulai Ulang Eksplorasi?</div>
            <div class="text-[10px] text-[#a08060] font-sans">Reset seluruh stempel dan XP jika ingin mencoba kembali dari awal.</div>
          </div>
          <button
            type="button"
            @click="handleResetConfirm"
            class="text-[9.5px] font-pixel text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/60 hover:border-red-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PhArrowCounterClockwise :size="12" />
            <span>Reset Progres</span>
          </button>
        </div>
      </div>

      <!-- ------------------------------------------------------------- -->
      <!-- BOTTOM CTA: BACK TO PLAY LOBBY                                -->
      <!-- ------------------------------------------------------------- -->
      <div class="w-full flex items-center justify-center pt-2">
        <button
          type="button"
          @click="handleBack"
          class="w-full max-w-md py-3 px-4 text-xs sm:text-sm font-pixel font-bold uppercase tracking-wider rpg-btn-primary flex items-center justify-center gap-2 shadow-xl cursor-pointer"
        >
          <PhGameController :size="20" weight="bold" />
          <span>KEMBALI KE MENU LOBBY (PLAY)</span>
        </button>
      </div>

      <!-- FOOTER QUICK NAV -->
      <footer class="flex items-center justify-center pt-1 pb-2">
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
            class="hover:text-[#86efac] flex items-center gap-1 transition-colors"
          >
            <PhCalendarCheck :size="12" />
            <span>PRESENSI</span>
          </RouterLink>
          <span>•</span>
          <RouterLink
            to="/team"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#38bdf8] flex items-center gap-1 transition-colors"
          >
            <PhUsersThree :size="12" />
            <span>REGU</span>
          </RouterLink>
        </div>
      </footer>
    </main>

    <!-- ================================================================= -->
    <!-- MODALS SECTION                                                    -->
    <!-- ================================================================= -->

    <!-- Modal 1: Detail Stempel Pos Lantai -->
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
              'profile-modal-stamp w-20 h-20 border-2 rounded-xl flex flex-col items-center justify-center p-2 rotate-[-2deg] shadow-lg',
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
              class="rpg-btn-primary py-2 px-3 text-xs font-pixel font-bold w-full shadow cursor-pointer"
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

    <!-- Modal 2: Graduation Certificate Modal -->
    <div
      v-if="showCertificate"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0604]/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div class="profile-certificate-card w-full max-w-lg bg-gradient-to-b from-[#2d1b0e] to-[#170f07] border-4 border-[#f0d060] rounded-2xl p-5 sm:p-6 text-center relative shadow-2xl">
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
            Telah berhasil menyelesaikan seluruh rangkaian eksplorasi 6 lantai kampus dan mengumpulkan seluruh 9 stempel orientasi resmi GENIUS 2026.
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

    <!-- Modal 3: Scanner Modal for Ormawa Stand QR -->
    <QrScannerModal
      :is-open="showOrmawaScanner"
      title="SCAN QR FISIK STAN ORMAWA"
      subtitle="Arahkan kamera ke lembar QR fisik di meja stan UKM (Selasar Lantai 3-5)"
      expected-pattern="UNU-ORMAWA"
      :preset-codes="ormawaPresets"
      @close="showOrmawaScanner = false"
      @scan-success="handleOrmawaScanSuccess"
    />

    <!-- Modal 4: Logout / Ganti Akun -->
    <LogoutConfirmModal
      :isOpen="isLogoutModalOpen"
      @close="isLogoutModalOpen = false"
      @confirm="() => { isLogoutModalOpen = false; router.push('/'); }"
    />

    <!-- Modal 6: Reset Progress Confirmation -->
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
          Apakah kamu yakin ingin mereset seluruh progres stempel dan eksplorasi? Tindakan ini permanen dan tidak dapat dibatalkan.
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
