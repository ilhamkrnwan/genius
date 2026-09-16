<template>
  <div class="space-y-3 pb-8 font-sans">
    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="toast"
        :class="[
          'fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 z-50 p-2.5 rounded-xl border shadow-xl font-mono text-xs flex items-center gap-2 max-w-sm backdrop-blur-md',
          toast.type === 'success'
            ? 'bg-[#142612]/95 border-[#22c55e] text-[#86efac]'
            : toast.type === 'error'
            ? 'bg-[#2a1210]/95 border-red-500 text-red-300'
            : 'bg-[#181d28]/95 border-sky-500 text-sky-300'
        ]"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="h-4 w-4 shrink-0 text-[#22c55e]" />
        <AlertCircle v-else-if="toast.type === 'error'" class="h-4 w-4 shrink-0 text-red-400" />
        <Sparkles v-else class="h-4 w-4 shrink-0 text-sky-400" />
        <span class="leading-tight">{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- Compact Top Group Header -->
    <div class="sdv-card-gold p-3 space-y-2">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold">
            {{ currentTeamInfo.name }}
          </h1>
          <span class="text-[10px] text-[#c4956a] font-mono">
            Buddy: <strong class="text-white">{{ cleanBuddyName }}</strong> &bull; Rute: <strong class="text-[#f0d060]">{{ currentTeamInfo.startFloor }}</strong>
          </span>
        </div>

        <div class="text-right shrink-0">
          <span class="font-pixel text-xs sm:text-sm text-[#86efac] font-bold block">
            {{ currentTeamScore }} PTS
          </span>
          <span class="text-[9px] text-[#facc15] font-mono">Rank #{{ currentTeamRank }}</span>
        </div>
      </div>

      <!-- Quick Metrics Strip (Synchronized with check-in and check-out) -->
      <div class="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px] pt-1 border-t border-[#5a3a18]">
        <div class="bg-[#170f07] py-1 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate">TOTAL MABA</span>
          <span class="font-pixel text-xs text-white">{{ activeMembers.length }}</span>
        </div>
        <div class="bg-[#170f07] py-1 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate">MASUK PAGI</span>
          <span class="font-pixel text-xs text-[#86efac]">{{ attendedInCount }}/{{ activeMembers.length }}</span>
        </div>
        <div class="bg-[#170f07] py-1 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate">PULANG SORE</span>
          <span class="font-pixel text-xs text-[#38bdf8]">{{ attendedOutCount }}/{{ activeMembers.length }}</span>
        </div>
        <div class="bg-[#170f07] py-1 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate">FGD TUNTAS</span>
          <span class="font-pixel text-xs text-[#facc15]">{{ fgdCompletedCount }}/{{ activeMembers.length }}</span>
        </div>
      </div>
    </div>

    <!-- Day Navigation Bar (Synchronized with Maba View: Hari 1, 2, 3) -->
    <div class="grid grid-cols-3 gap-1.5 bg-[#140c06]/90 p-1.5 rounded-xl border border-[#5a3a18]">
      <button
        v-for="item in DAYS"
        :key="item.day"
        type="button"
        @click="selectDay(item.day)"
        :class="[
          'py-2 px-1.5 rounded-lg transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95',
          activeDayTab === item.day
            ? 'bg-[#38761d] text-white border border-[#f0d060] font-bold shadow'
            : 'text-[#c4956a] hover:text-[#f0d060] hover:bg-[#20140c]'
        ]"
      >
        <div class="flex items-center gap-1 text-[11px]">
          <span class="font-pixel">{{ item.label }}</span>
          <span
            v-if="dayAttendanceCount[item.day] > 0"
            class="text-[8px] px-1 py-0.2 rounded-full bg-[#142612] text-[#86efac] border border-[#22c55e]/40 font-mono"
          >
            {{ dayAttendanceCount[item.day] }}
          </span>
        </div>
        <span class="text-[8px] opacity-85 font-sans mt-0.5">{{ item.date }} &bull; {{ item.subtitle }}</span>
      </button>
    </div>

    <!-- Quick Batch Actions (Presensi Cepat Seluruh Regu) -->
    <div class="sdv-card p-2 sm:p-2.5 flex items-center justify-between gap-2">
      <div class="text-[10px] text-[#c4956a] font-mono leading-tight">
        <span class="text-white font-bold block">Aksi Presensi Regu (Hari {{ activeDayTab }})</span>
        <span>Kelola kehadiran jam pertama dan kepulangan maba</span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          :disabled="isBatchProcessing || attendedInCount >= activeMembers.length"
          @click="handleBatchCheckIn"
          class="rpg-btn-wood h-7 px-2.5 font-pixel text-[8px] font-bold flex items-center gap-1 shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Presensi masuk seluruh anggota regu yang belum hadir (+100 XP)"
        >
          <Sun class="h-3 w-3 text-[#facc15]" />
          <span>+ MASUK SEMUA</span>
        </button>

        <button
          type="button"
          :disabled="isBatchProcessing || attendedOutCount >= attendedInCount || attendedInCount === 0"
          @click="handleBatchCheckOut"
          class="rpg-btn-primary h-7 px-2.5 font-pixel text-[8px] font-bold flex items-center gap-1 shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Presensi pulang seluruh anggota regu yang sudah masuk (+50 XP)"
        >
          <Moon class="h-3 w-3 text-[#38bdf8]" />
          <span>+ PULANG SEMUA</span>
        </button>
      </div>
    </div>

    <!-- Quick Actions Hub (Direct access to FGD, Bonus H3, Leaderboard) -->
    <div class="grid grid-cols-3 gap-1.5 font-mono">
      <NuxtLink
        to="/buddy/fgd"
        class="sdv-card p-2 text-center flex flex-col items-center justify-center hover:border-[#f0d060] transition-all active:scale-95 group cursor-pointer"
      >
        <div class="w-7 h-7 rounded-lg bg-[#271d15] border border-[#f0d060] flex items-center justify-center text-[#facc15] mb-1 group-hover:scale-105 transition-transform">
          <FileEdit class="h-3.5 w-3.5" />
        </div>
        <span class="font-pixel text-[8px] sm:text-[9px] text-[#fef08a] block uppercase">NILAI FGD</span>
        <span class="text-[7px] text-[#c4956a]">Rubrik Sesi</span>
      </NuxtLink>

      <NuxtLink
        to="/buddy/bonus"
        class="sdv-card-gold p-2 text-center flex flex-col items-center justify-center hover:border-[#facc15] transition-all active:scale-95 group cursor-pointer"
      >
        <div class="w-7 h-7 rounded-lg bg-[#281c12] border border-[#f0d060] flex items-center justify-center text-[#f0d060] mb-1 group-hover:scale-105 transition-transform">
          <Gift class="h-3.5 w-3.5" />
        </div>
        <span class="font-pixel text-[8px] sm:text-[9px] text-[#facc15] block uppercase">BONUS H3</span>
        <span class="text-[7px] text-[#86efac]">Apresiasi</span>
      </NuxtLink>

      <NuxtLink
        to="/buddy/leaderboard"
        class="sdv-card p-2 text-center flex flex-col items-center justify-center hover:border-[#f0d060] transition-all active:scale-95 group cursor-pointer"
      >
        <div class="w-7 h-7 rounded-lg bg-[#271d15] border border-[#f0d060] flex items-center justify-center text-[#38bdf8] mb-1 group-hover:scale-105 transition-transform">
          <Trophy class="h-3.5 w-3.5" />
        </div>
        <span class="font-pixel text-[8px] sm:text-[9px] text-[#38bdf8] block uppercase">KLASEMEN</span>
        <span class="text-[7px] text-[#c4956a]">Leaderboard</span>
      </NuxtLink>
    </div>

    <!-- Pos Gatekeeper & Server Timer Controller -->
    <BuddyPosController
      v-if="teamData?.id"
      :teamId="teamData.id"
      :teamName="currentTeamInfo.name"
    />

    <!-- Loading / Empty State -->
    <div v-if="loading" class="sdv-card p-6 text-center text-[#c4956a] font-mono text-xs">
      <div class="inline-block w-5 h-5 border-2 border-[#f0d060] border-t-transparent rounded-full animate-spin mb-2"></div>
      <div>Memuat data presensi Hari {{ activeDayTab }} dari server...</div>
    </div>
    <div v-else-if="activeMembers.length === 0" class="sdv-card p-6 text-center text-[#c4956a] font-mono text-xs">
      Belum ada mahasiswa baru yang terdaftar di regu ini.
    </div>

    <!-- Student Cards: Dual-Session Architecture (Jam Pertama & Kepulangan) -->
    <div v-else class="space-y-2.5">
      <div
        v-for="m in activeMembers"
        :key="m.id"
        class="sdv-card p-3 space-y-2.5 transition-all"
      >
        <!-- Top Row: Student Profile & Current XP -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Avatar -->
            <img
              :src="m.avatarUrl || '/character-cowok-avatar.png'"
              :alt="m.fullName"
              class="w-9 h-9 rounded-lg border border-[#f0d060] bg-black/40 shrink-0 object-cover"
            />
            <div class="min-w-0 leading-tight">
              <h3 class="font-bold text-xs sm:text-[13px] text-white truncate">
                {{ m.fullName }}
              </h3>
              <div class="text-[10px] text-[#c4956a] font-mono truncate mt-0.5">
                <span>{{ m.username }}</span>
                <span class="mx-1">&bull;</span>
                <span class="text-[#f0d060] font-semibold">{{ m.prodi }}</span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="font-pixel text-xs text-[#86efac] font-bold block">
              {{ m.totalXp }} XP
            </span>
            <span class="text-[9px] text-[#38bdf8] font-mono">
              {{ m.stampsCount }}/9 Pos
            </span>
          </div>
        </div>

        <!-- Middle: 2 Sesi Presensi Matching User Interface -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#5a3a18]">
          <!-- Sesi 1: Jam Pertama / Masuk Pagi (+100 XP) -->
          <div class="bg-[#170f07] p-2 rounded-lg border border-[#4a2e14] flex flex-col justify-between gap-1.5">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[9.5px] font-bold text-white flex items-center gap-1 font-mono">
                <Sun class="h-3 w-3 text-[#facc15]" />
                <span>Sesi 1: Masuk Pagi</span>
              </span>
              <span class="font-pixel text-[8.5px] text-[#facc15] font-bold">+100 XP</span>
            </div>

            <div class="flex items-center justify-between gap-1.5 pt-1 border-t border-[#3a200f]">
              <!-- Status Label -->
              <div>
                <span
                  v-if="m.checkInTime"
                  :class="[
                    'text-[8.5px] font-mono px-1.5 py-0.5 rounded border block',
                    m.attendanceStatus === 'LATE'
                      ? 'bg-[#2a1d08] border-[#f59e0b]/50 text-[#facc15]'
                      : 'bg-[#172513] border-[#22c55e]/50 text-[#86efac]'
                  ]"
                >
                  {{ m.attendanceStatus === 'LATE' ? '⚠ Telat' : '✓ Hadir' }} ({{ m.checkInTime }})
                </span>
                <span
                  v-else
                  class="text-[8.5px] font-mono text-red-400 bg-[#2a1210] border border-red-500/40 px-1.5 py-0.5 rounded block"
                >
                  Belum Hadir
                </span>
              </div>

              <!-- Button Action Sesi 1 -->
              <div v-if="!m.checkInTime" class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  :disabled="m.processingIn"
                  @click="markCheckIn(m, 'ON_TIME')"
                  class="rpg-btn-wood h-6 px-2 font-pixel text-[7.5px] font-bold flex items-center gap-1 shadow cursor-pointer disabled:opacity-40"
                  title="Tandai Hadir Tepat Waktu (+100 XP)"
                >
                  <span>+ HADIR</span>
                </button>
                <button
                  type="button"
                  :disabled="m.processingIn"
                  @click="markCheckIn(m, 'LATE')"
                  class="h-6 px-1.5 rounded bg-[#2a1d08] border border-[#f59e0b]/60 hover:border-[#f59e0b] text-[#facc15] font-pixel text-[7px] font-bold shadow cursor-pointer active:scale-95 disabled:opacity-40"
                  title="Tandai Terlambat (+50 XP)"
                >
                  <span>TELAT</span>
                </button>
              </div>
              <div v-else class="text-[8px] font-mono text-[#86efac] flex items-center gap-0.5">
                <CheckCircle2 class="h-3 w-3 text-[#22c55e]" />
                <span>Terverifikasi</span>
              </div>
            </div>
          </div>

          <!-- Sesi 2: Kepulangan / Check Out Sore (+50 XP) -->
          <div class="bg-[#170f07] p-2 rounded-lg border border-[#4a2e14] flex flex-col justify-between gap-1.5">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[9.5px] font-bold text-white flex items-center gap-1 font-mono">
                <Moon class="h-3 w-3 text-[#38bdf8]" />
                <span>Sesi 2: Pulang (Check-Out)</span>
              </span>
              <span class="font-pixel text-[8.5px] text-[#38bdf8] font-bold">+50 XP</span>
            </div>

            <div class="flex items-center justify-between gap-1.5 pt-1 border-t border-[#3a200f]">
              <!-- Status Label -->
              <div>
                <span
                  v-if="m.hasCheckedOut"
                  class="text-[8.5px] font-mono text-[#86efac] bg-[#172513] border border-[#22c55e]/50 px-1.5 py-0.5 rounded block"
                >
                  ✓ Pulang ({{ m.checkOutTime }})
                </span>
                <span
                  v-else-if="m.checkInTime"
                  class="text-[8.5px] font-mono text-[#facc15] bg-[#2a1d08] border border-[#f59e0b]/50 px-1.5 py-0.5 rounded block"
                >
                  Belum Pulang
                </span>
                <span
                  v-else
                  class="text-[8.5px] font-mono text-[#8a6b52] bg-[#140c06] border border-[#3a200f] px-1.5 py-0.5 rounded block"
                >
                  Menunggu Sesi Masuk
                </span>
              </div>

              <!-- Button Action Sesi 2 -->
              <div v-if="!m.hasCheckedOut" class="shrink-0">
                <button
                  type="button"
                  :disabled="m.processingOut"
                  @click="markCheckOut(m)"
                  class="rpg-btn-primary h-6 px-2.5 font-pixel text-[7.5px] font-bold flex items-center gap-1 shadow cursor-pointer disabled:opacity-40"
                  :title="m.checkInTime ? 'Tandai Selesai & Pulang (+50 XP)' : 'Presensi Masuk & Pulang Otomatis (+150 XP)'"
                >
                  <span>+ PULANG</span>
                </button>
              </div>
              <div v-else class="text-[8px] font-mono text-[#86efac] flex items-center gap-0.5">
                <CheckCircle2 class="h-3 w-3 text-[#22c55e]" />
                <span>Tuntas (+50 XP)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row: FGD Assessment Link -->
        <div class="flex items-center justify-between gap-2 pt-1 border-t border-[#3a200f] text-[10px]">
          <span class="text-[#a08060] font-mono text-[9px]">
            Status FGD: <strong :class="m.fgdScore ? 'text-[#86efac]' : 'text-[#facc15]'">{{ m.fgdScore ? `${m.fgdScore} XP Diperoleh` : 'Belum Dinilai' }}</strong>
          </span>

          <NuxtLink
            :to="`/buddy/fgd?participantId=${m.id}`"
            class="px-2 py-1 rounded bg-[#271d15] border border-[#f0d060]/70 hover:border-[#f0d060] text-[#fef08a] font-pixel text-[8px] font-bold flex items-center gap-1 transition-all active:scale-95"
          >
            <span>{{ m.fgdScore ? 'EDIT NILAI FGD' : 'NILAI FGD' }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  FileEdit,
  Gift,
  Trophy,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-vue-next";
import BuddyPosController from "@/components/buddy/BuddyPosController.vue";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

const { user } = useAuth();
const api = useApi();

interface BuddyMember {
  id: string;
  fullName: string;
  username: string; // NIM
  prodi: string; // Jurusan / Class
  avatarUrl: string;
  totalXp: number;
  attendanceStatus: "ON_TIME" | "LATE" | "ABSENT";
  checkInTime?: string;
  checkOutTime?: string;
  hasCheckedOut: boolean;
  stampsCount: number;
  fgdScore?: number;
  processingIn?: boolean;
  processingOut?: boolean;
}

const DAYS = [
  { day: 1, label: "HARI 1", date: "22 Sep", subtitle: "Ke-UNU-an" },
  { day: 2, label: "HARI 2", date: "23 Sep", subtitle: "Campus Quest" },
  { day: 3, label: "HARI 3", date: "24 Sep", subtitle: "Ormawa Expo" },
];

const activeDayTab = ref<number>(1);
const loading = ref(true);
const isBatchProcessing = ref(false);
const teamData = ref<any>(null);
const activeMembers = ref<BuddyMember[]>([]);
const leaderboardTeams = ref<any[]>([]);
const dayAttendanceCount = ref<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });

