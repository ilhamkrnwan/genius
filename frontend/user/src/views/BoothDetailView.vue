<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import {
  PhArrowLeft,
  PhCheckCircle,
  PhBookOpen,
  PhPause,
} from '@phosphor-icons/vue';
import { BOOTHS_DATA, FLOORS_DATA, AVATAR_OPTIONS } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';
import { api } from '@/lib/api';
import { normalizePlayableMission, normalizePlayableSessionMission } from '@/lib/game-adapter';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import CelebrationModal from '@/components/ui/CelebrationModal.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import Navbar from '@/components/layout/Navbar.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import MiniGameContainer from '@/components/minigames/MiniGameContainer.vue';
import { soundEngine } from '@/lib/sound';
import { PlayerLevel, StampRecord } from '@/types/game';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const gameSessionStore = useGameSessionStore();

const boothId = computed(() => (route.params.id as string) || '');
const backendBooth = ref<ReturnType<typeof normalizePlayableMission> | null>(null);
const isBackendLoading = ref(false);
const backendError = ref<string | null>(null);
const hasBackendAuth = computed(() => typeof window !== 'undefined' && Boolean(localStorage.getItem('genius_user_token')));
const booth = computed(() => backendBooth.value || BOOTHS_DATA[boothId.value] || null);
const serverSessionId = computed(() => hasBackendAuth.value ? gameSessionStore.session?.id : undefined);
const isPractice = computed(() => gameSessionStore.session?.metadata?.isPractice === true);
const practiceFinished = ref(false);
const floor = computed(
  () => FLOORS_DATA.find((f) => f.number === (booth.value ? booth.value.floorNumber : 1)) || FLOORS_DATA[0]
);

const isAlreadyCompleted = computed(() => gameStore.isBoothCompleted(boothId.value));
const selectedAvatarObj = computed(
  () => AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) || AVATAR_OPTIONS[0]
);

const isSpot1 = computed(() => booth.value && floor.value ? booth.value.id === floor.value.boothIds[0] || booth.value.code === `POS-L${floor.value.number}-A` : true);
const nextSpotId = computed(() => isSpot1.value && floor.value ? floor.value.boothIds[1] : null);

const teamId = computed(() => {
  const profile = typeof window !== 'undefined' ? localStorage.getItem('genius_user_profile') : null;
  const parsed = profile ? JSON.parse(profile) : null;
  return parsed?.teamId || parsed?.groupId || gameStore.participant.groupId || '';
});

// Server-Authoritative Timer & Waiting Room States
const nowTick = ref(Date.now());
let tickTimer: any = null;
let sessionPollingTimer: any = null;

const isWaitingForBuddy = computed(() => {
  if (!hasBackendAuth.value) return false;
  return !isBackendLoading.value && !backendError.value && gameSessionStore.session?.status === 'READY';
});

const isSessionActive = computed(() => {
  if (!hasBackendAuth.value) return true;
  return gameSessionStore.session?.status === 'ACTIVE' || gameSessionStore.status === 'active';
});

const serverRemainingSeconds = computed(() => {
  if (!gameSessionStore.session?.serverStartAt) return 0;
  const startMs = new Date(gameSessionStore.session.serverStartAt).getTime();
  const limitMs = Number(gameSessionStore.session.timeLimit || 900) * 1000;
  const elapsed = nowTick.value - startMs;
  return Math.max(0, Math.floor((limitMs - elapsed) / 1000));
});

const formattedServerTimer = computed(() => {
  const s = serverRemainingSeconds.value;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
});

