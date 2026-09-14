<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import {
  PhArrowLeft,
  PhCheckCircle,
  PhBookOpen,
} from '@phosphor-icons/vue';
import { BOOTHS_DATA, FLOORS_DATA, AVATAR_OPTIONS } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';
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

const floorNumber = computed(() => parseInt((route.params.floorId as string) || '1', 10) || 1);
const spotId = computed(() => (route.params.spotId as string) || '');

const backendBooth = ref<ReturnType<typeof normalizePlayableMission> | null>(null);
const isBackendLoading = ref(false);
const backendError = ref<string | null>(null);
const waitingForGameMaster = ref(false);
let pollingInterval: any = null;
const hasBackendAuth = computed(() => typeof window !== 'undefined' && Boolean(localStorage.getItem('genius_user_token')));
const booth = computed(() => hasBackendAuth.value ? (backendBooth.value || BOOTHS_DATA[spotId.value]) : (backendBooth.value || BOOTHS_DATA[spotId.value]));
const serverSessionId = computed(() => gameSessionStore.session?.id);

const floor = computed(() => FLOORS_DATA.find((f) => f.number === floorNumber.value) || FLOORS_DATA[0]);
const floorBooths = computed(() => (floor.value.boothIds || []).map(id => BOOTHS_DATA[id]).filter(Boolean));
const currentSpotIndex = computed(() => floorBooths.value.findIndex(b => b.id === spotId.value || b.code === booth.value?.code));
const isLastSpot = computed(() => currentSpotIndex.value === floorBooths.value.length - 1);
const nextSpot = computed(() => {
  if (currentSpotIndex.value >= 0 && currentSpotIndex.value < floorBooths.value.length - 1) {
    return floorBooths.value[currentSpotIndex.value + 1];
  }
  return null;
});
const nextBoothCode = computed(() => nextSpot.value?.code || '');
const isSpot1 = computed(() => currentSpotIndex.value === 0);
const isAlreadyCompleted = computed(() => gameStore.isBoothCompleted(spotId.value));

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
  if (isAlreadyCompleted.value) return false;
  return gameSessionStore.session?.status === 'READY' || gameSessionStore.status === 'ready';
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
  if (!spotId.value || !gameStore.isLoggedIn || !hasBackendAuth.value) return;

  isBackendLoading.value = true;
  backendError.value = null;
  const missionResponse = await gameSessionStore.loadMissionForPlay(spotId.value);

  if (!missionResponse || missionResponse.status !== 'ACTIVE' || !missionResponse.game) {
    backendError.value = gameSessionStore.error?.message || 'Misi backend belum tersedia.';
    isBackendLoading.value = false;
    return;
  }

  backendBooth.value = normalizePlayableMission(missionResponse);

  if (!teamId.value) {
    backendError.value = 'Akun belum terhubung ke team. Gunakan mode lokal.';
    isBackendLoading.value = false;
    return;
  }

  // 1. Coba restore sesi yang sudah ada di memori browser
  const restored = await gameSessionStore.restoreSession(missionResponse.id);
  
  // 2. Coba ambil dari server apakah ada sesi aktif untuk tim ini
  const activeRestored = restored || await gameSessionStore.restoreActiveSessionForMission(missionResponse.id);
  
  if (activeRestored && activeRestored.status === 'ACTIVE') {
    // Sesi sudah dibuka & DIMULAI oleh Game Master
    waitingForGameMaster.value = false;
    backendBooth.value = normalizePlayableSessionMission(missionResponse, activeRestored);
    isBackendLoading.value = false;
  } else {
    // Sesi belum dimulai (mungkin belum dibuat atau masih READY), tunggu Game Master
    waitingForGameMaster.value = true;
    isBackendLoading.value = false;
    startPollingForSession(missionResponse.id);
  }
}