const toast = ref<{ type: "success" | "error" | "info"; message: string } | null>(null);

function showToast(type: "success" | "error" | "info", message: string) {
  toast.value = { type, message };
  setTimeout(() => {
    toast.value = null;
  }, 4000);
}

const cleanBuddyName = computed(() => {
  const raw = user.value?.fullName || "Buddy";
  return raw.replace(/^Kak(ak)?\s+/i, "").trim();
});

const currentTeamInfo = computed(() => {
  const name = teamData.value?.name || user.value?.teamName || "Genius 01";
  const routeName =
    teamData.value?.routeName ||
    (user.value?.assignedFloor ? `Lantai ${user.value.assignedFloor}` : "Lantai 1");
  return {
    name: name.replace(/^Team\s+/i, "").trim(),
    startFloor: routeName,
  };
});

const currentTeamScore = computed(() => {
  const found = leaderboardTeams.value.find(
    (t: any) =>
      t.teamId === teamData.value?.id || t.teamName === currentTeamInfo.value.name
  );
  if (found?.totalScore != null) return Number(found.totalScore).toLocaleString();
  return Number(teamData.value?.totalScore || 0).toLocaleString();
});

const currentTeamRank = computed(() => {
  const found = leaderboardTeams.value.find(
    (t: any) =>
      t.teamId === teamData.value?.id || t.teamName === currentTeamInfo.value.name
  );
  return found?.rank || 1;
});

