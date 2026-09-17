<template>
  <div class="sdv-card p-3 sm:p-3.5 space-y-3 font-sans select-none border-2 border-[#f0d060]/70 shadow-lg">
    <!-- Header Section -->
    <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-[#281c12] border border-[#f0d060] flex items-center justify-center text-[#facc15] shrink-0 shadow">
          <Gamepad2 class="h-4 w-4 text-[#facc15]" />
        </div>
        <div>
          <span class="border border-[#f0d060] bg-[#1a1008] px-1.5 py-0.2 text-[7.5px] font-pixel text-[#f0d060] uppercase tracking-wider rounded">
            GATEKEEPER POS
          </span>
          <h2 class="font-pixel text-[10px] sm:text-xs text-[#fef08a] font-bold mt-0.5 uppercase">
            KONTROL SESI POS REGUSAYA
          </h2>
        </div>
      </div>

      <!-- Live Status Badge -->
      <div>
        <span
          v-if="currentSession?.status === 'ACTIVE'"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-pixel text-[#86efac] bg-[#172513] border border-[#22c55e]/60 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
          SESI AKTIF
        </span>
        <span
          v-else-if="currentSession?.status === 'PAUSED'"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-pixel text-[#facc15] bg-[#2a1d08] border border-[#f59e0b]/60"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
          DIJEDA
        </span>
        <span
          v-else
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-pixel text-[#a08060] bg-[#170f07] border border-[#5a3a18]"
        >
          MENUNGGU AKTIVASI
        </span>
      </div>
    </div>

    <!-- STATE 1: Sesi Sedang Berjalan (ACTIVE / PAUSED) -->
    <div v-if="currentSession && (currentSession.status === 'ACTIVE' || currentSession.status === 'PAUSED')" class="space-y-2.5">
      <!-- Active Pos Banner -->
      <div class="p-2.5 bg-[#170f07] border-2 border-[#f0d060] rounded-xl space-y-2">
        <div class="flex items-center justify-between text-xs">
          <div class="min-w-0">
            <span class="text-[9px] font-mono text-[#a08060] block uppercase">Pos Sedang Dimainkan:</span>
            <span class="font-bold text-[#fef08a] text-xs sm:text-sm font-pixel truncate block">
              {{ currentSession.missionName || currentSession.gameName || 'Pos Permainan' }}
            </span>
            <span class="text-[10px] text-[#86efac] font-mono">
              {{ currentSession.locationName ? `${currentSession.locationName}` : 'Lokasi Terdaftar' }}
            </span>
          </div>

          <!-- Big Countdown Timer Box -->
          <div class="text-right shrink-0 bg-[#271d15] border-2 border-[#f0d060] px-3 py-1.5 rounded-lg shadow-inner">
            <span class="text-[7.5px] text-[#c4956a] font-mono block">SISA WAKTU SERVER</span>
            <span
              :class="[
                'font-pixel text-base sm:text-lg font-bold tracking-wider',
                remainingSeconds <= 120 ? 'text-red-400 animate-pulse' : 'text-[#86efac]'
              ]"
            >
              {{ formattedRemainingTime }}
            </span>
          </div>
        </div>

        <!-- Progress Bar (Server Authoritative) -->
        <div class="w-full bg-[#2a1b10] h-2 rounded-full border border-[#5a3a18] overflow-hidden">
          <div
            class="h-full transition-all duration-1000 rounded-full"
            :class="remainingPercent <= 20 ? 'bg-red-500' : remainingPercent <= 50 ? 'bg-amber-400' : 'bg-[#22c55e]'"
            :style="{ width: `${remainingPercent}%` }"
          ></div>
        </div>

        <!-- Anti-Lockscreen & Anti-Refresh Status Indicator -->
        <div class="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-[#c4956a] pt-1 border-t border-[#5a3a18]/40">
          <span class="flex items-center gap-1" :class="isWakeLockActive ? 'text-[#86efac]' : 'text-[#c4956a]'">
            <Sun class="w-3 h-3 text-amber-400" :class="isWakeLockActive ? 'animate-pulse' : ''" />
            <span>{{ isWakeLockActive ? 'Anti-Lockscreen Aktif' : 'WakeLock Siaga' }}</span>
          </span>
          <span class="flex items-center gap-1 text-[#38bdf8]">
            <ShieldCheck class="w-3 h-3 text-[#38bdf8]" />
            <span>Anti-Refresh &amp; Waktu Ter-Sync</span>
          </span>
        </div>
      </div>

      <!-- Action Controls for Active Session -->
      <div class="grid grid-cols-2 gap-2 font-mono">
        <button
          v-if="currentSession.status === 'ACTIVE'"
          type="button"
          @click="togglePauseSession"
          :disabled="actionLoading"
          class="rpg-btn-wood h-9 text-[9.5px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
        >
          <Pause class="h-3.5 w-3.5 text-[#facc15]" />
          <span>JEDA SESI</span>
        </button>

        <button
          v-else
          type="button"
          @click="resumeSession"
          :disabled="actionLoading"
          class="rpg-btn-primary h-9 text-[9.5px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
        >
          <Play class="h-3.5 w-3.5 text-white" />
          <span>LANJUTKAN</span>
        </button>

        <button
          type="button"
          @click="endSessionManual"
          :disabled="actionLoading"
          class="bg-[#2a1210] hover:bg-red-900 border-2 border-red-700/80 text-red-200 h-9 rounded-lg text-[9.5px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
        >
          <Square class="h-3.5 w-3.5 text-red-400" />
          <span>SELESAIKAN POS</span>
        </button>
      </div>
    </div>

    <!-- STATE 2: Belum Ada Sesi (IDLE / READY untuk diaktifkan) -->
    <div v-else class="space-y-2.5">
      <div class="p-2 bg-[#170f07] border border-[#5a3a18] rounded-lg text-[10px] text-[#c4956a] leading-relaxed">
        🛡️ <strong class="text-[#f0d060]">Aturan Gatekeeper:</strong> Mahasiswa Baru regu Anda tidak dapat memulai kuis pos sebelum Anda mengaktifkannya di sini.
      </div>

      <!-- Pilih Pos Game -->
      <div class="space-y-1">
        <label class="text-[9px] font-pixel text-[#f0d060] uppercase block">
          1. PILIH POS PERMAINAN LANTAI:
        </label>
        <select
          v-model="selectedMissionId"
          class="w-full bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg px-2.5 py-2 text-xs text-[#fef08a] font-mono outline-none cursor-pointer"
        >
          <option v-for="m in missionOptions" :key="m.id" :value="m.id">
            {{ m.label }}
          </option>
        </select>
      </div>

      <!-- Durasi Baku Pos: 12 Menit (Fixed Default) -->
      <div class="p-2.5 bg-[#170f07] border-2 border-[#5a3a18] rounded-xl flex items-center justify-between font-mono">
        <div>
          <span class="text-[8px] font-pixel text-[#c4956a] uppercase block">DURASI RESMI POS:</span>
          <span class="text-xs font-pixel text-[#fef08a] font-bold">12 MENIT (720 DETIK)</span>
        </div>
        <div class="flex items-center gap-1.5 bg-[#120a05] border border-[#f0d060]/40 px-2 py-1 rounded text-[9px] text-[#86efac]">
          <Clock class="w-3 h-3 text-[#f0d060]" />
          <span>Baku 12 Menit</span>
        </div>
      </div>

      <!-- Tombol Aktivasi Utama -->
      <button
        type="button"
        @click="activatePosSession"
        :disabled="actionLoading || !selectedMissionId"
        class="rpg-btn-primary w-full py-2.5 px-3 rounded-xl font-pixel text-xs sm:text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
      >
        <span v-if="actionLoading" class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <Unlock v-else class="h-4 w-4 text-[#facc15]" />
        <span>{{ actionLoading ? 'MENGHUBUNGI SERVER...' : '🔓 AKTIFKAN SESI POS REGUSAYA (12 MENIT)' }}</span>
      </button>
    </div>

    <!-- Alert / Toast Banner -->
    <div
      v-if="statusFeedback"
      class="p-2 bg-[#172513] border border-[#22c55e] rounded-lg text-center text-[10px] font-mono text-[#86efac]"
    >
      {{ statusFeedback }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Gamepad2, Unlock, Pause, Play, Square, Clock, Sun, ShieldCheck } from "lucide-vue-next";
import { useApi } from "~/composables/useApi";
import { useRealtime } from "~/composables/useRealtime";

interface Props {
  teamId: string;
  teamName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "session-changed", session: any): void;
}>();

const api = useApi();
const { onEvent } = useRealtime();

// Durasi tetap resmi PKKMB: 12 menit (720 detik)
const DEFAULT_POS_DURATION_SECONDS = 720;
const selectedMissionId = ref("");
const currentSession = ref<any>(null);
const actionLoading = ref(false);
const statusFeedback = ref<string | null>(null);

// Anti-Lockscreen (Screen Wake Lock API)
const isWakeLockActive = ref(false);
let wakeLockSentinel: any = null;

async function requestWakeLock() {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
    isWakeLockActive.value = true;
    wakeLockSentinel.addEventListener?.("release", () => {
      isWakeLockActive.value = false;
    });
  } catch (err) {
    // Graceful fallback on low battery or non-secure context
    isWakeLockActive.value = false;
  }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch (_) {}
    wakeLockSentinel = null;
  }
  isWakeLockActive.value = false;
}

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible" && currentSession.value?.status === "ACTIVE") {
    requestWakeLock();
  }
};

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (currentSession.value?.status === "ACTIVE") {
    e.preventDefault();
    e.returnValue = "Sesi game pos sedang berjalan. Meninggalkan halaman dapat mengganggu panduan regu.";
  }
};

