<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  Store,
  Users,
  Plus,
  RotateCw,
  QrCode,
  Search,
  Pencil,
  Trash2,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  Trophy,
  Zap,
  Download,
  Printer,
  ExternalLink,
  MoreHorizontal,
  CheckSquare,
  ScanLine,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import PixelPagination from "@/components/PixelPagination.vue";
import LogoUploadField from "~/components/ormawa/LogoUploadField.vue";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";

const api = useApi();
const toast = useToast();
const confirmModal = useConfirm();

// Active Tab
const activeTab = ref<"booths" | "visitors">("booths");
const loading = ref(false);

// State Data
const booths = ref<any[]>([]);
const floors = ref<any[]>([]);
const recentScans = ref<any[]>([]);
const loadingRecentScans = ref(false);

// Selection State
const selectedBoothIds = ref<string[]>([]);
const selectedScanIds = ref<string[]>([]);
const processingBulk = ref(false);

// Pagination
const boothPage = ref(1);
const boothPageSize = ref(10);
const scanPage = ref(1);
const scanPageSize = ref(25);

// Filters for Booths
const searchQuery = ref("");
const selectedFloor = ref(0);
const selectedCategory = ref("");
const selectedStatus = ref("all");

// Filters for Visitors Tab
const visitorSearchQuery = ref("");
const visitorSelectedBooth = ref("");

// QR Code Preview Modal State
const showQrModal = ref(false);
const selectedBoothForQr = ref<any>(null);

// Form Modal State
const showFormModal = ref(false);
const isEditing = ref(false);
const savingForm = ref(false);
const formState = reactive({
  id: "",
  code: "",
  name: "",
  shortName: "",
  category: "",
  floorId: null as string | null,
  boothNumber: "",
  description: "",
  qrCode: "",
  xpReward: 75,
  contactPerson: "",
  instagram: "",
  logoUrl: "",
  isActive: true,
});

// Computed Available Categories
const availableCategories = computed(() => {
  const set = new Set<string>();
  booths.value.forEach((b) => {
    if (b.category) set.add(b.category);
  });
  return Array.from(set).sort();
});

// Filtered Booths
const filteredBooths = computed(() => {
  return booths.value.filter((b) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = b.name?.toLowerCase().includes(q);
      const matchCode = b.code?.toLowerCase().includes(q);
      const matchShort = b.shortName?.toLowerCase().includes(q);
      const matchBooth = b.boothNumber?.toLowerCase().includes(q);
      const matchCat = b.category?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchShort && !matchBooth && !matchCat) return false;
    }

    if (selectedFloor.value !== 0 && b.floorNumber !== selectedFloor.value) {
      return false;
    }

    if (selectedCategory.value && b.category !== selectedCategory.value) {
      return false;
    }

    if (selectedStatus.value === "active" && !b.isActive) return false;
    if (selectedStatus.value === "inactive" && b.isActive) return false;

    return true;
  });
});

const paginatedBooths = computed(() => {
  const start = (boothPage.value - 1) * boothPageSize.value;
  return filteredBooths.value.slice(start, start + boothPageSize.value);
});

// Filtered Recent Scans
const filteredRecentScans = computed(() => {
  return recentScans.value.filter((s) => {
    if (visitorSelectedBooth.value && s.boothId !== visitorSelectedBooth.value) {
      return false;
    }
    if (visitorSearchQuery.value.trim()) {
      const q = visitorSearchQuery.value.toLowerCase().trim();
      const matchName = s.fullName?.toLowerCase().includes(q);
      const matchNim = s.username?.toLowerCase().includes(q);
      const matchTeam = s.teamName?.toLowerCase().includes(q);
      const matchBooth = s.boothName?.toLowerCase().includes(q);
      if (!matchName && !matchNim && !matchTeam && !matchBooth) return false;
    }
    return true;
  });
});

const paginatedScans = computed(() => {
  const start = (scanPage.value - 1) * scanPageSize.value;
  return filteredRecentScans.value.slice(start, start + scanPageSize.value);
});

// Selection Helpers - Booths
const isAllBoothsSelected = computed(() => {
  if (paginatedBooths.value.length === 0) return false;
  return paginatedBooths.value.every((b) => selectedBoothIds.value.includes(b.id));
});

function toggleSelectAllBooths() {
  if (isAllBoothsSelected.value) {
    selectedBoothIds.value = selectedBoothIds.value.filter(
      (id) => !paginatedBooths.value.some((b) => b.id === id)
    );
  } else {
    const toAdd = paginatedBooths.value
      .map((b) => b.id)
      .filter((id) => !selectedBoothIds.value.includes(id));
    selectedBoothIds.value.push(...toAdd);
  }
}

function toggleSelectBooth(id: string) {
  const idx = selectedBoothIds.value.indexOf(id);
  if (idx > -1) {
    selectedBoothIds.value.splice(idx, 1);
  } else {
    selectedBoothIds.value.push(id);
  }
}

// Selection Helpers - Scans
const isAllScansSelected = computed(() => {
  if (paginatedScans.value.length === 0) return false;
  return paginatedScans.value.every((s) => selectedScanIds.value.includes(s.scanId));
});

function toggleSelectAllScans() {
  if (isAllScansSelected.value) {
    selectedScanIds.value = selectedScanIds.value.filter(
      (id) => !paginatedScans.value.some((s) => s.scanId === id)
    );
  } else {
    const toAdd = paginatedScans.value
      .map((s) => s.scanId)
      .filter((id) => !selectedScanIds.value.includes(id));
    selectedScanIds.value.push(...toAdd);
  }
}