const attendedInCount = computed(
  () => activeMembers.value.filter((m) => Boolean(m.checkInTime)).length
);

const attendedOutCount = computed(
  () => activeMembers.value.filter((m) => Boolean(m.hasCheckedOut)).length
);

const fgdCompletedCount = computed(
  () => activeMembers.value.filter((m) => Boolean(m.fgdScore)).length
);

function selectDay(day: number) {
  activeDayTab.value = day;
  loadData();
}

async function markCheckIn(member: BuddyMember, status: "ON_TIME" | "LATE" = "ON_TIME") {
  member.processingIn = true;
  try {
    const res = await api.post<{ success: boolean; data: any; message?: string }>(
      "/api/attendance/check-in",
      {
        participantId: member.id,
        day: activeDayTab.value,
        status,
        qrToken: `MANUAL-BUDDY-H${activeDayTab.value}`,
      }
    );

    if (res.success) {
      member.attendanceStatus = res.data?.checkInStatus || status;
      const now = new Date();
      member.checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      if (res.data?.totalXp != null) {
        member.totalXp = Number(res.data.totalXp);
      } else {
        member.totalXp += status === "LATE" ? 50 : 100;
      }
      showToast(
        "success",
        `Presensi Masuk ${member.fullName} berhasil (+${status === "LATE" ? 50 : 100} XP)`
      );
    }
  } catch (err: any) {
    showToast(
      "error",
      err?.data?.error?.message || err?.message || "Gagal mencatat presensi masuk"
    );
  } finally {
    member.processingIn = false;
  }
}

