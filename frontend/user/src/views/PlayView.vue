<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';
import { FLOORS_DATA, LEVEL_CONFIG, AVATAR_OPTIONS } from '@/data/mockData';
import {
  PhGameController,
  PhMapTrifold,
  PhCalendarCheck,
  PhStorefront,
  PhIdentificationBadge,
  PhTrophy,
  PhInfo,
  PhHouse,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhCaretRight,
  PhSparkle,
  PhStar,
  PhUser,
  PhCheckCircle,
  PhShieldCheck,
  PhPencilSimple,
  PhCompass,
  PhUsersThree,
} from '@phosphor-icons/vue';
import MabaAuthModal from '@/components/auth/MabaAuthModal.vue';

const router = useRouter();
const gameStore = useGameStore();

// Team active session tracking from API
const activeTeamSessionFloor = ref<number | null>(null);

// Full body character image from /mascots folder (clean transparent PNGs)
const characterFullImage = computed(() => {
  const isFemale =
    gameStore.participant.avatar === 'character_cewek' ||
    gameStore.participant.gender === 'perempuan';
  return isFemale
    ? '/mascots/character-cewek.png'
    : '/mascots/character-cowok.png';
});

// Interactive character click & speech bubble
const showCharBubble = ref(false);
const charBubbleMessage = ref('Bismillah, siap jelajahi 6 lantai!');

function handleCharacterClick() {
  if (gameStore.soundEnabled) {
    soundEngine.playCorrect();
  }
  const quotes = [
    `Semangat orientasi, ${gameStore.participant.name || 'Petualang'}!`,
    'Bismillah, siap jelajahi 6 lantai UNU!',
    'Upgrade New You 2026!',
    'Kumpulkan 9 stempel emas PKKMB!',
    'Jangan lupa presensi bersama Kakak Buddy!',
  ];
  charBubbleMessage.value = quotes[Math.floor(Math.random() * quotes.length)];
  showCharBubble.value = true;
  setTimeout(() => {
    showCharBubble.value = false;
  }, 3500);
}

// Splash state: Starts true upon entering the page, transitions to menu
const isSplash = ref(false);
const isMuted = ref(gameStore.soundEnabled === false);

// Profile edit modal state
const isProfileModalOpen = ref(false);

// Active Floor determination
const nextFloor = computed(() => {
  if (activeTeamSessionFloor.value) {
    return activeTeamSessionFloor.value;
  }
  for (const floor of FLOORS_DATA) {
    if (gameStore.getFloorStatus(floor.number) !== 'completed') {
      return floor.number;
    }
  }
  return 1;
});

onMounted(async () => {
  gameStore.syncWithServer();
  if (gameStore.soundEnabled && !isMuted.value) {
    try {
      soundEngine.playMenuMusic?.();
    } catch (_) {}
  }
  try {
    const response = await api.getMyTeamSessions();
    if (response.success && response.data) {
      const activeSession = response.data.find((s: any) => s.status !== 'COMPLETED');
      if (activeSession && activeSession.floorNumber) {
        activeTeamSessionFloor.value = activeSession.floorNumber;
      }
    }
  } catch (_) {}
});

const isCheckedInToday = computed(() => gameStore.isDayCheckedIn(gameStore.activeDay || 1));
const totalStamps = computed(() => gameStore.getTotalStampsCount());
const completedFloorsCount = computed(() => gameStore.getCompletedFloorsCount());
const currentLevelStr = computed(() => gameStore.getCurrentLevel());
const attendedSessionsCount = computed(() => gameStore.getAttendedSessionsCount());

const levelInfo = computed(() => {
  return LEVEL_CONFIG.find((l) => l.level === currentLevelStr.value) || LEVEL_CONFIG[0];
});

const avatarData = computed(() => {
  return (
    AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) ||
    AVATAR_OPTIONS[0]
  );
});

function safeSound(fn: () => void) {
  try {
    if (gameStore.soundEnabled) {
      fn();
    }
  } catch (err) {
    console.warn('[Sound ignored]', err);
  }
}

function toggleSound() {
  gameStore.soundEnabled = !gameStore.soundEnabled;
  isMuted.value = !gameStore.soundEnabled;
  try {
    soundEngine.setMuted(isMuted.value);
    if (!isMuted.value) {
      soundEngine.playClick?.();
    }
  } catch (_) {}
}