function toggleSelectScan(id: string) {
  const idx = selectedScanIds.value.indexOf(id);
  if (idx > -1) {
    selectedScanIds.value.splice(idx, 1);
  } else {
    selectedScanIds.value.push(id);
  }
}

// Metrics HUD
const activeBoothsCount = computed(() => booths.value.filter((b) => b.isActive).length);
const totalVisitsCount = computed(() => {
  return booths.value.reduce((acc, b) => acc + (b.visitorCount || 0), 0);
});
const totalXpDistributed = computed(() => {
  return recentScans.value.reduce((acc, s) => acc + (s.xpEarned || 75), 0) || (totalVisitsCount.value * 75);
});
const topBooth = computed(() => {
  if (booths.value.length === 0) return null;
  const sorted = [...booths.value].sort((a, b) => (b.visitorCount || 0) - (a.visitorCount || 0));
  return sorted[0]?.visitorCount > 0 ? sorted[0] : null;
});

// Load Data
async function loadFloors() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/floors");
    if (res?.success && Array.isArray(res.data)) {
      floors.value = res.data;
    }
  } catch (err) {
    console.error("Gagal memuat daftar lantai:", err);
  }
}

async function loadBooths() {
  loading.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/ormawa/booths?includeInactive=true");
    if (res?.success && Array.isArray(res.data)) {
      booths.value = res.data;
    }
  } catch (err) {
    console.error("Gagal memuat stan ormawa:", err);
  } finally {
    loading.value = false;
  }
}

async function loadRecentScans() {
  loadingRecentScans.value = true;
  try {
    const res = await api.get<{ success: boolean; data: { totalVisits: number; scans: any[] } }>("/api/ormawa/visitors?limit=200");
    if (res?.success && res.data?.scans) {
      recentScans.value = res.data.scans;
    }
  } catch (err) {
    console.error("Gagal memuat riwayat kunjungan:", err);
  } finally {
    loadingRecentScans.value = false;
  }
}

function handleRefresh() {
  loadBooths();
  loadRecentScans();
}

// Form Handlers
function openCreateModal() {
  isEditing.value = false;
  formState.id = "";
  formState.code = "";
  formState.name = "";
  formState.shortName = "";
  formState.category = "";
  formState.floorId = null;
  formState.boothNumber = "";
  formState.description = "";
  formState.qrCode = "";
  formState.xpReward = 75;
  formState.contactPerson = "";
  formState.instagram = "";
  formState.logoUrl = "";
  formState.isActive = true;
  showFormModal.value = true;
}

function openEditModal(booth: any) {
  isEditing.value = true;
  formState.id = booth.id;
  formState.code = booth.code;
  formState.name = booth.name;
  formState.shortName = booth.shortName || "";
  formState.category = booth.category;
  formState.floorId = booth.floorId || null;
  formState.boothNumber = booth.boothNumber || "";
  formState.description = booth.description || "";
  formState.qrCode = booth.qrCode || "";
  formState.xpReward = booth.xpReward || 75;
  formState.contactPerson = booth.contactPerson || "";
  formState.instagram = booth.instagram || "";
  formState.logoUrl = booth.logoUrl || "";
  formState.isActive = booth.isActive;
  showFormModal.value = true;
}

