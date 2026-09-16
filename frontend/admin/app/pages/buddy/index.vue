<template>
  <div class="space-y-4 pb-10 font-sans px-1 sm:px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Compact Top Group Header -->
    <div class="pixel-card-gold p-3 sm:p-3.5 space-y-3 relative overflow-hidden group">
      <!-- Decorative Background Glow -->
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-700"></div>
      
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-2 relative z-10">
        <div class="space-y-1">
          <h1 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {{ currentTeamInfo.name }}
          </h1>
          <div class="flex flex-col gap-0.5">
            <span class="text-[10px] sm:text-[11px] text-[#c4956a] font-mono flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 bg-[#f0d060] rounded-sm shadow-[0_0_4px_#f0d060]"></span>
              Buddy: <strong class="text-white ml-1">{{ cleanBuddyName }}</strong>
            </span>
            <span class="text-[10px] sm:text-[11px] text-[#c4956a] font-mono flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 bg-[#86efac] rounded-sm shadow-[0_0_4px_#86efac]"></span>
              Rute: <strong class="text-[#86efac] ml-1">{{ currentTeamInfo.startFloor }}</strong>
            </span>
          </div>
        </div>

        <div class="self-start sm:self-auto text-left sm:text-right shrink-0 bg-black/40 p-2 rounded-lg border border-[#ca8a04]/50 shadow-inner backdrop-blur-sm min-w-[100px]">
          <span class="font-pixel text-sm text-[#86efac] font-bold block drop-shadow-[0_0_5px_rgba(134,239,172,0.4)]">
            {{ currentTeamScore }} PTS
          </span>
          <div class="mt-1 flex items-center sm:justify-end gap-1">
            <Trophy class="w-3 h-3 text-[#facc15]" />
            <span class="text-[9px] text-[#facc15] font-pixel">Rank #{{ currentTeamRank }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="grid grid-cols-3 gap-1.5 sm:gap-2 text-center font-mono text-[9px] sm:text-[10px] pt-2 border-t-2 border-[#ca8a04]/30 relative z-10">
        <div class="bg-[#120a05] py-1.5 px-1 sm:px-2 rounded-md border-b-2 border-r-2 border-[#ca8a04]/20 shadow-inner flex flex-col items-center justify-center">
          <span class="text-[#a08060] text-[7.5px] sm:text-[8px] block font-bold tracking-wider mb-0.5">TOTAL MABA</span>
          <span class="font-pixel text-[11px] sm:text-xs text-white">{{ activeMembers.length }}</span>
        </div>
        <div class="bg-[#120a05] py-1.5 px-1 sm:px-2 rounded-md border-b-2 border-r-2 border-[#22c55e]/20 shadow-inner flex flex-col items-center justify-center">
          <span class="text-[#a08060] text-[7.5px] sm:text-[8px] block font-bold tracking-wider mb-0.5">HADIR</span>
          <span class="font-pixel text-[11px] sm:text-xs text-[#86efac] drop-shadow-[0_0_2px_#86efac]">{{ attendedCount }}<span class="text-white/40 text-[8px] sm:text-[9px]">/{{ activeMembers.length }}</span></span>
        </div>
        <div class="bg-[#120a05] py-1.5 px-1 sm:px-2 rounded-md border-b-2 border-r-2 border-[#0ea5e9]/20 shadow-inner flex flex-col items-center justify-center">
          <span class="text-[#a08060] text-[7.5px] sm:text-[8px] block font-bold tracking-wider mb-0.5">FGD TUNTAS</span>
          <span class="font-pixel text-[11px] sm:text-xs text-[#38bdf8] drop-shadow-[0_0_2px_#38bdf8]">{{ fgdCompletedCount }}<span class="text-white/40 text-[8px] sm:text-[9px]">/{{ activeMembers.length }}</span></span>
        </div>
      </div>
    </div>

    <!-- Quick Actions Hub -->
    <div class="grid grid-cols-3 gap-1.5 sm:gap-2 font-mono">
      <NuxtLink
        to="/buddy/fgd"
        class="pixel-card p-2 sm:p-2.5 text-center flex flex-col items-center justify-center hover:bg-[#2a1d13] hover:border-[#f0d060] transition-all active:scale-95 group cursor-pointer relative overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-[#f0d060]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#120a05] border-2 border-[#f0d060]/50 flex items-center justify-center text-[#facc15] mb-1.5 group-hover:scale-110 group-hover:border-[#f0d060] transition-all group-hover:shadow-[0_0_10px_rgba(240,208,96,0.3)]">
          <FileEdit class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <span class="font-pixel text-[8px] sm:text-[9.5px] text-[#fef08a] block uppercase mb-0.5 drop-shadow-md">NILAI FGD</span>
        <span class="text-[7px] sm:text-[7.5px] text-[#c4956a] group-hover:text-[#e5b383] transition-colors line-clamp-1">Rubrik Sesi</span>
      </NuxtLink>

      <NuxtLink
        to="/buddy/bonus"
        class="pixel-card-gold p-2 sm:p-2.5 text-center flex flex-col items-center justify-center hover:bg-[#2a1d13] transition-all active:scale-95 group cursor-pointer relative overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-[#facc15]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#120a05] border-2 border-[#facc15] flex items-center justify-center text-[#facc15] mb-1.5 group-hover:scale-110 transition-all glow-gold">
          <Gift class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <span class="font-pixel text-[8px] sm:text-[9.5px] text-[#facc15] block uppercase mb-0.5 drop-shadow-md">BONUS H3</span>
        <span class="text-[7px] sm:text-[7.5px] text-[#86efac] line-clamp-1">Apresiasi</span>
      </NuxtLink>

      <NuxtLink
        to="/buddy/leaderboard"
        class="pixel-card p-2 sm:p-2.5 text-center flex flex-col items-center justify-center hover:bg-[#2a1d13] hover:border-[#38bdf8] transition-all active:scale-95 group cursor-pointer relative overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-[#38bdf8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#120a05] border-2 border-[#38bdf8]/50 flex items-center justify-center text-[#38bdf8] mb-1.5 group-hover:scale-110 group-hover:border-[#38bdf8] transition-all group-hover:shadow-[0_0_10px_rgba(56,189,248,0.3)]">
          <Trophy class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <span class="font-pixel text-[8px] sm:text-[9.5px] text-[#38bdf8] block uppercase mb-0.5 drop-shadow-md">KLASEMEN</span>
        <span class="text-[7px] sm:text-[7.5px] text-[#c4956a] group-hover:text-[#e5b383] transition-colors line-clamp-1">Leaderboard</span>
      </NuxtLink>
    </div>

    <!-- Pos Gatekeeper & Server Timer Controller -->
    <BuddyPosController
      v-if="teamData?.id"
      :teamId="teamData.id"
      :teamName="currentTeamInfo.name"
    />

    <!-- Loading / Empty State -->
    <div v-if="loading" class="pixel-card p-6 sm:p-8 text-center text-[#e5b383] font-mono text-xs flex flex-col items-center justify-center">
      <div class="w-8 h-8 relative mb-3">
        <div class="absolute inset-0 border-4 border-[#f0d060]/20 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-[#f0d060] rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div class="animate-pulse">Memuat data regu dari server...</div>
    </div>
    
    <div v-else-if="activeMembers.length === 0" class="pixel-card p-6 sm:p-8 text-center text-[#e5b383] font-mono text-[10px] sm:text-xs flex flex-col items-center border-dashed border-[#5a3a18]">
      <div class="text-3xl mb-2 opacity-50">👥</div>
      <p>Belum ada mahasiswa baru yang terdaftar di regu ini.</p>
    </div>

    <!-- Student Cards (Polished Retro Style) -->
    <div v-else class="space-y-3">
      <div class="flex items-center gap-2 mb-2 pl-1">
        <div class="w-1.5 h-1.5 bg-[#f0d060] rotate-45"></div>
        <h2 class="font-pixel text-[9px] sm:text-[11px] lg:text-xs text-[#e5b383] uppercase tracking-wider">Daftar Mahasiswa ({{ activeMembers.length }})</h2>
      </div>

      <!-- Locked Banner -->
      <div v-if="isLocked" class="bg-red-950/60 border border-red-500/50 rounded-lg p-3 sm:p-4 mb-4 flex items-start sm:items-center gap-3 shadow-lg">
        <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-900/80 border-2 border-red-400 flex items-center justify-center shrink-0">
          <span class="text-lg sm:text-xl leading-none">🔒</span>
        </div>
        <div class="min-w-0">
          <h3 class="font-pixel text-[10px] sm:text-xs text-red-400 uppercase tracking-widest mb-0.5">SISTEM DIKUNCI ADMIN</h3>
          <p class="text-[9px] sm:text-[10px] text-red-200/80 font-mono leading-tight">Penilaian FGD dan Absensi Manual telah ditutup. Hubungi pos informasi jika terdapat kendala darurat.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div
          v-for="(m, i) in activeMembers"
          :key="m.id"
          class="pixel-card p-2.5 sm:p-3.5 space-y-2 sm:space-y-3 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-col justify-between"
          :style="`animation-delay: ${i * 50}ms`"
        >
        <!-- Top Row: Name, NIM, Jurusan, XP -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <!-- Mini Avatar with Status Indicator -->
            <div class="relative shrink-0 group">
              <div class="absolute inset-0 bg-[#f0d060] rounded blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img
                :src="m.avatarUrl || '/character-cowok-avatar.png'"
                :alt="m.fullName"
                class="relative w-8 h-8 sm:w-10 sm:h-10 rounded border-2 border-[#5a3a18] bg-[#120a05] object-cover group-hover:border-[#f0d060] transition-colors"
              />
              <div 
                class="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-[#1d1611] flex items-center justify-center z-10"
                :class="{
                  'bg-[#22c55e]': m.attendanceStatus === 'ON_TIME',
                  'bg-[#f59e0b]': m.attendanceStatus === 'LATE',
                  'bg-[#ef4444]': m.attendanceStatus === 'ABSENT'
                }"
              ></div>
            </div>
            
            <div class="min-w-0 leading-tight">
              <h3 class="font-bold text-[11px] sm:text-[13px] text-white truncate drop-shadow-md">
                {{ m.fullName }}
              </h3>
              <div class="text-[8.5px] sm:text-[10px] text-[#c4956a] font-mono truncate mt-0.5">
                <span class="opacity-80">{{ m.username }}</span>
                <span class="mx-1 sm:mx-1.5 text-[#5a3a18]">|</span>
                <span class="text-[#f0d060]">{{ m.prodi }}</span>
              </div>
            </div>
          </div>

          <div class="self-start sm:self-auto bg-[#120a05] py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-md border border-[#4a3624] flex items-center sm:flex-col gap-2 sm:gap-0 sm:items-end justify-between w-full sm:w-auto">
            <span class="font-pixel text-[9.5px] sm:text-[11px] text-[#86efac] font-bold block drop-shadow-[0_0_2px_rgba(134,239,172,0.5)]">
              {{ m.totalXp }} XP
            </span>
            <div class="flex items-center gap-1 sm:mt-0.5">
              <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm bg-[#38bdf8] inline-block opacity-80"></span>
              <span class="text-[8px] sm:text-[8.5px] text-[#38bdf8] font-mono leading-none">
                {{ m.stampsCount }}/18
              </span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px w-full bg-gradient-to-r from-[#4a3624]/20 via-[#4a3624] to-[#4a3624]/20 sm:from-transparent sm:opacity-50"></div>

        <!-- Status & Direct Actions Row -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <!-- Status Pill -->
          <div>
            <div
              v-if="m.attendanceStatus === 'ON_TIME'"
              class="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-mono text-[#86efac] bg-[#172513] border border-[#22c55e]/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-inner"
            >
              <span class="text-[#22c55e]">✓</span> Hadir ({{ m.checkInTime }})
            </div>
            <div
              v-else-if="m.attendanceStatus === 'LATE'"
              class="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-mono text-[#facc15] bg-[#2a1d08] border border-[#f59e0b]/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-inner"
            >
              <span class="text-[#f59e0b]">⚠</span> Telat ({{ m.checkInTime }})
            </div>
            <div
              v-else
              class="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-mono text-red-400 bg-[#2a1210] border border-red-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-inner"
            >
              <span class="text-red-500">✗</span> Belum Hadir
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              v-if="!m.checkInTime"
              type="button"
              @click="markManualAttendance(m)"
              :disabled="isLocked"
              class="pixel-btn h-6 sm:h-7 px-2 sm:px-2.5 bg-[#4a3624] text-[#f0e0c0] font-pixel text-[7.5px] sm:text-[8px] font-bold flex items-center gap-1 transition-colors"
              :class="isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5a3a18]'"
            >
              <span v-if="!isLocked" class="text-[#86efac]">+</span>
              <span v-else class="text-red-400">🔒</span>
              HADIR
            </button>

            <NuxtLink
              :to="`/buddy/fgd?participantId=${m.id}`"
              class="pixel-btn h-6 sm:h-7 px-2 sm:px-2.5 font-pixel text-[7.5px] sm:text-[8px] font-bold flex items-center gap-1 sm:gap-1.5 transition-colors"
              :class="m.fgdScore ? 'bg-[#1e3a29] hover:bg-[#284a37] text-[#86efac] border-[#22c55e]' : 'bg-[#b45309] hover:bg-[#d97706] text-white'"
            >
              <FileEdit v-if="!m.fgdScore" class="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span class="text-[#86efac]" v-else>✓</span>
              <span>{{ m.fgdScore ? `FGD: ${m.fgdScore}` : 'NILAI FGD' }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FileEdit, Gift, Trophy } from "lucide-vue-next";
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
  stampsCount: number;
  fgdScore?: number;
}

const loading = ref(true);
const isLocked = ref(false);
const teamData = ref<any>(null);
const activeMembers = ref<BuddyMember[]>([]);
const leaderboardTeams = ref<any[]>([]);

const cleanBuddyName = computed(() => {
  const raw = user.value?.fullName || "Buddy";
  return raw.replace(/^Kak(ak)?\s+/i, "").trim();
});

const currentTeamInfo = computed(() => {
  const name = teamData.value?.name || user.value?.teamName || "Genius 01";
  const routeName = teamData.value?.routeName || (user.value?.assignedFloor ? `Lantai ${user.value.assignedFloor}` : "Lantai 1");
  return {
    name: name.replace(/^Team\s+/i, "").trim(),
    startFloor: routeName,
  };
});

const currentTeamScore = computed(() => {
  const found = leaderboardTeams.value.find(
    (t: any) => t.teamId === teamData.value?.id || t.teamName === currentTeamInfo.value.name
  );
  if (found?.totalScore != null) return Number(found.totalScore).toLocaleString();
  return Number(teamData.value?.totalScore || 0).toLocaleString();
});

const currentTeamRank = computed(() => {
  const found = leaderboardTeams.value.find(
    (t: any) => t.teamId === teamData.value?.id || t.teamName === currentTeamInfo.value.name
  );
  return found?.rank || 1;
});

const attendedCount = computed(
  () => activeMembers.value.filter((m) => m.attendanceStatus !== "ABSENT").length
);

const fgdCompletedCount = computed(
  () => activeMembers.value.filter((m) => !!m.fgdScore).length
);

async function markManualAttendance(member: BuddyMember) {
  if (isLocked.value) return;
  try {
    const res = await api.post<{ success: boolean; data: any }>("/api/attendance/check-in", {
      participantId: member.id,
      day: 1,
      qrToken: "QR-PRESENSI-H1-GATE",
    });

    if (res.success) {
      member.attendanceStatus = res.data?.checkInStatus || "ON_TIME";
      const now = new Date();
      member.checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} (Manual)`;
      member.totalXp += 100;
    }
  } catch (err: any) {
    console.error("Gagal presensi manual:", err);
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
      // 2. Fetch Team Details, Leaderboard, FGD Evaluations, Attendance, and System Settings
      const [teamRes, lbRes, evalsRes, attRes, settingsRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: any }>(`/api/teams/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>("/api/leaderboard"),
        api.get<{ success: boolean; data: any }>(`/api/buddy/evaluations/team/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>("/api/attendance/recap?day=1"),
        api.get<{ success: boolean; data: any }>("/api/system/settings"),
      ]);

      if (teamRes.status === "fulfilled" && teamRes.value.success) {
        teamData.value = teamRes.value.data;
      }

      if (lbRes.status === "fulfilled" && lbRes.value.success) {
        leaderboardTeams.value = lbRes.value.data?.teamLeaderboard || [];
      }

      if (settingsRes.status === "fulfilled" && settingsRes.value.success) {
        isLocked.value = settingsRes.value.data.isBuddyEvaluationLocked || false;
      }

      const fgdEvalsMap = new Map<string, number>();
      if (evalsRes.status === "fulfilled" && evalsRes.value.success) {
        const evalsMembers = evalsRes.value.data?.members || [];
        evalsMembers.forEach((em: any) => {
          if (em.userId) fgdEvalsMap.set(em.userId, em.totalFgdXp || 0);
        });
      }

      const attendanceMap = new Map<string, { status: "ON_TIME" | "LATE"; time: string }>();
      if (attRes.status === "fulfilled" && attRes.value.success) {
        const attendees = attRes.value.data?.attendees || [];
        attendees.forEach((a: any) => {
          if (a.participantId) {
            const timeStr = a.checkInAt ? new Date(a.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "07:30";
            attendanceMap.set(a.participantId, {
              status: a.checkInStatus === "LATE" ? "LATE" : "ON_TIME",
              time: timeStr,
            });
          }
        });
      }

      // Map team members (participants only)
      const rawMembers = (teamData.value?.members || []).filter((m: any) => m.role === "PARTICIPANT" || !m.role);
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
          attendanceStatus: att ? att.status : "ABSENT",
          checkInTime: att ? att.time : undefined,
          stampsCount: Math.min(18, Math.floor(Number(m.totalScore || 0) / 50)),
          fgdScore: fgdScore && fgdScore > 0 ? fgdScore : undefined,
        };
      });
    }
  } catch (err: any) {
    console.error("Failed to load buddy dashboard data:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