// Standard 9 Official Campus Quest Pos Fallback
const defaultBooths = [
  { id: "POS-L1-1", label: "Lantai 1 — Pos 1: Anti Korupsi & Terorisme (Pilihan Ganda)" },
  { id: "POS-L2-2", label: "Lantai 2 — Pos 2: Leadership & Problem Solving (Memory Match)" },
  { id: "POS-L2-6", label: "Lantai 2 — Pos 6: Media Sosial & Komunikasi (Kuis Cepat)" },
  { id: "POS-L3-3", label: "Lantai 3 — Pos 3: Profil Pelajar Pancasila (Benar/Salah)" },
  { id: "POS-L4-4", label: "Lantai 4 — Pos 4: Kampus Bersinar Bebas Narkoba (Teka-Teki Silang)" },
  { id: "POS-L4-9", label: "Lantai 4 — Pos 9: Ingat Aku: Teks Blur & 3 Tokoh NU (Tebak Gambar)" },
  { id: "POS-L5-5", label: "Lantai 5 — Pos 5: Anti Plagiarisme & Integritas (Tebak Kata)" },
  { id: "POS-L6-7", label: "Lantai 6 — Pos 7: Fun Pos Tebak Gambar & Audio (Observasi)" },
  { id: "POS-L6-8", label: "Lantai 6 — Pos 8: Ingat Aku: Tebak Lokasi Lantai Gedung (Tebak Posisi)" },
];

