<template>
  <div class="space-y-4 pb-12 font-sans select-none text-[#f0e0c0]">
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
          'fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 z-50 p-3 rounded-xl border shadow-xl font-mono text-xs flex items-center gap-2 max-w-sm backdrop-blur-md',
          toast.type === 'success'
            ? 'bg-[#142612]/95 border-[#22c55e] text-[#86efac]'
            : toast.type === 'error'
            ? 'bg-[#2a1210]/95 border-red-500 text-red-300'
            : 'bg-[#181d28]/95 border-sky-500 text-sky-300'
        ]"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="h-4 w-4 shrink-0 text-[#22c55e]" />
        <AlertCircle v-else class="h-4 w-4 shrink-0 text-red-400" />
        <span class="leading-tight">{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- 1. HEADER IDENTITAS STAN ORMAWA (Stardew Valley Gold Banner)         -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div class="sdv-card-gold p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="border border-[#f0d060] bg-[#1a1008] px-2 py-0.5 text-[8.5px] font-pixel text-[#f0d060] uppercase tracking-wider rounded">
              STAN ORMAWA
            </span>
            <span class="border border-[#22c55e] bg-[#132215] px-2 py-0.5 text-[8.5px] font-pixel text-[#86efac] uppercase tracking-wider rounded">
              LANTAI {{ boothInfo.floorNumber }}
            </span>
          </div>
          <h1 class="font-pixel text-base sm:text-lg text-[#fef08a] font-bold tracking-wide truncate">
            {{ boothInfo.name }}
          </h1>
          <p class="text-xs text-[#c4956a] font-mono">
            PIC: <strong class="text-white">{{ user?.fullName || 'PIC Stan' }}</strong> &bull; Kategori: <strong class="text-[#f0d060]">{{ boothInfo.category }}</strong>
          </p>
        </div>

        <div class="text-right shrink-0">
          <span class="font-pixel text-sm sm:text-base text-[#86efac] font-bold block">
            {{ visitorCount }} MABA
          </span>
          <span class="text-[9.5px] text-[#facc15] font-mono">Total Berkunjung</span>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="grid grid-cols-3 gap-2 text-center font-mono text-[10.5px] pt-2.5 border-t border-[#5a3a18]">
        <div class="bg-[#170f07] py-2 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[8px] block truncate uppercase">TOTAL PENGUNJUNG</span>
          <span class="font-pixel text-xs text-white">{{ visitorCount }}</span>
        </div>
        <div class="bg-[#170f07] py-2 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[8px] block truncate uppercase">TOTAL XP KAMPUS</span>
          <span class="font-pixel text-xs text-[#86efac]">+{{ (visitorCount * (boothInfo.xpReward || 75)).toLocaleString('id-ID') }}</span>
        </div>
        <div class="bg-[#170f07] py-2 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[8px] block truncate uppercase">STATUS STAN</span>
          <span class="font-pixel text-[10px] text-[#22c55e] flex items-center justify-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            AKTIF
          </span>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- 2. PANEL UTAMA: PEMBERIAN XP TAMBAHAN MAHASISWA BARU                -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div class="sdv-card p-4 space-y-4">
      <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2.5">
        <div class="flex items-center gap-2">
          <Sparkles class="h-4 w-4 text-[#facc15]" />
          <div>
            <h2 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold uppercase">
              BERI REWARD XP MAHASISWA BARU
            </h2>
            <p class="text-[10px] text-[#c4956a] font-mono mt-0.5">
              Reward resmi kunjungan: <strong class="text-[#86efac]">+{{ boothInfo.xpReward || 75 }} XP</strong> per mahasiswa
            </p>
          </div>
        </div>
      </div>

      <!-- Action 1: Tombol Buka Kamera Scanner QR Maba -->
      <NuxtLink
        to="/ormawa/scan"
        class="rpg-btn-primary p-3.5 flex items-center justify-between gap-3 shadow-lg active:scale-98 transition-all block rounded-xl"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-black/30 border border-[#f0d060] flex items-center justify-center shrink-0">
            <ScanLine class="h-6 w-6 text-[#facc15]" />
          </div>
          <div class="text-left">
            <div class="font-pixel text-xs sm:text-sm font-bold text-white uppercase flex items-center gap-1.5">
              <span>BUKA SCANNER KAMERA</span>
              <span class="text-[8.5px] bg-[#facc15] text-black px-1.5 py-0.2 rounded font-mono font-bold">LIVE QR</span>
            </div>
            <p class="text-[10.5px] text-[#86efac] font-mono mt-0.5">
              Scan barcode / QR Code kartu identitas mahasiswa baru
            </p>
          </div>
        </div>
        <ArrowRight class="h-5 w-5 text-[#f0d060] shrink-0" />
      </NuxtLink>

      <div class="flex items-center gap-2 text-center text-xs text-[#a08060] font-mono">
        <div class="flex-1 border-t border-[#422d18]"></div>
        <span class="text-[9px] uppercase font-pixel tracking-wider">ATAU INPUT MANUAL</span>
        <div class="flex-1 border-t border-[#422d18]"></div>
      </div>

      <!-- Action 2: Input Manual NIM Mahasiswa -->
      <div class="bg-[#140c06] p-3.5 rounded-xl border border-[#5a3a18] space-y-2.5">
        <label class="text-[10px] font-pixel text-[#e5b383] uppercase flex items-center justify-between">
          <span>Ketik NIM Mahasiswa Baru:</span>
          <span class="text-[8.5px] text-gray-500 font-mono">Tekan Enter atau klik tombol Beri XP</span>
        </label>
        
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="relative flex-1">
            <input
              v-model="manualNim"
              type="text"
              placeholder="Contoh: 26111101 atau NIM maba..."
              class="w-full h-10 bg-[#0d0804] border border-[#523e2b] focus:border-[#f0d060] rounded-lg px-3 text-xs text-[#fef08a] placeholder:text-gray-600 outline-none font-mono"
              @keydown.enter="submitManualNim"
              :disabled="isProcessing"
            />
          </div>
          <button
            type="button"
            @click="submitManualNim"
            :disabled="!manualNim.trim() || isProcessing"
            class="h-10 px-4 bg-[#ca8a04] hover:bg-[#eab308] text-[#140e08] font-pixel text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Check v-if="!isProcessing" class="h-4 w-4 text-[#140e08]" />
            <Loader2 v-else class="h-4 w-4 animate-spin text-[#140e08]" />
            <span>BERI +{{ boothInfo.xpReward || 75 }} XP</span>
          </button>
        </div>

        <!-- Feedback Result Card -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="lastResult"
            :class="[
              'p-3 rounded-lg border font-mono text-xs flex items-start gap-2.5',
              lastResult.success
                ? 'bg-[#142612] border-[#22c55e] text-[#86efac]'
                : 'bg-[#2a1210] border-red-600 text-red-300'
            ]"
          >
            <CheckCircle2 v-if="lastResult.success" class="h-4 w-4 shrink-0 text-[#22c55e] mt-0.5" />
            <AlertCircle v-else class="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div class="space-y-0.5">
              <p class="font-pixel text-[10px] leading-tight" :class="lastResult.success ? 'text-[#86efac]' : 'text-red-300'">
                {{ lastResult.message }}
              </p>
              <p v-if="lastResult.mabaName" class="text-[9.5px] text-gray-300">
                Mahasiswa: <strong>{{ lastResult.mabaName }}</strong> (NIM: {{ lastResult.mabaNim }})
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- 3. PANEL DATA: DAFTAR MAHASISWA YANG SUDAH BERKUNJUNG               -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div class="sdv-card p-4 space-y-3">
      <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <Users class="h-4 w-4 text-[#facc15]" />
          <div>
            <h2 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold uppercase">
              DATA PENGUNJUNG STAN ({{ visitors.length }})
            </h2>
            <span class="text-[9.5px] text-[#c4956a] font-mono">Daftar mahasiswa yang telah divalidasi</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="loadBoothData"
            :disabled="loadingVisitors"
            class="h-7 px-2 bg-[#271d15] hover:bg-[#3d2d1e] border border-[#523e2b] text-[#c4956a] hover:text-white font-mono text-[9px] rounded flex items-center gap-1 cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': loadingVisitors }" />
            <span class="hidden sm:inline">REFRESH</span>
          </button>

          <button
            type="button"
            @click="exportVisitorsCsv"
            :disabled="visitors.length === 0"
            class="h-7 px-2.5 bg-[#271d15] hover:bg-[#3d2d1e] border border-[#f0d060] text-[#facc15] font-pixel text-[8.5px] rounded flex items-center gap-1 cursor-pointer shadow active:scale-95 disabled:opacity-40"
          >
            <Download class="h-3 w-3" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      <!-- Search Input Filter -->
      <div class="relative">
        <Search class="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau NIM mahasiswa..."
          class="h-8.5 w-full bg-[#140c06] border border-[#523e2b] rounded-lg pl-9 pr-3 text-xs font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f0d060]"
        />
      </div>

      <!-- Visitors List / Table -->
      <div v-if="loadingVisitors" class="p-8 text-center text-[#c4956a] font-mono text-xs">
        <div class="inline-block w-5 h-5 border-2 border-[#f0d060] border-t-transparent rounded-full animate-spin mb-2"></div>
        <div>Memuat daftar pengunjung stan...</div>
      </div>

      <div v-else-if="filteredVisitors.length === 0" class="p-8 text-center text-[#c4956a] font-mono text-xs space-y-2 border border-dashed border-[#5a3a18] rounded-xl bg-[#140c06]">
        <Users class="h-8 w-8 mx-auto text-[#a08060]/50" />
        <p class="text-amber-200/80">Belum ada data kunjungan mahasiswa baru.</p>
        <p class="text-[10px] text-gray-400">
          Silakan scan barcode profil maba atau ketik NIM maba pada form di atas.
        </p>
      </div>

      <div v-else class="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
        <div
          v-for="(visitor, idx) in filteredVisitors"
          :key="visitor.scanId || visitor.id || idx"
          class="p-2.5 rounded-lg bg-[#140c06] border border-[#5a3a18] flex items-center justify-between gap-2.5 hover:border-[#f0d060] transition-colors"
        >
          <!-- Left: Number, Name & NIM -->
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="h-7 w-7 rounded bg-[#201309] border border-[#5a3a18] flex items-center justify-center font-pixel text-[10px] text-[#a08060] shrink-0">
              {{ idx + 1 }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-[#fef08a] truncate block">
                  {{ visitor.fullName || 'Mahasiswa' }}
                </span>
                <span v-if="visitor.teamName" class="text-[8.5px] bg-[#271d15] text-[#86efac] px-1.5 py-0.2 rounded font-pixel shrink-0">
                  {{ visitor.teamName }}
                </span>
              </div>
              <span class="text-[9.5px] text-[#a08060] font-mono block">
                NIM: {{ visitor.username || visitor.nim || '-' }}
              </span>
            </div>
          </div>

          <!-- Right: XP & Time -->
          <div class="text-right shrink-0">
            <span class="font-pixel text-[10px] text-[#86efac] font-bold block">
              +{{ visitor.xpEarned || boothInfo.xpReward || 75 }} XP
            </span>
            <span class="text-[8.5px] text-gray-400 font-mono">
              {{ formatTime(visitor.scannedAt) }}
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
  ScanLine,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Check,
  Loader2,
  Download,
  Search,
  RefreshCw,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

const { user } = useAuth();
const api = useApi();

const visitorCount = ref(0);
const visitors = ref<any[]>([]);
const loadingVisitors = ref(false);
const searchQuery = ref("");
const manualNim = ref("");
const isProcessing = ref(false);

const lastResult = ref<{
  success: boolean;
  message: string;
  mabaName?: string;
  mabaNim?: string;
} | null>(null);

const toast = ref<{ type: "success" | "error"; message: string } | null>(null);

const boothInfo = ref({
  id: (user.value as any)?.boothId || "",
  name: (user.value as any)?.boothName || "Memuat Stan Ormawa...",
  code: (user.value as any)?.boothCode || "ORMAWA",
  category: (user.value as any)?.category || "Stan Ormawa",
  floorNumber: (user.value as any)?.assignedFloor || 6,
  xpReward: 75,
});

const filteredVisitors = computed(() => {
  if (!searchQuery.value.trim()) return visitors.value;
  const q = searchQuery.value.toLowerCase().trim();
  return visitors.value.filter(
    (v) =>
      (v.fullName || "").toLowerCase().includes(q) ||
      (v.username || v.nim || "").toLowerCase().includes(q) ||
      (v.teamName || "").toLowerCase().includes(q)
  );
});

// Audio synth feedback
function playBeep(type: "success" | "error" = "success") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio context restriction
  }
}

function showToast(type: "success" | "error", message: string) {
  toast.value = { type, message };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
}

function formatTime(isoString: string) {
  if (!isoString) return "Baru saja";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

// ─── Manual NIM Submission & Give XP ─────────────────────────────────────────
async function submitManualNim() {
  const nim = manualNim.value.trim();
  if (!nim || isProcessing.value) return;

  isProcessing.value = true;
  lastResult.value = null;

  try {
    const payload: Record<string, any> = {
      mabaNim: nim,
    };
    if (boothInfo.value.id) {
      payload.boothId = boothInfo.value.id;
    }

    const res = await api.post("/ormawa/scan-maba", payload);

    if (res.success) {
      playBeep("success");
      const mabaName = res.data?.maba?.fullName || res.data?.participant?.fullName || `Mahasiswa (${nim})`;
      const mabaNim = res.data?.maba?.username || res.data?.participant?.nim || nim;
      const xpEarned = res.data?.xpEarned || boothInfo.value.xpReward || 75;

      lastResult.value = {
        success: true,
        message: res.message || `Berhasil memberikan +${xpEarned} XP!`,
        mabaName,
        mabaNim,
      };

      showToast("success", `+${xpEarned} XP berhasil diberikan ke ${mabaName}!`);
      manualNim.value = "";

      // Refresh data pengunjung
      await loadBoothData();
    } else {
      playBeep("error");
      const msg = res.message || res.error?.message || "Gagal mencatat kunjungan mahasiswa.";
      lastResult.value = {
        success: false,
        message: msg,
      };
      showToast("error", msg);
    }
  } catch (err: any) {
    playBeep("error");
    const msg = err?.data?.error?.message || err?.data?.message || err?.message || "Terjadi kesalahan saat memproses NIM.";
    lastResult.value = {
      success: false,
      message: msg,
    };
    showToast("error", msg);
  } finally {
    isProcessing.value = false;
  }
}

// ─── Export CSV ─────────────────────────────────────────────────────────────
function exportVisitorsCsv() {
  if (visitors.value.length === 0) return;
  const headers = ["No", "NIM", "Nama Lengkap", "Regu", "Waktu Kunjungan", "XP"];
  const rows = visitors.value.map((v, i) => [
    i + 1,
    `"${v.username || v.nim || ''}"`,
    `"${(v.fullName || '').replace(/"/g, '""')}"`,
    `"${(v.teamName || '').replace(/"/g, '""')}"`,
    `"${formatTime(v.scannedAt)}"`,
    v.xpEarned || boothInfo.value.xpReward || 75,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pengunjung-${boothInfo.value.code || 'stan'}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Load Booth & Visitors ───────────────────────────────────────────────────
async function loadBoothData() {
  loadingVisitors.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any }>("/api/ormawa/my-booth");
    if (res.success && res.data) {
      boothInfo.value = {
        ...boothInfo.value,
        ...res.data,
      };
    }
  } catch (err) {
    console.warn("Could not load /api/ormawa/my-booth, using auth session data:", err);
    if ((user.value as any)?.boothName) {
      boothInfo.value.name = (user.value as any).boothName;
    }
    if ((user.value as any)?.boothCode) {
      boothInfo.value.code = (user.value as any).boothCode;
    }
    if (user.value?.assignedFloor) {
      boothInfo.value.floorNumber = user.value.assignedFloor;
    }
    if ((user.value as any)?.boothId) {
      boothInfo.value.id = (user.value as any).boothId;
    }
  }

  // Load visitors
  try {
    const targetId = boothInfo.value.id || (user.value as any)?.boothId;
    if (targetId) {
      const resVisitors = await api.get<{ success: boolean; data: { totalAttendees: number; attendees: any[] } }>(
        `/api/ormawa/booths/${targetId}/visitors`
      );
      if (resVisitors.success && resVisitors.data) {
        visitorCount.value = Number(resVisitors.data.totalAttendees || 0);
        visitors.value = Array.isArray(resVisitors.data.attendees) ? resVisitors.data.attendees : [];
      }
    } else {
      visitorCount.value = 0;
      visitors.value = [];
    }
  } catch {
    visitorCount.value = 0;
    visitors.value = [];
  } finally {
    loadingVisitors.value = false;
  }
}

onMounted(() => {
  loadBoothData();
});
</script>
