<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  Trophy,
  Shield,
  User,
  History,
  RotateCw,
  Search,
  Scale,
  Download,
  Snowflake,
  Tv,
  CheckSquare,
  MoreHorizontal,
  ExternalLink,
  Copy,
} from "lucide-vue-next";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import PixelPagination from "@/components/PixelPagination.vue";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";

const router = useRouter();
const api = useApi();
const toast = useToast();

const loading = ref(false);
const submitting = ref(false);
const isFrozen = ref(false);
const activeTab = ref<"team" | "participant" | "ledger">("team");
const searchQuery = ref("");
const stageFilter = ref("");

// Selection state for bulk actions
const selectedTeamIds = ref<string[]>([]);
const selectedParticipantIds = ref<string[]>([]);
const selectedLedgerIds = ref<string[]>([]);

const toggleFreeze = () => {
  isFrozen.value = !isFrozen.value;
  if (import.meta.client) {
    localStorage.setItem("genius_leaderboard_frozen", isFrozen.value ? "true" : "false");
  }
  if (isFrozen.value) {
    toast.warning("Skor publik mahasiswa dibekukan.");
  } else {
    toast.success("Skor publik mahasiswa dibuka kembali.");
  }
};

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);

const tabOptions = [
  { key: "team" as const, label: "KLASEMEN TIM", icon: Shield },
  { key: "participant" as const, label: "INDIVIDU", icon: User },
  { key: "ledger" as const, label: "LEDGER", icon: History },
];

const teams = ref<any[]>([]);
const participants = ref<any[]>([]);
const ledger = ref<any[]>([]);
const stages = ref<any[]>([]);

const showCorrectionModal = ref(false);
const correctionForm = ref({
  teamId: "",
  amount: 50,
  reason: "",
});

const podiumTeams = computed(() => {
  return teams.value.slice(0, 3);
});

const filteredTeams = computed(() => {
  if (!searchQuery.value.trim()) return teams.value;
  const q = searchQuery.value.toLowerCase().trim();
  return teams.value.filter(
    (t) => t.name?.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q)
  );
});

const paginatedTeams = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTeams.value.slice(start, start + pageSize.value);
});

const filteredParticipants = computed(() => {
  if (!searchQuery.value.trim()) return participants.value;
  const q = searchQuery.value.toLowerCase().trim();
  return participants.value.filter(
    (p) => p.fullName?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q)
  );
});

const paginatedParticipants = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredParticipants.value.slice(start, start + pageSize.value);
});

const filteredLedger = computed(() => {
  if (!searchQuery.value.trim()) return ledger.value;
  const q = searchQuery.value.toLowerCase().trim();
  return ledger.value.filter(
    (l) => l.reason?.toLowerCase().includes(q) || l.targetName?.toLowerCase().includes(q)
  );
});

const paginatedLedger = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredLedger.value.slice(start, start + pageSize.value);
});

// Selection helpers: Team
const isAllTeamsSelected = computed(() => {
  if (paginatedTeams.value.length === 0) return false;
  return paginatedTeams.value.every((t) => selectedTeamIds.value.includes(t.teamId));
});

function toggleSelectAllTeams() {
  if (isAllTeamsSelected.value) {
    const pageIds = paginatedTeams.value.map((t) => t.teamId);
    selectedTeamIds.value = selectedTeamIds.value.filter((id) => !pageIds.includes(id));
  } else {
    const newIds = paginatedTeams.value.map((t) => t.teamId);
    selectedTeamIds.value = Array.from(new Set([...selectedTeamIds.value, ...newIds]));
  }
}

function toggleSelectTeam(teamId: string) {
  if (selectedTeamIds.value.includes(teamId)) {
    selectedTeamIds.value = selectedTeamIds.value.filter((id) => id !== teamId);
  } else {
    selectedTeamIds.value.push(teamId);
  }
}

// Selection helpers: Participant
const isAllParticipantsSelected = computed(() => {
  if (paginatedParticipants.value.length === 0) return false;
  return paginatedParticipants.value.every((p) => selectedParticipantIds.value.includes(p.userId));
});

function toggleSelectAllParticipants() {
  if (isAllParticipantsSelected.value) {
    const pageIds = paginatedParticipants.value.map((p) => p.userId);
    selectedParticipantIds.value = selectedParticipantIds.value.filter((id) => !pageIds.includes(id));
  } else {
    const newIds = paginatedParticipants.value.map((p) => p.userId);
    selectedParticipantIds.value = Array.from(new Set([...selectedParticipantIds.value, ...newIds]));
  }
}

function toggleSelectParticipant(userId: string) {
  if (selectedParticipantIds.value.includes(userId)) {
    selectedParticipantIds.value = selectedParticipantIds.value.filter((id) => id !== userId);
  } else {
    selectedParticipantIds.value.push(userId);
  }
}