async function markCheckOut(member: BuddyMember) {
  member.processingOut = true;
  try {
    const res = await api.post<{ success: boolean; data: any; message?: string }>(
      "/api/attendance/check-out",
      {
        participantId: member.id,
        day: activeDayTab.value,
        qrToken: `MANUAL-BUDDY-PULANG-H${activeDayTab.value}`,
      }
    );

    if (res.success) {
      const now = new Date();
      member.checkOutTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      member.hasCheckedOut = true;
      if (!member.checkInTime) {
        member.checkInTime = member.checkOutTime;
        member.attendanceStatus = "ON_TIME";
      }
      if (res.data?.totalXp != null) {
        member.totalXp = Number(res.data.totalXp);
      } else {
        member.totalXp += 50;
      }
      showToast(
        "success",
        `Presensi Pulang ${member.fullName} berhasil (+50 XP)`
      );
    }
  } catch (err: any) {
    showToast(
      "error",
      err?.data?.error?.message || err?.message || "Gagal mencatat presensi pulang"
    );
  } finally {
    member.processingOut = false;
  }
}

async function handleBatchCheckIn() {
  const targets = activeMembers.value.filter((m) => !m.checkInTime).map((m) => m.id);
  if (targets.length === 0) {
    showToast("info", "Seluruh mahasiswa sudah presensi masuk.");
    return;
  }
  isBatchProcessing.value = true;
  try {
    const res = await api.post<{ success: boolean; count: number }>(
      "/api/attendance/batch-check-in",
      {
        participantIds: targets,
        day: activeDayTab.value,
        status: "ON_TIME",
      }
    );
    if (res.success) {
      showToast(
        "success",
        `Berhasil presensi masuk untuk ${res.count || targets.length} mahasiswa (+100 XP)`
      );
      await loadData();
    }
  } catch (err: any) {
    showToast("error", "Gagal memproses presensi masuk massal");
  } finally {
    isBatchProcessing.value = false;
  }
}