async function submitBoothForm() {
  savingForm.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/api/ormawa/booths/${formState.id}`, {
        name: formState.name,
        shortName: formState.shortName || null,
        category: formState.category,
        floorId: formState.floorId || null,
        boothNumber: formState.boothNumber || null,
        description: formState.description || null,
        qrCode: formState.qrCode || undefined,
        xpReward: formState.xpReward,
        contactPerson: formState.contactPerson || null,
        instagram: formState.instagram || null,
        logoUrl: formState.logoUrl || null,
        isActive: formState.isActive,
      });
      toast.success(`Stan "${formState.name}" berhasil disimpan.`);
    } else {
      await api.post("/api/ormawa/booths", {
        code: formState.code,
        name: formState.name,
        shortName: formState.shortName || null,
        category: formState.category,
        floorId: formState.floorId || null,
        boothNumber: formState.boothNumber || null,
        description: formState.description || null,
        qrCode: formState.qrCode || null,
        xpReward: formState.xpReward,
        contactPerson: formState.contactPerson || null,
        instagram: formState.instagram || null,
        logoUrl: formState.logoUrl || null,
        isActive: formState.isActive,
      });
      toast.success(`Stan "${formState.name}" berhasil ditambahkan.`);
    }

    showFormModal.value = false;
    await loadBooths();
  } catch (err: any) {
    const msg = err?.data?.error?.message || err?.message || "Gagal menyimpan stan.";
    toast.error(msg);
  } finally {
    savingForm.value = false;
  }
}

async function toggleBoothStatus(booth: any) {
  const newStatus = !booth.isActive;
  try {
    await api.put(`/api/ormawa/booths/${booth.id}`, { isActive: newStatus });
    booth.isActive = newStatus;
    toast.info(`Stan "${booth.name}" sekarang ${newStatus ? 'aktif' : 'nonaktif'}.`);
  } catch (err: any) {
    toast.error("Gagal mengubah status stan.");
  }
}

async function confirmDelete(booth: any) {
  const confirmed = await confirmModal.show({
    title: "Hapus Stan?",
    description: `Hapus stan "${booth.name}" (${booth.code}) beserta seluruh riwayat presensinya?`,
    confirmText: "Ya, Hapus",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!confirmed) return;

  try {
    await api.del(`/api/ormawa/booths/${booth.id}`);
    toast.success(`Stan "${booth.name}" telah dihapus.`);
    selectedBoothIds.value = selectedBoothIds.value.filter((id) => id !== booth.id);
    await loadBooths();
    await loadRecentScans();
  } catch (err: any) {
    toast.error(err?.data?.error?.message || "Gagal menghapus stan.");
  }
}

// Bulk Actions - Booths
async function batchToggleBoothStatus(isActive: boolean) {
  if (selectedBoothIds.value.length === 0) return;
  processingBulk.value = true;
  try {
    const res = await api.post<{ success: boolean; message: string }>("/api/ormawa/booths/batch-status", {
      boothIds: selectedBoothIds.value,
      isActive,
    });
    if (res.success) {
      toast.success(res.message || `${selectedBoothIds.value.length} stan berhasil diperbarui.`);
      selectedBoothIds.value = [];
      await loadBooths();
    }
  } catch (err: any) {
    toast.error(err?.data?.error?.message || err?.message || "Gagal memperbarui status stan.");
  } finally {
    processingBulk.value = false;
  }
}

async function batchDeleteBooths() {
  if (selectedBoothIds.value.length === 0) return;
  const ok = await confirmModal.show({
    title: "Hapus Stan Terpilih?",
    description: `Yakin ingin menghapus ${selectedBoothIds.value.length} stan terpilih secara permanen?`,
    confirmText: "Ya, Hapus Semua",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!ok) return;

  processingBulk.value = true;
  try {
    const res = await api.post<{ success: boolean; message: string }>("/api/ormawa/booths/batch-delete", {
      boothIds: selectedBoothIds.value,
    });
    if (res.success) {
      toast.success(res.message || `${selectedBoothIds.value.length} stan berhasil dihapus.`);
      selectedBoothIds.value = [];
      await loadBooths();
      await loadRecentScans();
    }
  } catch (err: any) {
    toast.error(err?.data?.error?.message || err?.message || "Gagal menghapus stan terpilih.");
  } finally {
    processingBulk.value = false;
  }
}

// QR Preview
function openQrPreview(booth: any) {
  selectedBoothForQr.value = booth;
  showQrModal.value = true;
}

function getQrImageUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(code || '')}`;
}

// CSV Export Utilities
function exportSelectedVisitorsCsv() {
  const toExport = recentScans.value.filter((s) => selectedScanIds.value.includes(s.scanId));
  if (toExport.length === 0) return;
  generateCsvDownload(toExport, `presensi-expo-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${toExport.length} data terpilih.`);
}

function exportAllVisitorsCsv() {
  if (filteredRecentScans.value.length === 0) {
    toast.warning("Tidak ada data kunjungan untuk diexport.");
    return;
  }
  generateCsvDownload(filteredRecentScans.value, `presensi-expo-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${filteredRecentScans.value.length} baris.`);
}

