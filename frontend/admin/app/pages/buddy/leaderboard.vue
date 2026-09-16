<template>
  <div class="space-y-4 pb-10 select-none font-sans px-1 sm:px-2 animate-in fade-in duration-500 text-[#f0e0c0]">
    <!-- Compact Header Banner -->
    <div class="pixel-card-gold p-4 sm:p-5 space-y-3 relative overflow-hidden group">
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-700"></div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 relative z-10">
        <div>
          <span class="border border-[#f0d060] bg-[#120a05] px-2 py-0.5 text-[9px] sm:text-[10px] font-pixel text-[#f0d060] uppercase tracking-wider rounded drop-shadow">
            KLASEMEN KAMPUS
          </span>
          <h1 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold mt-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            LEADERBOARD GENIUS 2026
          </h1>
        </div>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#120a05] border-2 border-[#f0d060] flex items-center justify-center shrink-0 shadow-lg glow-gold group-hover:scale-110 transition-transform">
          <Trophy class="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d060]" />
        </div>
      </div>

      <!-- Live / Freeze Status Pill -->
      <div class="flex flex-wrap items-center justify-between pt-2 border-t-2 border-[#ca8a04]/30 text-[10px] sm:text-[11px] font-mono gap-2 relative z-10">
        <div class="flex items-center gap-2 bg-[#120a05]/50 px-2.5 py-1.5 rounded-lg border border-[#22c55e]/30 shadow-inner">
          <span class="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_5px_#22c55e]"></span>
          <span class="text-[#86efac] font-bold tracking-wider">LIVE CLOUD SYNC</span>
        </div>
        <span class="text-[#c4956a] bg-[#120a05]/50 px-2.5 py-1.5 rounded-lg border border-[#ca8a04]/30 shadow-inner">
          Regu Anda: <strong class="text-[#facc15] font-pixel text-[10px] sm:text-[11px] drop-shadow-sm ml-1">{{ myTeamRankLabel }}</strong>
        </span>
      </div>
    </div>

    <!-- Controls Row (Tabs + Search) -->
    <div class="flex flex-col lg:flex-row gap-3 items-center">
      <!-- Tab Switcher: Kelompok vs Individu (Stardew Style) -->
      <div class="grid grid-cols-2 gap-2 font-mono text-xs p-1.5 bg-[#120a05] border-2 border-[#5a3a18] rounded-xl w-full lg:w-auto shrink-0 shadow-inner">
        <button
          type="button"
          @click="activeTab = 'teams'"
          :class="[
            'py-2 px-3 sm:px-5 rounded-lg font-pixel text-[9px] sm:text-[11px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
            activeTab === 'teams'
              ? 'pixel-btn-primary shadow-md text-white scale-[1.02]'
              : 'text-[#c4956a] hover:text-white hover:bg-[#2a1d13]'
          ]"
        >
          <Users class="h-4 w-4" />
          <span>REGU</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'individuals'"
          :class="[
            'py-2 px-3 sm:px-5 rounded-lg font-pixel text-[9px] sm:text-[11px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
            activeTab === 'individuals'
              ? 'pixel-btn-primary shadow-md text-white scale-[1.02]'
              : 'text-[#c4956a] hover:text-white hover:bg-[#2a1d13]'
          ]"
        >
          <User class="h-4 w-4" />
          <span>INDIVIDU</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="activeTab === 'teams' ? 'Cari nama kelompok atau kode...' : 'Cari nama maba atau NIM...'"
          class="w-full bg-[#120a05] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-xl pl-9 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none font-mono placeholder:text-[#8b5a2b] shadow-inner transition-colors focus:shadow-[0_0_10px_rgba(240,208,96,0.15)]"
        />
        <Search class="h-4 w-4 sm:h-5 sm:w-5 text-[#f0d060] absolute left-3 top-2.5 sm:top-3 opacity-80" />
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="pixel-card p-8 text-center text-[#e5b383] font-mono text-xs sm:text-sm flex flex-col items-center justify-center min-h-[200px]">
      <div class="w-8 h-8 relative mb-4">
        <div class="absolute inset-0 border-4 border-[#f0d060]/20 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-[#f0d060] rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div class="animate-pulse">Menyelaraskan data klasemen kampus...</div>
    </div>

    <!-- TAB 1: KLASEMEN REGU (TEAMS) -->
    <div v-else-if="activeTab === 'teams'" class="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <!-- Top 3 Podium (Mini Physical Cards) -->
      <div class="grid grid-cols-3 gap-2 sm:gap-4 pt-2 pb-2 font-mono max-w-3xl mx-auto items-end">
        <!-- 2nd Place -->
        <div class="pixel-card p-2 sm:p-3 text-center flex flex-col justify-end items-center h-[120px] sm:h-[140px] hover:-translate-y-1 transition-transform group">
          <Medal class="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-1.5 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />
          <span class="font-pixel text-[8px] sm:text-[9px] text-gray-300 tracking-wider">#2 PERAK</span>
          <span class="font-sans text-[11px] sm:text-xs font-bold text-white line-clamp-2 mt-1 px-1 drop-shadow-md">{{ rank2Team?.name || '-' }}</span>
          <span class="font-pixel text-[9px] sm:text-[10px] text-[#86efac] font-bold mt-auto bg-[#172513] px-2 py-1 rounded border border-[#22c55e]/30 w-full">{{ rank2Team ? `${rank2Team.score.toLocaleString()} PTS` : '- PTS' }}</span>
        </div>

        <!-- 1st Place (Winner / Highlight) -->
        <div class="pixel-card-gold p-2.5 sm:p-3 text-center flex flex-col justify-end items-center h-[140px] sm:h-[160px] scale-105 shadow-xl hover:-translate-y-2 transition-transform group z-10">
          <Crown class="h-8 w-8 sm:h-10 sm:w-10 text-[#facc15] mb-1.5 group-hover:scale-110 transition-transform drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
          <span class="font-pixel text-[9px] sm:text-[10px] text-[#facc15] tracking-wider drop-shadow">#1 EMAS</span>
          <span class="font-sans text-[12px] sm:text-sm font-bold text-[#fef08a] line-clamp-2 mt-1 px-1 drop-shadow-md">{{ rank1Team?.name || '-' }}</span>
          <span class="font-pixel text-[10px] sm:text-[11px] text-[#facc15] font-bold mt-auto bg-[#2a1d08] px-2 py-1 rounded border border-[#ca8a04]/50 w-full shadow-inner">{{ rank1Team ? `${rank1Team.score.toLocaleString()} PTS` : '- PTS' }}</span>
        </div>

        <!-- 3rd Place -->
        <div class="pixel-card p-2 sm:p-3 text-center flex flex-col justify-end items-center h-[110px] sm:h-[130px] hover:-translate-y-1 transition-transform group">
          <Medal class="h-5 w-5 sm:h-7 sm:w-7 text-[#ea580c] mb-1.5 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
          <span class="font-pixel text-[8px] sm:text-[9px] text-[#fb923c] tracking-wider">#3 PERUNGGU</span>
          <span class="font-sans text-[10px] sm:text-[11px] font-bold text-white line-clamp-2 mt-1 px-1 drop-shadow-md">{{ rank3Team?.name || '-' }}</span>
          <span class="font-pixel text-[9px] sm:text-[10px] text-[#86efac] font-bold mt-auto bg-[#172513] px-2 py-1 rounded border border-[#22c55e]/30 w-full">{{ rank3Team ? `${rank3Team.score.toLocaleString()} PTS` : '- PTS' }}</span>
        </div>
      </div>

      <!-- Team List -->
      <div>
        <div v-if="filteredTeams.length === 0" class="pixel-card p-6 sm:p-8 text-center text-[#e5b383] font-mono text-[10px] sm:text-xs border-dashed border-[#5a3a18]">
          <div class="text-3xl mb-2 opacity-50">🔍</div>
          <p>Tidak ada regu yang cocok dengan pencarian.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            v-for="team in filteredTeams"
            :key="team.id"
            :class="[
              'p-3 sm:p-4 rounded-xl border-2 flex items-center justify-between transition-all hover:-translate-y-1 hover:shadow-lg',
              isMyTeam(team.id)
                ? 'pixel-card-gold border-[#f0d060] shadow-[0_0_15px_rgba(240,208,96,0.15)] z-10'
                : 'pixel-card'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Rank Badge -->
              <div
                :class="[
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-pixel text-sm sm:text-base shrink-0 shadow-inner',
                  team.rank === 1 ? 'bg-[#ca8a04] text-[#140e08] border-2 border-[#fef08a]' :
                  team.rank === 2 ? 'bg-gray-400 text-black border-2 border-gray-200' :
                  team.rank === 3 ? 'bg-amber-800 text-white border-2 border-amber-500' :
                  'bg-[#120a05] border-2 border-[#5a3a18] text-[#c4956a]'
                ]"
              >
                #{{ team.rank }}
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-sans text-xs sm:text-sm text-white font-bold truncate drop-shadow-md">
                    {{ team.name }}
                  </span>
                  <span
                    v-if="isMyTeam(team.id)"
                    class="font-pixel text-[7px] sm:text-[8px] text-[#120a05] bg-[#f0d060] px-1.5 sm:px-2 py-0.5 rounded shrink-0 shadow font-bold"
                  >
                    REGU ANDA
                  </span>
                </div>
                <div class="text-[9.5px] sm:text-[10px] text-[#c4956a] font-mono mt-0.5 truncate">
                  Kode: <strong class="text-[#e5b383]">{{ team.code }}</strong> <span class="mx-1 sm:mx-1.5 text-[#5a3a18]">|</span> {{ team.completedStamps }}/18 Pos
                </div>
              </div>
            </div>

            <div class="text-right shrink-0 bg-[#120a05] py-1 px-2 sm:px-3 rounded-lg border border-[#4a3624] shadow-inner ml-2">
              <span class="font-pixel text-[11px] sm:text-xs text-[#86efac] font-bold block drop-shadow-[0_0_3px_rgba(134,239,172,0.4)]">
                {{ team.score.toLocaleString() }}
              </span>
              <span class="text-[7.5px] sm:text-[8px] text-[#a08060] font-mono mt-0.5 block border-t border-[#4a3624] pt-0.5">POIN REGU</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: KLASEMEN INDIVIDU (INDIVIDUALS) -->
    <div v-else-if="activeTab === 'individuals'" class="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div v-if="filteredStudents.length === 0" class="pixel-card p-6 sm:p-8 text-center text-[#e5b383] font-mono text-[10px] sm:text-xs border-dashed border-[#5a3a18]">
        <div class="text-3xl mb-2 opacity-50">🔍</div>
        <p>Tidak ada mahasiswa yang cocok dengan pencarian.</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div
          v-for="student in filteredStudents"
          :key="student.id"
          :class="[
            'p-3 sm:p-4 rounded-xl border-2 flex items-center justify-between transition-all hover:-translate-y-1 hover:shadow-lg',
            isMyMember(student.id)
              ? 'pixel-card-gold border-[#f0d060] shadow-[0_0_15px_rgba(240,208,96,0.15)] z-10'
              : 'pixel-card'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- Rank Badge -->
            <div
              :class="[
                'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-pixel text-sm sm:text-base shrink-0 shadow-inner',
                student.rank === 1 ? 'bg-[#ca8a04] text-[#140e08] border-2 border-[#fef08a]' :
                student.rank === 2 ? 'bg-gray-400 text-black border-2 border-gray-200' :
                student.rank === 3 ? 'bg-amber-800 text-white border-2 border-amber-500' :
                'bg-[#120a05] border-2 border-[#5a3a18] text-[#c4956a]'
              ]"
            >
              #{{ student.rank }}
            </div>

            <img
              :src="student.avatarUrl"
              :alt="student.fullName"
              class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-[#f0d060] bg-[#120a05] shrink-0 object-cover shadow"
            />

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-sans text-xs sm:text-sm text-white font-bold truncate drop-shadow-md">
                  {{ student.fullName }}
                </span>
                <span
                  v-if="isMyMember(student.id)"
                  class="font-pixel text-[7px] sm:text-[8px] text-[#120a05] bg-[#f0d060] px-1.5 sm:px-2 py-0.5 rounded shrink-0 shadow font-bold"
                >
                  BINAAN
                </span>
              </div>
              <span class="text-[9px] sm:text-[10px] text-[#c4956a] font-mono truncate mt-0.5 block">
                NIM {{ student.username }} <span class="mx-1 text-[#5a3a18]">|</span> <strong class="text-[#f0d060]">{{ student.prodi }}</strong> <span class="mx-1 text-[#5a3a18]">|</span> {{ student.teamName }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0 bg-[#120a05] py-1 px-2 sm:px-3 rounded-lg border border-[#4a3624] shadow-inner ml-2">
            <span class="font-pixel text-[11px] sm:text-xs text-[#86efac] font-bold block drop-shadow-[0_0_3px_rgba(134,239,172,0.4)]">
              {{ student.totalXp.toLocaleString() }} XP
            </span>
            <span class="text-[7.5px] sm:text-[8px] text-[#f0d060] font-mono mt-0.5 block border-t border-[#4a3624] pt-0.5">
              {{ student.stamps }}/18 POS
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Trophy,
  Users,
  User,
  Search,
  Crown,
  Medal,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";
import { useRealtime } from "~/composables/useRealtime";

const { user } = useAuth();
const api = useApi();
const { onLeaderboardUpdate } = useRealtime();

const activeTab = ref<"teams" | "individuals">("teams");
const searchQuery = ref("");
const loading = ref(true);

interface TeamRankItem {
  id: string;
  rank: number;
  name: string;
  code: string;
  score: number;
  completedStamps: number;
  buddyName: string;
}

interface StudentRankItem {
  id: string;
  rank: number;
  fullName: string;
  username: string;
  prodi: string;
  teamName: string;
  teamId?: string;
  totalXp: number;
  stamps: number;
  avatarUrl: string;
}

const allTeams = ref<TeamRankItem[]>([]);
const allStudents = ref<StudentRankItem[]>([]);

const rank1Team = computed(() => allTeams.value.find((t) => t.rank === 1) || allTeams.value[0]);
const rank2Team = computed(() => allTeams.value.find((t) => t.rank === 2) || allTeams.value[1]);
const rank3Team = computed(() => allTeams.value.find((t) => t.rank === 3) || allTeams.value[2]);

const currentTeamId = computed(() => {
  return user.value?.teamId || "";
});

const isMyTeam = (teamId: string) => {
  if (!currentTeamId.value) return false;
  return teamId === currentTeamId.value;
};

const isMyMember = (studentId: string) => {
  const student = allStudents.value.find((s) => s.id === studentId);
  if (!currentTeamId.value || !student?.teamId) return false;
  return student.teamId === currentTeamId.value;
};

const myTeamRankLabel = computed(() => {
  if (!currentTeamId.value) {
    const first = allTeams.value[0];
    return first ? `#${first.rank} (${first.score.toLocaleString()} PTS)` : "#-";
  }
  const found = allTeams.value.find((t) => t.id === currentTeamId.value || t.name === user.value?.teamName);
  if (found) return `#${found.rank} (${found.score.toLocaleString()} PTS)`;
  return "#-";
});

const filteredTeams = computed(() => {
  if (!searchQuery.value.trim()) return allTeams.value;
  const q = searchQuery.value.toLowerCase();
  return allTeams.value.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.buddyName.toLowerCase().includes(q)
  );
});

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) return allStudents.value;
  const q = searchQuery.value.toLowerCase();
  return allStudents.value.filter(
    (s) =>
      s.fullName.toLowerCase().includes(q) ||
      s.username.includes(q) ||
      s.teamName.toLowerCase().includes(q)
  );
});