const missionOptions = ref<{ id: string; label: string }[]>(defaultBooths);

// Countdown Timer Calculations (Server Authoritative)
const nowTick = ref(Date.now());
let timerInterval: any = null;

const remainingSeconds = computed(() => {
  if (!currentSession.value || currentSession.value.status !== "ACTIVE" || !currentSession.value.serverStartAt) {
    return 0;
  }
  const startMs = new Date(currentSession.value.serverStartAt).getTime();
  const limitMs = Number(currentSession.value.timeLimit || DEFAULT_POS_DURATION_SECONDS) * 1000;
  const elapsedMs = nowTick.value - startMs;
  const rem = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
  return rem;
});

const remainingPercent = computed(() => {
  const total = Number(currentSession.value?.timeLimit || DEFAULT_POS_DURATION_SECONDS);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((remainingSeconds.value / total) * 100)));
});

const formattedRemainingTime = computed(() => {
  const s = remainingSeconds.value;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
});

async function fetchMissions() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/missions");
    if (res.success && res.data && res.data.length > 0) {
      missionOptions.value = res.data.map((m: any) => ({
        id: m.id,
        label: `${m.floorNumber ? `Lantai ${m.floorNumber} - ` : ""}${m.name || m.locationName}`,
      }));
      if (!selectedMissionId.value) {
        selectedMissionId.value = missionOptions.value[0].id;
      }
    } else {
      selectedMissionId.value = defaultBooths[0].id;
    }
  } catch {
    selectedMissionId.value = defaultBooths[0].id;
  }
}