async function initializeBackendMission() {
  if (!boothId.value || !gameStore.isLoggedIn || !hasBackendAuth.value) return;

  isBackendLoading.value = true;
  backendError.value = null;
  backendBooth.value = null;
  practiceFinished.value = false;
  const missionResponse = await gameSessionStore.loadMissionForPlay(boothId.value);

  if (!missionResponse || missionResponse.status !== 'ACTIVE' || !missionResponse.game) {
    backendError.value = gameSessionStore.error?.message || 'Misi backend belum tersedia.';
    isBackendLoading.value = false;
    return;
  }

  missionResponseRef.value = missionResponse;
  backendBooth.value = normalizePlayableMission(missionResponse);

  if (!teamId.value) {
    backendError.value = 'Akun belum terhubung ke team. Gunakan booth lokal atau hubungi panitia.';
    isBackendLoading.value = false;
    return;
  }

  const restored = await gameSessionStore.restoreSession(missionResponse.id);
  const activeRestored = restored || await gameSessionStore.restoreActiveSessionForMission(missionResponse.id);
  const created = activeRestored || await gameSessionStore.createSession(missionResponse.id, teamId.value);
  if (!created) {
    backendError.value = gameSessionStore.error?.message || 'Sesi game gagal dibuat.';
    isBackendLoading.value = false;
    return;
  }

  backendBooth.value = normalizePlayableSessionMission(missionResponse, created);

  // Note: Sesi pos harus diaktifkan oleh Kakak Buddy (Gatekeeper rule).
  // Mahasiswa baru TIDAK boleh men-start sesi mandiri.

  isBackendLoading.value = false;
}

onMounted(() => {
  void initializeBackendMission();

  tickTimer = setInterval(() => {
    nowTick.value = Date.now();
    if (isSessionActive.value && serverRemainingSeconds.value === 0 && gameSessionStore.session?.id) {
      void gameSessionStore.refreshSession();
    }
  }, 1000);

  sessionPollingTimer = setInterval(async () => {
    if (!isBackendLoading.value && ['READY', 'ACTIVE', 'PAUSED'].includes(gameSessionStore.session?.status || '') && gameSessionStore.session?.id) {
      const refreshed = await gameSessionStore.refreshSession();
      if (refreshed && refreshed.status === 'ACTIVE' && backendBooth.value && missionResponseRef.value) {
        backendBooth.value = normalizePlayableSessionMission(missionResponseRef.value, refreshed);
      }
    }
  }, 2500);

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }
  requestUserWakeLock();
});

const missionResponseRef = ref<any>(null);
watch(boothId, () => { void initializeBackendMission(); });
watch(() => gameSessionStore.session, (session) => {
  if (session?.status === 'ACTIVE' && missionResponseRef.value?.id === session.missionId) {
    backendBooth.value = normalizePlayableSessionMission(missionResponseRef.value, session);
    requestUserWakeLock();
  } else if (session?.status === 'PAUSED' || session?.status === 'EXPIRED') {
    releaseUserWakeLock();
  }
});

// Screen Wake Lock API & Anti-Refresh
let userWakeLock: any = null;

async function requestUserWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
  try {
    userWakeLock = await (navigator as any).wakeLock.request('screen');
  } catch (_) {}
}

function releaseUserWakeLock() {
  if (userWakeLock) {
    try {
      userWakeLock.release();
    } catch (_) {}
    userWakeLock = null;
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isSessionActive.value) {
    e.preventDefault();
    e.returnValue = 'Kuis pos sedang berlangsung. Meninggalkan halaman dapat membatalkan progres Anda.';
  }
};

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (sessionPollingTimer) clearInterval(sessionPollingTimer);
  releaseUserWakeLock();
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
});

const showStoryModal = ref(!isAlreadyCompleted.value);
const showCelebration = ref(false);
const celebrationDetails = ref<{
  stampRecord: StampRecord | null;
  isFloorCompleted: boolean;
  floorNumber: number;
  isLevelUp: boolean;
  newLevel: PlayerLevel;
}>({
  stampRecord: null,
  isFloorCompleted: false,
  floorNumber: booth.value ? booth.value.floorNumber : 1,
  isLevelUp: false,
  newLevel: 'New You',
});