function enterMenu() {
  safeSound(() => soundEngine.playSelect?.());
  isSplash.value = false;
}

function showSplash() {
  safeSound(() => soundEngine.playClick?.());
  isSplash.value = true;
}

function startFloorGame() {
  safeSound(() => {
    if (typeof soundEngine.playSuccess === 'function') {
      soundEngine.playSuccess();
    } else if (typeof soundEngine.playCorrect === 'function') {
      soundEngine.playCorrect();
    } else {
      soundEngine.playClick?.();
    }
  });
  router.push(`/play/floor/${nextFloor.value}/intro`);
}

function navigateTo(path: string) {
  safeSound(() => soundEngine.playClick?.());
  router.push(path);
}

function openEditProfile() {
  safeSound(() => soundEngine.playClick?.());
  isProfileModalOpen.value = true;
}

</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] h-[100dvh] max-h-[100dvh] overflow-hidden select-none font-pixel flex flex-col justify-between"
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
    <!-- Dark Vignette / Atmospheric Gradient Overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none z-0" />

    <!-- ================================================================= -->
    <!-- TOP HEADER: Clean Institutional Badge (Landing Page Style)        -->
    <!-- ================================================================= -->
    <header class="relative z-30 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-2.5 sm:pt-4 pb-1 flex items-center justify-between shrink-0">
      <!-- Left: Institutional Brand Pill (Same as Landing Page) -->
      <RouterLink
        to="/"
        class="backdrop-blur-md bg-[#140e0a]/90 border border-[#f0d060]/50 hover:border-[#f0d060] rounded-full px-2.5 sm:px-4 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-3 shadow-lg shrink-0 transition-transform active:scale-95 group cursor-pointer"
        title="Kembali ke Beranda"
      >
        <img
          src="/unu.png"
          alt="Logo UNU Yogyakarta"
          class="h-6 sm:h-7 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform"
        />
        <div class="hidden sm:block w-[1px] h-4 sm:h-5 bg-[#f0d060]/40" />
        <div class="hidden sm:flex flex-col text-left leading-none">
          <span class="font-pixel text-[8.5px] sm:text-[9.5px] text-[#f0d060] font-bold tracking-wider">
            UNU YOGYAKARTA
          </span>
          <span class="font-sans text-[7.5px] sm:text-[8.5px] text-[#a0d870] font-medium pt-0.5">
            GENIUS 2026
          </span>
        </div>
      </RouterLink>

      <!-- Center: Contextual Badge (Hidden on mobile) -->
      <div class="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c120a]/80 border border-[#5a3a18] text-[#f0d060] text-[8.5px] font-pixel shadow">
        <PhGameController :size="13" weight="fill" class="text-[#7ec850]" />
        <span>LOBBY PETUALANGAN KAMPUS</span>
      </div>

      <!-- Right Controls: Profile Shortcut, Sound Toggle, Home Button -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Quick Profile & KTM Shortcut -->
        <button
          type="button"
          @click="navigateTo('/profile')"
          class="p-1 sm:p-1.5 bg-[#2d1b0e]/90 border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg text-[#f0d060] transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center w-8 h-8 sm:w-8.5 sm:h-8.5 shrink-0"
          :title="`Buka Profil & KTM: ${gameStore.participant.name || 'Mahasiswa Baru'}`"
        >
          <div class="w-full h-full rounded border border-[#f0d060]/70 overflow-hidden bg-black/40">
            <img
              :src="avatarData.avatarImage"
              :alt="gameStore.participant.name || 'Avatar'"
              class="w-full h-full object-cover"
            />
          </div>
        </button>

        <!-- Audio Toggle Button -->
        <button
          type="button"
          @click="toggleSound"
          class="p-1.5 sm:p-2 rounded-lg bg-[#2a1b10]/90 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all shadow cursor-pointer active:scale-95"
          :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
        >
          <PhSpeakerHigh v-if="!isMuted" :size="15" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="15" weight="bold" />
        </button>

        <!-- Home Button -->
        <button
          type="button"
          @click="navigateTo('/')"
          class="p-1.5 sm:p-2 rounded-lg bg-[#2a1b10]/90 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all shadow cursor-pointer active:scale-95 flex items-center gap-1 text-[9px]"
          title="Kembali ke Beranda"
        >
          <PhHouse :size="15" weight="bold" />
          <span class="hidden lg:inline font-pixel">BERANDA</span>
        </button>
      </div>
    </header>

    <!-- ================================================================= -->
    <!-- MAIN INTERACTIVE STAGE                                            -->
    <!-- ================================================================= -->
    <main class="relative z-20 flex-1 flex flex-col items-center justify-center px-3 sm:px-4 w-full max-w-5xl mx-auto my-auto overflow-y-auto no-scrollbar py-2">
      <!-- ------------------------------------------------------------- -->
      <!-- VIEW A: SPLASH SCREEN STATE (Optional banner view)            -->
      <!-- ------------------------------------------------------------- -->
      <Transition
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 scale-90"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isSplash"
          class="flex flex-col items-center justify-center text-center cursor-pointer max-w-xl w-full my-auto"
          @click="enterMenu"
        >
          <!-- Big GENIUS 3D Title Logo -->
          <div class="relative group transition-transform duration-300 hover:scale-105">
            <img
              src="/logo/genius.png"
              alt="GENIUS UNU JOGJA"
              class="w-72 sm:w-96 md:w-[420px] max-w-full h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] animate-title-float"
            />
          </div>

          <!-- Motto Banner Pill -->
          <div
            class="mt-2 sm:mt-3 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border-2 border-[#1b120a] bg-gradient-to-r from-[#eab308] via-[#facc15] to-[#ca8a04] shadow-[0_6px_16px_rgba(0,0,0,0.6)] text-[#1b120a] font-bold text-[10px] sm:text-xs md:text-sm tracking-wide transition-transform hover:scale-105"
            style="text-shadow: 0 1px 0 rgba(255,255,255,0.4);"
          >
            "Upgrade New U: Lead, Impact, and Grow Together!"
          </div>

          <!-- Quick Enter Button -->
          <button
            type="button"
            @click.stop="enterMenu"
            class="mt-4 px-6 py-2.5 rounded-xl bg-[#38761d] hover:bg-[#2e6217] border-2 border-[#f0d060] text-white text-[11px] sm:text-xs font-bold tracking-wider shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <PhGameController :size="18" weight="bold" />
            <span>BUKA MENU UTAMA</span>
            <PhCaretRight :size="16" weight="bold" />
          </button>
        </div>
      </Transition>

      <!-- ------------------------------------------------------------- -->
      <!-- VIEW B: MENU STATE (Interactive RPG Menu Hub)                 -->
      <!-- ------------------------------------------------------------- -->
      <Transition
        enter-active-class="transition duration-400 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="!isSplash"
          class="flex flex-col lg:flex-row items-center justify-center gap-5 sm:gap-7 w-full my-auto"
        >
          <!-- Desktop Standing Character Companion (Side stage on lg screens) -->
          <div
            class="hidden lg:flex flex-col items-center cursor-pointer group shrink-0 relative select-none"
            @click="handleCharacterClick"
            :title="`${gameStore.participant.name || 'Petualang'} (Klik untuk bicara)`"
          >
            <!-- Speech Bubble -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2 scale-90"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1 scale-90"
            >
              <div
                v-if="showCharBubble"
                class="absolute -top-12 bg-[#fbf6e9] border-2 border-[#5a3a18] text-[#2d1b0e] text-[9px] font-pixel px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-30"
              >
                {{ charBubbleMessage }}
                <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#5a3a18]" />
              </div>
            </Transition>

            <!-- Nametag Badge -->
            <div class="mb-2 px-2.5 py-0.5 rounded-full bg-[#1c120a]/90 border border-[#f0d060]/70 text-[#86efac] text-[8.5px] font-pixel shadow flex items-center gap-1.5 group-hover:border-white transition-colors">
              <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span>{{ gameStore.participant.name || 'Mahasiswa Baru' }}</span>
            </div>

            <!-- Full Body Character Sprite -->
            <div class="relative flex items-center justify-center">
              <img
                :src="characterFullImage"
                :alt="gameStore.participant.name || 'Karakter'"
                class="h-60 xl:h-68 w-auto object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] select-none pointer-events-none group-hover:scale-105 transition-transform"
                style="image-rendering: pixelated;"
              />
              <!-- Foot Ground Shadow -->
              <div class="absolute -bottom-2 w-28 h-5 bg-black/60 rounded-[100%] blur-[2px] pointer-events-none" />
            </div>
          </div>

          <!-- The Central RPG Menu Hub Card -->
          <div
            class="w-full max-w-xl bg-[#19120c]/95 backdrop-blur-xl border-2 border-[#8b6f4e] rounded-2xl p-3 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex flex-col items-center text-center shrink-0"
          >
            <!-- 1. Player RPG Status HUD Header (No Truncation & Spaced Out) -->
            <div class="flex items-center justify-between w-full border-b border-[#4d3319] pb-2.5 mb-2.5 gap-2 sm:gap-3">
              <div
                @click="navigateTo('/profile')"
                class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group/user text-left"
                title="Buka Halaman Profil & KTM Digital"
              >
                <!-- Avatar Frame -->
                <div
                  class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#120a05] border-2 border-[#f0d060] group-hover/user:border-white overflow-hidden shrink-0 relative transition-all shadow-md"
                >
                  <img
                    :src="avatarData.avatarImage"
                    :alt="gameStore.participant.name || 'Petualang'"
                    class="w-full h-full object-cover object-top"
                  />
                </div>

                <!-- Character Identity: Name, Level, NIM, Prodi -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[#86efac] text-xs sm:text-sm font-bold block group-hover/user:text-[#fde047] transition-colors leading-tight">
                      {{ gameStore.participant.name || 'Mahasiswa Baru' }}
                    </span>
                    <span
                      class="font-pixel text-[7.5px] sm:text-[8px] px-1.5 py-0.5 rounded border uppercase shrink-0"
                      :style="{ color: levelInfo.color, borderColor: levelInfo.color }"
                    >
                      {{ levelInfo.title }}
                    </span>
                  </div>
                  <div class="text-[9px] sm:text-[10px] text-[#c4956a] font-sans leading-tight mt-0.5">
                    NIM: <span class="text-[#fde047] font-mono font-semibold">{{ gameStore.participant.nim || '2026' }}</span> • {{ gameStore.participant.prodi || 'UNU Yogyakarta' }}
                  </div>
                  <div class="flex items-center gap-1 text-[7.5px] sm:text-[8px] text-[#86efac] font-pixel mt-0.5 group-hover/user:text-[#fde047] transition-colors">
                    <span>Lihat KTM Digital</span>
                    <PhCaretRight :size="10" weight="bold" />
                  </div>
                </div>
              </div>

              <!-- Total XP & Banner Toggle -->
              <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                <div class="bg-[#24170d] border border-[#d97706] px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <PhSparkle :size="12" weight="fill" class="text-[#facc15]" />
                  <span class="font-pixel text-[9.5px] sm:text-[11px] text-[#facc15] font-bold">+{{ gameStore.participant.totalXp }} XP</span>
                </div>

                <button
                  type="button"
                  @click="showSplash"
                  class="text-[7.5px] sm:text-[8.5px] font-pixel text-[#c4956a] hover:text-[#f0d060] border border-[#5a3a18] hover:border-[#f0d060] px-2 py-0.5 sm:py-1 rounded-lg bg-[#24170d] cursor-pointer transition-all shadow active:scale-95"
                  title="Lihat Banner Acara"
                >
                  BANNER
                </button>
              </div>
            </div>

            <!-- 2. PRIMARY ACTION CARD: Mulai / Lanjutkan Misi Lantai -->
            <button
              type="button"
              @click="startFloorGame"
              class="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 mb-2.5 rounded-xl bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] hover:brightness-110 border-2 border-[#fef08a] text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)] flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 group"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-lg bg-black/30 border border-[#fef08a]/60 flex items-center justify-center shrink-0">
                  <PhGameController :size="22" weight="fill" class="text-[#fef08a] group-hover:scale-110 transition-transform" />
                </div>
                <div class="text-left min-w-0">
                  <span class="text-[11px] sm:text-xs font-bold block leading-tight tracking-wider text-white">
                    {{ totalStamps > 0 ? `LANJUTKAN MISI LANTAI ${nextFloor}` : `MULAI MISI LANTAI 1` }}
                  </span>
                  <span class="text-[8.5px] sm:text-[9px] text-[#bbf7d0] font-sans block truncate">
                    Progres: {{ totalStamps }}/9 Stempel • {{ completedFloorsCount }}/6 Lantai Tuntas
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1 text-[9px] font-pixel text-[#fef08a] bg-black/40 px-2.5 py-1 rounded-lg border border-[#fef08a]/40 group-hover:bg-[#fef08a] group-hover:text-[#1b120a] transition-colors shrink-0">
                <span>MASUK</span>
                <PhCaretRight :size="14" weight="bold" />
              </div>
            </button>

            <!-- Regu / Tim Banner Strip -->
            <div 
              @click="navigateTo('/team')"
              class="w-full mb-2.5 px-3 py-2 rounded-xl bg-[#22150b]/90 border border-[#8b6f4e] hover:border-[#f0d060] flex items-center justify-between cursor-pointer transition-all shadow-md group active:scale-98"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-[#38761d]/40 border border-[#4ade80]/60 flex items-center justify-center text-[#86efac] shrink-0">
                  <PhUsersThree :size="18" weight="bold" />
                </div>
                <div class="text-left min-w-0">
                  <div class="text-[7.5px] text-[#a89279] uppercase font-pixel tracking-wider">Regu Kelompok Kamu:</div>
                  <div class="text-[11px] font-bold text-[#facc15] font-pixel group-hover:text-white transition-colors truncate">
                    {{ gameStore.participant.groupName || 'Genius 01' }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 text-[8.5px] font-pixel text-[#86efac] group-hover:text-[#fde047] shrink-0 bg-black/40 px-2 py-1 rounded-lg border border-[#86efac]/30">
                <span>Lihat</span>
                <PhCaretRight :size="10" weight="bold" />
              </div>
            </div>

            <!-- 3. GRID MENU: 6 Portal Fitur Gamifikasi PKKMB -->
            <div class="grid grid-cols-3 gap-2 sm:gap-2.5 w-full">
              <!-- 1. Peta Kampus -->
              <button
                type="button"
                @click="navigateTo('/dashboard')"
                class="p-2 sm:p-2.5 rounded-xl bg-[#23170e] hover:bg-[#322013] border border-[#5a3a18] hover:border-[#60a5fa] transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow active:scale-95"
              >
                <PhMapTrifold :size="22" weight="fill" class="text-[#60a5fa] group-hover:scale-110 transition-transform mb-1" />
                <span class="text-[8.5px] sm:text-[9.5px] text-[#e2e8f0] font-bold leading-tight block">
                  PETA KAMPUS
                </span>
                <span class="text-[7.5px] text-[#94a3b8] block mt-0.5 font-sans">6 Lantai</span>
              </button>

              <!-- 2. Presensi (Di-absen Buddy) -->
              <button
                type="button"
                @click="navigateTo('/presensi')"
                class="p-2 sm:p-2.5 rounded-xl bg-[#23170e] hover:bg-[#322013] border transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow active:scale-95 relative"
                :class="attendedSessionsCount > 0 ? 'border-[#22c55e]/70 bg-[#142312]' : 'border-[#5a3a18] hover:border-[#f59e0b]'"
              >
                <PhCalendarCheck
                  :size="22"
                  weight="fill"
                  :class="attendedSessionsCount > 0 ? 'text-[#86efac]' : 'text-[#f59e0b] group-hover:scale-110 transition-transform mb-1'"
                />
                <span class="text-[8.5px] sm:text-[9.5px] text-[#e2e8f0] font-bold leading-tight block">
                  PRESENSI
                </span>
                <span class="text-[7.5px] block mt-0.5 font-sans" :class="attendedSessionsCount > 0 ? 'text-[#86efac]' : 'text-[#d4b08c]'">
                  {{ attendedSessionsCount > 0 ? `${attendedSessionsCount}/6 Sesi` : 'Di-absen Buddy' }}
                </span>
              </button>

              <!-- 3. Ormawa Expo -->
              <button
                type="button"
                @click="navigateTo('/ormawa')"
                class="p-2 sm:p-2.5 rounded-xl bg-[#23170e] hover:bg-[#322013] border border-[#5a3a18] hover:border-[#c084fc] transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow active:scale-95"
              >
                <PhStorefront :size="22" weight="fill" class="text-[#c084fc] group-hover:scale-110 transition-transform mb-1" />
                <span class="text-[8.5px] sm:text-[9.5px] text-[#e2e8f0] font-bold leading-tight block">
                  ORMAWA EXPO
                </span>
                <span class="text-[7.5px] text-[#94a3b8] block mt-0.5 font-sans">Stan UKM</span>
              </button>

              <!-- 4. Profil Digital & Stempel -->
              <button
                type="button"
                @click="navigateTo('/profile')"
                class="p-2 sm:p-2.5 rounded-xl bg-[#23170e] hover:bg-[#322013] border border-[#5a3a18] hover:border-[#facc15] transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow active:scale-95"
              >
                <PhIdentificationBadge :size="22" weight="bold" class="text-[#facc15] group-hover:scale-110 transition-transform mb-1" />
                <span class="text-[8.5px] sm:text-[9.5px] text-[#e2e8f0] font-bold leading-tight block">
                  PROFIL DIGITAL
                </span>
                <span class="text-[7.5px] text-[#94a3b8] block mt-0.5 font-sans">{{ totalStamps }}/9 Stempel</span>
              </button>

              <!-- 5. Leaderboard XP -->
              <button
                type="button"
                @click="navigateTo('/leaderboard')"
                class="p-2 sm:p-2.5 rounded-xl bg-[#23170e] hover:bg-[#322013] border border-[#5a3a18] hover:border-[#facc15] transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow active:scale-95"
              >
                <PhTrophy :size="22" weight="fill" class="text-[#facc15] group-hover:scale-110 transition-transform mb-1" />
                <span class="text-[8.5px] sm:text-[9.5px] text-[#e2e8f0] font-bold leading-tight block">
                  LEADERBOARD
                </span>
                <span class="text-[7.5px] text-[#94a3b8] block mt-0.5 font-sans">Peringkat XP</span>
              </button>

              <!-- 6. Panduan & Bantuan -->
              <button
                type="button"
                @click="navigateTo('/bantuan')"
                class="p-2 sm:p-2.5 rounded-xl bg-[#23170e] hover:bg-[#322013] border border-[#5a3a18] hover:border-[#86efac] transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow active:scale-95"
              >
                <PhInfo :size="22" weight="bold" class="text-[#86efac] group-hover:scale-110 transition-transform mb-1" />
                <span class="text-[8.5px] sm:text-[9.5px] text-[#e2e8f0] font-bold leading-tight block">
                  PANDUAN
                </span>
                <span class="text-[7.5px] text-[#94a3b8] block mt-0.5 font-sans">Aturan Main</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <!-- ================================================================= -->
    <!-- CENTER WOODEN SIGNPOST OVERLAY ("UNU Jogja 2026")                 -->
    <!-- ================================================================= -->
    <div class="relative z-20 pb-2 flex flex-col items-center justify-center pointer-events-none shrink-0" aria-hidden="true">
      <div
        class="px-3 py-0.5 bg-[#8b5a2b] border border-[#4a2e14] rounded-md shadow-md text-[#fbf6e9] text-[8px] sm:text-[9px] font-pixel font-bold tracking-wider uppercase"
        style="text-shadow: 1px 1px 0 #3a1d06;"
      >
        UNU Jogja 2026
      </div>
    </div>


    <!-- Modal Profil / Karakter Setup -->
    <MabaAuthModal
      :isOpen="isProfileModalOpen"
      initialStep="profile"
      @close="isProfileModalOpen = false"
      @complete="isProfileModalOpen = false"
    />
  </div>
</template>

<style scoped>
/* ========================================================================= */
/* PLAYER CHARACTER STATIC SPRITE & GROUND SHADOW STYLING                   */
/* ========================================================================= */
.player-char-sprite {
  transform-origin: bottom center;
}

.player-char-shadow {
  transform-origin: center;
}
</style>
