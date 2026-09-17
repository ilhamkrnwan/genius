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
            
            <div class="flex items-center gap-2 shrink-0">
              <span class="border border-[#38bdf8] bg-[#0c1c28] px-2 py-0.5 text-[8.5px] font-pixel text-[#38bdf8] rounded">
                HARI {{ activeDay }}
              </span>
              <button
                type="button"
                @click="loadData()"
                :disabled="loading"
                title="Muat Ulang Data Server"
                class="p-1 rounded bg-[#120a05] border border-[#5a3a18] hover:border-[#f0d060] text-[#c4956a] hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
              </button>
              <span class="border-2 border-[#f0d060] bg-[#120a05] px-2.5 py-1 text-[9px] sm:text-[10px] font-pixel text-[#facc15] rounded-lg shadow-inner">
                {{ fgdSessions.length > 0 ? selectedSession : 'TIDAK ADA SESI' }}
              </span>
            </div>
          </div>

          <!-- Sesi Selector Tabs -->
          <div v-if="fgdSessions.length > 0" class="grid gap-1.5 sm:gap-2 text-center text-xs relative z-10" :class="fgdSessions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'">
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

          <div v-else class="p-2.5 rounded-lg border border-amber-600/40 bg-[#1f1208] text-center text-[10px] font-mono text-[#f0d060] relative z-10">
            <span>Hari 2 (Campus Quest): Tidak ada evaluasi FGD hari ini.</span>
          </div>

          <!-- Topic Pill -->
          <div v-if="currentSessionInfo" class="px-2.5 py-1.5 bg-[#120a05] border border-[#ca8a04]/30 rounded-lg flex items-center justify-between text-[11px] relative z-10 shadow-inner">
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
        <div v-else-if="isFgdEffectivelyLocked" class="bg-red-950/60 border border-red-500/50 rounded-lg p-3 sm:p-4 mb-4 flex items-start sm:items-center gap-3 shadow-lg">
          <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-900/80 border-2 border-red-400 flex items-center justify-center shrink-0">
            <Lock class="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="font-pixel text-[10px] sm:text-xs text-red-400 uppercase tracking-widest mb-0.5">
              {{ fgdSessions.length === 0 ? 'TIDAK ADA SESI FGD HARI INI' : 'EVALUASI FGD DIKUNCI ADMIN' }}
            </h3>
            <p class="text-[9px] sm:text-[10px] text-red-200/80 font-mono leading-tight">
              {{ fgdSessions.length === 0 ? 'Hari 2 (Campus Quest) fokus penjelajahan pos kuis lantai. Evaluasi FGD diadakan pada Hari 1 dan Hari 3.' : 'Penilaian FGD telah ditutup oleh Admin Pusat.' }}
            </p>
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
                <div class="text-[9px] sm:text-[10px] text-[#c4956a] truncate font-mono mt-0.5 flex items-center gap-2">
                  <span class="opacity-80">NIM {{ m.username }}</span>
                  <span v-if="m.evaluations?.some(e => e.sessionId === selectedSession)" class="text-[#86efac] font-bold">✓ Dinilai</span>
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
                  NIM {{ selectedMember.username }}
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
              <div class="grid grid-cols-6 gap-1 sm:gap-1.5 font-pixel text-[11px] sm:text-xs">
                <button
                  v-for="val in [0, 1, 2, 3, 4, 5]"
                  :key="val"
                  type="button"
                  @click="scoreKeaktifan = val"
                  :class="[
                    'h-8 sm:h-9 rounded border-2 transition-all cursor-pointer font-bold active:scale-95',
                    scoreKeaktifan === val
                      ? (val === 0
                          ? 'bg-red-950/80 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] scale-105'
                          : 'bg-[#ca8a04] text-[#120a05] border-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-105')
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
              <div class="grid grid-cols-6 gap-1 sm:gap-1.5 font-pixel text-[11px] sm:text-xs">
                <button
                  v-for="val in [0, 1, 2, 3, 4, 5]"
                  :key="val"
                  type="button"
                  @click="scoreKedalaman = val"
                  :class="[
                    'h-8 sm:h-9 rounded border-2 transition-all cursor-pointer font-bold active:scale-95',
                    scoreKedalaman === val
                      ? (val === 0
                          ? 'bg-red-950/80 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] scale-105'
                          : 'bg-[#0284c7] text-white border-[#7dd3fc] shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-105')
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
              <div class="grid grid-cols-6 gap-1 sm:gap-1.5 font-pixel text-[11px] sm:text-xs max-w-md mx-auto xl:max-w-none">
                <button
                  v-for="val in [0, 1, 2, 3, 4, 5]"
                  :key="val"
                  type="button"
                  @click="scoreAdab = val"
                  :class="[
                    'h-8 sm:h-9 rounded border-2 transition-all cursor-pointer font-bold active:scale-95',
                    scoreAdab === val
                      ? (val === 0
                          ? 'bg-red-950/80 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] scale-105'
                          : 'bg-[#db2777] text-white border-[#fbcfe8] shadow-[0_0_8px_rgba(244,114,182,0.5)] scale-105')
                      : 'bg-[#2a1d13] text-[#c4956a] border-[#4a3624] hover:border-[#f472b6] hover:text-[#f0e0c0]'
                  ]"
                >
                  {{ val }}
                </button>
              </div>
            </div>
          </div>

          <!-- Submit Action Button -->
          <button
            v-if="!isFgdEffectivelyLocked"
            type="button"
            @click="submitFgdEvaluation"
            :disabled="submitting"
            class="pixel-btn-primary w-full h-11 sm:h-12 font-pixel text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-[#4a3624] hover:bg-[#5a3a18] text-[#f0e0c0] border-2 border-[#8b5a2b]"
            :class="submitting ? 'opacity-70 pointer-events-none' : 'hover:border-[#f0d060] hover:text-[#fef08a]'"
          >
            <CheckCircle2 class="h-4 w-4 sm:h-5 sm:w-5" :class="submitting ? 'animate-pulse' : 'text-[#86efac]'" />
            <span>{{ submitting ? 'MENYIMPAN DATA...' : (calculatedXp === 0 ? 'SIMPAN NILAI FGD (0 XP / PASIF)' : `SIMPAN NILAI FGD (+${calculatedXp} XP)`) }}</span>
          </button>
          
          <div v-else class="w-full h-11 sm:h-12 font-pixel text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 bg-[#2a1210] text-red-400 border-2 border-red-900 rounded opacity-70">
            <Lock class="h-4 w-4 text-red-400" />
            <span>{{ fgdSessions.length === 0 ? 'TIDAK ADA SESI FGD HARI INI' : 'TERKUNCI OLEH ADMIN' }}</span>
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
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {
  FileEdit,
  Sparkles,
  Lightbulb,
  HeartHandshake,
  CheckCircle2,
  Lock,
  RefreshCw,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";
import { useRealtime } from "~/composables/useRealtime";

const allFgdSessions = [
  { id: "FGD-1", dayLabel: "H-1 Pagi", topic: "Ke UNU Apa Yang Kau Cari?", day: 1 },
  { id: "FGD-2", dayLabel: "H-1 Siang", topic: "Agent of Change & Bela Negara", day: 1 },
  { id: "FGD-6", dayLabel: "H-3 Siang", topic: "Refleksi & Aksi Nyata Mahasiswa", day: 3 },
];

const activeDay = ref(1);

// Only show FGD sessions matching active day
const fgdSessions = computed(() => allFgdSessions.filter((s) => s.day === activeDay.value));

const selectedSession = ref("FGD-1");

interface FgdMember {
  id: string;
  fullName: string;
  username: string; // NIM
  prodi: string; // Jurusan / Class
  avatarUrl: string;
  evaluations?: any[];
}

const { user } = useAuth();
const api = useApi();
const route = useRoute();
const { onEvent } = useRealtime();

const loading = ref(true);
const isLocked = ref(false);
const isGlobalLocked = ref(false);
const submitting = ref(false);
const activeTeamId = ref<string>("");
const teamMembers = ref<FgdMember[]>([]);
const selectedMember = ref<FgdMember | null>(null);

// FGD is locked if admin globally locked OR no FGD sessions available for current day
const isFgdEffectivelyLocked = computed(() => {
  return isGlobalLocked.value || isLocked.value || fgdSessions.value.length === 0;
});

const scoreKeaktifan = ref(5);
const scoreKedalaman = ref(4);
const scoreAdab = ref(5);
const toastMessage = ref<string | null>(null);

const currentSessionInfo = computed(() => allFgdSessions.find((s) => s.id === selectedSession.value));

const totalScore = computed(() => scoreKeaktifan.value + scoreKedalaman.value + scoreAdab.value);
// Rumus konversi XP: (skala 0-15) -> 0 s/d +200 XP (0 XP jika pasif)
const calculatedXp = computed(() => Math.round((totalScore.value / 15) * 200));

function selectMember(m: FgdMember) {
  selectedMember.value = m;
  loadMemberEvaluation(m.id, selectedSession.value);
}

watch(
  fgdSessions,
  (newSessions) => {
    if (newSessions.length > 0) {
      if (!newSessions.some((s) => s.id === selectedSession.value)) {
        selectedSession.value = newSessions[0].id;
      }
    } else {
      selectedSession.value = "";
    }
  },
  { immediate: true }
);

// When session changes, reload scores for selected member
watch(selectedSession, (newSession) => {
  if (selectedMember.value && newSession) {
    loadMemberEvaluation(selectedMember.value.id, newSession);
  }
});

function loadMemberEvaluation(participantId: string, sessionId: string) {
  const member = teamMembers.value.find((m) => m.id === participantId);
  const found = member?.evaluations?.find((e: any) => e.sessionId === sessionId);

  if (found && found.rubricScores) {
    scoreKeaktifan.value = found.rubricScores.keaktifan !== undefined ? found.rubricScores.keaktifan : 5;
    scoreKedalaman.value = found.rubricScores.kedalaman !== undefined ? found.rubricScores.kedalaman : 4;
    scoreAdab.value = found.rubricScores.adab !== undefined ? found.rubricScores.adab : 5;
  } else {
    // Defaults for new rubric
    scoreKeaktifan.value = 5;
    scoreKedalaman.value = 4;
    scoreAdab.value = 5;
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
      }
    );

    if (res.success) {
      toastMessage.value = res.message || (calculatedXp.value === 0
        ? `Nilai ${selectedMember.value.fullName} berhasil disimpan! (0 XP / Pasif)`
        : `Nilai ${selectedMember.value.fullName} berhasil disimpan! (+${calculatedXp.value} XP)`);

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
        const settings = settingsRes.value.data;
        isLocked.value = Boolean(settings.isBuddyEvaluationLocked);
        if (settings.activeDay) {
          activeDay.value = Number(settings.activeDay);
        }
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
          prodi: m.prodi || "",
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

      // If already selecting a member, refresh with latest data
      if (selectedMember.value) {
        const foundCurrent = teamMembers.value.find((m) => m.id === selectedMember.value?.id);
        if (foundCurrent) {
          selectMember(foundCurrent);
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

let unsubscribeRealtime: (() => void) | null = null;

onMounted(() => {
  loadData();
  unsubscribeRealtime = onEvent((event, data) => {
    if (
      event === "SYSTEM_SETTINGS_UPDATED" ||
      (event === "ADMIN_FEED_EVENT" && data?.action === "SYSTEM_SETTINGS_UPDATED")
    ) {
      const payload = data?.details?.settings || data?.settings || data?.details || data;
      if (payload?.isBuddyEvaluationLocked !== undefined) {
        isLocked.value = Boolean(payload.isBuddyEvaluationLocked);
      }
      if (payload?.activeDay !== undefined) {
        activeDay.value = Number(payload.activeDay);
      }
    } else if (
      event === "XP_RESET" ||
      data?.type === "XP_RESET" ||
      (event === "ADMIN_FEED_EVENT" && (data?.action === "XP_RESET_TRIGGERED" || data?.action === "XP_RESET"))
    ) {
      teamMembers.value.forEach((m) => {
        m.evaluations = [];
      });
      if (selectedMember.value) {
        selectedMember.value.evaluations = [];
        loadMemberEvaluation(selectedMember.value.id, selectedSession.value);
      }
      loadData();
    }
  });
});

onUnmounted(() => {
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }
});
</script>