// Selection helpers: Ledger
const isAllLedgerSelected = computed(() => {
  if (paginatedLedger.value.length === 0) return false;
  return paginatedLedger.value.every((l) => selectedLedgerIds.value.includes(l.id));
});

function toggleSelectAllLedger() {
  if (isAllLedgerSelected.value) {
    const pageIds = paginatedLedger.value.map((l) => l.id);
    selectedLedgerIds.value = selectedLedgerIds.value.filter((id) => !pageIds.includes(id));
  } else {
    const newIds = paginatedLedger.value.map((l) => l.id);
    selectedLedgerIds.value = Array.from(new Set([...selectedLedgerIds.value, ...newIds]));
  }
}

function toggleSelectLedger(id: string) {
  if (selectedLedgerIds.value.includes(id)) {
    selectedLedgerIds.value = selectedLedgerIds.value.filter((i) => i !== id);
  } else {
    selectedLedgerIds.value.push(id);
  }
}

function switchTab(tab: "team" | "participant" | "ledger") {
  activeTab.value = tab;
  currentPage.value = 1;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any }>("/api/leaderboard?limit=500");
    if (res.success && res.data) {
      teams.value = (res.data.teamLeaderboard || []).map((t: any, idx: number) => ({
        ...t,
        teamId: t.teamId || t.id,
        rank: t.rank || idx + 1,
        name: t.teamName || t.name || `Tim ${idx + 1}`,
        code: t.teamCode || t.code || `T-${String(idx + 1).padStart(2, "0")}`,
        buddy: t.buddy || t.mentor || "-",
        floor: t.floor || "-",
        txCount: t.transactionCount ?? t.txCount ?? 0,
        totalScore: Number(t.totalScore ?? t.score ?? 0),
      }));
      participants.value = (res.data.participantLeaderboard || []).map((p: any, idx: number) => ({
        ...p,
        userId: p.participantId || p.userId || p.id,
        rank: p.rank || idx + 1,
        fullName: p.participantName || p.fullName || p.name || `Peserta ${idx + 1}`,
        username: p.username || "-",
        prodi: p.prodi || p.characterClass || "-",
        faculty: p.faculty || "-",
        avatarUrl: p.avatarUrl || (p.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png"),
        teamName: p.teamName || "",
        teamCode: p.teamCode || "",
        gender: p.gender || "MALE",
        txCount: p.transactionCount ?? p.txCount ?? 0,
        totalScore: Number(p.totalScore ?? p.score ?? 0),
      }));
      ledger.value = (res.data.recentTransactions || []).map((tx: any) => ({
        ...tx,
        id: tx.id,
        targetName: tx.teamName || tx.participantName || tx.targetName || "-",
        sourceType: tx.type || tx.sourceType || "GAME",
        reason: tx.description || tx.reason || "Aktivitas Game",
        amount: Number(tx.amount || 0),
        createdAt: tx.createdAt,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    toast.error("Gagal memuat data klasemen");
  } finally {
    loading.value = false;
  }
}

function openCorrectionModal() {
  correctionForm.value = {
    teamId: teams.value[0]?.teamId || "",
    amount: 50,
    reason: "",
  };
  showCorrectionModal.value = true;
}

function openTeamCorrection(t: any) {
  correctionForm.value = {
    teamId: t.teamId,
    amount: 50,
    reason: "",
  };
  showCorrectionModal.value = true;
}

function navigateToTeam(t: any) {
  router.push(`/teams?search=${encodeURIComponent(t.name || "")}`);
}

async function copyTeamCode(code: string) {
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    toast.info("Kode tim disalin: " + code);
  } catch {
    toast.warning("Gagal menyalin kode");
  }
}

function navigateToParticipant(p: any) {
  router.push(`/participants?search=${encodeURIComponent(p.fullName || "")}`);
}

async function copyParticipantNim(nim: string) {
  if (!nim) return;
  try {
    await navigator.clipboard.writeText(nim);
    toast.info("NIM/Username disalin: " + nim);
  } catch {
    toast.warning("Gagal menyalin NIM");
  }
}

async function submitCorrection() {
  if (!correctionForm.value.teamId) return;
  submitting.value = true;
  try {
    await api.post("/api/leaderboard/adjust", {
      teamId: correctionForm.value.teamId,
      amount: correctionForm.value.amount,
      reason: correctionForm.value.reason,
    });
    toast.success("Penyesuaian skor berhasil disimpan!");
    showCorrectionModal.value = false;
    await fetchData();
  } catch (err: any) {
    toast.error("Gagal koreksi skor: " + (err.data?.error?.message || err.message));
  } finally {
    submitting.value = false;
  }
}

// CSV Utilities
function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportTeamsData(data: any[], filename: string) {
  const headers = ["Rank", "Nama Tim", "Kode", "Buddy", "Lokasi", "Transaksi", "Total Poin"];
  const rows = data.map((t) => [
    t.rank,
    `"${(t.name || "").replace(/"/g, '""')}"`,
    `"${t.code || ""}"`,
    `"${(t.buddy || "-").replace(/"/g, '""')}"`,
    `"${(t.floor || "-").replace(/"/g, '""')}"`,
    t.txCount || 0,
    t.totalScore || t.score || 0,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCsv(csv, filename);
}

function exportParticipantsData(data: any[], filename: string) {
  const headers = ["Rank", "Nama Lengkap", "Username/NIM", "Regu Tim", "Transaksi", "Total Poin"];
  const rows = data.map((p) => [
    p.rank,
    `"${(p.fullName || "").replace(/"/g, '""')}"`,
    `"${p.username || ""}"`,
    `"${(p.teamName || "Free Agent").replace(/"/g, '""')}"`,
    p.txCount || 0,
    p.totalScore || 0,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCsv(csv, filename);
}

function exportLedgerData(data: any[], filename: string) {
  const headers = ["ID", "Waktu", "Sasaran", "Tipe Sumber", "Alasan", "Poin"];
  const rows = data.map((l) => [
    `"${l.id}"`,
    `"${l.createdAt}"`,
    `"${(l.targetName || "-").replace(/"/g, '""')}"`,
    `"${l.sourceType || "-"}"`,
    `"${(l.reason || "-").replace(/"/g, '""')}"`,
    l.amount || 0,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCsv(csv, filename);
}

function exportCurrentViewCSV() {
  if (activeTab.value === "team") {
    if (filteredTeams.value.length === 0) {
      toast.warning("Tidak ada data tim untuk diexport");
      return;
    }
    exportTeamsData(filteredTeams.value, `klasemen-tim-${Date.now()}.csv`);
    toast.success(`Berhasil mengunduh ${filteredTeams.value.length} tim.`);
  } else if (activeTab.value === "participant") {
    if (filteredParticipants.value.length === 0) {
      toast.warning("Tidak ada data individu untuk diexport");
      return;
    }
    exportParticipantsData(filteredParticipants.value, `klasemen-individu-${Date.now()}.csv`);
    toast.success(`Berhasil mengunduh ${filteredParticipants.value.length} peserta.`);
  } else {
    if (filteredLedger.value.length === 0) {
      toast.warning("Tidak ada transaksi untuk diexport");
      return;
    }
    exportLedgerData(filteredLedger.value, `ledger-${Date.now()}.csv`);
    toast.success(`Berhasil mengunduh ${filteredLedger.value.length} transaksi.`);
  }
}

function exportSelectedTeamsCSV() {
  const selected = teams.value.filter((t) => selectedTeamIds.value.includes(t.teamId));
  if (selected.length === 0) return;
  exportTeamsData(selected, `klasemen-tim-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${selected.length} tim terpilih.`);
}

function exportSelectedParticipantsCSV() {
  const selected = participants.value.filter((p) => selectedParticipantIds.value.includes(p.userId));
  if (selected.length === 0) return;
  exportParticipantsData(selected, `klasemen-individu-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${selected.length} peserta terpilih.`);
}

function exportSelectedLedgerCSV() {
  const selected = ledger.value.filter((l) => selectedLedgerIds.value.includes(l.id));
  if (selected.length === 0) return;
  exportLedgerData(selected, `ledger-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${selected.length} transaksi terpilih.`);
}

function getParticipantAvatar(p: any) {
  if (p.avatarUrl) return p.avatarUrl;
  const isFemale =
    p.gender === "FEMALE" ||
    p.fullName?.toLowerCase().includes("siti") ||
    p.fullName?.toLowerCase().includes("dewi") ||
    p.fullName?.toLowerCase().includes("annisa") ||
    p.fullName?.toLowerCase().includes("zahra") ||
    p.fullName?.toLowerCase().includes("putri") ||
    p.fullName?.toLowerCase().includes("rina");
  return isFemale ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png";
}

function formatDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const { onEvent } = useRealtime();
let lbRefreshInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribeWs: (() => void) | null = null;

onMounted(() => {
  if (import.meta.client) {
    const savedFreeze = localStorage.getItem("genius_leaderboard_frozen");
    if (savedFreeze !== null) {
      isFrozen.value = savedFreeze === "true";
    }
  }
  fetchData();
  unsubscribeWs = onEvent((event) => {
    if (["SCORE_SUBMITTED", "XP_AWARDED", "LEADERBOARD_UPDATED", "GAME_SESSION_COMPLETED"].includes(event)) {
      fetchData();
    }
  });
  lbRefreshInterval = setInterval(fetchData, 15000);
});

onUnmounted(() => {
  if (lbRefreshInterval) clearInterval(lbRefreshInterval);
  if (unsubscribeWs) unsubscribeWs();
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden select-none font-mono text-gray-200">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer"
        @click="openCorrectionModal"
        title="Koreksi Skor / Bonus"
      >
        <Scale class="h-3.5 w-3.5" />
        <span class="hidden sm:inline font-pixel">KOREKSI SKOR</span>
      </button>

      <button
        type="button"
        :class="[
          'pixel-btn h-8 px-3 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer',
          isFrozen
            ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow animate-pulse'
            : 'bg-[#271d15] border-[#523e2b] text-gray-300 hover:text-white'
        ]"
        @click="toggleFreeze"
        title="Bekukan / Buka Skor Publik"
      >
        <Snowflake class="h-3.5 w-3.5 text-cyan-400" />
        <span class="hidden sm:inline font-pixel">{{ isFrozen ? 'BEKU AKTIF' : 'BEKUKAN SKOR' }}</span>
      </button>

      <NuxtLink
        to="/projector"
        target="_blank"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#3b1d54] text-[#d8b4fe] border-[#a855f7] flex items-center gap-1.5 hover:bg-[#4c246f] transition-all shadow cursor-pointer"
        title="Buka Mode Proyektor Layar Panggung"
      >
        <Tv class="h-3.5 w-3.5 text-[#c084fc]" />
        <span class="hidden sm:inline font-pixel">PROYEKTOR</span>
      </NuxtLink>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#271d15] text-[#38bdf8] border-[#0284c7] flex items-center gap-1.5 hover:bg-[#3d2d1e] cursor-pointer"
        @click="exportCurrentViewCSV"
        title="Export CSV"
      >
        <Download class="h-3.5 w-3.5 text-[#38bdf8]" />
        <span class="hidden sm:inline font-pixel">EXPORT (CSV)</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
        @click="fetchData"
        :disabled="loading"
        title="Segarkan Data"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- Freeze Alert Notice Banner -->
    <div
      v-if="isFrozen"
      class="px-4 md:px-6 py-2 bg-cyan-950/80 border-b border-cyan-500/50 flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 shrink-0"
    >
      <div class="flex items-center gap-2">
        <Snowflake class="h-4 w-4 text-cyan-400 shrink-0 animate-spin" />
        <span><strong>MODE FREEZE AKTIF:</strong> Tampilan skor publik mahasiswa dibekukan untuk panggung awarding. Data admin tetap realtime.</span>
      </div>
      <button
        type="button"
        @click="toggleFreeze"
        class="text-[10px] underline text-cyan-400 hover:text-white shrink-0 cursor-pointer font-bold"
      >
        Buka Freeze
      </button>
    </div>

    <!-- Top 3 Podium Visual Deck -->
    <div v-if="podiumTeams.length > 0" class="px-4 md:px-6 py-3 border-b border-[#3d2a1b] bg-[#120d09] shrink-0">
      <div class="grid grid-cols-1 gap-2.5 md:grid-cols-3 font-mono">
        <!-- Silver (Rank 2) -->
        <div class="pixel-card p-3 flex flex-col items-center text-center space-y-1.5 border-[#94a3b8]/60 bg-[#1a140f] md:order-1 order-2">
          <div class="text-xl font-pixel text-[#e2e8f0] font-bold py-1">
            #2
          </div>
          <div>
            <div class="font-bold text-foreground text-xs">{{ podiumTeams[1]?.name || 'Genius 02' }}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5">Buddy: {{ podiumTeams[1]?.buddy || '-' }} · {{ podiumTeams[1]?.floor || '-' }}</div>
          </div>
          <div class="font-pixel text-xs font-bold text-[#e2e8f0]">
            {{ (podiumTeams[1]?.totalScore || podiumTeams[1]?.score || 0).toLocaleString() }} PTS
          </div>
          <span class="border border-[#94a3b8]/40 bg-[#1f242d] px-2 py-0.5 text-[9px] font-pixel text-[#e2e8f0]">JUARA 2</span>
        </div>

        <!-- Gold (Rank 1 - Winner) -->
        <div class="pixel-card-gold p-3 flex flex-col items-center text-center space-y-1.5 md:order-2 order-1 md:-translate-y-0.5">
          <div class="flex items-center justify-center gap-1.5 text-2xl font-pixel text-[#facc15] font-bold py-0.5 animate-pulse">
            <span class="text-xl">👑</span>
            <span>#1</span>
          </div>
          <div>
            <div class="font-pixel text-xs sm:text-sm font-bold text-[#facc15]">{{ podiumTeams[0]?.name || 'Genius 01' }}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5">Buddy: {{ podiumTeams[0]?.buddy || '-' }} · {{ podiumTeams[0]?.floor || '-' }}</div>
          </div>
          <div class="font-pixel text-sm font-bold text-[#facc15]">
            {{ (podiumTeams[0]?.totalScore || podiumTeams[0]?.score || 0).toLocaleString() }} PTS
          </div>
          <span class="border border-[#ca8a04] bg-[#2b2014] px-2 py-0.5 text-[9px] font-pixel text-[#facc15]">JUARA 1</span>
        </div>

        <!-- Bronze (Rank 3) -->
        <div class="pixel-card p-3 flex flex-col items-center text-center space-y-1.5 border-[#c2410c]/60 bg-[#1a140f] md:order-3 order-3">
          <div class="text-xl font-pixel text-[#fb923c] font-bold py-1">
            #3
          </div>
          <div>
            <div class="font-bold text-foreground text-xs">{{ podiumTeams[2]?.name || 'Genius 03' }}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5">Buddy: {{ podiumTeams[2]?.buddy || '-' }} · {{ podiumTeams[2]?.floor || '-' }}</div>
          </div>
          <div class="font-pixel text-xs font-bold text-[#fb923c]">
            {{ (podiumTeams[2]?.totalScore || podiumTeams[2]?.score || 0).toLocaleString() }} PTS
          </div>
          <span class="border border-[#c2410c]/40 bg-[#291710] px-2 py-0.5 text-[9px] font-pixel text-[#fb923c]">JUARA 3</span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs & Filter Toolbar -->
    <div class="pixel-toolbar-sticky px-4 md:px-6 py-2 border-b border-[#3d2a1b] bg-[#15100c] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
      <!-- Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto">
        <button
          v-for="tab in tabOptions"
          :key="tab.key"
          @click="switchTab(tab.key)"
          :class="[
            'h-7 px-3 rounded font-pixel text-[10px] flex items-center gap-1.5 border transition-all cursor-pointer',
            activeTab === tab.key
              ? 'bg-[#f59e0b] text-[#16110d] border-[#f59e0b] font-bold shadow-sm'
              : 'bg-[#271d15] text-gray-300 border-[#523e2b] hover:text-foreground hover:border-[#f59e0b]'
          ]"
        >
          <component :is="tab.icon" class="h-3 w-3" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Filters: Search & Stage Selector -->
      <div class="flex items-center gap-2">
        <div class="relative w-48 sm:w-60">
          <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f59e0b]" />
          <input
            v-model="searchQuery"
            placeholder="Cari..."
            class="w-full h-7 text-xs font-mono pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        <select
          v-if="stages.length > 0"
          v-model="stageFilter"
          class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
          @change="fetchData"
        >
          <option value="">Semua Stage</option>
          <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- ================= TAB 1: KLASEMEN TIM ================= -->
    <template v-if="activeTab === 'team'">
      <!-- Bulk Action Bar - Teams -->
      <div
        v-if="selectedTeamIds.length > 0"
        class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
      >
        <div class="flex items-center gap-2 text-[#f59e0b]">
          <CheckSquare class="h-4 w-4" />
          <span><b>{{ selectedTeamIds.length }}</b> tim terpilih</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportSelectedTeamsCSV"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#1d1611] text-[#38bdf8] border-[#0284c7] hover:bg-[#251e17] flex items-center gap-1.5 cursor-pointer"
          >
            <Download class="h-3.5 w-3.5 text-[#38bdf8]" />
            <span>Export (CSV)</span>
          </button>
          <button
            @click="selectedTeamIds = []"
            class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Flush Edge-to-Edge Team Table -->
      <div class="flex-1 overflow-x-auto min-h-0">
        <table class="pixel-table w-full text-left text-xs font-mono">
          <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10 text-gray-400 font-pixel text-[11px]">
            <tr>
              <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllTeamsSelected"
                  @change="toggleSelectAllTeams"
                  class="accent-[#f59e0b] cursor-pointer"
                  title="Pilih Semua Halaman Ini"
                />
              </th>
              <th class="p-3 w-14 text-center">#</th>
              <th class="p-3 min-w-[180px]">TIM</th>
              <th class="p-3 min-w-[110px]">KODE</th>
              <th class="p-3 min-w-[140px]">BUDDY</th>
              <th class="p-3 min-w-[100px]">LOKASI</th>
              <th class="p-3 text-center min-w-[90px]">TRANSAKSI</th>
              <th class="p-3 text-right min-w-[110px]">POIN</th>
              <th class="pr-4 md:pr-6 pl-3 py-3 text-right w-16">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#3d2d1e]/60">
            <tr v-if="loading && teams.length === 0" class="text-center">
              <td colspan="9" class="p-8 text-muted-foreground">
                <div class="flex items-center justify-center gap-2">
                  <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                  <span>Memuat klasemen tim...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredTeams.length === 0" class="text-center">
              <td colspan="9" class="p-8 text-muted-foreground">
                Tidak ada data tim yang sesuai.
              </td>
            </tr>

            <tr
              v-for="t in paginatedTeams"
              :key="t.teamId"
              :class="[
                'hover:bg-[#271d15]/50 transition-colors',
                selectedTeamIds.includes(t.teamId) ? 'bg-[#3b2716]/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedTeamIds.includes(t.teamId)"
                  @change="toggleSelectTeam(t.teamId)"
                  class="accent-[#f59e0b] cursor-pointer"
                />
              </td>

              <!-- Rank -->
              <td class="p-3 text-center font-pixel text-xs font-bold">
                <span
                  :class="[
                    t.rank === 1
                      ? 'text-[#facc15]'
                      : t.rank === 2
                      ? 'text-[#e2e8f0]'
                      : t.rank === 3
                      ? 'text-[#fb923c]'
                      : 'text-gray-400'
                  ]"
                >
                  {{ t.rank }}
                </span>
              </td>

              <!-- Team Name -->
              <td class="p-3 font-semibold text-foreground font-pixel text-xs">
                {{ t.name }}
              </td>

              <!-- Code -->
              <td class="p-3 text-[#facc15]">
                {{ t.code }}
              </td>

              <!-- Buddy -->
              <td class="p-3">
                <span v-if="t.buddy" class="border border-[#0284c7]/80 bg-[#16222f] text-[#38bdf8] text-[9px] px-1.5 py-0.5 font-pixel">
                  {{ t.buddy }}
                </span>
                <span v-else class="text-muted-foreground/60 italic text-[10px]">-</span>
              </td>

              <!-- Location / Floor -->
              <td class="p-3 text-muted-foreground">
                {{ t.floor || '-' }}
              </td>

              <!-- Transaction count -->
              <td class="p-3 text-center text-muted-foreground">
                {{ t.txCount || 0 }}
              </td>

              <!-- Points -->
              <td class="p-3 text-right font-pixel text-xs font-bold text-[#4ade80]">
                {{ (t.totalScore || t.score || 0).toLocaleString() }} PTS
              </td>

              <!-- Action Dropdown (3-Dots) -->
              <td class="pr-4 md:pr-6 pl-3 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      class="h-7 w-7 flex items-center justify-center rounded border border-[#523e2b] bg-[#1d1611] text-gray-400 hover:text-white hover:border-[#f59e0b] transition-colors cursor-pointer"
                      title="Menu Aksi"
                    >
                      <MoreHorizontal class="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44 bg-[#1e1510] border-2 border-[#523e2b] text-gray-200 font-mono text-xs z-50">
                    <DropdownMenuItem
                      @click="openTeamCorrection(t)"
                      class="cursor-pointer hover:bg-[#ca8a04]/20 hover:text-[#facc15] flex items-center gap-2 py-1.5"
                    >
                      <Scale class="h-3.5 w-3.5 text-[#f59e0b]" />
                      <span>Koreksi Poin</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="navigateToTeam(t)"
                      class="cursor-pointer hover:bg-[#ca8a04]/20 hover:text-[#facc15] flex items-center gap-2 py-1.5"
                    >
                      <ExternalLink class="h-3.5 w-3.5 text-[#38bdf8]" />
                      <span>Detail Tim</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator class="bg-[#3d2d1e]" />
                    <DropdownMenuItem
                      @click="copyTeamCode(t.code)"
                      class="cursor-pointer hover:bg-[#ca8a04]/20 hover:text-[#facc15] flex items-center gap-2 py-1.5"
                    >
                      <Copy class="h-3.5 w-3.5 text-gray-400" />
                      <span>Salin Kode</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ================= TAB 2: INDIVIDU ================= -->
    <template v-else-if="activeTab === 'participant'">
      <!-- Bulk Action Bar - Participants -->
      <div
        v-if="selectedParticipantIds.length > 0"
        class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
      >
        <div class="flex items-center gap-2 text-[#f59e0b]">
          <CheckSquare class="h-4 w-4" />
          <span><b>{{ selectedParticipantIds.length }}</b> peserta terpilih</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportSelectedParticipantsCSV"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#1d1611] text-[#38bdf8] border-[#0284c7] hover:bg-[#251e17] flex items-center gap-1.5 cursor-pointer"
          >
            <Download class="h-3.5 w-3.5 text-[#38bdf8]" />
            <span>Export (CSV)</span>
          </button>
          <button
            @click="selectedParticipantIds = []"
            class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Flush Edge-to-Edge Participant Table -->
      <div class="flex-1 overflow-x-auto min-h-0">
        <table class="pixel-table w-full text-left text-xs font-mono">
          <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10 text-gray-400 font-pixel text-[11px]">
            <tr>
              <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllParticipantsSelected"
                  @change="toggleSelectAllParticipants"
                  class="accent-[#f59e0b] cursor-pointer"
                  title="Pilih Semua Halaman Ini"
                />
              </th>
              <th class="p-3 w-14 text-center">#</th>
              <th class="p-3 min-w-[200px]">MAHASISWA</th>
              <th class="p-3 min-w-[140px]">REGU</th>
              <th class="p-3 text-center min-w-[90px]">TRANSAKSI</th>
              <th class="p-3 text-right min-w-[110px]">POIN</th>
              <th class="pr-4 md:pr-6 pl-3 py-3 text-right w-16">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#3d2d1e]/60">
            <tr v-if="loading && participants.length === 0" class="text-center">
              <td colspan="7" class="p-8 text-muted-foreground">
                <div class="flex items-center justify-center gap-2">
                  <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                  <span>Memuat klasemen peserta...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredParticipants.length === 0" class="text-center">
              <td colspan="7" class="p-8 text-muted-foreground">
                Tidak ada data peserta yang sesuai.
              </td>
            </tr>

            <tr
              v-for="p in paginatedParticipants"
              :key="p.userId"
              :class="[
                'hover:bg-[#271d15]/50 transition-colors',
                selectedParticipantIds.includes(p.userId) ? 'bg-[#3b2716]/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedParticipantIds.includes(p.userId)"
                  @change="toggleSelectParticipant(p.userId)"
                  class="accent-[#f59e0b] cursor-pointer"
                />
              </td>

              <!-- Rank -->
              <td class="p-3 text-center font-pixel text-xs font-bold">
                <span
                  :class="[
                    p.rank === 1
                      ? 'text-[#facc15]'
                      : p.rank === 2
                      ? 'text-[#e2e8f0]'
                      : p.rank === 3
                      ? 'text-[#fb923c]'
                      : 'text-gray-400'
                  ]"
                >
                  {{ p.rank }}
                </span>
              </td>

              <!-- Mahasiswa Details -->
              <td class="p-3">
                <div class="flex items-center gap-2.5">
                  <div class="h-8 w-8 rounded border border-[#f59e0b]/40 overflow-hidden bg-[#1e1712] shrink-0 shadow-sm">
                    <img
                      :src="getParticipantAvatar(p)"
                      :alt="p.fullName"
                      class="h-full w-full object-cover"
                      style="image-rendering: pixelated;"
                    />
                  </div>
                  <div>
                    <div class="font-bold text-foreground leading-tight">{{ p.fullName }}</div>
                    <div class="text-[10px] text-muted-foreground">@{{ p.username }}</div>
                  </div>
                </div>
              </td>

              <!-- Regu Tim -->
              <td class="p-3">
                <span v-if="p.teamName" class="font-pixel text-[10px] text-[#facc15]">
                  {{ p.teamName }} ({{ p.teamCode }})
                </span>
                <span v-else class="text-[#ca8a04] italic text-[10px]">Free Agent</span>
              </td>

              <!-- Transaction count -->
              <td class="p-3 text-center text-muted-foreground">
                {{ p.txCount || 0 }}
              </td>

              <!-- Points -->
              <td class="p-3 text-right font-pixel text-xs font-bold text-[#4ade80]">
                {{ (p.totalScore || 0).toLocaleString() }} PTS
              </td>

              <!-- Action Dropdown (3-Dots) -->
              <td class="pr-4 md:pr-6 pl-3 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      class="h-7 w-7 flex items-center justify-center rounded border border-[#523e2b] bg-[#1d1611] text-gray-400 hover:text-white hover:border-[#f59e0b] transition-colors cursor-pointer"
                      title="Menu Aksi"
                    >
                      <MoreHorizontal class="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44 bg-[#1e1510] border-2 border-[#523e2b] text-gray-200 font-mono text-xs z-50">
                    <DropdownMenuItem
                      @click="navigateToParticipant(p)"
                      class="cursor-pointer hover:bg-[#ca8a04]/20 hover:text-[#facc15] flex items-center gap-2 py-1.5"
                    >
                      <ExternalLink class="h-3.5 w-3.5 text-[#38bdf8]" />
                      <span>Detail Peserta</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator class="bg-[#3d2d1e]" />
                    <DropdownMenuItem
                      @click="copyParticipantNim(p.username)"
                      class="cursor-pointer hover:bg-[#ca8a04]/20 hover:text-[#facc15] flex items-center gap-2 py-1.5"
                    >
                      <Copy class="h-3.5 w-3.5 text-gray-400" />
                      <span>Salin NIM</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ================= TAB 3: LEDGER ================= -->
    <template v-else-if="activeTab === 'ledger'">
      <!-- Bulk Action Bar - Ledger -->
      <div
        v-if="selectedLedgerIds.length > 0"
        class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
      >
        <div class="flex items-center gap-2 text-[#f59e0b]">
          <CheckSquare class="h-4 w-4" />
          <span><b>{{ selectedLedgerIds.length }}</b> transaksi terpilih</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportSelectedLedgerCSV"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#1d1611] text-[#38bdf8] border-[#0284c7] hover:bg-[#251e17] flex items-center gap-1.5 cursor-pointer"
          >
            <Download class="h-3.5 w-3.5 text-[#38bdf8]" />
            <span>Export (CSV)</span>
          </button>
          <button
            @click="selectedLedgerIds = []"
            class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Flush Edge-to-Edge Ledger Table -->
      <div class="flex-1 overflow-x-auto min-h-0">
        <table class="pixel-table w-full text-left text-xs font-mono">
          <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10 text-gray-400 font-pixel text-[11px]">
            <tr>
              <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllLedgerSelected"
                  @change="toggleSelectAllLedger"
                  class="accent-[#f59e0b] cursor-pointer"
                  title="Pilih Semua Halaman Ini"
                />
              </th>
              <th class="p-3 min-w-[140px]">WAKTU</th>
              <th class="p-3 min-w-[180px]">SASARAN</th>
              <th class="p-3 min-w-[100px]">SUMBER</th>
              <th class="p-3 min-w-[200px]">ALASAN</th>
              <th class="pr-4 md:pr-6 pl-3 py-3 text-right min-w-[100px]">POIN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#3d2d1e]/60">
            <tr v-if="loading && ledger.length === 0" class="text-center">
              <td colspan="6" class="p-8 text-muted-foreground">
                <div class="flex items-center justify-center gap-2">
                  <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                  <span>Memuat data ledger...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredLedger.length === 0" class="text-center">
              <td colspan="6" class="p-8 text-muted-foreground">
                Tidak ada transaksi ledger yang sesuai.
              </td>
            </tr>

            <tr
              v-for="tx in paginatedLedger"
              :key="tx.id"
              :class="[
                'hover:bg-[#271d15]/50 transition-colors',
                selectedLedgerIds.includes(tx.id) ? 'bg-[#3b2716]/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedLedgerIds.includes(tx.id)"
                  @change="toggleSelectLedger(tx.id)"
                  class="accent-[#f59e0b] cursor-pointer"
                />
              </td>

              <!-- Timestamp -->
              <td class="p-3 text-muted-foreground text-[10px]">
                {{ formatDate(tx.createdAt) }}
              </td>

              <!-- Sasaran -->
              <td class="p-3 font-semibold text-foreground">
                {{ tx.targetName || '-' }}
              </td>

              <!-- Sumber -->
              <td class="p-3">
                <span
                  :class="[
                    'px-1.5 py-0.2 text-[8px] font-pixel border',
                    tx.sourceType === 'GAME'
                      ? 'border-[#16a34a] text-[#4ade80]'
                      : tx.sourceType === 'BONUS'
                      ? 'border-[#ca8a04] text-[#facc15]'
                      : tx.sourceType === 'QR'
                      ? 'border-[#0284c7] text-[#38bdf8]'
                      : 'border-[#523e2b] text-muted-foreground'
                  ]"
                >
                  {{ tx.sourceType }}
                </span>
              </td>

              <!-- Alasan -->
              <td class="p-3 text-muted-foreground text-[11px]">
                {{ tx.reason || 'Sesi Game Selesai' }}
              </td>

              <!-- Poin -->
              <td class="pr-4 md:pr-6 pl-3 py-3 text-right font-pixel text-xs font-bold" :class="tx.amount >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'">
                {{ tx.amount >= 0 ? `+${tx.amount}` : tx.amount }} PTS
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
    <PixelPagination
      :current-page="currentPage"
      :total-items="activeTab === 'team' ? filteredTeams.length : activeTab === 'participant' ? filteredParticipants.length : filteredLedger.length"
      :page-size="pageSize"
      @update:current-page="currentPage = $event"
      @update:page-size="pageSize = $event; currentPage = 1"
    />

    <!-- Modal: Koreksi Skor -->
    <Dialog :open="showCorrectionModal" @update:open="showCorrectionModal = $event">
      <DialogContent class="sm:max-w-[440px] pixel-card border-2 border-[#ca8a04] bg-[#1a140f] text-foreground font-mono">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#f59e0b] flex items-center gap-2">
            <Scale class="h-4 w-4" />
            <span>KOREKSI SKOR</span>
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitCorrection" class="space-y-3 py-1 font-mono text-xs">
          <div class="space-y-1">
            <Label class="text-xs font-semibold">Pilih Tim:</Label>
            <select
              v-model="correctionForm.teamId"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              required
            >
              <option value="">-- Pilih Tim Sasaran --</option>
              <option v-for="t in teams" :key="t.teamId" :value="t.teamId">
                {{ t.name }} ({{ t.code }})
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-semibold">Nominal Poin (+ / -):</Label>
            <input
              type="number"
              v-model.number="correctionForm.amount"
              placeholder="Contoh: 100 atau -50"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-semibold">Alasan Koreksi:</Label>
            <input
              v-model="correctionForm.reason"
              placeholder="Alasan penyesuaian nilai..."
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <DialogFooter class="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground cursor-pointer"
              @click="showCorrectionModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold cursor-pointer"
              :disabled="submitting"
            >
              <RotateCw v-if="submitting" class="h-3 w-3 animate-spin mr-1 inline" />
              <span>SIMPAN</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
