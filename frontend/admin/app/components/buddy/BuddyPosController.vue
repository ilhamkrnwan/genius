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
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-pixel text-[#86efac] bg-[#172513] border border-[#22c55e]/60 animate-pulse"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
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
      </div>

      <!-- Action Controls for Active Session -->
      <div class="grid grid-cols-2 gap-2 font-mono">
        <button
          v-if="currentSession.status === 'ACTIVE'"
          type="button"
          @click="togglePauseSession"
          :disabled="actionLoading"
          class="rpg-btn-wood h-8 text-[9px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Pause class="h-3 w-3 text-[#facc15]" />
          <span>JEDA SESI</span>
        </button>

        <button
          v-else
          type="button"
          @click="resumeSession"
          :disabled="actionLoading"
          class="rpg-btn-primary h-8 text-[9px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Play class="h-3 w-3 text-white" />
          <span>LANJUTKAN</span>
        </button>

        <button
          type="button"
          @click="endSessionManual"
          :disabled="actionLoading"
          class="bg-[#2a1210] hover:bg-red-900 border-2 border-red-700/80 text-red-200 h-8 rounded-lg text-[9px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Square class="h-3 w-3 text-red-400" />
          <span>SELESAIKAN POS</span>
        </button>
      </div>
    </div>

    <!-- STATE 2: Belum Ada Sesi (IDLE / READY untuk diaktifkan) -->
    <div v-else class="space-y-2.5">
      <div class="p-2 bg-[#170f07] border border-[#5a3a18] rounded-lg text-[10px] text-[#c4956a] leading-relaxed">
        🛡️ <strong class="text-[#f0d060]">Aturan Gatekeeper:</strong> Mahasiswa Baru regu Anda tidak dapat memulai game pos sebelum Anda mengaktifkannya di sini.
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

      <!-- Pilih Durasi Preset (10m, 12m, 15m) -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <label class="text-[9px] font-pixel text-[#f0d060] uppercase">
            2. DURASI AKTIF SERVER:
          </label>
          <span class="text-[8.5px] text-[#86efac] font-mono font-bold">
            {{ selectedDuration / 60 }} Menit ({{ selectedDuration }} Detik)
          </span>
        </div>

        <div class="grid grid-cols-3 gap-1.5 font-mono">
          <button
            v-for="preset in durationPresets"
            :key="preset.seconds"
            type="button"
            @click="selectedDuration = preset.seconds"
            :class="[
              'p-1.5 rounded-lg border-2 text-center transition-all cursor-pointer active:scale-95',
              selectedDuration === preset.seconds
                ? 'bg-[#1a1008] border-[#f0d060] shadow-[0_0_10px_rgba(240,208,96,0.25)]'
                : 'bg-[#170f07] border-[#5a3a18] text-[#a08060] hover:border-[#8b6f4e]'
            ]"
          >
            <span class="font-pixel text-[9px] text-[#fef08a] block">{{ preset.label }}</span>
            <span class="text-[7.5px] text-[#c4956a] mt-0.5 block">{{ preset.desc }}</span>
          </button>
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
        <span>{{ actionLoading ? 'MENGHUBUNGI SERVER...' : '🔓 AKTIFKAN SESI POS REGUSAYA' }}</span>
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
import { Gamepad2, Unlock, Pause, Play, Square } from "lucide-vue-next";
import { useApi } from "~/composables/useApi";

interface Props {
  teamId: string;
  teamName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "session-changed", session: any): void;
}>();

const api = useApi();

// Presets waktu resmi: 10 menit (600s), 12 menit (720s), 15 menit (900s)
const durationPresets = [
  { seconds: 600, label: "10 MENIT", desc: "Kuis / Cepat" },
  { seconds: 720, label: "12 MENIT", desc: "Standar Pos" },
  { seconds: 900, label: "15 MENIT", desc: "Maksimal" },
];

const selectedDuration = ref(720); // default 12 menit
const selectedMissionId = ref("");
const currentSession = ref<any>(null);
const actionLoading = ref(false);
const statusFeedback = ref<string | null>(null);

// Standard 18 Booths / Missions Fallback
const defaultBooths = [
  { id: "b1-a", label: "Lantai 1 - Pos B1-A: Galeri Nilai Aswaja" },
  { id: "b1-b", label: "Lantai 1 - Pos B1-B: Jejak Sejarah UNU" },
  { id: "b2-a", label: "Lantai 2 - Pos B2-A: Perpustakaan & Integritas" },
  { id: "b2-b", label: "Lantai 2 - Pos B2-B: Literasi Digital Aswaja" },
  { id: "b3-a", label: "Lantai 3 - Pos B3-A: Laboratorium Komputer" },
  { id: "b3-b", label: "Lantai 3 - Pos B3-B: Cyber Security Santri" },
  { id: "b4-a", label: "Lantai 4 - Pos B4-A: Ruang Microteaching" },
  { id: "b4-b", label: "Lantai 4 - Pos B4-B: Wawasan Karakter Guru" },
  { id: "b5-a", label: "Lantai 5 - Pos B5-A: Inkubator Bisnis Halal" },
  { id: "b5-b", label: "Lantai 5 - Pos B5-B: Startup & Kewirausahaan" },
  { id: "b6-a", label: "Lantai 6 - Pos B6-A: Studio Media Kreatif" },
  { id: "b6-b", label: "Lantai 6 - Pos B6-B: Podcast Aswaja Masa Depan" },
  { id: "b7-a", label: "Lantai 7 - Pos B7-A: Laboratorium Robotika" },
  { id: "b7-b", label: "Lantai 7 - Pos B7-B: Rekayasa Sains Hijau" },
  { id: "b8-a", label: "Lantai 8 - Pos B8-A: Galeri Riset Pascasarjana" },
  { id: "b8-b", label: "Lantai 8 - Pos B8-B: Publikasi Ilmiah Global" },
  { id: "b9-a", label: "Lantai 9 - Pos B9-A: Convention Hall Utama" },
  { id: "b9-b", label: "Lantai 9 - Pos B9-B: Master Transformation Quiz" },
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
  const limitMs = Number(currentSession.value.timeLimit || 900) * 1000;
  const elapsedMs = nowTick.value - startMs;
  const rem = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
  return rem;
});

const remainingPercent = computed(() => {
  const total = Number(currentSession.value?.timeLimit || 900);
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
      emit("session-changed", res.data);
    } else {
      currentSession.value = null;
    }
  } catch (err) {
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

    // 2. Start session with chosen duration (10-15 mins)
    const startRes = await api.post<{ success: boolean; data: any }>(`/api/game-sessions/${sessionId}/start`, {
      timeLimitSeconds: selectedDuration.value,
    });

    if (startRes.success && startRes.data) {
      currentSession.value = startRes.data;
      statusFeedback.value = `Sesi Pos berhasil diaktifkan selama ${selectedDuration.value / 60} menit!`;
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
      timeLimitSeconds: currentSession.value.timeLimit,
    });
    if (res.success && res.data) {
      currentSession.value = res.data;
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

onMounted(() => {
  fetchMissions();
  fetchActiveSession();

  // Tick local timer every 1000ms
  timerInterval = setInterval(() => {
    nowTick.value = Date.now();
    // Auto refresh active session periodically
    if (currentSession.value?.status === "ACTIVE" && remainingSeconds.value === 0) {
      fetchActiveSession();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
