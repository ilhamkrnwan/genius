<template>
  <div class="space-y-4 pb-10 select-none font-sans px-1 sm:px-2 animate-in fade-in duration-500 text-[#f0e0c0]">
    
    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
      <!-- Left Column: Context & Member Selection (Sticky on Desktop) -->
      <div class="w-full lg:w-[40%] space-y-4 lg:sticky lg:top-20">
        <!-- Compact Header -->
        <div class="pixel-card-gold p-3 sm:p-4 space-y-3 relative overflow-hidden group">
          <div class="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-700"></div>
          
          <div class="flex items-start justify-between relative z-10">
            <div>
              <span class="border border-[#f0d060] bg-[#120a05] px-1.5 py-0.5 text-[8px] sm:text-[9px] font-pixel text-[#f0d060] uppercase tracking-wider rounded drop-shadow">
                EVALUASI BUDDY
              </span>
              <h1 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold mt-1.5 flex items-center gap-1.5 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                <FileEdit class="h-4 w-4 text-[#facc15]" />
                <span>NILAI FGD SANTRI</span>
              </h1>
            </div>
            
            <span class="border-2 border-[#f0d060] bg-[#120a05] px-2.5 py-1 text-[9px] sm:text-[10px] font-pixel text-[#facc15] rounded-lg shrink-0 shadow-inner">
              {{ selectedSession }}
            </span>
          </div>

          <!-- Sesi Selector Tabs -->
          <div class="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs relative z-10">
            <button
              v-for="s in fgdSessions"
              :key="s.id"
              type="button"
              @click="selectedSession = s.id"
              :class="[
                'p-2 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center justify-center font-mono active:scale-95',
                selectedSession === s.id
                  ? 'bg-[#ca8a04] border-[#facc15] text-[#120a05] font-bold shadow-md'
                  : 'bg-[#120a05] border-[#5a3a18] text-[#c4956a] hover:border-[#f0d060] hover:text-[#f0e0c0]'
              ]"
            >
              <span class="font-pixel text-[9px] sm:text-[10px]">{{ s.id }}</span>
              <span class="text-[7.5px] sm:text-[8px] truncate mt-0.5">{{ s.dayLabel }}</span>
            </button>
          </div>

          <!-- Topic Pill -->
          <div class="px-2.5 py-1.5 bg-[#120a05] border border-[#ca8a04]/30 rounded-lg flex items-center justify-between text-[11px] relative z-10 shadow-inner">
            <span class="text-[#86efac] font-bold truncate drop-shadow-[0_0_2px_#86efac]">{{ currentSessionInfo?.topic }}</span>
            <span class="text-[9px] text-[#facc15] font-mono shrink-0 ml-2 border border-[#facc15]/30 bg-[#2a1d08] px-1 rounded">Maks +200 XP</span>
          </div>
        </div>

        <!-- Member Selector / Loading / Empty -->
        <div v-if="loading" class="pixel-card p-6 sm:p-8 text-center text-[#e5b383] font-mono text-xs flex flex-col items-center justify-center">
          <div class="w-8 h-8 relative mb-3">
            <div class="absolute inset-0 border-4 border-[#f0d060]/20 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-[#f0d060] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div class="animate-pulse">Memuat anggota regu & rubrik...</div>
        </div>
        
        <div v-else-if="teamMembers.length === 0" class="pixel-card p-6 sm:p-8 text-center text-[#e5b383] font-mono text-[10px] sm:text-xs flex flex-col items-center border-dashed border-[#5a3a18]">
          <div class="text-3xl mb-2 opacity-50">👥</div>
          <p>Belum ada mahasiswa yang terdaftar di regu bimbingan Anda.</p>
        </div>

        <!-- Locked Banner -->
        <div v-else-if="isLocked" class="bg-red-950/60 border border-red-500/50 rounded-lg p-3 sm:p-4 mb-4 flex items-start sm:items-center gap-3 shadow-lg">
          <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-900/80 border-2 border-red-400 flex items-center justify-center shrink-0">
            <span class="text-lg sm:text-xl leading-none">🔒</span>
          </div>
          <div class="min-w-0">
            <h3 class="font-pixel text-[10px] sm:text-xs text-red-400 uppercase tracking-widest mb-0.5">SISTEM DIKUNCI ADMIN</h3>
            <p class="text-[9px] sm:text-[10px] text-red-200/80 font-mono leading-tight">Penilaian FGD telah ditutup oleh Admin.</p>
          </div>
        </div>

        <!-- Member Grid/Carousel -->
        <div v-else class="space-y-2">
          <div class="flex items-center gap-2 pl-1">
            <div class="w-1.5 h-1.5 bg-[#f0d060] rotate-45"></div>
            <span class="font-pixel text-[9px] sm:text-[10px] text-[#e5b383] uppercase tracking-wider block">
              PILIH MAHASISWA:
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 lg:max-h-[50vh] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <button
              v-for="m in teamMembers"
              :key="m.id"
              type="button"
              @click="selectMember(m)"
              :class="[
                'p-2 sm:p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 sm:gap-3 text-left active:scale-95 group relative overflow-hidden',
                selectedMember?.id === m.id
                  ? 'bg-[#2a1d13] border-[#f0d060] shadow-[0_0_10px_rgba(240,208,96,0.3)] z-10 scale-[1.02]'
                  : 'bg-[#120a05] border-[#5a3a18] hover:border-[#8b5a2b] hover:bg-[#1a100a]'
              ]"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-[#f0d060]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img
                :src="m.avatarUrl || '/character-cowok-avatar.png'"
                :alt="m.fullName"
                class="h-8 w-8 sm:h-10 sm:w-10 rounded-lg border-2 border-[#5a3a18] object-cover bg-black/40 shrink-0 group-hover:border-[#f0d060] transition-colors relative z-10"
                :class="selectedMember?.id === m.id ? 'border-[#f0d060]' : ''"
              />
              <div class="min-w-0 relative z-10">
                <div class="font-bold text-[11px] sm:text-xs truncate font-sans" :class="selectedMember?.id === m.id ? 'text-white' : 'text-[#e5b383] group-hover:text-white'">{{ m.fullName }}</div>
                <div class="text-[9px] sm:text-[10px] text-[#c4956a] truncate font-mono mt-0.5">
                  <span class="text-[#f0d060]">{{ m.prodi }}</span>
                  <span v-if="m.evaluations?.some(e => e.sessionId === selectedSession)" class="ml-2 text-[#86efac]">✓ Dinilai</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Rubrik Penilaian -->
      <div v-if="selectedMember" class="w-full lg:w-[60%]">
        <div class="pixel-card p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-4">
          <!-- Target Member Header -->
          <div class="flex items-center justify-between border-b-2 border-[#5a3a18]/50 pb-3">
            <div class="flex items-center gap-3 sm:gap-4">
              <img
                :src="selectedMember.avatarUrl || '/character-cowok-avatar.png'"
                :alt="selectedMember.fullName"
                class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-2 border-[#f0d060] object-cover bg-[#120a05] shrink-0 shadow-lg"
              />
              <div>
                <span class="text-[8px] sm:text-[9px] font-pixel text-[#86efac] uppercase tracking-widest drop-shadow">MENILAI:</span>
                <h2 class="font-bold text-sm sm:text-base text-[#fef08a] font-sans drop-shadow-md">
                  {{ selectedMember.fullName }}
                </h2>
                <span class="text-[10px] sm:text-[11px] text-[#c4956a] font-mono mt-0.5 block">
                  NIM {{ selectedMember.username }} <span class="mx-1 text-[#5a3a18]">|</span> {{ selectedMember.prodi }}
                </span>
              </div>
            </div>

            <div class="text-right shrink-0 bg-[#120a05] p-2 rounded-lg border border-[#4a3624] shadow-inner">
              <span class="font-pixel text-[13px] sm:text-[15px] text-[#86efac] font-bold block drop-shadow-[0_0_5px_rgba(134,239,172,0.4)]">
                +{{ calculatedXp }} XP
              </span>
              <span class="text-[9px] sm:text-[10px] text-[#c4956a] font-mono mt-1 block border-t border-[#4a3624] pt-1">Skor: {{ totalScore }}/15</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <!-- Pilar 1: Keaktifan Diskusi -->
            <div class="bg-[#120a05] border border-[#5a3a18] p-3 sm:p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-[#f0d060]/50 transition-colors group">
              <div class="flex items-center justify-between">
                <label class="font-pixel text-[9px] sm:text-[10px] text-[#f0d060] flex items-center gap-1.5 drop-shadow">
                  <Sparkles class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#facc15] group-hover:animate-pulse" />
                  <span>1. KEAKTIFAN DISKUSI</span>
                </label>
                <span class="font-pixel text-[11px] sm:text-xs text-[#86efac] font-bold">{{ scoreKeaktifan }}/5</span>
              </div>
              <div class="grid grid-cols-5 gap-1.5 sm:gap-2 font-pixel text-[11px] sm:text-xs">
                <button
                  v-for="val in 5"
                  :key="val"
                  type="button"
                  @click="scoreKeaktifan = val"
                  :class="[
                    'h-8 sm:h-10 rounded border-2 transition-all cursor-pointer font-bold active:scale-95',
                    scoreKeaktifan === val
                      ? 'bg-[#ca8a04] text-[#120a05] border-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-105'
                      : 'bg-[#2a1d13] text-[#c4956a] border-[#4a3624] hover:border-[#f0d060] hover:text-[#f0e0c0]'
                  ]"
                >
                  {{ val }}
                </button>
              </div>
            </div>

            <!-- Pilar 2: Kedalaman Gagasan -->
            <div class="bg-[#120a05] border border-[#5a3a18] p-3 sm:p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-[#38bdf8]/50 transition-colors group">
              <div class="flex items-center justify-between">
                <label class="font-pixel text-[9px] sm:text-[10px] text-[#38bdf8] flex items-center gap-1.5 drop-shadow">
                  <Lightbulb class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#38bdf8] group-hover:animate-pulse" />
                  <span>2. KEDALAMAN GAGASAN</span>
                </label>
                <span class="font-pixel text-[11px] sm:text-xs text-[#38bdf8] font-bold">{{ scoreKedalaman }}/5</span>
              </div>
              <div class="grid grid-cols-5 gap-1.5 sm:gap-2 font-pixel text-[11px] sm:text-xs">
                <button
                  v-for="val in 5"
                  :key="val"
                  type="button"
                  @click="scoreKedalaman = val"
                  :class="[
                    'h-8 sm:h-10 rounded border-2 transition-all cursor-pointer font-bold active:scale-95',
                    scoreKedalaman === val
                      ? 'bg-[#0284c7] text-white border-[#7dd3fc] shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-105'
                      : 'bg-[#2a1d13] text-[#c4956a] border-[#4a3624] hover:border-[#38bdf8] hover:text-[#f0e0c0]'
                  ]"
                >
                  {{ val }}
                </button>
              </div>
            </div>

            <!-- Pilar 3: Adab & Tawadhu' -->
            <div class="bg-[#120a05] border border-[#5a3a18] p-3 sm:p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-[#f472b6]/50 transition-colors group sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <div class="flex items-center justify-between">
                <label class="font-pixel text-[9px] sm:text-[10px] text-[#f472b6] flex items-center gap-1.5 drop-shadow">
                  <HeartHandshake class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#ec4899] group-hover:animate-pulse" />
                  <span>3. ADAB &amp; TAWADHU'</span>
                </label>
                <span class="font-pixel text-[11px] sm:text-xs text-[#ec4899] font-bold">{{ scoreAdab }}/5</span>
              </div>
              <div class="grid grid-cols-5 gap-1.5 sm:gap-2 font-pixel text-[11px] sm:text-xs max-w-md mx-auto xl:max-w-none">
                <button
                  v-for="val in 5"
                  :key="val"
                  type="button"
                  @click="scoreAdab = val"
                  :class="[
                    'h-8 sm:h-10 rounded border-2 transition-all cursor-pointer font-bold active:scale-95',
                    scoreAdab === val
                      ? 'bg-[#db2777] text-white border-[#fbcfe8] shadow-[0_0_8px_rgba(244,114,182,0.5)] scale-105'
                      : 'bg-[#2a1d13] text-[#c4956a] border-[#4a3624] hover:border-[#f472b6] hover:text-[#f0e0c0]'
                  ]"
                >
                  {{ val }}
                </button>
              </div>
            </div>
          </div>

          <!-- Catatan Buddy Singkat -->
          <div class="space-y-1.5 pt-2 border-t border-[#5a3a18]/50">
            <label class="font-pixel text-[9px] sm:text-[10px] text-[#e5b383] uppercase flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 bg-[#f0d060] rotate-45"></div>
              CATATAN APRESIASI (OPSIONAL):
            </label>
            <input
              v-model="feedbackNotes"
              type="text"
              :disabled="isLocked"
              placeholder="Berikan catatan motivasi singkat untuk mahasiswa ini..."
              class="w-full bg-[#120a05] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white outline-none font-sans shadow-inner transition-colors focus:shadow-[0_0_10px_rgba(240,208,96,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <!-- Submit Action Button -->
          <button
            v-if="!isLocked"
            type="button"
            @click="submitFgdEvaluation"
            :disabled="submitting"
            class="pixel-btn-primary w-full h-11 sm:h-12 font-pixel text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-[#4a3624] hover:bg-[#5a3a18] text-[#f0e0c0] border-2 border-[#8b5a2b]"
            :class="submitting ? 'opacity-70 pointer-events-none' : 'hover:border-[#f0d060] hover:text-[#fef08a]'"
          >
            <CheckCircle2 class="h-4 w-4 sm:h-5 sm:w-5" :class="submitting ? 'animate-pulse' : 'text-[#86efac]'" />
            <span>{{ submitting ? 'MENYIMPAN DATA...' : `SIMPAN NILAI FGD (+${calculatedXp} XP)` }}</span>
          </button>
          
          <div v-else class="w-full h-11 sm:h-12 font-pixel text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 bg-[#2a1210] text-red-400 border-2 border-red-900 rounded opacity-70">
            <span class="text-lg leading-none">🔒</span>
            <span>TERKUNCI</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-24 lg:bottom-10 right-4 lg:right-10 z-50 px-4 py-3 bg-[#172513] border-2 border-[#22c55e] text-[#86efac] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] font-mono text-[10px] sm:text-xs flex items-center gap-3 animate-in slide-in-from-right-8"
    >
      <div class="h-6 w-6 rounded-full bg-[#22c55e]/20 flex items-center justify-center shrink-0">
        <CheckCircle2 class="h-4 w-4 text-[#22c55e]" />
      </div>
      <span class="font-bold">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  FileEdit,
  Sparkles,
  Lightbulb,
  HeartHandshake,
  CheckCircle2,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

const { user } = useAuth();
const api = useApi();
const route = useRoute();

const fgdSessions = [
  { id: "FGD-1", dayLabel: "H-1 Pagi", topic: "Ke UNU Apa Yang Kau Cari?" },
  { id: "FGD-2", dayLabel: "H-1 Siang", topic: "Agent of Change & Bela Negara" },
  { id: "FGD-6", dayLabel: "H-3 Siang", topic: "Refleksi & Aksi Nyata Mahasiswa" },
];

const selectedSession = ref("FGD-1");

interface FgdMember {
  id: string;
  fullName: string;
  username: string; // NIM
  prodi: string; // Jurusan / Class
  avatarUrl: string;
  evaluations?: any[];
}

const loading = ref(true);
const isLocked = ref(false);
const submitting = ref(false);
const activeTeamId = ref<string>("");
const teamMembers = ref<FgdMember[]>([]);
const selectedMember = ref<FgdMember | null>(null);


const scoreKeaktifan = ref(5);
const scoreKedalaman = ref(4);
const scoreAdab = ref(5);
const feedbackNotes = ref("Aktif berdiskusi dan santun");
const toastMessage = ref<string | null>(null);

const currentSessionInfo = computed(() => fgdSessions.find((s) => s.id === selectedSession.value));

const totalScore = computed(() => scoreKeaktifan.value + scoreKedalaman.value + scoreAdab.value);
// Rumus konversi XP: (skala 3-15) -> +40 s/d +200 XP
const calculatedXp = computed(() => Math.round((totalScore.value / 15) * 200));

function selectMember(m: FgdMember) {
  selectedMember.value = m;
  loadMemberEvaluation(m.id, selectedSession.value);
}

// When session changes, reload scores for selected member
watch(selectedSession, (newSession) => {
  if (selectedMember.value) {
    loadMemberEvaluation(selectedMember.value.id, newSession);
  }
});

function loadMemberEvaluation(participantId: string, sessionId: string) {
  const member = teamMembers.value.find((m) => m.id === participantId);
  const found = member?.evaluations?.find((e: any) => e.sessionId === sessionId);

  if (found && found.rubricScores) {
    scoreKeaktifan.value = found.rubricScores.keaktifan || 5;
    scoreKedalaman.value = found.rubricScores.kedalaman || 4;
    scoreAdab.value = found.rubricScores.adab || 5;
    feedbackNotes.value = found.feedbackNotes || "";
  } else {
    // Defaults for new rubric
    scoreKeaktifan.value = 5;
    scoreKedalaman.value = 4;
    scoreAdab.value = 5;
    feedbackNotes.value = "Aktif berdiskusi dan santun";
  }
}

async function submitFgdEvaluation() {
  if (!selectedMember.value) return;
  submitting.value = true;

  try {
    const res = await api.post<{ success: boolean; message?: string; data?: any }>(
      "/api/buddy/evaluations",
      {
        sessionId: selectedSession.value,
        participantId: selectedMember.value.id,
        teamId: activeTeamId.value,
        rubricScores: {
          keaktifan: scoreKeaktifan.value,
          kedalaman: scoreKedalaman.value,
          adab: scoreAdab.value,
        },
        feedbackNotes: feedbackNotes.value,
      }
    );

    if (res.success) {
      toastMessage.value = res.message || `Nilai ${selectedMember.value.fullName} berhasil disimpan! (+${calculatedXp.value} XP)`;

      // Update in-memory evaluations for the member
      if (!selectedMember.value.evaluations) selectedMember.value.evaluations = [];
      const idx = selectedMember.value.evaluations.findIndex((e: any) => e.sessionId === selectedSession.value);
      const evalObj = {
        sessionId: selectedSession.value,
        rubricScores: {
          keaktifan: scoreKeaktifan.value,
          kedalaman: scoreKedalaman.value,
          adab: scoreAdab.value,
        },
        feedbackNotes: feedbackNotes.value,
        xpAwarded: calculatedXp.value,
      };
      if (idx >= 0) {
        selectedMember.value.evaluations[idx] = evalObj;
      } else {
        selectedMember.value.evaluations.push(evalObj);
      }
    }
  } catch (err: any) {
    console.error("Gagal submit evaluasi FGD:", err);
    toastMessage.value = err?.data?.error?.message || "Gagal menyimpan evaluasi ke server.";
  } finally {
    submitting.value = false;
    setTimeout(() => {
      toastMessage.value = null;
    }, 3500);
  }
}

async function loadData() {
  loading.value = true;
  try {
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
      activeTeamId.value = targetTeamId;

      const [teamRes, evalsRes, settingsRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: any }>(`/api/teams/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>(`/api/buddy/evaluations/team/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>("/api/system/settings"),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.success) {
        isLocked.value = settingsRes.value.data.isBuddyEvaluationLocked || false;
      }

      const evalMap = new Map<string, any[]>();
      if (evalsRes.status === "fulfilled" && evalsRes.value.success) {
        const emList = evalsRes.value.data?.members || [];
        emList.forEach((em: any) => {
          if (em.userId) evalMap.set(em.userId, em.evaluations || []);
        });
      }

      if (teamRes.status === "fulfilled" && teamRes.value.success) {
        const rawMembers = (teamRes.value.data?.members || []).filter(
          (m: any) => m.role === "PARTICIPANT" || !m.role
        );

        teamMembers.value = rawMembers.map((m: any) => ({
          id: m.userId || m.id,
          fullName: m.fullName || "Mahasiswa",
          username: m.username || "-",
          prodi: m.characterClass || m.characterTitle || "Informatika",
          avatarUrl: m.avatarUrl || "/character-cowok-avatar.png",
          evaluations: evalMap.get(m.userId || m.id) || [],
        }));
      }

      // If route has participantId query param, select that participant
      const queryParticipantId = route.query.participantId as string;
      if (queryParticipantId) {
        const found = teamMembers.value.find((m) => m.id === queryParticipantId);
        if (found) {
          selectMember(found);
          return;
        }
      }

      const firstMember = teamMembers.value[0];
      if (firstMember) {
        selectMember(firstMember);
      }
    }
  } catch (err: any) {
    console.error("Gagal memuat data FGD:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