function startPollingForSession(missionId: string) {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    if (!waitingForGameMaster.value) {
      clearInterval(pollingInterval);
      return;
    }
    
    const activeSession = await gameSessionStore.restoreActiveSessionForMission(missionId);
    if (activeSession && activeSession.status === 'ACTIVE') {
      waitingForGameMaster.value = false;
      clearInterval(pollingInterval);
      // Reload ulang page atau re-initialize agar data terupdate bersih
      void initializeBackendMission();
    }
  }, 3000);
}

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

onMounted(() => {
  void initializeBackendMission();

  tickTimer = setInterval(() => {
    nowTick.value = Date.now();
    if (isSessionActive.value && serverRemainingSeconds.value === 0 && gameSessionStore.session?.id) {
      void gameSessionStore.refreshSession();
    }
  }, 1000);

  sessionPollingTimer = setInterval(async () => {
    if (isWaitingForBuddy.value && gameSessionStore.session?.id) {
      const refreshed = await gameSessionStore.refreshSession();
      if (refreshed && refreshed.status === 'ACTIVE' && backendBooth.value) {
        backendBooth.value = normalizePlayableSessionMission(missionResponseRef.value, refreshed);
      }
    }
  }, 2500);
});

const missionResponseRef = ref<any>(null);

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (sessionPollingTimer) clearInterval(sessionPollingTimer);
});

const selectedAvatarObj = computed(
  () => AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) || AVATAR_OPTIONS[0]
);

const showStoryModal = ref(false);
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
  floorNumber: floor.value.number,
  isLevelUp: false,
  newLevel: 'New You',
});

