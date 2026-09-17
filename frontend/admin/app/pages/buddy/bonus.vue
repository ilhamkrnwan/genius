<template>
  <div class="space-y-4 pb-12 select-none font-sans px-1 sm:px-2 animate-in fade-in duration-500 text-[#f0e0c0]">
    <!-- Header: Penilaian Hari Ke-3 -->
    <div class="pixel-card-gold p-4 sm:p-5 space-y-2 relative overflow-hidden group">
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-700"></div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 relative z-10">
        <div>
          <div class="flex items-center gap-2">
            <span class="border border-[#f0d060] bg-[#120a05] px-2 py-0.5 text-[9px] sm:text-[10px] font-pixel text-[#f0d060] uppercase tracking-wider rounded drop-shadow">
              PENILAIAN HARI KE-3
            </span>
            <span
              :class="[
                'px-2 py-0.5 text-[8.5px] font-pixel rounded border uppercase',
                systemActiveDay === 3 && !isLocked
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500'
              ]"
            >
              {{ systemActiveDay === 3 && !isLocked ? 'SESI AKTIF' : 'TERKUNCI' }}
            </span>
          </div>
          <h1 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold mt-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            EVALUASI INDIVIDU MAHASISWA
          </h1>
          <p class="text-[10px] sm:text-[11px] text-[#c4956a] mt-0.5">
            {{ currentTeamName }} &bull; Nilai kontribusi &amp; keaktifan akhir tiap peserta
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="loadData"
            :disabled="loading"
            title="Muat Ulang Data Server"
            class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#120a05] border-2 border-[#5a3a18] hover:border-[#f0d060] text-[#c4956a] hover:text-[#fef08a] flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-colors"
          >
            <RefreshCw class="h-4 w-4 sm:h-5 sm:w-5" :class="loading ? 'animate-spin' : ''" />
          </button>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#120a05] border-2 border-[#f0d060] flex items-center justify-center shrink-0 shadow-lg glow-gold">
            <Gift class="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d060]" />
          </div>
        </div>
      </div>
    </div>

    <!-- Banner Terkunci (Jika bukan Hari 3 atau dikunci admin) -->
    <div
      v-if="systemActiveDay !== 3 || isLocked"
      class="pixel-card p-4 sm:p-5 border-amber-600/70 bg-[#1a0f07] space-y-2 text-center"
    >
      <div class="flex items-center justify-center gap-2 text-amber-300 font-pixel text-xs sm:text-sm">
        <Lock class="w-4 h-4 text-amber-400" />
        <span>PENILAIAN HARI KE-3 TERKUNCI</span>
      </div>
      <p class="text-[11px] sm:text-xs text-[#e5b383] font-sans max-w-xl mx-auto leading-relaxed">
        <template v-if="systemActiveDay !== 3">
          Penilaian ini hanya dapat dibuka pada <strong>Hari Ke-3 PKKMB</strong> setelah diarahkan oleh Super Admin di Control Center.
          <span class="block mt-1 text-[#c4956a] font-mono text-[10px]">
            Status sistem saat ini: <strong>Hari {{ systemActiveDay }}</strong>.
          </span>
        </template>
        <template v-else>
          Penilaian Hari Ke-3 sedang dibekukan / dikunci sementara oleh Super Admin.
        </template>
      </p>
    </div>

    <!-- Ringkasan & Kontrol Cepat -->
    <div class="pixel-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
      <div class="flex items-center gap-3">
        <div class="text-left">
          <span class="text-[9px] sm:text-[10px] text-[#c4956a] uppercase block">Progres Penilaian:</span>
          <span class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold">
            {{ evaluatedCount }}/{{ activeMembers.length }} Mahasiswa
          </span>
        </div>
        <div class="h-7 w-px bg-[#5a3a18]"></div>
        <div class="text-left">
          <span class="text-[9px] sm:text-[10px] text-[#c4956a] uppercase block">Total XP Diberikan:</span>
          <span class="font-pixel text-xs sm:text-sm text-[#86efac] font-bold">
            +{{ totalXpAssigned }} XP
          </span>
        </div>
      </div>

      <!-- Quick Preset Actions -->
      <div class="flex items-center gap-2 self-stretch sm:self-auto" v-if="systemActiveDay === 3 && !isLocked">
        <button
          type="button"
          @click="setAllScores(100)"
          class="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-[#120a05] border border-[#5a3a18] hover:border-[#f0d060] text-[9.5px] sm:text-[10px] text-[#c4956a] hover:text-white transition-colors cursor-pointer"
        >
          Set Semua 100 XP (Standar)
        </button>
        <button
          type="button"
          @click="setAllScores(0)"
          class="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-[#120a05] border border-[#5a3a18] hover:border-red-500 text-[9.5px] sm:text-[10px] text-red-300 hover:text-white transition-colors cursor-pointer"
        >
          Set Semua 0 XP (Pasif)
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pixel-card p-8 text-center text-[#c4956a] font-mono text-xs">
      <div class="inline-block w-6 h-6 border-2 border-[#f0d060] border-t-transparent rounded-full animate-spin mb-2"></div>
      <div>Memuat daftar mahasiswa regu...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="activeMembers.length === 0" class="pixel-card p-8 text-center text-[#c4956a] font-mono text-xs">
      Belum ada anggota regu yang terdaftar.
    </div>

    <!-- Daftar Mahasiswa & Penilaian Individu -->
    <div v-else class="space-y-2.5">
      <div
        v-for="m in activeMembers"
        :key="m.id"
        class="pixel-card p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all"
        :class="memberScores[m.id] === 0 ? 'bg-[#150a07] border-red-950/60' : 'bg-[#120a05]'"
      >
        <!-- Info Mahasiswa (Nama & NIM SAJA, Tanpa character_class) -->
        <div class="flex items-center gap-3 min-w-0">
          <img
            :src="m.avatarUrl || '/character-cowok-avatar.png'"
            :alt="m.fullName"
            class="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border-2 border-[#5a3a18] object-cover bg-black/40 shrink-0"
          />
          <div class="min-w-0">
            <h3 class="font-bold text-xs sm:text-sm text-white truncate font-sans">
              {{ m.fullName }}
            </h3>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] sm:text-[11px] text-[#c4956a] font-mono">
                NIM {{ m.username }}
              </span>
              <span
                v-if="m.savedXp !== null && m.savedXp !== undefined"
                class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
                :class="m.savedXp === 0 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'"
              >
                ✓ Tersimpan: +{{ m.savedXp }} XP
              </span>
            </div>
          </div>
        </div>

        <!-- Bobot Pilihan Nilai (Termasuk 0 XP untuk Pasif) -->
        <div class="flex items-center gap-1 sm:gap-1.5 font-mono">
          <button
            v-for="opt in xpOptions"
            :key="opt.value"
            type="button"
            :disabled="systemActiveDay !== 3 || isLocked"
            @click="memberScores[m.id] = opt.value"
            :class="[
              'px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border-2 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer active:scale-95 text-center shrink-0',
              memberScores[m.id] === opt.value
                ? (opt.value === 0
                    ? 'bg-red-950 text-red-200 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-105'
                    : 'bg-[#ca8a04] text-[#120a05] border-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.4)] scale-105')
                : (opt.value === 0
                    ? 'bg-[#1e0d08] text-red-400 border-red-900/60 hover:border-red-700'
                    : 'bg-[#2a1d13] text-[#c4956a] border-[#4a3624] hover:border-[#f0d060] hover:text-[#f0e0c0]')
            ]"
          >
            <div>{{ opt.value }} XP</div>
            <div class="text-[7.5px] sm:text-[8px] font-normal uppercase opacity-80">{{ opt.label }}</div>
          </button>
        </div>
      </div>
    </div>

    <!-- Tombol Simpan Semua -->
    <div class="pt-2 sticky bottom-16 sm:bottom-6 z-20">
      <button
        type="button"
        @click="saveAllEvaluations"
        :disabled="submitting || loading || systemActiveDay !== 3 || isLocked"
        :class="[
          'w-full h-12 sm:h-14 font-pixel text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 rounded-xl border-2 shadow-2xl transition-all',
          systemActiveDay !== 3 || isLocked
            ? 'bg-[#2d1b0e] text-[#8c6b4a] border-[#5a3a18] cursor-not-allowed opacity-70'
            : 'bg-[#4a3624] hover:bg-[#5a3a18] text-[#fef08a] border-[#f0d060] hover:shadow-[0_0_20px_rgba(240,208,96,0.3)] cursor-pointer active:scale-98'
        ]"
      >
        <Save class="h-4 w-4 sm:h-5 sm:w-5 text-[#f0d060]" :class="submitting ? 'animate-spin' : ''" />
        <span>
          {{ submitting ? 'MENYIMPAN PENILAIAN...' : `SIMPAN SEMUA PENILAIAN HARI KE-3 (${activeMembers.length} MAHASISWA)` }}
        </span>
      </button>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  Gift,
  Lock,
  Save,
  CheckCircle2,
  RefreshCw,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";