function generateCsvDownload(rows: any[], filename: string) {
  const headers = ["No", "NIM", "Nama Lengkap", "Regu", "Kode Stan", "Nama Stan", "Kategori", "Waktu Scan", "XP Didapat"];
  const csvContent = [
    headers.join(","),
    ...rows.map((s, i) =>
      [
        i + 1,
        `"${s.username || ''}"`,
        `"${(s.fullName || '').replace(/"/g, '""')}"`,
        `"${(s.teamName || 'Independen').replace(/"/g, '""')}"`,
        `"${s.boothCode || ''}"`,
        `"${(s.boothName || '').replace(/"/g, '""')}"`,
        `"${s.category || ''}"`,
        `"${formatDateTime(s.scannedAt)}"`,
        s.xpEarned || 75,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Date/Time Formatting
function formatTime(isoString: string) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoString: string) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function formatDateTime(isoString: string) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

onMounted(() => {
  loadFloors();
  loadBooths();
  loadRecentScans();
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        @click="openCreateModal"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#9333ea] text-white border-[#c084fc] flex items-center gap-1.5 hover:bg-[#a855f7] cursor-pointer"
        title="Daftarkan Stan Baru"
      >
        <Plus class="h-3.5 w-3.5" />
        <span class="hidden sm:inline font-pixel">TAMBAH STAN</span>
      </button>

      <NuxtLink
        to="/ormawa/scan"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#132215] text-[#4ade80] border-[#22c55e] flex items-center gap-1.5 hover:bg-[#172e1e] cursor-pointer"
        title="Dashboard Scanner PIC Ormawa"
      >
        <ScanLine class="h-3.5 w-3.5" />
        <span class="hidden md:inline font-pixel text-[11px]">SCANNER PIC</span>
      </NuxtLink>

      <NuxtLink
        to="/qr-center"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#271d15] text-[#facc15] border-[#ca8a04] flex items-center gap-1.5 hover:bg-[#3d2d1e] cursor-pointer"
        title="Buka QR Print Center"
      >
        <QrCode class="h-3.5 w-3.5 text-[#f59e0b]" />
        <span class="hidden md:inline font-pixel text-[11px]">PRINT QR</span>
      </NuxtLink>

      <button
        @click="handleRefresh"
        :disabled="loading"
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
        title="Segarkan Data"
      >
        <RotateCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
      </button>
    </TopbarActions>

    <!-- Subtitle / Info Header -->
    <div class="px-4 md:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#4a3624]/60 text-xs text-muted-foreground bg-[#15100c]/85 backdrop-blur-md shrink-0">
      <div>
        <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
          <Store class="h-4 w-4 text-[#c084fc]" />
          <span>STAN ORMAWA</span>
        </h1>
        <p class="text-[11px] text-gray-400 mt-0.5">
          Pusat kendali stan UKM & ormawa expo.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="border border-[#9333ea]/60 bg-[#251538] px-2.5 py-1 text-[10px] font-pixel text-[#c084fc] flex items-center gap-1.5">
          <Sparkles class="h-3 w-3 text-[#facc15]" />
          HARI 3
        </span>
        <span class="border border-[#ca8a04]/40 bg-[#2b2014] px-2.5 py-1 text-[10px] font-pixel text-[#facc15] flex items-center gap-1.5">
          <Users class="h-3 w-3 text-[#f59e0b]" />
          {{ totalVisitsCount }} KUNJUNGAN
        </span>
      </div>
    </div>

    <!-- Stats HUD Cards (Compact Top Deck) -->
    <div class="px-4 md:px-6 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-[#3d2a1b] bg-[#120d09]/80 backdrop-blur-md shrink-0">
      <div class="p-2 border border-[#523e2b] bg-[#1a140f]/85 backdrop-blur-sm rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-gray-400 uppercase block">TOTAL STAN</span>
          <span class="font-pixel text-base text-foreground font-bold">
            {{ activeBoothsCount }} <span class="text-xs text-muted-foreground font-mono font-normal">/ {{ booths.length }}</span>
          </span>
        </div>
        <span class="text-[10px] text-muted-foreground">Unit kegiatan</span>
      </div>

      <div class="p-2 border border-[#16a34a] bg-[#132215]/85 backdrop-blur-sm rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#4ade80] uppercase block">KUNJUNGAN</span>
          <span class="font-pixel text-base text-[#4ade80] font-bold">{{ totalVisitsCount }}</span>
        </div>
        <span class="text-[10px] text-[#86efac]">Total scan</span>
      </div>

      <div class="p-2 border border-[#ca8a04] bg-[#221a0f]/85 backdrop-blur-sm rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#facc15] uppercase block">TERFAVORIT</span>
          <div class="font-pixel text-xs text-[#facc15] font-bold truncate max-w-[110px]" :title="topBooth?.name || '-'">
            {{ topBooth?.shortName || topBooth?.name || "-" }}
          </div>
        </div>
        <span class="text-[10px] text-[#fde047]">
          {{ topBooth ? `${topBooth.visitorCount} maba` : '-' }}
        </span>
      </div>

      <div class="p-2 border border-[#9333ea] bg-[#1e1329]/85 backdrop-blur-sm rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#c084fc] uppercase block">TOTAL XP</span>
          <span class="font-pixel text-base text-[#c084fc] font-bold">+{{ totalXpDistributed.toLocaleString('id-ID') }}</span>
        </div>
        <span class="text-[10px] text-[#e9d5ff]">Poin dibagikan</span>
      </div>
    </div>

    <!-- Main Navigation Tabs (Compact) -->
    <div class="px-4 md:px-6 py-1.5 flex items-center gap-2 border-b border-[#3d2a1b] bg-[#15100c]/85 backdrop-blur-md shrink-0 text-xs">
      <button
        @click="activeTab = 'booths'"
        :class="[
          'h-7 px-3 rounded font-pixel text-[10px] flex items-center gap-1.5 border transition-all cursor-pointer',
          activeTab === 'booths'
            ? 'bg-[#9333ea] text-white border-[#c084fc] font-bold shadow-sm'
            : 'bg-[#1e1429] text-gray-300 border-[#523e2b] hover:border-[#c084fc]'
        ]"
      >
        <Store class="h-3 w-3" />
        <span>DAFTAR STAN ({{ booths.length }})</span>
      </button>

      <button
        @click="activeTab = 'visitors'"
        :class="[
          'h-7 px-3 rounded font-pixel text-[10px] flex items-center gap-1.5 border transition-all cursor-pointer',
          activeTab === 'visitors'
            ? 'bg-[#ca8a04] text-black border-[#facc15] font-bold shadow-sm'
            : 'bg-[#271d15] text-gray-300 border-[#523e2b] hover:border-[#f59e0b]'
        ]"
      >
        <Clock class="h-3 w-3" />
        <span>LOG KUNJUNGAN ({{ recentScans.length }})</span>
      </button>
    </div>

    <!-- ================= TAB 1: DAFTAR STAN ================= -->
    <template v-if="activeTab === 'booths'">
      <!-- Sticky Filter Toolbar -->
      <div class="pixel-toolbar-sticky px-4 md:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div class="flex flex-wrap items-center gap-2 flex-1">
          <div class="relative flex-1 min-w-[200px] max-w-sm">
            <Search class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama ormawa, kode, nomor..."
              class="h-7 w-full bg-[#15100c] border border-[#523e2b] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
            />
          </div>

          <select
            v-model="selectedFloor"
            class="h-7 bg-[#15100c] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#c084fc]"
          >
            <option :value="0">Semua Lantai</option>
            <option v-for="f in floors" :key="f.id" :value="f.number">
              Lantai {{ f.number }}
            </option>
          </select>

          <select
            v-model="selectedCategory"
            class="h-7 bg-[#15100c] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#c084fc]"
          >
            <option value="">Semua Kategori</option>
            <option v-for="cat in availableCategories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>

          <select
            v-model="selectedStatus"
            class="h-7 bg-[#15100c] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#c084fc]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      <!-- Bulk Action Bar - Booths -->
      <div
        v-if="selectedBoothIds.length > 0"
        class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
      >
        <div class="flex items-center gap-2 text-[#f59e0b]">
          <CheckSquare class="h-4 w-4" />
          <span><b>{{ selectedBoothIds.length }}</b> stan terpilih</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="batchToggleBoothStatus(true)"
            :disabled="processingBulk"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] hover:bg-[#1f3822] cursor-pointer disabled:opacity-50"
          >
            Aktifkan
          </button>
          <button
            @click="batchToggleBoothStatus(false)"
            :disabled="processingBulk"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#241a13] text-[#facc15] border-[#ca8a04] hover:bg-[#35251a] cursor-pointer disabled:opacity-50"
          >
            Nonaktifkan
          </button>
          <button
            @click="batchDeleteBooths"
            :disabled="processingBulk"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#dc2626] text-white border-[#ef4444] hover:bg-[#b91c1c] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 class="h-3.5 w-3.5" />
            <span>Hapus Terpilih</span>
          </button>
          <button
            @click="selectedBoothIds = []"
            class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Flush Edge-to-Edge Booths Table -->
      <div class="flex-1 overflow-x-auto min-h-0">
        <table class="pixel-table w-full text-left text-xs font-mono">
          <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10">
            <tr>
              <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllBoothsSelected"
                  @change="toggleSelectAllBooths"
                  class="accent-[#f59e0b] cursor-pointer"
                  title="Pilih Semua Halaman Ini"
                />
              </th>
              <th class="p-3 w-12 text-center">#</th>
              <th class="p-3 min-w-[200px]">STAN</th>
              <th class="p-3 min-w-[130px]">KATEGORI</th>
              <th class="p-3 min-w-[120px]">KODE QR</th>
              <th class="p-3 text-center min-w-[100px]">PRESENSI</th>
              <th class="p-3 text-center w-24">STATUS</th>
              <th class="pr-4 md:pr-6 pl-3 py-3 text-right w-16">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#3d2d1e]/60">
            <tr v-if="loading && booths.length === 0">
              <td colspan="8" class="p-8 text-center text-muted-foreground">
                <div class="flex items-center justify-center gap-2">
                  <RotateCw class="h-4 w-4 animate-spin text-[#c084fc]" />
                  <span>Memuat stan ormawa...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredBooths.length === 0">
              <td colspan="8" class="p-8 text-center text-muted-foreground">
                Tidak ada stan ormawa yang sesuai dengan filter.
              </td>
            </tr>

            <tr
              v-for="(booth, idx) in paginatedBooths"
              :key="booth.id"
              :class="[
                'hover:bg-[#271d15]/50 transition-colors',
                selectedBoothIds.includes(booth.id) ? 'bg-[#3b2716]/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedBoothIds.includes(booth.id)"
                  @change="toggleSelectBooth(booth.id)"
                  class="accent-[#f59e0b] cursor-pointer"
                />
              </td>

              <!-- Index -->
              <td class="p-3 text-center text-muted-foreground font-pixel text-[10px]">
                {{ (boothPage - 1) * boothPageSize + idx + 1 }}
              </td>

              <!-- Stan -->
              <td class="p-3">
                <div class="flex items-center gap-2.5">
                  <NuxtLink
                    :to="`/ormawa/${booth.id}`"
                    class="h-8 w-8 shrink-0 rounded border-2 border-white bg-white flex items-center justify-center font-pixel text-[9px] font-bold text-[#3a2818] shadow-sm hover:scale-105 transition-transform overflow-hidden"
                  >
                    <img v-if="booth.logoUrl" :src="booth.logoUrl" :alt="`Logo ${booth.name}`" class="h-full w-full object-contain p-0.5" />
                    <span v-else>{{ booth.shortName?.slice(0, 2) || booth.code.slice(0, 2) }}</span>
                  </NuxtLink>
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/ormawa/${booth.id}`"
                      class="font-bold text-foreground hover:text-[#facc15] transition-colors truncate block"
                    >
                      {{ booth.name }}
                    </NuxtLink>
                    <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                      <span class="text-amber-400 font-bold">{{ booth.code }}</span>
                      <span>•</span>
                      <span>{{ booth.boothNumber || 'BOOTH' }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Kategori -->
              <td class="p-3 font-mono">
                <span class="inline-block px-1.5 py-0.5 text-[9px] font-bold border border-[#9333ea]/50 bg-[#2d153e] text-[#d8b4fe] rounded">
                  {{ booth.category }}
                </span>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  {{ booth.floorNumber ? `Lt. ${booth.floorNumber}` : 'Lt. 3-5' }}
                </div>
              </td>

              <!-- Kode QR -->
              <td class="p-3 font-mono">
                <div class="flex items-center gap-1.5">
                  <code class="text-[10px] bg-[#130e0a] px-1 py-0.5 border border-[#4a3624] text-[#facc15] truncate max-w-[100px]" :title="booth.qrCode">
                    {{ booth.qrCode }}
                  </code>
                  <button
                    @click="openQrPreview(booth)"
                    class="h-6 w-6 rounded bg-[#271d15] border border-[#523e2b] text-[#f59e0b] hover:bg-[#3d2d1e] flex items-center justify-center shrink-0 cursor-pointer"
                    title="Lihat QR"
                  >
                    <QrCode class="h-3 w-3" />
                  </button>
                </div>
              </td>

              <!-- Presensi -->
              <td class="p-3 text-center">
                <NuxtLink
                  :to="`/ormawa/${booth.id}`"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-pixel border transition-all cursor-pointer"
                  :class="booth.visitorCount > 0
                    ? 'border-[#16a34a] bg-[#162518] text-[#4ade80] hover:bg-[#1f3822]'
                    : 'border-[#523e2b] bg-[#271d15] text-gray-400 hover:text-white'"
                >
                  <Users class="h-3 w-3" />
                  <span>{{ booth.visitorCount || 0 }} Maba</span>
                </NuxtLink>
              </td>

              <!-- Status -->
              <td class="p-3 text-center">
                <button
                  @click="toggleBoothStatus(booth)"
                  class="px-2 py-0.5 text-[8px] font-pixel border rounded transition-colors cursor-pointer"
                  :class="booth.isActive
                    ? 'border-[#4ade80] bg-[#16351b] text-[#86efac] hover:bg-[#1f4a26]'
                    : 'border-red-600 bg-[#351616] text-red-300 hover:bg-[#4a1f1f]'"
                  :title="booth.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                >
                  {{ booth.isActive ? 'AKTIF' : 'NONAKTIF' }}
                </button>
              </td>

              <!-- Aksi Dropdown -->
              <td class="pr-4 md:pr-6 pl-3 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      class="h-7 w-7 border border-[#523e2b] bg-[#271d15] text-[#f59e0b] hover:border-[#f59e0b] flex items-center justify-center text-xs cursor-pointer ml-auto"
                      title="Opsi Stan"
                    >
                      <MoreHorizontal class="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44 bg-[#1e1711] border-2 border-[#523e2b] text-foreground font-mono text-xs">
                    <DropdownMenuItem as-child>
                      <NuxtLink
                        :to="`/ormawa/${booth.id}`"
                        class="cursor-pointer hover:bg-[#3d2d1e] focus:bg-[#3d2d1e] flex items-center gap-2 text-[#c084fc] px-2 py-1.5"
                      >
                        <ExternalLink class="h-3.5 w-3.5" />
                        <span>Detail Stan</span>
                      </NuxtLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="openEditModal(booth)"
                      class="cursor-pointer hover:bg-[#3d2d1e] focus:bg-[#3d2d1e] flex items-center gap-2 text-[#f59e0b]"
                    >
                      <Pencil class="h-3.5 w-3.5" />
                      <span>Edit Stan</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="openQrPreview(booth)"
                      class="cursor-pointer hover:bg-[#3d2d1e] focus:bg-[#3d2d1e] flex items-center gap-2 text-[#facc15]"
                    >
                      <QrCode class="h-3.5 w-3.5" />
                      <span>Lihat QR</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="toggleBoothStatus(booth)"
                      class="cursor-pointer hover:bg-[#3d2d1e] focus:bg-[#3d2d1e] flex items-center gap-2 text-gray-300"
                    >
                      <CheckCircle2 class="h-3.5 w-3.5" />
                      <span>{{ booth.isActive ? 'Nonaktifkan' : 'Aktifkan' }}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator class="bg-[#523e2b]" />
                    <DropdownMenuItem
                      @click="confirmDelete(booth)"
                      class="cursor-pointer hover:bg-[#2a1414] focus:bg-[#2a1414] text-[#f87171] flex items-center gap-2"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                      <span>Hapus Stan</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
      <PixelPagination
        :current-page="boothPage"
        :total-items="filteredBooths.length"
        :page-size="boothPageSize"
        @update:current-page="boothPage = $event"
        @update:page-size="boothPageSize = $event; boothPage = 1"
      />
    </template>

    <!-- ================= TAB 2: LOG KUNJUNGAN ================= -->
    <template v-else-if="activeTab === 'visitors'">
      <!-- Sticky Filter Toolbar -->
      <div class="pixel-toolbar-sticky px-4 md:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div class="flex flex-wrap items-center gap-2 flex-1">
          <div class="relative flex-1 min-w-[200px] max-w-sm">
            <Search class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="visitorSearchQuery"
              type="text"
              placeholder="Cari maba, NIM, regu, stan..."
              class="h-7 w-full bg-[#15100c] border border-[#523e2b] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ca8a04]"
            />
          </div>

          <select
            v-model="visitorSelectedBooth"
            class="h-7 bg-[#15100c] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#ca8a04]"
          >
            <option value="">Semua Stan</option>
            <option v-for="b in booths" :key="b.id" :value="b.id">
              {{ b.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="exportAllVisitorsCsv"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] hover:bg-[#1f3822] flex items-center gap-1.5 cursor-pointer"
          >
            <Download class="h-3.5 w-3.5 text-[#4ade80]" />
            <span>Export (CSV)</span>
          </button>
        </div>
      </div>

      <!-- Bulk Action Bar - Visitors -->
      <div
        v-if="selectedScanIds.length > 0"
        class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
      >
        <div class="flex items-center gap-2 text-[#f59e0b]">
          <CheckSquare class="h-4 w-4" />
          <span><b>{{ selectedScanIds.length }}</b> log terpilih</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportSelectedVisitorsCsv"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] hover:bg-[#1f3822] flex items-center gap-1.5 cursor-pointer"
          >
            <Download class="h-3.5 w-3.5" />
            <span>Export Terpilih (CSV)</span>
          </button>
          <button
            @click="selectedScanIds = []"
            class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Flush Edge-to-Edge Scans Table -->
      <div class="flex-1 overflow-x-auto min-h-0">
        <table class="pixel-table w-full text-left text-xs font-mono">
          <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10">
            <tr>
              <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllScansSelected"
                  @change="toggleSelectAllScans"
                  class="accent-[#f59e0b] cursor-pointer"
                  title="Pilih Semua Halaman Ini"
                />
              </th>
              <th class="p-3 w-12 text-center">#</th>
              <th class="p-3 min-w-[110px]">WAKTU</th>
              <th class="p-3 min-w-[180px]">MAHASISWA</th>
              <th class="p-3 min-w-[110px]">REGU</th>
              <th class="p-3 min-w-[180px]">STAN</th>
              <th class="p-3 text-center min-w-[80px]">XP</th>
              <th class="pr-4 md:pr-6 pl-3 py-3 text-right w-24">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#3d2d1e]/60">
            <tr v-if="loadingRecentScans">
              <td colspan="8" class="p-8 text-center text-muted-foreground">
                <div class="flex items-center justify-center gap-2">
                  <RotateCw class="h-4 w-4 animate-spin text-[#ca8a04]" />
                  <span>Memuat riwayat kunjungan...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredRecentScans.length === 0">
              <td colspan="8" class="p-8 text-center text-muted-foreground">
                Belum ada riwayat kunjungan stan tercatat.
              </td>
            </tr>

            <tr
              v-for="(scan, idx) in paginatedScans"
              :key="scan.scanId"
              :class="[
                'hover:bg-[#271d15]/50 transition-colors',
                selectedScanIds.includes(scan.scanId) ? 'bg-[#3b2716]/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedScanIds.includes(scan.scanId)"
                  @change="toggleSelectScan(scan.scanId)"
                  class="accent-[#f59e0b] cursor-pointer"
                />
              </td>

              <!-- Index -->
              <td class="p-3 text-center text-muted-foreground font-pixel text-[10px]">
                {{ (scanPage - 1) * scanPageSize + idx + 1 }}
              </td>

              <!-- Waktu -->
              <td class="p-3 font-mono">
                <div class="text-foreground font-bold flex items-center gap-1 text-[11px]">
                  <Clock class="h-3 w-3 text-[#f59e0b]" />
                  <span>{{ formatTime(scan.scannedAt) }}</span>
                </div>
                <div class="text-[10px] text-muted-foreground">
                  {{ formatDate(scan.scannedAt) }}
                </div>
              </td>

              <!-- Mahasiswa -->
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <div class="h-6 w-6 rounded-full border border-[#523e2b] bg-[#271d15] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                    <img
                      :src="scan.avatarUrl || (scan.gender === 'PEREMPUAN' ? '/character-cewek-avatar.png' : '/character-cowok-avatar.png')"
                      alt="Avatar"
                      class="h-full w-full object-contain"
                    />
                  </div>
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/participants/${scan.participantId}`"
                      class="font-bold text-foreground hover:text-[#facc15] truncate block text-xs"
                    >
                      {{ scan.fullName }}
                    </NuxtLink>
                    <div class="font-mono text-[10px] text-amber-400">
                      {{ scan.username }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Regu -->
              <td class="p-3 font-mono">
                <span class="inline-block px-1.5 py-0.5 text-[9px] font-bold border border-[#ca8a04]/50 bg-[#2b2014] text-[#facc15] rounded">
                  {{ scan.teamName || 'Individu' }}
                </span>
              </td>

              <!-- Stan -->
              <td class="p-3">
                <NuxtLink
                  :to="`/ormawa/${scan.boothId}`"
                  class="font-bold text-foreground hover:text-[#c084fc] block truncate text-xs"
                >
                  {{ scan.boothName }}
                </NuxtLink>
                <div class="text-[10px] text-muted-foreground font-mono">
                  {{ scan.boothNumber || scan.boothCode }} • {{ scan.category }}
                </div>
              </td>

              <!-- XP -->
              <td class="p-3 text-center font-mono font-bold text-emerald-400 text-xs">
                +{{ scan.xpEarned || 75 }}
              </td>

              <!-- Status -->
              <td class="pr-4 md:pr-6 pl-3 py-3 text-right">
                <span class="px-2 py-0.5 text-[9px] font-pixel border border-[#4ade80] bg-[#16351b] text-[#86efac] rounded">
                  SUKSES
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
      <PixelPagination
        :current-page="scanPage"
        :total-items="filteredRecentScans.length"
        :page-size="scanPageSize"
        @update:current-page="scanPage = $event"
        @update:page-size="scanPageSize = $event; scanPage = 1"
      />
    </template>

    <!-- Modal: Form Tambah / Edit Stan -->
    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono"
    >
      <div class="pixel-card w-full max-w-lg border-2 border-[#9333ea] bg-[#1a140f] p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col rounded">
        <!-- Header -->
        <div class="flex items-start justify-between border-b border-[#523e2b] pb-2.5 shrink-0">
          <div>
            <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] uppercase tracking-wider">
              {{ isEditing ? 'EDIT STAN' : 'TAMBAH STAN' }}
            </h2>
            <p class="text-[10px] text-gray-400 mt-0.5">
              {{ isEditing ? formState.name : 'Daftarkan unit kegiatan mahasiswa' }}
            </p>
          </div>

          <button
            @click="showFormModal = false"
            class="h-7 w-7 rounded bg-[#271d15] border border-[#523e2b] text-gray-400 hover:text-white hover:bg-[#3d2d1e] flex items-center justify-center cursor-pointer"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Form Fields Scrollable -->
        <form @submit.prevent="submitBoothForm" class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 text-xs">
          <!-- Kode Stan & Nomor Booth -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Kode Stan <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formState.code"
                :disabled="isEditing"
                type="text"
                placeholder="UKM-ROBOTIK"
                required
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc] disabled:opacity-60"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Nomor Booth
              </label>
              <input
                v-model="formState.boothNumber"
                type="text"
                placeholder="BOOTH E3-01"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Nama Stan & Singkatan -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div class="sm:col-span-2">
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Nama Stan <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formState.name"
                type="text"
                placeholder="Robotika & AI UNU"
                required
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Singkatan
              </label>
              <input
                v-model="formState.shortName"
                type="text"
                placeholder="ROBOTIK"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Kategori & Lantai -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Kategori <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formState.category"
                type="text"
                list="categoryList"
                placeholder="Kategori stan..."
                required
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
              <datalist id="categoryList">
                <option value="Sains & Teknologi" />
                <option value="Olahraga & Beladiri" />
                <option value="Seni & Paduan Suara" />
                <option value="Seni Pertunjukan & Sastra" />
                <option value="Sosial & Kemanusiaan" />
                <option value="Lingkungan & Alam" />
                <option value="Keagamaan & Dakwah" />
                <option value="Penelitian & Penalaran" />
              </datalist>
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Lokasi Lantai
              </label>
              <select
                v-model="formState.floorId"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2 text-foreground focus:outline-none focus:border-[#c084fc]"
              >
                <option :value="null">Pilih Lantai...</option>
                <option v-for="f in floors" :key="f.id" :value="f.id">
                  Lantai {{ f.number }} — {{ f.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Deskripsi Stan -->
          <div>
            <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
              Deskripsi Singkat
            </label>
            <textarea
              v-model="formState.description"
              rows="2"
              placeholder="Kegiatan dan pameran stan..."
              class="w-full bg-[#15100c] border border-[#523e2b] p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
            ></textarea>
          </div>

          <!-- Token QR & XP Reward -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Kode QR
              </label>
              <input
                v-model="formState.qrCode"
                type="text"
                placeholder="Auto-generate"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Reward XP
              </label>
              <input
                v-model.number="formState.xpReward"
                type="number"
                min="0"
                step="5"
                placeholder="75"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Kontak & Instagram -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Narahubung
              </label>
              <input
                v-model="formState.contactPerson"
                type="text"
                placeholder="08123456789"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Instagram
              </label>
              <input
                v-model="formState.instagram"
                type="text"
                placeholder="@unu_robotik"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <LogoUploadField v-model="formState.logoUrl" />

          <!-- Status Switch -->
          <div class="pt-2 border-t border-[#4a3624] flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              v-model="formState.isActive"
              class="h-4 w-4 rounded accent-[#9333ea] cursor-pointer"
            />
            <label for="isActiveCheck" class="text-xs text-gray-200 cursor-pointer">
              Stan aktif dan dapat dipindai saat expo
            </label>
          </div>

          <!-- Modal Action Buttons -->
          <div class="pt-3 border-t border-[#523e2b] flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showFormModal = false"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#271d15] text-gray-300 border-[#523e2b] hover:bg-[#3d2d1e] cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              :disabled="savingForm"
              class="pixel-btn h-8 px-5 text-xs font-pixel font-bold bg-[#9333ea] text-white border-[#c084fc] hover:bg-[#a855f7] cursor-pointer shadow flex items-center gap-1.5"
            >
              <RotateCw v-if="savingForm" class="h-3 w-3 animate-spin" />
              <span>{{ isEditing ? 'SIMPAN' : 'BUAT STAN' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Pratinjau QR Code Stan -->
    <div
      v-if="showQrModal && selectedBoothForQr"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono"
    >
      <div class="pixel-card w-full max-w-sm border-2 border-[#9333ea] bg-[#1e1429] p-5 space-y-4 shadow-2xl text-center rounded">
        <div class="border-b border-[#9333ea] pb-2">
          <div class="flex items-center justify-between">
            <span class="font-pixel text-[9px] font-bold text-[#c084fc]">
              QR EXPO
            </span>
            <span class="border border-[#c084fc] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#facc15]">
              {{ selectedBoothForQr.boothNumber || selectedBoothForQr.code }}
            </span>
          </div>
          <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] mt-1 uppercase tracking-wider truncate">
            {{ selectedBoothForQr.name }}
          </h2>
        </div>

        <!-- Big QR Image -->
        <div class="flex flex-col items-center justify-center p-3 bg-white border border-black rounded shadow-inner">
          <img
            :src="getQrImageUrl(selectedBoothForQr.qrCode)"
            :alt="selectedBoothForQr.code"
            class="h-48 w-48 object-contain"
          />
          <span class="font-mono text-xs text-black font-bold mt-2 tracking-wider">
            {{ selectedBoothForQr.qrCode }}
          </span>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#6b21a8]">
          <NuxtLink
            to="/qr-center"
            class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#ca8a04] text-black border-[#facc15] flex items-center justify-center gap-1 hover:bg-[#eab308] cursor-pointer"
          >
            <Printer class="h-3 w-3" />
            <span>CETAK QR</span>
          </NuxtLink>

          <button
            @click="showQrModal = false"
            class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#271d15] text-gray-300 border-[#523e2b] hover:bg-[#3d2d1e] cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