const handleMiniGameComplete = (score: number, totalQuestions: number) => {
  if (!booth.value) return;
  if (gameStore.soundEnabled) soundEngine.playCorrect();

  const hasServerSession = Boolean(serverSessionId.value && gameSessionStore.status === 'active');
  const result = gameStore.completeBooth(booth.value.id, score, totalQuestions, hasServerSession);

  // Sync complete server session if session is active
  if (hasServerSession) {
    gameSessionStore.completeSession([{ score, totalQuestions, action: 'COMPLETE' }]).then((res) => {
      if (res) console.log('[LinearSpotView] Server session completed:', res);
    }).catch((err) => {
      console.warn('[LinearSpotView] Error completing server session:', err);
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
  if (nextSpot.value) {
    router.push(`/play/floor/${floor.value.number}/spot/${nextSpot.value.id}`);
  } else {
    router.push(`/play/floor/${floor.value.number}/complete`);
  }
};
</script>

<template>
  <div v-if="booth" class="min-h-[100dvh] h-[100dvh] max-h-[100dvh] flex flex-col bg-[#2d1b0e] text-[#f0e0c0] overflow-hidden">
    <CrtScanlines />
    <Navbar />

    <main class="max-w-2xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex-1 flex flex-col justify-between overflow-hidden w-full gap-1.5 sm:gap-2">
      <!-- Top Spot Status Bar -->
      <div class="bg-[#1f140a] border-2 border-[#5a3a18] rounded-xl p-2 sm:p-2.5 shadow-md shrink-0 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <RouterLink
              :to="`/dashboard?floor=${floor.number}`"
              @click="() => gameStore.soundEnabled && soundEngine.playClick()"
              class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-pixel text-[#c4956a] hover:text-[#f0d060] transition-colors shrink-0 bg-[#170f07] px-2 py-1 rounded border border-[#5a3a18]"
            >
              <PhArrowLeft :size="12" weight="bold" />
              <span>LT {{ floor.number }}</span>
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
              +250 XP
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
        v-if="hasBackendAuth && isSessionActive && !isAlreadyCompleted && gameSessionStore.session?.serverStartAt"
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
      <div class="flex-1 sdv-card p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden shadow-lg relative">
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

        <!-- ACTIVE MINI GAME CONTAINER -->
        <MiniGameContainer
          v-else-if="gameSessionStore.status !== 'expired' && gameSessionStore.status !== 'error'"
          :booth="booth"
          :isCompleted="isAlreadyCompleted"
          :serverSessionId="serverSessionId"
          @complete="handleMiniGameComplete"
        />

        <div v-if="gameSessionStore.status === 'expired'" class="flex-1 flex items-center justify-center text-center p-6">
          <div class="max-w-sm space-y-3">
            <h2 class="font-pixel text-sm text-[#ff8080]">WAKTU GAME HABIS</h2>
            <p class="font-sans text-xs text-[#f0e0c0]">Sesi ini sudah kedaluwarsa dan tidak menerima jawaban lagi.</p>
            <RouterLink :to="`/dashboard?floor=${floorNumber}`" class="inline-block rpg-btn-primary py-2 px-4 text-[10px] font-pixel">KEMBALI KE PETA</RouterLink>
          </div>
        </div>

        <div v-else-if="gameSessionStore.status === 'error' && !isBackendLoading && !waitingForGameMaster" class="flex-1 flex items-center justify-center text-center p-6">
          <div class="max-w-sm space-y-3">
            <h2 class="font-pixel text-sm text-[#ff8080]">SESI TIDAK TERSEDIA</h2>
            <p class="font-sans text-xs text-[#f0e0c0]">{{ gameSessionStore.error?.message || backendError || 'Sesi game tidak dapat dimuat.' }}</p>
            <RouterLink :to="`/dashboard?floor=${floorNumber}`" class="inline-block rpg-btn-primary py-2 px-4 text-[10px] font-pixel">KEMBALI KE PETA</RouterLink>
          </div>
        </div>

        <div v-if="isBackendLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-[#170f07]/85 backdrop-blur-sm">
          <span class="font-pixel text-xs text-[#f0d060] animate-pulse">MENYIAPKAN SESI GAME...</span>
        </div>
        
        <div v-if="waitingForGameMaster" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#170f07]/95 backdrop-blur-md p-6 text-center space-y-5">
          <div class="w-16 h-16 rounded-full border-4 border-[#3a2818] border-t-[#f0d060] animate-spin"></div>
          <div>
            <h2 class="font-pixel text-sm text-[#f0d060] mb-2 animate-pulse">MENUNGGU AKSES</h2>
            <p class="font-sans text-xs text-[#d0c0a0] max-w-[200px] leading-relaxed">
              Silakan minta Game Master (Panitia/Buddy) untuk membukakan akses sesi kuis untuk tim Anda.
            </p>
          </div>
        </div>

        <div v-else-if="backendError && backendBooth && !waitingForGameMaster" class="mt-2 border border-[#d44040] bg-[#2d1210] p-2 text-[10px] text-[#ffd0d0] font-sans">
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
                Materi Spot • {{ booth.code }}
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
          TUTUP & MAINKAN MISI
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
      :nextActionLabel="nextSpot ? `Lanjut ke ${nextSpot.name} (${nextSpot.code})` : `Lantai ${floor.number} Tuntas!`"
      @close="showCelebration = false"
      @nextAction="handleNextStep"
    />
  </div>
  <div v-else class="min-h-screen flex flex-col bg-[#2d1b0e] text-[#f0e0c0]">
    <Navbar />
    <div class="flex-1 flex items-center justify-center p-6 text-center">
      <div class="p-8 max-w-md sdv-card-gold text-center space-y-4">
        <h2 class="font-pixel text-base font-bold text-[#ff8080]">
          SPOT TIDAK DITEMUKAN
        </h2>
        <p class="font-sans text-sm text-[#d0c0a0]">
          Spot &quot;{{ spotId }}&quot; tidak terdaftar di Lantai {{ floorNumber }}.
        </p>
        <RouterLink :to="`/dashboard?floor=${floorNumber}`">
          <button class="rpg-btn-primary py-3 px-6 text-xs font-pixel font-bold">
            Kembali ke Peta Lantai {{ floorNumber }}
          </button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