import { useRealtime } from "~/composables/useRealtime";

interface Member {
  id: string;
  fullName: string;
  username: string; // NIM
  avatarUrl: string;
  savedXp?: number | null;
}

const { user } = useAuth();
const api = useApi();
const { onEvent } = useRealtime();

const loading = ref(true);
const submitting = ref(false);
const toastMessage = ref<string | null>(null);

const activeTeamId = ref<string>("");
const teamName = ref<string>("Genius 01");
const systemActiveDay = ref<number>(1);
const isLocked = ref<boolean>(false);

const activeMembers = ref<Member[]>([]);
const memberScores = ref<Record<string, number>>({});

const xpOptions = [
  { value: 0, label: "Pasif" },
  { value: 50, label: "Cukup" },
  { value: 100, label: "Standar" },
  { value: 150, label: "Aktif" },
  { value: 200, label: "Bintang" },
];

const currentTeamName = computed(() => {
  const name = teamName.value || user.value?.teamName || "Kelompok Belum Terdaftar";
  return name.replace(/^Team\s+/i, "").trim();
});

const evaluatedCount = computed(() => {
  return activeMembers.value.filter(
    (m) => m.savedXp !== null && m.savedXp !== undefined
  ).length;
});

const totalXpAssigned = computed(() => {
  return Object.values(memberScores.value).reduce((sum, val) => sum + (val || 0), 0);
});