const handleMiniGameComplete = async (score: number, totalQuestions: number) => {
  if (isPractice.value) {
    if (gameSessionStore.status === 'active' && !await gameSessionStore.completeSession()) return;
    practiceFinished.value = true;
    return;
  }
  if (!booth.value) return;
  if (gameStore.soundEnabled) soundEngine.playCorrect();

  const hasServerSession = Boolean(serverSessionId.value && gameSessionStore.status === 'active');
  const result = gameStore.completeBooth(booth.value.id, score, totalQuestions, hasServerSession);

  // Sync complete server session if session is active
  if (hasServerSession) {
    gameSessionStore.completeSession([{
      participantId: gameStore.participant.id || gameStore.participant.nim,
      score,
      totalQuestions,
      action: 'COMPLETE',
    }]).then((res) => {
      if (res) {
        console.log('[BoothDetailView] Server session completed:', res);
        gameStore.syncWithServer();
      }
    }).catch((err) => {
      console.warn('[BoothDetailView] Error completing server session:', err);
    });
  }

  const stampRecord: StampRecord = {
    boothId: booth.value.id,
    boothName: booth.value.name,
    floorNumber: booth.value.floorNumber,
    stampTitle: booth.value.stampTitle,
    stampIcon: booth.value.stampIcon,
    stampColor: booth.value.stampColor,
    earnedAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    score,
    totalQuestions,
  };

  celebrationDetails.value = {
    stampRecord,
    isFloorCompleted: result.isFloorCompleted,
    floorNumber: booth.value.floorNumber,
    isLevelUp: result.isLevelUp,
    newLevel: result.newLevel,
  };

  showCelebration.value = true;
};

const handleNextStep = () => {
  showCelebration.value = false;
  if (nextSpotId.value) {
    router.push(`/play/floor/${floor.value.number}/spot/${nextSpotId.value}`);
  } else {
    router.push(`/play/floor/${floor.value.number}/complete`);
  }
};
</script>

