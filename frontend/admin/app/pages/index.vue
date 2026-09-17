<template>
  <div class="p-4 md:p-6 space-y-4 flex-1 flex flex-col min-h-0 select-none">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-mono text-xs text-muted-foreground border-b border-[#4a3624]/60 pb-2">
      <p>Pusat Kendali Gamifikasi PKKMB UNU Yogyakarta 2026.</p>
      <div class="flex items-center gap-2 shrink-0">
        <span class="border border-[#16a34a]/60 bg-[#162518] px-2 py-0.5 text-[9px] font-pixel text-[#4ade80] flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse"></span>
          REALTIME
        </span>
        <button
          class="pixel-btn h-7 w-7 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
          @click="fetchStats"
          :disabled="loading"
          title="Refresh"
        >
          <RotateCw :class="['h-3 w-3', loading && 'animate-spin']" />
        </button>
      </div>
    </div>

    <!-- PUSAT KENDALI: Day + FGD Control -->
    <div class="pixel-card-gold p-4 sm:p-5 space-y-4 relative overflow-hidden">
      <div class="absolute -right-16 -top-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex items-center gap-2 relative z-10">
        <span class="border border-[#f0d060] bg-[#120a05] px-2 py-0.5 text-[9px] font-pixel text-[#f0d060] uppercase tracking-wider rounded drop-shadow">
          PUSAT KENDALI UTAMA
        </span>
      </div>

      <!-- 2 Column: Day Controller + FGD Controller -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">

        <!-- 1. Kendali Hari Aktif -->
        <div class="border border-[#5a3a18] bg-[#15100c] p-3 rounded-lg space-y-2.5">
          <div class="flex items-center justify-between text-xs font-pixel">
            <span class="text-[#facc15] flex items-center gap-1.5">
              <Calendar class="h-3.5 w-3.5" />
              KENDALI HARI AKTIF
            </span>
            <span class="text-[9px] font-mono text-[#86efac] bg-[#172513] border border-[#22c55e]/40 px-1.5 py-0.5 rounded">
              HARI {{ currentActiveDay }}
            </span>
          </div>
          <p class="text-[10px] font-mono text-muted-foreground leading-tight">
            Mengatur hari aktif PKKMB. Buddy & Maba akan tersinkron otomatis. Presensi & pos kuis hanya berjalan pada hari yang dipilih.
          </p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="day in [1, 2, 3]"
              :key="day"
              type="button"
              @click="setActiveDay(day)"
              :disabled="updatingSettings"
              :class="[
                'py-2 px-2 text-[10px] font-pixel border rounded transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:cursor-not-allowed',
                day === currentActiveDay
                  ? 'bg-[#ca8a04] border-[#fef08a] text-[#120a05] font-bold shadow-md'
                  : 'bg-[#271d15] border-[#523e2b] text-[#f0e0c0] hover:border-[#ca8a04] hover:bg-[#3d2d1e]'
              ]"
            >
              <span>HARI {{ day }}</span>
              <span class="text-[8px] font-mono opacity-80 mt-0.5">{{ dayLabels[day - 1] }}</span>
            </button>
          </div>
        </div>

        <!-- 2. Kendali Sesi FGD -->
        <div class="border border-[#5a3a18] bg-[#15100c] p-3 rounded-lg space-y-2.5">
          <div class="flex items-center justify-between text-xs font-pixel">
            <span class="text-[#facc15] flex items-center gap-1.5">
              <FileEdit class="h-3.5 w-3.5" />
              KENDALI SESI FGD
            </span>
            <span
              :class="[
                'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                activeFgdInfo.locked
                  ? 'bg-red-950/60 border-red-800 text-red-400'
                  : 'bg-[#172513] border-[#22c55e]/40 text-[#4ade80]'
              ]"
            >
              {{ activeFgdInfo.locked ? 'SEMUA TERKUNCI' : activeFgdInfo.label }}
            </span>
          </div>
          <p class="text-[10px] font-mono text-muted-foreground leading-tight">
            FGD-1 (H1 Pagi) & FGD-2 (H1 Siang) terbuka saat Hari 1 aktif. FGD-6 (H3 Siang) terbuka saat Hari 3 aktif. Hari 2 tidak ada sesi FGD.
          </p>

          <!-- FGD Session Indicators -->
          <div class="grid grid-cols-3 gap-1.5">
            <div
              v-for="fgd in fgdSessions"
              :key="fgd.id"
              :class="[
                'py-1.5 px-1.5 text-[9px] font-pixel border rounded flex flex-col items-center text-center',
                fgd.day === currentActiveDay
                  ? 'bg-[#172513] border-[#22c55e]/60 text-[#86efac]'
                  : 'bg-[#1a1210] border-[#523e2b] text-[#6b5a4a]'
              ]"
            >
              <span class="font-bold">{{ fgd.id }}</span>
              <span class="text-[7.5px] font-mono mt-0.5">{{ fgd.dayLabel }}</span>
              <span
                :class="[
                  'text-[7px] mt-0.5',
                  fgd.day === currentActiveDay ? 'text-[#86efac]' : 'text-[#6b5a4a]'
                ]"
              >
                {{ fgd.day === currentActiveDay ? 'TERBUKA' : 'TERKUNCI' }}
              </span>
            </div>
          </div>

          <!-- Lock All / Unlock Override -->
          <button
            type="button"
            @click="toggleFgdLock"
            :disabled="updatingSettings"
            :class="[
              'w-full py-1.5 px-3 text-[10px] font-pixel border rounded transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 font-bold',
              isFgdLocked
                ? 'bg-[#1e3a1f] border-[#22c55e] text-[#86efac] hover:bg-[#284f2a]'
                : 'bg-[#3b1815] border-red-600 text-red-200 hover:bg-[#4f201d]'
            ]"
          >
            <Unlock v-if="isFgdLocked" class="h-3 w-3" />
            <Lock v-else class="h-3 w-3" />
            <span>{{ isFgdLocked ? 'BUKA KUNCI (IKUT HARI AKTIF)' : 'KUNCI SEMUA SESI FGD' }}</span>
          </button>
        </div>
      </div>

      <!-- Reset XP row -->
      <div class="relative z-10 border-t border-[#ca8a04]/30 pt-3">
        <button
          type="button"
          @click="showResetXpModal = true"
          class="py-1.5 px-4 text-[10px] font-pixel border border-amber-600/80 bg-[#2b1808] text-[#facc15] hover:bg-[#3d230d] rounded transition-all flex items-center gap-2 cursor-pointer active:scale-95 font-bold"
        >
          <Trash2 class="h-3 w-3 text-red-400" />
          RESET XP PESERTA (SIMULASI)
        </button>
      </div>
    </div>

    <!-- Core KPI Cards (100% DB Driven) -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <!-- 1. Teams -->
      <div class="pixel-card p-3.5 space-y-1.5 border-[#4a3624]">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-[10px] font-pixel text-[#f59e0b]">TIM GENIUS</span>
          <Shield class="h-3.5 w-3.5 text-[#f59e0b]" />
        </div>
        <div class="font-mono text-xl font-bold text-foreground">
          {{ stats?.counters?.totalTeams ?? 0 }}
        </div>
        <div class="text-[10px] text-muted-foreground font-mono">Kelompok Terdaftar</div>
      </div>

      <!-- 2. Participants -->
      <div class="pixel-card p-3.5 space-y-1.5 border-[#4a3624]">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-[10px] font-pixel text-[#4ade80]">PESERTA MABA</span>
          <Users class="h-3.5 w-3.5 text-[#4ade80]" />
        </div>
        <div class="font-mono text-xl font-bold text-foreground">
          {{ stats?.counters?.totalParticipants ?? 0 }}
        </div>
        <div class="text-[10px] text-muted-foreground font-mono">Mahasiswa Baru</div>
      </div>

      <!-- 3. Buddies -->
      <div class="pixel-card p-3.5 space-y-1.5 border-[#4a3624]">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-[10px] font-pixel text-[#38bdf8]">BUDDY</span>
          <UserCheck class="h-3.5 w-3.5 text-[#38bdf8]" />
        </div>
        <div class="font-mono text-xl font-bold text-foreground">
          {{ stats?.counters?.totalBuddies ?? 0 }}
        </div>
        <div class="text-[10px] text-muted-foreground font-mono">Game Master</div>
      </div>

      <!-- 4. Attendance -->
      <div class="pixel-card p-3.5 space-y-1.5 border-[#4a3624]">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-[10px] font-pixel text-[#86efac]">PRESENSI H{{ currentActiveDay }}</span>
          <CheckCircle2 class="h-3.5 w-3.5 text-[#86efac]" />
        </div>
        <div class="font-mono text-xl font-bold text-[#86efac]">
          {{ stats?.counters?.checkedInToday ?? 0 }}
          <span class="text-xs font-normal text-muted-foreground">/ {{ stats?.counters?.checkedOutToday ?? 0 }} plg</span>
        </div>
        <div class="text-[10px] text-muted-foreground font-mono">Masuk / Pulang</div>
      </div>

      <!-- 5. Total XP -->
      <div class="pixel-card p-3.5 space-y-1.5 border-[#4a3624]">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-[10px] font-pixel text-[#facc15]">TOTAL XP</span>
          <Coins class="h-3.5 w-3.5 text-[#facc15]" />
        </div>
        <div class="font-mono text-xl font-bold text-[#facc15] truncate">
          {{ Number(stats?.counters?.totalScoreDistributed || 0).toLocaleString('id-ID') }}
        </div>
        <div class="text-[10px] text-muted-foreground font-mono truncate">
          Avg: {{ stats?.counters?.totalTeams ? Math.round((stats.counters.totalScoreDistributed || 0) / stats.counters.totalTeams).toLocaleString('id-ID') : 0 }} / tim
        </div>
      </div>
    </div>

    <!-- Activity + Leaderboard -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <!-- Left: Activity Stream -->
      <div class="lg:col-span-7">
        <div class="pixel-card p-4 space-y-3">
          <div class="flex items-center justify-between border-b border-[#4a3624] pb-2.5">
            <div>
              <div class="font-pixel text-xs sm:text-sm font-bold text-[#f59e0b] flex items-center gap-2">
                <Activity class="h-4 w-4" />
                LIVE ACTIVITY
              </div>
              <p class="text-[10px] font-mono text-muted-foreground mt-0.5">Transaksi skor & presensi realtime dari database.</p>
            </div>
          </div>

          <div
            v-if="activities.length === 0"
            class="border border-dashed border-[#4a3624] p-8 text-center text-muted-foreground font-mono rounded"
          >
            <Activity class="h-8 w-8 mx-auto mb-2 text-[#ca8a04]/40" />
            <p class="text-xs font-semibold text-[#f0e0c0]">Belum Ada Aktivitas</p>
            <p class="text-[10px] mt-1">Transaksi skor dan presensi akan muncul otomatis di sini.</p>
          </div>

          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto pr-1 font-mono text-xs">
            <div
              v-for="item in activities"
              :key="item.id"
              class="flex items-start justify-between gap-3 border border-[#3d2d1e] bg-[#1a140f] p-2.5 hover:bg-[#271d15] transition-colors"
            >
              <div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-bold text-foreground">{{ item.teamName }}</span>
                  <span class="text-[9px] font-pixel border border-[#523e2b] px-1 bg-[#271d15] text-muted-foreground">{{ item.participantName }}</span>
                  <span class="text-[8px] font-pixel px-1 border border-[#ca8a04] text-[#facc15]">{{ item.sourceType }}</span>
                </div>
                <p class="text-[11px] text-muted-foreground mt-0.5">{{ item.reason }}</p>
                <div class="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                  <Clock class="h-2.5 w-2.5" />
                  <span>{{ item.time }}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-pixel text-xs font-bold" :class="item.amount >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'">
                  {{ item.amount >= 0 ? `+${item.amount}` : item.amount }} PTS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Top 5 Leaderboard -->
      <div class="lg:col-span-5">
        <div class="pixel-card p-4 space-y-3">
          <div class="flex items-center justify-between border-b border-[#4a3624] pb-2.5">
            <div>
              <div class="font-pixel text-xs sm:text-sm font-bold text-[#facc15] flex items-center gap-2">
                <Trophy class="h-4 w-4" />
                TOP 5 TIM
              </div>
              <p class="text-[10px] font-mono text-muted-foreground mt-0.5">Peringkat dari database</p>
            </div>
            <button class="text-[10px] font-pixel text-[#f59e0b] hover:underline cursor-pointer" @click="navigateTo('/leaderboard')">
              SEMUA →
            </button>
          </div>

          <div v-if="topTeams.length === 0" class="border border-dashed border-[#4a3624] p-8 text-center text-muted-foreground font-mono rounded">
            <Trophy class="h-8 w-8 mx-auto mb-2 text-[#ca8a04]/40" />
            <p class="text-xs font-semibold text-[#f0e0c0]">Belum Ada Skor</p>
          </div>

          <div v-else class="space-y-1.5 font-mono text-xs">
            <div
              v-for="(team, index) in topTeams"
              :key="team.id"
              class="flex items-center justify-between border border-[#3d2d1e] bg-[#1a140f] p-2 hover:bg-[#271d15] transition-colors"
            >
              <div class="flex items-center gap-2.5">
                <div
                  :class="[
                    'flex h-6 w-6 items-center justify-center font-pixel text-[9px] border',
                    index === 0 ? 'bg-[#2b2014] text-[#facc15] border-[#ca8a04]'
                      : index === 1 ? 'bg-[#222] text-[#e2e8f0] border-[#94a3b8]'
                      : index === 2 ? 'bg-[#2b1810] text-[#fb923c] border-[#c2410c]'
                      : 'bg-[#15100c] text-muted-foreground border-[#3d2d1e]',
                  ]"
                >
                  #{{ index + 1 }}
                </div>
                <div>
                  <div class="font-bold text-foreground text-xs">{{ team.name }}</div>
                  <div class="text-[9px] text-muted-foreground">
                    Buddy: {{ team.buddy }} | {{ team.stamps }}/9 Stempel
                  </div>
                </div>
              </div>
              <div class="font-pixel text-xs font-bold text-[#4ade80]">
                {{ Number(team.score || 0).toLocaleString('id-ID') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Reset XP -->
    <Dialog :open="showResetXpModal" @update:open="showResetXpModal = $event">
      <DialogContent class="sm:max-w-[480px] pixel-card border-2 border-red-600 bg-[#160d09] text-foreground font-mono">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            KONFIRMASI RESET SELURUH XP
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-3 py-2 text-xs text-[#f0e0c0]">
          <div class="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 leading-relaxed space-y-1.5">
            <p class="font-bold font-pixel text-[11px] text-red-300">PERINGATAN: FITUR SIMULASI</p>
            <ul class="list-disc list-inside space-y-0.5 text-[10.5px] text-red-300/90">
              <li>Seluruh riwayat transaksi skor & XP peserta dihapus.</li>
              <li>Seluruh sesi permainan pos kuis dihapus.</li>
              <li>Seluruh riwayat presensi dihapus.</li>
              <li>Seluruh evaluasi FGD dihapus.</li>
              <li>Seluruh log kunjungan & pendaftaran stan Ormawa dihapus.</li>
            </ul>
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-[#facc15]">Ketik "RESET" untuk mengonfirmasi:</Label>
            <input
              v-model="resetConfirmationText"
              type="text"
              placeholder="RESET"
              class="w-full h-9 px-3 bg-[#120a05] border border-red-700/80 text-red-400 font-pixel text-center tracking-widest text-sm focus:outline-none focus:border-red-500 rounded"
            />
          </div>
        </div>
        <DialogFooter class="pt-3 flex items-center justify-end gap-2">
          <button type="button" class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground cursor-pointer rounded" @click="showResetXpModal = false; resetConfirmationText = ''">Batal</button>
          <button
            type="button"
            @click="handleResetXp"
            :disabled="resettingXp || resetConfirmationText.trim().toUpperCase() !== 'RESET'"
            class="pixel-btn h-8 px-4 text-xs font-pixel bg-red-800 hover:bg-red-700 text-white border-red-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 rounded"
          >
            <RotateCw v-if="resettingXp" class="h-3 w-3 animate-spin inline" />
            <Trash2 v-else class="h-3 w-3 inline" />
            RESET SEMUA XP
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  Shield,
  Users,
  UserCheck,
  Coins,
  Activity,
  Trophy,
  RotateCw,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  Trash2,
  Calendar,
  CheckCircle2,
  FileEdit,
} from "lucide-vue-next";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";
import { useRealtime } from "~/composables/useRealtime";

const api = useApi();
const toast = useToast();
const confirmModal = useConfirm();
const { onEvent } = useRealtime();

const loading = ref(false);
const updatingSettings = ref(false);
const isFgdLocked = ref(false);
const currentActiveDay = ref(1);
let unsubscribeRealtime: (() => void) | null = null;

const dayLabels = ["Ke-UNU-an", "Campus Quest", "Ormawa Expo"];

const fgdSessions = [
  { id: "FGD-1", dayLabel: "H1 Pagi", day: 1 },
  { id: "FGD-2", dayLabel: "H1 Siang", day: 1 },
  { id: "FGD-6", dayLabel: "H3 Siang", day: 3 },
];

const activeFgdInfo = computed(() => {
  if (isFgdLocked.value) return { locked: true, label: "SEMUA TERKUNCI" };
  const open = fgdSessions.filter((f) => f.day === currentActiveDay.value);
  if (open.length === 0) return { locked: true, label: "TIDAK ADA FGD HARI INI" };
  return { locked: false, label: open.map((f) => f.id).join(" & ") + " TERBUKA" };
});

const stats = ref<any>(null);
const teamsList = ref<any[]>([]);
const activities = ref<any[]>([]);
const topTeams = ref<any[]>([]);

const showResetXpModal = ref(false);
const resetConfirmationText = ref("");
const resettingXp = ref(false);

async function fetchTeams() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/teams?pageSize=100");
    if (res.success && res.data) teamsList.value = res.data;
  } catch (_) {}
}

async function fetchStats() {
  loading.value = true;
  try {
    const [statsRes, lbRes]: any = await Promise.allSettled([
      api.get("/api/monitoring/stats"),
      api.get("/api/leaderboard?limit=5"),
    ]);

    if (statsRes.status === "fulfilled" && statsRes.value?.success && statsRes.value.data) {
      stats.value = statsRes.value.data;
      if (stats.value.systemSettings) {
        currentActiveDay.value = stats.value.systemSettings.activeDay ?? 1;
        isFgdLocked.value = Boolean(stats.value.systemSettings.isBuddyEvaluationLocked);
      }
      if (Array.isArray(statsRes.value.data.recentActivity)) {
        activities.value = statsRes.value.data.recentActivity.map((a: any) => ({
          id: a.id,
          teamName: a.teamName || "Regu",
          participantName: a.participantName || "Peserta",
          sourceType: a.sourceType || "GAME",
          reason: a.reason || "Poin aktivitas",
          time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
          amount: a.amount,
        }));
      }
    }

    if (lbRes.status === "fulfilled" && lbRes.value?.success && lbRes.value.data) {
      if (Array.isArray(lbRes.value.data.topTeams)) {
        topTeams.value = lbRes.value.data.topTeams.map((t: any) => {
          const matched = teamsList.value.find((tm) => tm.id === t.teamId);
          return {
            id: t.teamId,
            name: t.teamName,
            buddy: matched?.buddies?.[0]?.fullName || "Buddy",
            stamps: t.stampsCollected ?? 0,
            score: t.totalScore || 0,
          };
        });
      }
    }
  } catch (_) {} finally {
    loading.value = false;
  }
}

async function setActiveDay(day: number) {
  if (day === currentActiveDay.value) return;
  const ok = await confirmModal.show({
    title: `Ubah ke Hari ${day}?`,
    description: `Presensi, pos kuis, dan FGD akan berpindah ke Hari ${day}. Buddy & Maba akan tersinkron otomatis.`,
    confirmText: `Aktifkan Hari ${day}`,
    cancelText: "Batal",
    variant: "default",
    icon: "shield",
  });
  if (!ok) return;
  try {
    updatingSettings.value = true;
    const res = await api.put<{ success: boolean }>("/api/system/settings", { activeDay: day });
    if (res.success) {
      currentActiveDay.value = day;
      toast.success("Hari Aktif Diperbarui", `Sistem berjalan pada Hari ${day}.`);
      await fetchStats();
    }
  } catch (err: any) {
    toast.error("Gagal", err.data?.error?.message || err.message || "Error");
  } finally {
    updatingSettings.value = false;
  }
}

async function toggleFgdLock() {
  const next = !isFgdLocked.value;
  try {
    updatingSettings.value = true;
    const res = await api.put<{ success: boolean }>("/api/system/settings", { isBuddyEvaluationLocked: next });
    if (res.success) {
      isFgdLocked.value = next;
      toast.success(next ? "FGD Terkunci" : "FGD Terbuka", next ? "Buddy tidak bisa input nilai FGD." : "Buddy bisa input nilai FGD sesuai hari aktif.");
    }
  } catch (err: any) {
    toast.error("Gagal", err.data?.error?.message || err.message || "Error");
  } finally {
    updatingSettings.value = false;
  }
}

async function handleResetXp() {
  if (resetConfirmationText.value.trim().toUpperCase() !== "RESET") return;
  resettingXp.value = true;
  try {
    const res = await api.post<{ success: boolean }>("/api/system/reset-xp", { confirm: "RESET_ALL_XP" });
    if (res.success) {
      toast.success("Reset Berhasil", "Seluruh XP, sesi kuis, presensi, dan FGD telah dikosongkan.");
      showResetXpModal.value = false;
      resetConfirmationText.value = "";
      await fetchStats();
    }
  } catch (err: any) {
    toast.error("Gagal Reset", err.data?.error?.message || err.message || "Error");
  } finally {
    resettingXp.value = false;
  }
}

onMounted(async () => {
  await fetchTeams();
  await fetchStats();

  unsubscribeRealtime = onEvent((event, data) => {
    if (
      event === "SYSTEM_SETTINGS_UPDATED" ||
      (event === "ADMIN_FEED_EVENT" && data?.action === "SYSTEM_SETTINGS_UPDATED")
    ) {
      const payload = data?.details?.settings || data?.settings || data?.details || data;
      if (payload?.activeDay !== undefined) currentActiveDay.value = payload.activeDay;
      if (payload?.isBuddyEvaluationLocked !== undefined) isFgdLocked.value = Boolean(payload.isBuddyEvaluationLocked);
      fetchStats();
    } else if (["XP_RESET", "LEADERBOARD_UPDATED", "ATTENDANCE_CHECK_IN", "ATTENDANCE_CHECK_OUT"].includes(event)) {
      fetchStats();
    }
  });
});

onUnmounted(() => {
  if (unsubscribeRealtime) { unsubscribeRealtime(); unsubscribeRealtime = null; }
});
</script>