async function fetchLeaderboard() {
  loading.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any }>("/api/leaderboard");
    if (res.success && res.data) {
      const rawTeams = res.data.teamLeaderboard || [];
      allTeams.value = rawTeams.map((t: any, idx: number) => ({
        id: t.teamId,
        rank: t.rank || idx + 1,
        name: t.teamName || "Genius Tim",
        code: t.teamCode || "-",
        score: Number(t.totalScore || 0),
        completedStamps: Math.min(18, Math.floor(Number(t.totalScore || 0) / 100)),
        buddyName: t.buddyName || "Buddy",
      }));

      const rawParticipants = res.data.participantLeaderboard || [];
      allStudents.value = rawParticipants.map((p: any, idx: number) => ({
        id: p.participantId,
        rank: p.rank || idx + 1,
        fullName: p.participantName || "Mahasiswa",
        username: p.username || "-",
        prodi: p.characterClass || p.characterTitle || "Informatika",
        teamName: p.teamName || "Genius",
        teamId: p.teamId,
        totalXp: Number(p.totalScore || 0),
        stamps: Math.min(18, Math.floor(Number(p.totalScore || 0) / 50)),
        avatarUrl: p.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png",
      }));
    }
  } catch (err: any) {
    console.error("Gagal memuat leaderboard buddy:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchLeaderboard();
  onLeaderboardUpdate(() => {
    fetchLeaderboard();
  });
});
</script>