<template>
  <div v-if="booth" class="relative min-h-[100dvh] flex flex-col text-[#f0e0c0] overflow-y-auto">
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
    <Navbar class="relative z-10" />

    <main class="relative z-10 max-w-2xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex-1 flex flex-col justify-between w-full gap-1.5 sm:gap-2">
      <!-- Top Spot Status Bar -->
      <div class="bg-[#1f140a] border-2 border-[#5a3a18] rounded-xl p-2 sm:p-2.5 shadow-md shrink-0 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <RouterLink
              :to="`/play/floor/${booth.floorNumber}/intro`"
              @click="() => gameStore.soundEnabled && soundEngine.playClick()"
              class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-pixel text-[#c4956a] hover:text-[#f0d060] transition-colors shrink-0 bg-[#170f07] px-2 py-1 rounded border border-[#5a3a18]"
            >
              <PhArrowLeft :size="12" weight="bold" />
              <span>LT {{ booth.floorNumber }}</span>
            </RouterLink>

            <span class="font-pixel text-[8px] sm:text-[9px] text-[#f0d060] bg-[#281c12] px-1.5 py-1 rounded border border-[#5a3a18]">
              {{ booth.code }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              @click="() => {
                if (gameStore.soundEnabled) soundEngine.playSelect();
                showStoryModal = true;
              }"
              class="py-1 px-2.5 text-[8px] sm:text-[9px] font-pixel text-[#f0d060] bg-[#2d1b0e] hover:bg-[#3d2b1e] border border-[#8b6f4e] rounded-md flex items-center gap-1 cursor-pointer shadow"
            >
              <PhBookOpen :size="12" weight="fill" />
              <span>Materi</span>
            </button>

            <div v-if="isAlreadyCompleted" class="flex items-center gap-1 bg-[#14230f] border border-[#7ec850] rounded-md px-1.5 py-0.5">
              <PhCheckCircle :size="12" weight="fill" class="text-[#7ec850]" />
              <span class="font-pixel text-[8px] text-[#7ec850]">Selesai</span>
            </div>
            <PixelBadge v-else variant="gold" size="sm">
              {{ isPractice ? 'LATIHAN - TANPA XP' : 'Max 100 XP' }}
            </PixelBadge>
          </div>
        </div>

        <!-- Spot Title Line with Stamp Icon -->
        <div class="flex items-center gap-2 border-t border-[#3d2b1e] pt-1.5">
          <div class="w-6 h-6 bg-[#170f07] border border-[#f0d060] rounded-md flex items-center justify-center shrink-0">
            <StampIcon :name="booth.stampIcon" :size="14" class="text-[#f0d060]" />
          </div>
          <h1 class="font-pixel text-[9px] sm:text-[11px] font-bold text-white leading-normal break-words flex-1">
            {{ booth.name }}
          </h1>
        </div>
      </div>

      <!-- Server-Authoritative Timer Banner (When Active) -->
      <div
        v-if="hasBackendAuth && isSessionActive && gameSessionStore.session?.serverStartAt"
        class="mb-2 px-3 py-1.5 bg-[#170f07] border-2 border-[#f0d060] rounded-lg flex items-center justify-between shadow"
      >
        <div class="flex items-center gap-1.5 text-[8.5px] sm:text-[9px] font-pixel text-[#86efac]">
          <span class="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
          <span>SESI POS AKTIF</span>
        </div>
        <div class="flex items-center gap-1.5 font-mono text-[10px]">
          <span class="text-[#c4956a]">SISA WAKTU SERVER:</span>
          <span
            :class="[
              'font-pixel text-xs sm:text-sm font-bold',
              serverRemainingSeconds <= 120 ? 'text-red-400 animate-pulse' : 'text-[#fef08a]'
            ]"
          >
            ⏱️ {{ formattedServerTimer }}
          </span>
        </div>
      </div>

      <!-- Dynamic Mini-Game Arena / Waiting Room -->
      <div class="flex-1 sdv-card p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden shadow-lg">
        <!-- WAITING ROOM (Menunggu Buddy Mengaktifkan) -->
        <div
          v-if="isWaitingForBuddy"
          class="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3.5 my-auto"
        >
          <div class="w-14 h-14 rounded-2xl bg-[#170f07] border-2 border-[#f0d060] flex items-center justify-center text-[#facc15] shadow-xl animate-bounce">
            <span class="text-2xl">⏳</span>
          </div>

          <div class="space-y-1.5 max-w-sm">
            <span class="border border-[#f0d060] bg-[#1a1008] px-2 py-0.5 text-[7.5px] font-pixel text-[#f0d060] uppercase tracking-wider rounded">
              GATEKEEPER POS AKTIF
            </span>
            <h2 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold uppercase mt-1">
              MENUNGGU AKTIVASI KAKAK BUDDY
            </h2>
            <p class="font-sans text-xs text-[#f0e0c0] leading-relaxed">
              Pos <strong class="text-white">{{ booth.name }}</strong> telah siap untuk regu Anda. Mini-game akan otomatis terbuka serentak begitu Kakak Buddy menekan tombol aktivasi sesi di portal bimbingan.
            </p>
          </div>

          <!-- Pulsing Live Sync Box -->
          <div class="px-3 py-1.5 bg-[#170f07] border border-[#5a3a18] rounded-xl flex items-center gap-2 font-mono text-[10px] text-[#86efac]">
            <span class="w-2 h-2 rounded-full bg-[#22c55e] animate-ping"></span>
            <span>Menunggu jam server... Tetap di halaman ini!</span>
          </div>

          <button
            type="button"
            @click="gameSessionStore.refreshSession()"
            class="rpg-btn-wood py-1.5 px-3 font-pixel text-[8.5px] flex items-center gap-1.5 cursor-pointer shadow active:scale-95 text-[#f0d060]"
          >
            <span>🔄 PERIKSA STATUS SESI</span>
          </button>
        </div>

        <div v-else-if="practiceFinished" class="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h2 class="font-pixel text-sm text-[#7ec850]">LATIHAN SELESAI</h2>
          <p class="text-sm">Latihan ini tidak menambah XP atau stempel.</p>
          <button class="rpg-btn-primary py-2 px-4 text-[10px] font-pixel" @click="initializeBackendMission">ULANG LATIHAN</button>
          <RouterLink to="/peta" class="text-xs underline">Kembali ke Peta</RouterLink>
        </div>
        <!-- ACTIVE MINI GAME CONTAINER -->
        <MiniGameContainer
          v-else-if="!isBackendLoading && !backendError && (isSessionActive || !hasBackendAuth || gameSessionStore.status === 'paused') && gameSessionStore.status !== 'expired' && gameSessionStore.session?.status !== 'EXPIRED'"
          :key="serverSessionId || boothId"
          :booth="booth"
          :isCompleted="isAlreadyCompleted && !isPractice"
          :serverSessionId="serverSessionId"
          @complete="handleMiniGameComplete"
        />

        <!-- PAUSE MODAL OVERLAY -->
        <div
          v-if="gameSessionStore.status === 'paused' || gameSessionStore.session?.status === 'PAUSED'"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-300"
        >
          <div class="sdv-card max-w-sm w-full p-6 text-center space-y-4 border-2 border-amber-400 bg-[#1f140a] shadow-[0_0_40px_rgba(245,158,11,0.35)] animate-in zoom-in-95">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-[#120a05] border-2 border-amber-400 flex items-center justify-center shadow-lg">
              <PhPause :size="32" class="text-amber-400 animate-pulse" weight="fill" />
            </div>
            <div class="space-y-1.5">
              <span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-pixel text-[9px] border border-amber-600 uppercase">
                INSTRUKSI GAME MASTER
              </span>
              <h2 class="font-pixel text-base text-[#fef08a] font-bold drop-shadow">
                SESI PERMAINAN DIJEDA
              </h2>
              <p class="font-sans text-xs text-[#f0e0c0] leading-relaxed">
                Kakak Buddy sedang menjeda waktu pos ini. Permainan dihentikan sementara. Harap dengarkan instruksi langsung dari Kakak Buddy.
              </p>
            </div>
            <div class="p-2.5 rounded-lg bg-[#120a05] border border-[#5a3a18] text-[10px] font-mono text-[#86efac] flex items-center justify-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#22c55e] animate-ping"></span>
              <span>Menunggu Game Master melanjutkan sesi...</span>
            </div>
          </div>
        </div>

        <div v-if="gameSessionStore.status === 'expired' || gameSessionStore.session?.status === 'EXPIRED'" class="flex-1 flex items-center justify-center text-center p-6">
          <div class="max-w-sm space-y-3">
            <h2 class="font-pixel text-sm text-[#ff8080]">WAKTU GAME HABIS</h2>
            <p class="font-sans text-xs text-[#f0e0c0]">Sesi pos ini telah selesai / dihentikan oleh Game Master.</p>
            <RouterLink to="/peta" class="inline-block rpg-btn-primary py-2 px-4 text-[10px] font-pixel">KEMBALI KE PETA</RouterLink>
          </div>
        </div>

        <div v-else-if="gameSessionStore.status === 'error' && !isBackendLoading" class="flex-1 flex items-center justify-center text-center p-6">
          <div class="max-w-sm space-y-3">
            <h2 class="font-pixel text-sm text-[#ff8080]">SESI TIDAK TERSEDIA</h2>
            <p class="font-sans text-xs text-[#f0e0c0]">{{ gameSessionStore.error?.message || backendError || 'Sesi game tidak dapat dimuat.' }}</p>
            <RouterLink to="/peta" class="inline-block rpg-btn-primary py-2 px-4 text-[10px] font-pixel">KEMBALI KE PETA</RouterLink>
          </div>
        </div>

        <div v-if="isBackendLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-[#170f07]/85">
          <span class="font-pixel text-xs text-[#f0d060] animate-pulse">MENYIAPKAN SESI GAME...</span>
        </div>
        <div v-else-if="backendError && backendBooth && gameSessionStore.status !== 'error'" class="mt-2 border border-[#d44040] bg-[#2d1210] p-2 text-[10px] text-[#ffd0d0] font-sans">
          {{ backendError }}
        </div>
      </div>
    </main>

    <!-- Educational Story Lore Modal -->
    <div
      v-if="showStoryModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0a0604]/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div class="w-full max-w-md bg-gradient-to-b from-[#2d1b0e] to-[#170f07] border-[3px] border-[#f0d060] rounded-2xl p-4 sm:p-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2 mb-3">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="w-7 h-7 bg-[#170f07] border border-[#f0d060] rounded-md flex items-center justify-center shrink-0">
              <StampIcon :name="booth.stampIcon" :size="16" class="text-[#f0d060]" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[8px] font-pixel text-[#7ec850] uppercase block">
                Narasi Pos • {{ booth.code }}
              </span>
              <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-white leading-normal break-words">
                {{ booth.name }}
              </h3>
            </div>
          </div>

          <button
            type="button"
            @click="showStoryModal = false"
            class="text-[#a08060] hover:text-[#f0d060] p-1 font-pixel text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="flex items-start gap-3 bg-[#170f07] p-3 rounded-xl border border-[#5a3a18] mb-4">
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-[#281c12] border border-[#f0d060] shrink-0 relative">
            <img
              :src="selectedAvatarObj.avatarImage"
              :alt="selectedAvatarObj.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <span class="font-pixel text-[9px] text-[#f0d060] block">
              {{ gameStore.participant.name }}
            </span>
            <p class="font-sans text-xs text-[#f0e6d2] leading-relaxed text-justify break-words">
              {{ booth.story }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="() => {
            if (gameStore.soundEnabled) soundEngine.playClick();
            showStoryModal = false;
          }"
          class="w-full rpg-btn-primary py-2.5 px-4 text-xs font-pixel font-bold cursor-pointer"
        >
          LANJUT KE GAME
        </button>
      </div>
    </div>

    <!-- Stamp Award Celebration Modal -->
    <CelebrationModal
      :isOpen="showCelebration"
      :stampRecord="celebrationDetails.stampRecord"
      :isFloorCompleted="celebrationDetails.isFloorCompleted"
      :floorNumber="celebrationDetails.floorNumber"
      :isLevelUp="celebrationDetails.isLevelUp"
      :newLevel="celebrationDetails.newLevel"
      :nextActionLabel="nextSpotId ? 'Ke Spot Selanjutnya' : 'Evaluasi Lantai Tuntas'"
      @close="showCelebration = false"
      @nextAction="handleNextStep"
    />
  </div>
  <div v-else class="min-h-screen flex flex-col bg-[#2d1b0e] text-[#f0e0c0]">
    <Navbar />
    <div class="flex-1 flex items-center justify-center p-6 text-center">
      <div class="p-8 max-w-md sdv-card-gold text-center space-y-4">
        <h2 class="font-pixel text-base font-bold text-[#ff8080]">
          {{ isBackendLoading ? 'MEMUAT MISI...' : backendError ? 'MISI BELUM DAPAT DIMUAT' : 'BOOTH TIDAK DITEMUKAN' }}
        </h2>
        <p class="font-sans text-sm text-[#d0c0a0]">
          {{ isBackendLoading ? 'Mohon tunggu sebentar.' : backendError || `Maaf, ID booth "${boothId}" tidak terdaftar dalam gedung kampus ini.` }}
        </p>
        <RouterLink to="/peta">
          <button class="rpg-btn-primary py-3 px-6 text-xs font-pixel font-bold">
            Kembali ke Peta Gedung
          </button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