async function fetchActiveSession() {
  if (!props.teamId) return;
  try {
    const res = await api.get<{ success: boolean; data: any }>(`/api/game-sessions/team/${props.teamId}/active`);
    if (res.success && res.data) {
      currentSession.value = res.data;
      if (res.data.status === "ACTIVE") {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
      emit("session-changed", res.data);
    } else {
      currentSession.value = null;
      releaseWakeLock();
    }
  } catch {
    // ignore
  }
}

async function activatePosSession() {
  if (!props.teamId || !selectedMissionId.value || actionLoading.value) return;
  actionLoading.value = true;
  statusFeedback.value = null;

  try {
    // 1. Create or ensure session exists
    let sessionId = currentSession.value?.id;
    if (!sessionId || currentSession.value?.status !== "READY") {
      const createRes = await api.post<{ success: boolean; data: any; error?: any }>("/api/game-sessions/create", {
        missionId: selectedMissionId.value,
        teamId: props.teamId,
      });

      if (createRes.success && createRes.data) {
        sessionId = createRes.data.id;
      } else if (createRes.data?.sessionId) {
        sessionId = createRes.data.sessionId;
      }
    }

    if (!sessionId) {
      statusFeedback.value = "Gagal membuat sesi pos. Pastikan pos valid.";
      actionLoading.value = false;
      return;
    }

    // 2. Start session with fixed 12 minutes (720 seconds)
    const startRes = await api.post<{ success: boolean; data: any }>(`/api/game-sessions/${sessionId}/start`, {
      timeLimitSeconds: DEFAULT_POS_DURATION_SECONDS,
    });

    if (startRes.success && startRes.data) {
      currentSession.value = startRes.data;
      requestWakeLock();
      statusFeedback.value = "Sesi Pos berhasil diaktifkan selama 12 menit!";
      emit("session-changed", startRes.data);
    }
  } catch (err: any) {
    console.error("Gagal mengaktifkan sesi pos:", err);
    statusFeedback.value = err?.data?.error?.message || "Gagal mengaktifkan sesi pos.";
  } finally {
    actionLoading.value = false;
    setTimeout(() => {
      statusFeedback.value = null;
    }, 4000);
  }
}

async function togglePauseSession() {
  if (!currentSession.value?.id || actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await api.post<{ success: boolean; data: any }>(`/api/game-sessions/${currentSession.value.id}/pause`);
    if (res.success && res.data) {
      currentSession.value = res.data;
      releaseWakeLock();
      statusFeedback.value = "Sesi permainan dijeda sementara.";
    }
  } catch (err: any) {
    console.error("Gagal menjeda sesi:", err);
  } finally {
    actionLoading.value = false;
    setTimeout(() => {
      statusFeedback.value = null;
    }, 3000);
  }
}

async function resumeSession() {
  if (!currentSession.value?.id || actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await api.post<{ success: boolean; data: any }>(`/api/game-sessions/${currentSession.value.id}/start`, {
      timeLimitSeconds: currentSession.value.timeLimit || DEFAULT_POS_DURATION_SECONDS,
    });
    if (res.success && res.data) {
      currentSession.value = res.data;
      requestWakeLock();
      statusFeedback.value = "Sesi permainan dilanjutkan!";
    }
  } catch (err: any) {
    console.error("Gagal melanjutkan sesi:", err);
  } finally {
    actionLoading.value = false;
    setTimeout(() => {
      statusFeedback.value = null;
    }, 3000);
  }
}

async function endSessionManual() {
  if (!currentSession.value?.id || actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await api.post<{ success: boolean; data: any }>(`/api/game-sessions/${currentSession.value.id}/expire`);
    if (res.success) {
      currentSession.value = null;
      releaseWakeLock();
      statusFeedback.value = "Sesi pos telah diselesaikan.";
    }
  } catch (err: any) {
    console.error("Gagal menyelesaikan sesi:", err);
  } finally {
    actionLoading.value = false;
    setTimeout(() => {
      statusFeedback.value = null;
    }, 3000);
  }
}

let unsubscribeRealtime: (() => void) | null = null;

onMounted(() => {
  fetchMissions();
  fetchActiveSession();

  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
  }

  // Tick local timer every 1000ms
  timerInterval = setInterval(() => {
    nowTick.value = Date.now();
    if (currentSession.value?.status === "ACTIVE" && remainingSeconds.value === 0) {
      fetchActiveSession();
    }
  }, 1000);

  // Realtime WebSocket synchronization
  unsubscribeRealtime = onEvent((event, data) => {
    if (event === "PARTICIPANT_COMPLETED") {
      if (data && (!props.teamId || data.teamId === props.teamId)) {
        const cCount = data.completedCount ?? 1;
        const total = data.totalMembers ?? "?";
        statusFeedback.value = `Progres: ${cCount}/${total} peserta selesai (+${data.score ?? 0} Pts). Sesi tetap berjalan.`;
        setTimeout(() => {
          if (statusFeedback.value?.includes("peserta selesai")) {
            statusFeedback.value = null;
          }
        }, 5000);
      }
      return;
    }

    if (
      event === "SESSION_STARTED" ||
      event === "SESSION_PAUSED" ||
      event === "SESSION_EXPIRED" ||
      event === "SESSION_COMPLETED" ||
      event === "GAME_SESSION_STARTED" ||
      event === "GAME_SESSION_PAUSED" ||
      event === "GAME_SESSION_EXPIRED"
    ) {
      const sess = data?.session || data?.details || data;
      if (sess && (!props.teamId || sess.teamId === props.teamId)) {
        if (event.includes("EXPIRED") || event.includes("COMPLETED")) {
          currentSession.value = null;
          releaseWakeLock();
        } else {
          currentSession.value = sess;
          if (sess.status === "ACTIVE") {
            requestWakeLock();
          } else {
            releaseWakeLock();
          }
        }
      }
    }
  });
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  releaseWakeLock();
  if (typeof window !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  }
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }
});
</script>
