<template>
  <div class="space-y-3 pb-8 font-sans select-none text-[#f0e0c0]">
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
          'fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 z-50 p-2.5 rounded-xl border shadow-xl font-mono text-xs flex items-center gap-2 max-w-sm backdrop-blur-md',
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

    <!-- Header Stan Ormawa (Stardew Valley Gold Banner) -->
    <div class="sdv-card-gold p-3.5 space-y-2.5">
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-1 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="border border-[#f0d060] bg-[#1a1008] px-1.5 py-0.5 text-[8px] font-pixel text-[#f0d060] uppercase tracking-wider rounded">
              STAN ORMAWA
            </span>
            <span class="border border-[#22c55e] bg-[#132215] px-1.5 py-0.5 text-[8px] font-pixel text-[#86efac] uppercase tracking-wider rounded">
              LANTAI {{ boothInfo.floorNumber }}
            </span>
          </div>
          <h1 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold tracking-wide truncate">
            {{ boothInfo.name }}
          </h1>
          <p class="text-[10px] text-[#c4956a] font-mono">
            PIC: <strong class="text-white">{{ user?.fullName || 'PIC Stan' }}</strong> &bull; Kategori: <strong class="text-[#f0d060]">{{ boothInfo.category }}</strong>
          </p>
        </div>

        <div class="text-right shrink-0">
          <span class="font-pixel text-xs sm:text-sm text-[#86efac] font-bold block">
            {{ visitorCount }} MABA
          </span>
          <span class="text-[9px] text-[#facc15] font-mono">Total Berkunjung</span>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] pt-2 border-t border-[#5a3a18]">
        <div class="bg-[#170f07] py-1.5 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate uppercase">TOTAL PENGUNJUNG</span>
          <span class="font-pixel text-xs text-white">{{ visitorCount }}</span>
        </div>
        <div class="bg-[#170f07] py-1.5 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate uppercase">TOTAL XP KAMPUS</span>
          <span class="font-pixel text-xs text-[#86efac]">+{{ (visitorCount * (boothInfo.xpReward || 75)).toLocaleString('id-ID') }}</span>
        </div>
        <div class="bg-[#170f07] py-1.5 px-1 rounded border border-[#5a3a18]">
          <span class="text-[#a08060] text-[7.5px] block truncate uppercase">STATUS STAN</span>
          <span class="font-pixel text-[10px] text-[#22c55e] flex items-center justify-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            AKTIF
          </span>
        </div>
      </div>
    </div>

    <!-- Main Action Button: Scanner Validasi Maba -->
    <NuxtLink
      to="/ormawa/scan"
      class="rpg-btn-primary p-3.5 flex items-center justify-between gap-3 shadow-lg active:scale-98 transition-all block"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-black/30 border border-[#f0d060] flex items-center justify-center shrink-0">
          <ScanLine class="h-6 w-6 text-[#facc15]" />
        </div>
        <div class="text-left">
          <div class="font-pixel text-xs sm:text-sm font-bold text-white uppercase flex items-center gap-1.5">
            <span>BUKA SCANNER VALIDASI</span>
            <span class="text-[9px] bg-[#facc15] text-black px-1.5 py-0.2 rounded font-mono font-bold">LIVE</span>
          </div>
          <p class="text-[10px] text-[#86efac] font-mono mt-0.5">
            Scan QR Code mahasiswa yang hadir di stan ini
          </p>
        </div>
      </div>
      <ArrowRight class="h-5 w-5 text-[#f0d060] shrink-0" />
    </NuxtLink>

    <!-- Official Booth QR Code Card (Dipajang di Meja Expo) -->
    <div class="sdv-card p-3.5 space-y-3">
      <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2">
        <div class="flex items-center gap-2">
          <QrCode class="h-4 w-4 text-[#f0d060]" />
          <div>
            <h2 class="font-pixel text-[10px] sm:text-[11px] text-[#fef08a] font-bold uppercase">
              QR CODE MEJA STAN EXPO
            </h2>
            <span class="text-[9px] text-[#c4956a]">Tunjukkan kepada mahasiswa yang berkunjung</span>
          </div>
        </div>

        <button
          type="button"
          @click="showFullQr = true"
          class="h-6 px-2 bg-[#271d15] hover:bg-[#3d2d1e] border border-[#523e2b] text-[#facc15] font-pixel text-[8px] rounded flex items-center gap-1 cursor-pointer"
        >
          <Maximize2 class="h-2.5 w-2.5" />
          <span>PERBESAR</span>
        </button>
      </div>

      <!-- QR Display Frame -->
      <div class="flex flex-col items-center justify-center p-4 bg-[#140c06] rounded-xl border-2 border-[#5a3a18]">
        <div class="bg-white p-2.5 rounded-lg shadow-md mb-2.5">
          <img
            :src="getQrImageUrl(boothInfo.qrCode)"
            alt="QR Code Stan"
            class="w-44 h-44 sm:w-48 sm:h-48 object-contain"
          />
        </div>

        <div class="text-center space-y-1">
          <span class="text-[8px] font-pixel text-[#a08060] uppercase block">KODE TOKEN RESMI:</span>
          <div class="inline-flex items-center gap-2 bg-[#22160d] px-3 py-1 rounded border border-[#5a3a18]">
            <code class="font-pixel text-xs text-[#facc15] font-bold">{{ boothInfo.qrCode }}</code>
            <button
              type="button"
              @click="copyToken"
              class="text-[#86efac] hover:text-white cursor-pointer"
              title="Salin Token"
            >
              <Copy class="h-3.5 w-3.5" />
            </button>
          </div>
          <p class="text-[9px] text-gray-400 font-mono mt-1">
            Mahasiswa mendapatkan <strong class="text-[#86efac]">+{{ boothInfo.xpReward || 75 }} XP</strong> dan lencana UKM setelah scan stan ini.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Links Grid -->
    <div class="grid grid-cols-2 gap-2 font-mono">
      <NuxtLink
        to="/ormawa/portal/visitors"
        class="sdv-card p-3 text-center flex flex-col items-center justify-center hover:border-[#f0d060] transition-all active:scale-95 group cursor-pointer"
      >
        <div class="w-8 h-8 rounded-lg bg-[#271d15] border border-[#f0d060] flex items-center justify-center text-[#facc15] mb-1.5 group-hover:scale-105 transition-transform">
          <Users class="h-4 w-4" />
        </div>
        <span class="font-pixel text-[9px] text-[#fef08a] block uppercase">LOG PENGUNJUNG</span>
        <span class="text-[8px] text-[#c4956a]">Daftar maba hadir ({{ visitorCount }})</span>
      </NuxtLink>

      <NuxtLink
        to="/qr-center"
        class="sdv-card p-3 text-center flex flex-col items-center justify-center hover:border-[#f0d060] transition-all active:scale-95 group cursor-pointer"
      >
        <div class="w-8 h-8 rounded-lg bg-[#271d15] border border-[#ca8a04] flex items-center justify-center text-[#ca8a04] mb-1.5 group-hover:scale-105 transition-transform">
          <Printer class="h-4 w-4" />
        </div>
        <span class="font-pixel text-[9px] text-[#fef08a] block uppercase">PRINT QR STAN</span>
        <span class="text-[8px] text-[#c4956a]">Format siap cetak A4</span>
      </NuxtLink>
    </div>

    <!-- Fullscreen QR Modal -->
    <div
      v-if="showFullQr"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
      @click.self="showFullQr = false"
    >
      <div class="sdv-card-gold p-5 w-full max-w-sm text-center space-y-3 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          @click="showFullQr = false"
          class="absolute right-3 top-3 h-7 w-7 rounded bg-[#2a1313] border border-red-800 text-red-300 flex items-center justify-center cursor-pointer"
        >
          <X class="h-4 w-4" />
        </button>

        <div class="pt-2">
          <h2 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold uppercase">
            {{ boothInfo.name }}
          </h2>
          <span class="text-[9px] text-[#86efac] font-mono">Pindai untuk validasi kunjungan</span>
        </div>

        <div class="bg-white p-4 rounded-xl shadow-2xl mx-auto inline-block">
          <img
            :src="getQrImageUrl(boothInfo.qrCode)"
            alt="QR Code Fullscreen"
            class="w-64 h-64 object-contain"
          />
        </div>

        <div class="bg-[#140c06] p-2 rounded border border-[#5a3a18]">
          <code class="font-pixel text-sm text-[#facc15] font-bold">{{ boothInfo.qrCode }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Store,
  QrCode,
  ScanLine,
  Users,
  Printer,
  Sparkles,
  ArrowRight,
  Maximize2,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

const { user } = useAuth();
const api = useApi();

const showFullQr = ref(false);
const visitorCount = ref(0);
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const boothInfo = ref({
  id: "booth-hmte",
  name: "Himpunan Mahasiswa Teknik Elektro (HMTE)",
  code: "ORMAWA-HMTE",
  category: "Himpunan & Teknologi",
  floorNumber: 3,
  qrCode: "UNU-ORMAWA-HMTE-2026",
  xpReward: 75,
});

function getQrImageUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(code || '')}`;
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(boothInfo.value.qrCode);
    showToast("success", "Token QR Code berhasil disalin ke clipboard!");
  } catch {
    showToast("error", "Gagal menyalin token.");
  }
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
}

async function loadBoothData() {
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
      boothInfo.value.qrCode = (user.value as any).qrCode || `UNU-${(user.value as any).boothCode}-2026`;
    }
    if (user.value?.assignedFloor) {
      boothInfo.value.floorNumber = user.value.assignedFloor;
    }
    if ((user.value as any)?.boothId) {
      boothInfo.value.id = (user.value as any).boothId;
    }
  }

  // Load visitor count from PostgreSQL
  try {
    const targetId = boothInfo.value.id || (user.value as any)?.boothId;
    if (targetId) {
      const resVisitors = await api.get<{ success: boolean; data: { totalAttendees: number } }>(
        `/api/ormawa/booths/${targetId}/visitors`
      );
      if (resVisitors.success && resVisitors.data) {
        visitorCount.value = Number(resVisitors.data.totalAttendees || 0);
      }
    } else {
      visitorCount.value = 0;
    }
  } catch {
    visitorCount.value = 0;
  }
}

onMounted(() => {
  loadBoothData();
});
</script>