async function handleBatchCheckOut() {
  const targets = activeMembers.value
    .filter((m) => m.checkInTime && !m.hasCheckedOut)
    .map((m) => m.id);
  if (targets.length === 0) {
    showToast("info", "Tidak ada mahasiswa yang menunggu presensi pulang.");
    return;
  }
  isBatchProcessing.value = true;
  try {
    const res = await api.post<{ success: boolean; count: number }>(
      "/api/attendance/batch-check-out",
      {
        participantIds: targets,
        day: activeDayTab.value,
      }
    );
    if (res.success) {
      showToast(
        "success",
        `Berhasil presensi pulang untuk ${res.count || targets.length} mahasiswa (+50 XP)`
      );
      await loadData();
    }
  } catch (err: any) {
    showToast("error", "Gagal memproses presensi pulang massal");
  } finally {
    isBatchProcessing.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    // 1. Resolve Team ID
    let targetTeamId = user.value?.teamId;
    if (!targetTeamId) {
      const teamsRes = await api.get<{ success: boolean; data: any[] }>("/api/teams");
      if (teamsRes.success && teamsRes.data?.length) {
        const myTeam = teamsRes.data.find((t: any) =>
          t.buddies?.some((b: any) => b.userId === user.value?.id)
        );
        targetTeamId = myTeam ? myTeam.id : teamsRes.data[0].id;
      }
    }

    if (targetTeamId) {
      // 2. Fetch Team Details, Leaderboard, FGD Evaluations, and Attendance for activeDayTab
      const [teamRes, lbRes, evalsRes, attRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: any }>(`/api/teams/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>("/api/leaderboard"),
        api.get<{ success: boolean; data: any }>(
          `/api/buddy/evaluations/team/${targetTeamId}`
        ),
        api.get<{ success: boolean; data: any }>(
          `/api/attendance/recap?day=${activeDayTab.value}`
        ),
      ]);

      if (teamRes.status === "fulfilled" && teamRes.value.success) {
        teamData.value = teamRes.value.data;
      }

      if (lbRes.status === "fulfilled" && lbRes.value.success) {
        leaderboardTeams.value = lbRes.value.data?.teamLeaderboard || [];
      }

      const fgdEvalsMap = new Map<string, number>();
      if (evalsRes.status === "fulfilled" && evalsRes.value.success) {
        const evalsMembers = evalsRes.value.data?.members || [];
        evalsMembers.forEach((em: any) => {
          if (em.userId) fgdEvalsMap.set(em.userId, em.totalFgdXp || 0);
        });
      }

      const attendanceMap = new Map<
        string,
        {
          status: "ON_TIME" | "LATE";
          checkInTime?: string;
          checkOutTime?: string;
          hasCheckedOut: boolean;
        }
      >();

      if (attRes.status === "fulfilled" && attRes.value.success) {
        const attendees = attRes.value.data?.attendees || [];
        attendees.forEach((a: any) => {
          if (a.participantId) {
            const inTimeStr = a.checkInAt
              ? new Date(a.checkInAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined;
            const outTimeStr = a.checkOutAt
              ? new Date(a.checkOutAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined;
            attendanceMap.set(a.participantId, {
              status: a.checkInStatus === "LATE" ? "LATE" : "ON_TIME",
              checkInTime: inTimeStr,
              checkOutTime: outTimeStr,
              hasCheckedOut: Boolean(a.checkOutAt),
            });
          }
        });
      }

      // Map team members (participants only)
      const rawMembers = (teamData.value?.members || []).filter(
        (m: any) => m.role === "PARTICIPANT" || !m.role
      );
      activeMembers.value = rawMembers.map((m: any) => {
        const att = attendanceMap.get(m.userId || m.id);
        const fgdScore = fgdEvalsMap.get(m.userId || m.id);
        return {
          id: m.userId || m.id,
          fullName: m.fullName || "Mahasiswa",
          username: m.username || "-",
          prodi: m.characterClass || m.characterTitle || "Informatika",
          avatarUrl: m.avatarUrl || "/character-cowok-avatar.png",
          totalXp: Number(m.totalScore || 0),
          attendanceStatus: att?.checkInTime ? att.status : "ABSENT",
          checkInTime: att?.checkInTime,
          checkOutTime: att?.checkOutTime,
          hasCheckedOut: Boolean(att?.hasCheckedOut),
          stampsCount: Math.min(9, Math.floor(Number(m.totalScore || 0) / 100)),
          fgdScore: fgdScore && fgdScore > 0 ? fgdScore : undefined,
        };
      });

      // Update count for current tab
      dayAttendanceCount.value[activeDayTab.value] = activeMembers.value.filter((m) =>
        Boolean(m.checkInTime)
      ).length;
    }
  } catch (err: any) {
    console.error("Failed to load buddy dashboard data:", err);
  } finally {
    loading.value = false;
  }
}

const { onEvent } = useRealtime();
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribeWs: (() => void) | null = null;

onMounted(() => {
  loadData();
  unsubscribeWs = onEvent((event) => {
    if (
      [
        "SCORE_SUBMITTED",
        "XP_AWARDED",
        "LEADERBOARD_UPDATED",
        "GAME_SESSION_COMPLETED",
        "ATTENDANCE_CHECK_IN",
        "ATTENDANCE_CHECK_OUT",
        "ATTENDANCE_BATCH_CHECK_IN",
        "ATTENDANCE_BATCH_CHECK_OUT",
      ].includes(event)
    ) {
      loadData();
    }
  });
  refreshInterval = setInterval(loadData, 12000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (unsubscribeWs) unsubscribeWs();
});
</script>