function setAllScores(val: number) {
  for (const m of activeMembers.value) {
    memberScores.value[m.id] = val;
  }
}

async function loadData() {
  loading.value = true;
  try {
    let targetTeamId = user.value?.teamId;
    if (!targetTeamId) {
      const teamsRes = await api.get<{ success: boolean; data: any[] }>("/api/teams");
      if (teamsRes.success && teamsRes.data?.length) {
        const userId = user.value?.id;
        const myTeam = teamsRes.data.find((t: any) =>
          t.buddies?.some((b: any) => b.userId === userId)
        );
        targetTeamId = myTeam ? myTeam.id : teamsRes.data[0].id;
      }
    }

    if (targetTeamId) {
      activeTeamId.value = targetTeamId;

      const [teamRes, day3Res, settingsRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: any }>(`/api/teams/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>(`/api/buddy/evaluations/day-3/team/${targetTeamId}`),
        api.get<{ success: boolean; data: any }>("/api/system/settings"),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.success) {
        const s = settingsRes.value.data;
        systemActiveDay.value = Number(s.activeDay || 1);
        isLocked.value = Boolean(s.isBuddyEvaluationLocked);
      }

      const evalMap = new Map<string, number>();
      if (day3Res.status === "fulfilled" && day3Res.value.success) {
        const dMembers = day3Res.value.data?.members || [];
        dMembers.forEach((dm: any) => {
          if (dm.id && dm.xpAwarded !== null && dm.xpAwarded !== undefined) {
            evalMap.set(dm.id, Number(dm.xpAwarded));
          }
        });
      }

      if (teamRes.status === "fulfilled" && teamRes.value.success) {
        teamName.value = teamRes.value.data.name || "Genius 01";
        const rawMembers = (teamRes.value.data.members || []).filter(
          (m: any) => m.role === "PARTICIPANT" || !m.role
        );

        activeMembers.value = rawMembers.map((m: any) => {
          const id = m.userId || m.id;
          const savedXp = evalMap.has(id) ? evalMap.get(id)! : null;
          return {
            id,
            fullName: m.fullName || "Mahasiswa",
            username: m.username || "-",
            avatarUrl: m.avatarUrl || "/character-cowok-avatar.png",
            savedXp,
          };
        });

        // Initialize scores
        for (const m of activeMembers.value) {
          if (memberScores.value[m.id] === undefined) {
            memberScores.value[m.id] = m.savedXp !== null && m.savedXp !== undefined ? m.savedXp : 100;
          }
        }
      }
    }
  } catch (err: any) {
    console.error("Gagal memuat data penilaian Hari Ke-3:", err);
  } finally {
    loading.value = false;
  }
}

async function saveAllEvaluations() {
  if (submitting.value || !activeTeamId.value) return;
  submitting.value = true;

  try {
    const payload = {
      teamId: activeTeamId.value,
      evaluations: activeMembers.value.map((m) => ({
        participantId: m.id,
        xp: memberScores.value[m.id] !== undefined ? memberScores.value[m.id] : 100,
      })),
    };

    const res = await api.post<{ success: boolean; message?: string; data?: any }>(
      "/api/buddy/evaluations/day-3",
      payload
    );

    if (res.success) {
      toastMessage.value = res.message || "Penilaian Hari Ke-3 berhasil disimpan ke server!";
      // Update local savedXp
      for (const m of activeMembers.value) {
        m.savedXp = memberScores.value[m.id];
      }
    }
  } catch (err: any) {
    console.error("Gagal menyimpan penilaian Hari Ke-3:", err);
    toastMessage.value = err?.data?.error?.message || "Gagal menyimpan penilaian ke server.";
  } finally {
    submitting.value = false;
    setTimeout(() => {
      toastMessage.value = null;
    }, 3500);
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
        systemActiveDay.value = Number(payload.activeDay);
      }
    } else if (
      event === "XP_RESET" ||
      data?.type === "XP_RESET" ||
      (event === "ADMIN_FEED_EVENT" && (data?.action === "XP_RESET_TRIGGERED" || data?.action === "XP_RESET"))
    ) {
      activeMembers.value.forEach((m) => {
        m.savedXp = null;
        memberScores.value[m.id] = 100;
      });
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
