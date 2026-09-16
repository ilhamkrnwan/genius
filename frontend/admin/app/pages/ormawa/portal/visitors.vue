<template>
  <div class="space-y-3 pb-8 font-sans select-none text-[#f0e0c0]">
    <!-- Header Banner -->
    <div class="sdv-card-gold p-3.5 space-y-2">
      <div class="flex items-center justify-between">
        <div>
          <span class="border border-[#f0d060] bg-[#1a1008] px-1.5 py-0.5 text-[8px] font-pixel text-[#f0d060] uppercase tracking-wider rounded">
            DATA PRESENSI STAN
          </span>
          <h1 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold mt-1 uppercase flex items-center gap-1.5">
            <Users class="h-4 w-4 text-[#facc15]" />
            <span>LOG PENGUNJUNG STAN</span>
          </h1>
        </div>

        <button
          type="button"
          @click="exportVisitorsCsv"
          :disabled="visitors.length === 0"
          class="h-7 px-2.5 bg-[#271d15] hover:bg-[#3d2d1e] border border-[#f0d060] text-[#facc15] font-pixel text-[9px] rounded flex items-center gap-1.5 cursor-pointer shadow active:scale-95 disabled:opacity-40"
        >
          <Download class="h-3 w-3" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="flex items-center justify-between pt-1 border-t border-[#5a3a18] text-[10px] font-mono">
        <span class="text-[#c4956a]">
          Total Mahasiswa: <strong class="text-white font-pixel text-[10px]">{{ filteredVisitors.length }}</strong>
        </span>
        <span class="text-[#86efac]">
          Total XP Dibagikan: <strong class="text-[#facc15] font-pixel text-[10px]">+{{ (visitors.length * 75).toLocaleString('id-ID') }} XP</strong>
        </span>
      </div>
    </div>

    <!-- Search Toolbar -->
    <div class="sdv-card p-2">
      <div class="relative">
        <Search class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau NIM mahasiswa..."
          class="h-8 w-full bg-[#140c06] border border-[#523e2b] rounded-lg pl-8 pr-3 text-xs font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f0d060]"
        />
      </div>
    </div>

    <!-- Visitors List -->
    <div v-if="loading" class="sdv-card p-8 text-center text-[#c4956a] font-mono text-xs">
      <div class="inline-block w-5 h-5 border-2 border-[#f0d060] border-t-transparent rounded-full animate-spin mb-2"></div>
      <div>Memuat daftar kunjungan maba...</div>
    </div>

    <div v-else-if="filteredVisitors.length === 0" class="sdv-card p-8 text-center text-[#c4956a] font-mono text-xs space-y-2">
      <Users class="h-8 w-8 mx-auto text-[#a08060]/50" />
      <div>Belum ada mahasiswa yang tercatat mengunjungi stan ini.</div>
      <NuxtLink
        to="/ormawa/scan"
        class="inline-flex items-center gap-1.5 text-xs text-[#facc15] hover:underline font-pixel text-[9px] pt-1"
      >
        <ScanLine class="h-3.5 w-3.5" />
        Buka Scanner Sekarang ▶
      </NuxtLink>
    </div>

    <div v-else class="space-y-1.5">
      <div
        v-for="(visitor, idx) in filteredVisitors"
        :key="visitor.scanId || idx"
        class="sdv-card p-2.5 flex items-center justify-between gap-2.5 hover:border-[#f0d060] transition-colors"
      >
        <!-- Left: Index & Info -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="h-7 w-7 rounded bg-[#170f07] border border-[#5a3a18] flex items-center justify-center font-pixel text-[10px] text-[#a08060] shrink-0">
            {{ idx + 1 }}
          </div>

          <div class="space-y-0.5 min-w-0">
            <div class="font-pixel text-[10.5px] sm:text-xs text-white font-bold truncate">
              {{ visitor.fullName }}
            </div>
            <div class="text-[10px] text-[#c4956a] font-mono flex items-center gap-1.5 flex-wrap">
              <span class="text-[#facc15] font-bold">{{ visitor.username }}</span>
              <span>&bull;</span>
              <span class="text-[#86efac] truncate">{{ visitor.teamName || 'Regu Maba' }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Time & XP -->
        <div class="text-right shrink-0">
          <span class="font-pixel text-[9px] text-[#86efac] font-bold block">
            +{{ visitor.xpEarned || 75 }} XP
          </span>
          <span class="text-[8px] text-gray-400 font-mono">
            {{ formatTime(visitor.scannedAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Users, Download, Search, ScanLine } from "lucide-vue-next";
import { useApi } from "~/composables/useApi";

const api = useApi();

const loading = ref(true);
const searchQuery = ref("");
const visitors = ref<any[]>([]);

const filteredVisitors = computed(() => {
  if (!searchQuery.value.trim()) return visitors.value;
  const q = searchQuery.value.toLowerCase().trim();
  return visitors.value.filter(
    (v) =>
      (v.fullName || "").toLowerCase().includes(q) ||
      (v.username || "").toLowerCase().includes(q) ||
      (v.teamName || "").toLowerCase().includes(q)
  );
});

function formatTime(isoString: string) {
  if (!isoString) return "Baru saja";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function exportVisitorsCsv() {
  if (visitors.value.length === 0) return;
  const headers = ["No", "NIM", "Nama Lengkap", "Regu", "Waktu Kunjungan", "XP"];
  const rows = visitors.value.map((v, i) => [
    i + 1,
    `"${v.username || ''}"`,
    `"${(v.fullName || '').replace(/"/g, '""')}"`,
    `"${(v.teamName || '').replace(/"/g, '""')}"`,
    `"${formatTime(v.scannedAt)}"`,
    v.xpEarned || 75,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pengunjung-stan-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

onMounted(async () => {
  loading.value = true;
  try {
    let boothId: string | null = null;
    const res = await api.get<{ success: boolean; data: any }>("/api/ormawa/my-booth");
    if (res.success && res.data?.id) {
      boothId = res.data.id;
    }

    if (boothId) {
      const resVisitors = await api.get<{ success: boolean; data: { attendees: any[] } }>(
        `/api/ormawa/booths/${boothId}/visitors`
      );
      if (resVisitors.success && Array.isArray(resVisitors.data?.attendees)) {
        visitors.value = resVisitors.data.attendees;
      } else {
        visitors.value = [];
      }
    } else {
      visitors.value = [];
    }
  } catch (err) {
    console.error("Gagal memuat log pengunjung dari database:", err);
    visitors.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
