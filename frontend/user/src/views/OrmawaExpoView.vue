<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import QRCode from 'qrcode';
import { RouterLink } from 'vue-router';
import {
  PhStorefront,
  PhMagnifyingGlass,
  PhCheckCircle,
  PhMapPin,
  PhX,
  PhInstagramLogo,
  PhPhone,
  PhListChecks,
  PhFlag,
  PhQrCode,
  PhWarning,
  PhHeart,
  PhArrowLeft,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhArrowsClockwise,
  PhCamera,
  PhCaretRight,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { ORMAWA_STANDS } from '@/data/ormawaData';
import { OrmawaStand } from '@/types/ormawa';
import OrmawaInterestModal from '@/components/ormawa/OrmawaInterestModal.vue';
import OrmawaStampGrid from '@/components/ormawa/OrmawaStampGrid.vue';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';
import { AVATAR_OPTIONS } from '@/data/mockData';

const gameStore = useGameStore();

// ─── State ────────────────────────────────────────────────────────────────────
const activeCategoryTab = ref<'ALL' | 'BAKAT' | 'PENALARAN' | 'SOSIAL'>('ALL');
const searchQuery = ref('');
const activeStandDetail = ref<OrmawaStand | null>(null);
const showQrModal = ref(false);
const isLoading = ref(false);
const isRefreshing = ref(false);
const apiError = ref<string | null>(null);
const isMuted = ref(!gameStore.soundEnabled);

// Sound Helpers
function safeSound(fn: () => void) {
  try {
    if (gameStore.soundEnabled) fn();
  } catch (_) {}
}

function toggleSound() {
  gameStore.soundEnabled = !gameStore.soundEnabled;
  isMuted.value = !gameStore.soundEnabled;
  try {
    soundEngine.setMuted(isMuted.value);
    if (!isMuted.value) soundEngine.playClick?.();
  } catch (_) {}
}

// Avatar
const avatarData = computed(() => {
  return (
    AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) ||
    AVATAR_OPTIONS[0]
  );
});

// Modal State
const isInterestModalOpen = ref(false);

// QR Code Maba — menampilkan NIM sebagai QR agar bisa di-scan PIC Ormawa
const mabaQrValue = computed(() => {
  const nim = gameStore.participant.nim || '261100123';
  return `GENIUS-MABA:${nim}`;
});

const mabaQrDataUrl = ref('');
watch(
  mabaQrValue,
  async (value) => {
    try {
      mabaQrDataUrl.value = await QRCode.toDataURL(value, {
        width: 360,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } catch (e) {
      console.warn('[OrmawaExpo] Failed to generate QR data URL:', e);
    }
  },
  { immediate: true }
);

// ─── Normalisasi Data API & Lantai 6 Focus ─────────────────────────────────────
const apiStands = ref<OrmawaStand[]>([]);

function normalizeApiData(data: any[]): OrmawaStand[] {
  return data.map((item: any, idx: number) => {
    const floorNum = 6;
    let boothCode = item.boothNumber;
    if (boothCode) {
      boothCode = String(boothCode).replace(/^E[0-9]-/, 'E6-');
    } else {
      boothCode = `E6-${String(idx + 1).padStart(2, '0')}`;
    }

    const locationStr = `Hall Lantai 6 — Stand ${boothCode}`;

    return {
      id: item.id,
      name: item.name,
      shortName: item.shortName || item.name,
      category: item.category || 'Organisasi Kampus',
      floor: floorNum,
      location: locationStr,
      qrToken: item.qrCode,
      tagline: item.tagline || item.description || '',
      description: item.description || '',
      instagram: item.instagram || '',
      badgeTitle: item.name,
      badgeColor: item.badgeColor || '#16a34a',
      activities: Array.isArray(item.activities) ? item.activities : [],
      requirements: Array.isArray(item.requirements) ? item.requirements : [],
      stampInstructions: Array.isArray(item.stampInstructions) && item.stampInstructions.length
        ? item.stampInstructions
        : [
            'Datangi stan dan kenali program Ormawa atau UKM.',
            'Selesaikan misi yang diberikan oleh PIC stan.',
            'Buka QR profilmu dan minta PIC memindainya untuk menerima stamp.',
          ],
      xpReward: Number(item.xpReward ?? 75),
      contactPerson: item.contactPerson || '',
      contactPhone: item.contactPhone || extractPhone(item.contactPerson),
      logoUrl: item.logoUrl || null,
    };
  });
}

// Katalog stan: terisi dari API atau fallback ke data lokal yang dinormalisasi ke Lantai 6
const stands = computed(() => {
  const source = apiStands.value.length > 0 ? apiStands.value : ORMAWA_STANDS;
  return source.map((s, idx) => {
    let boothCode = s.location?.match(/Stand\s+([A-Za-z0-9-]+)/)?.[1] || `E6-${String(idx + 1).padStart(2, '0')}`;
    boothCode = boothCode.replace(/^E[0-9]-/, 'E6-');
    return {
      ...s,
      floor: 6,
      location: `Hall Lantai 6 — Stand ${boothCode}`,
      stampInstructions: s.stampInstructions?.length
        ? s.stampInstructions
        : [
            'Datangi stan dan kenali program Ormawa atau UKM.',
            'Selesaikan misi yang diberikan oleh PIC stan.',
            'Buka QR profilmu dan minta PIC memindainya untuk menerima stamp.',
          ],
      xpReward: s.xpReward ?? 75,
    };
  });
});

// ─── Fetch Data dari API ───────────────────────────────────────────────────────
async function fetchBooths(isManualRefresh = false) {
  if (isManualRefresh) isRefreshing.value = true;
  else isLoading.value = true;
  apiError.value = null;

  try {
    const res = await api.getOrmawaBooths();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      apiStands.value = normalizeApiData(res.data);
    }
  } catch (err) {
    if (!apiStands.value.length) {
      apiError.value = 'Menggunakan katalog stan lokal (koneksi server offline).';
    }
    console.warn('[OrmawaExpo] API fetch failed, using local fallback:', err);
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

onMounted(async () => {
  await Promise.all([fetchBooths(), gameStore.syncOrmawaProgress()]);
});

// ─── Segmented Tabs & Filter ──────────────────────────────────────────────────
const CATEGORY_TABS = [
  { id: 'ALL', label: 'SEMUA STAN' },
  { id: 'BAKAT', label: 'MINAT & BAKAT' },
  { id: 'PENALARAN', label: 'PENALARAN & ILMIAH' },
  { id: 'SOSIAL', label: 'SOSIAL & RELAWAN' },
] as const;

function isCategoryMatch(tabId: string, category: string): boolean {
  if (tabId === 'ALL') return true;
  const cat = category.toUpperCase();
  if (tabId === 'BAKAT') {
    return (
      cat.includes('BELA_DIRI') ||
      cat.includes('SENI') ||
      cat.includes('OLAHRAGA') ||
      cat.includes('BAKAT') ||
      cat.includes('MUSIK') ||
      cat.includes('TARI')
    );
  }
  if (tabId === 'PENALARAN') {
    return (
      cat.includes('TEKNOLOGI') ||
      cat.includes('PENALARAN') ||
      cat.includes('ILMIAH') ||
      cat.includes('ROBOTIK') ||
      cat.includes('HIMPUNAN') ||
      cat.includes('KEISLAMAN') ||
      cat.includes('BAHASA')
    );
  }
  if (tabId === 'SOSIAL') {
    return (
      cat.includes('SOSIAL') ||
      cat.includes('KEMANUSIAAN') ||
      cat.includes('RELAWAN') ||
      cat.includes('PENGABDIAN') ||
      cat.includes('LINGKUNGAN') ||
      cat.includes('ALAM')
    );
  }
  return false;
}

function getTabCount(tabId: string): number {
  return stands.value.filter((s) => isCategoryMatch(tabId, s.category)).length;
}

const filteredStands = computed(() => {
  let list = stands.value;
  if (activeCategoryTab.value !== 'ALL') {
    list = list.filter((s) => isCategoryMatch(activeCategoryTab.value, s.category));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q)
    );
  }
  return list;
});

const visitedCount = computed(() => gameStore.visitedOrmawaCount);

// ─── UI Actions ───────────────────────────────────────────────────────────────
const openStandDetail = (stand: OrmawaStand) => {
  safeSound(() => soundEngine.playSelect?.());
  activeStandDetail.value = stand;
};

const ormawaScanToast = ref<{ message: string; success: boolean } | null>(null);

const openQrModal = () => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  showQrModal.value = true;
};

const openStampQr = () => {
  openQrModal();
};

function extractPhone(value?: string) {
  return value?.match(/(?:\+?62|0)8[\d\s-]{7,15}/)?.[0]?.replace(/[\s-]/g, '') || '';
}

function whatsappHref(stand: OrmawaStand) {
  const raw = stand.contactPhone || extractPhone(stand.contactPerson);
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('62')
    ? digits
    : digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
    ? `62${digits}`
    : digits;
  return `https://wa.me/${normalized}`;
}

function instagramHref(value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://www.instagram.com/${trimmed.replace(/^@/, '').replace(/\/$/, '')}`;
}

const openInterestModal = () => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  isInterestModalOpen.value = true;
};

const submitInterestHandler = async (payload: {
  phoneNumber: string;
  instagramUsername: string;
  motivation?: string;
  experience?: string;
}) => {
  if (!activeStandDetail.value) return;
  const res = await gameStore.submitInterest(activeStandDetail.value.id, payload);
  if (res.success) {
    isInterestModalOpen.value = false;
    ormawaScanToast.value = { message: res.message, success: true };
    setTimeout(() => {
      ormawaScanToast.value = null;
    }, 4500);
  } else {
    ormawaScanToast.value = { message: res.message, success: false };
    setTimeout(() => {
      ormawaScanToast.value = null;
    }, 4500);
  }
};

const closeStandDetail = () => {
  safeSound(() => soundEngine.playClick?.());
  activeStandDetail.value = null;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    BELA_DIRI: 'Bela Diri',
    TEKNOLOGI: 'Teknologi & AI',
    SENI_BUDAYA: 'Seni & Budaya',
    SOSIAL_KEMANUSIAAN: 'Sosial & Relawan',
    OLAHRAGA: 'Olahraga',
    PENALARAN_KEISLAMAN: 'Penalaran & Aswaja',
    Olahraga: 'Olahraga',
    Seni: 'Seni & Budaya',
    Penalaran: 'Penalaran',
    Keagamaan: 'Keagamaan',
  };
  return labels[category] || category;
};
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none px-3 pb-28 pt-3 sm:px-6 sm:pb-10 sm:pt-5"
  >
    <!-- Fixed Background Wallpaper (Fixed in Viewport) -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="
        background-image: url('/games/background.avif');
        background-size: cover;
        background-position: center bottom;
        image-rendering: pixelated;
      "
    />
    <!-- Dark Vignette Overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-[#0f0b08]/80 via-[#17100a]/65 to-[#0f0b08]/95 pointer-events-none z-0" />

    <!-- ================================================================= -->
    <!-- TOP HEADER: Sesuai Format Halaman Presensi & Play View             -->
    <!-- ================================================================= -->
    <header class="relative z-20 mx-auto flex w-full max-w-2xl items-center justify-between gap-3 pb-3">
      <!-- Left: Back to Menu -->
      <RouterLink
        to="/play"
        @click="() => safeSound(() => soundEngine.playClick?.())"
        class="flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#8b6f4e] bg-[#2a1a0e]/95 px-3 py-2 text-[10px] text-[#f0d060] shadow transition-all hover:border-[#f0d060] hover:text-white active:scale-[0.98]"
        title="Kembali ke Menu Utama"
      >
        <PhArrowLeft :size="13" weight="bold" />
        <span class="font-pixel">MENU</span>
      </RouterLink>

      <!-- Center: Title Badge -->
      <div class="flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[#8b6f4e] bg-[#1a110a]/90 px-3 shadow backdrop-blur-md">
        <PhStorefront :size="15" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] font-bold tracking-wide text-[#facc15] sm:text-xs">
          ORMAWA EXPO
        </span>
      </div>

      <!-- Right: Refresh & Sound -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Refresh Button -->
        <button
          type="button"
          @click="fetchBooths(true)"
          title="Segarkan Katalog Stan"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#8b6f4e] bg-[#2a1a0e]/95 text-[#f0d060] shadow transition-all hover:border-[#f0d060] active:scale-[0.98]"
        >
          <PhArrowsClockwise :size="13" :class="{ 'animate-spin': isRefreshing }" />
        </button>

        <!-- Sound Toggle -->
        <button
          type="button"
          @click="toggleSound"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#8b6f4e] bg-[#2a1a0e]/95 text-[#f0d060] shadow transition-all hover:border-[#f0d060] active:scale-[0.98]"
          :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
        >
          <PhSpeakerHigh v-if="!isMuted" :size="13" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="13" weight="bold" />
        </button>
      </div>
    </header>

    <!-- ================================================================= -->
    <!-- MAIN CONTENT: Simple, Clean & Focused                             -->
    <!-- ================================================================= -->
    <main class="relative z-20 mx-auto w-full max-w-2xl space-y-4">
      <!-- Scan Result Toast -->
      <div
        v-if="ormawaScanToast"
        :class="[
          'p-3 rounded-xl border-2 text-xs font-pixel space-y-1 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200',
          ormawaScanToast.success
            ? 'bg-[#142314]/95 border-[#22c55e] text-[#86efac]'
            : 'bg-[#2a1210]/95 border-[#ef4444] text-[#fca5a5]'
        ]"
      >
        <div class="flex items-center gap-2 font-bold">
          <PhCheckCircle v-if="ormawaScanToast.success" :size="16" weight="fill" class="text-[#4ade80]" />
          <PhWarning v-else :size="16" weight="fill" class="text-[#f87171]" />
          <span>{{ ormawaScanToast.success ? 'KUNJUNGAN BERHASIL DICATAT!' : 'SCAN GAGAL' }}</span>
        </div>
        <p class="font-sans text-[11px]">{{ ormawaScanToast.message }}</p>
      </div>

      <!-- API Error Notice -->
      <div
        v-if="apiError"
        class="p-2.5 rounded-xl border border-[#f59e0b]/50 bg-[#20150d]/90 text-[10px] font-mono text-amber-300 flex items-center gap-2 shadow"
      >
        <PhWarning :size="15" class="text-[#f59e0b] shrink-0" />
        <span>{{ apiError }}</span>
      </div>

      <!-- 1. Profil dan progres mahasiswa -->
      <section class="overflow-hidden rounded-[18px] border border-[#8b6f4e] bg-[#19110a]/95 text-left shadow-[0_8px_24px_rgba(20,10,4,0.28)] backdrop-blur-md">
        <div class="space-y-3 p-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-[#f0d060] bg-[#120a05] shadow-[0_3px_0_#65451f]">
              <img
                :src="avatarData.avatarImage"
                :alt="gameStore.participant.name || 'Avatar'"
                class="w-full h-full object-cover object-top"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-bold leading-tight text-[#a7f3b7] sm:text-base">
                {{ gameStore.participant.name || 'Mahasiswa Baru UNU' }}
              </div>
              <div class="mt-1 truncate font-sans text-[11px] text-[#c9a67d]">
                {{ gameStore.participant.nim || '261100123' }} <span class="text-[#755838]">·</span> Hall Lantai 6
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[8px] text-[#a08060] font-sans block">Target Lencana:</span>
              <span class="font-pixel text-[11px] sm:text-xs text-[#facc15] font-bold">
                {{ visitedCount }} / 10 Stan
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-[#2f8f4e]/70 bg-[#102315] p-3">
              <span class="block font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-[#86efac]">XP Ormawa</span>
              <div class="mt-1 flex items-end justify-between gap-2">
                <span class="font-pixel text-base font-bold text-[#facc15]">{{ gameStore.ormawaXpEarned }}</span>
                <span class="font-sans text-[9px] text-[#86efac]/75">{{ visitedCount }} stan dikunjungi</span>
              </div>
            </div>
            <div class="rounded-xl border border-[#c49325]/70 bg-[#2a1a0e] p-3">
              <span class="block font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-[#e2c477]">XP Total</span>
              <div class="mt-1 flex items-end justify-between gap-2">
                <span class="font-pixel text-base font-bold text-white">{{ gameStore.participant.totalXp.toLocaleString('id-ID') }}</span>
                <span class="font-sans text-[9px] text-[#d8b878]/75">semua aktivitas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Strip: Tunjukkan QR / Barcode Peserta -->
        <div class="p-3 bg-[#120a05]/90 border-t border-[#5a3a18]/70">
          <button
            type="button"
            @click="showQrModal = true; safeSound(() => soundEngine.playSelect?.())"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2a1a0e] via-[#3d2714] to-[#2a1a0e] hover:brightness-110 border-2 border-[#facc15] text-[#facc15] hover:text-white font-pixel text-xs font-bold flex items-center justify-between gap-3 shadow-lg active:scale-[0.98] cursor-pointer transition-all"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-black/40 border border-[#facc15]/50 flex items-center justify-center shrink-0">
                <PhQrCode :size="18" weight="bold" class="text-[#facc15]" />
              </div>
              <div class="text-left">
                <span class="block font-pixel text-xs text-white">TUNJUKKAN QR / BARCODE PESERTA</span>
                <span class="block font-sans text-[10px] text-[#c4956a] font-normal">Pindai oleh PIC Ormawa atau sebutkan NIM Anda</span>
              </div>
            </div>
            <PhCaretRight :size="16" weight="bold" class="text-[#facc15] shrink-0" />
          </button>
        </div>
      </section>

      <!-- Stamp Grid Collection -->
      <OrmawaStampGrid :maxStamps="10" />

      <!-- Pencarian dan filter -->
      <section class="space-y-2.5">
        <!-- Search Input -->
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari stan UKM, robotika, seni, silat..."
            class="min-h-11 w-full rounded-xl border border-[#6a4a2b] bg-[#140c06]/95 py-2.5 pl-10 pr-9 font-sans text-sm text-[#fef3c7] outline-none transition-colors placeholder:text-[#8b6f4e] focus:border-[#f0d060]"
          />
          <PhMagnifyingGlass :size="17" class="absolute left-3.5 top-3.5 text-[#b08b5b]" />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''; safeSound(() => soundEngine.playClick?.())"
            class="absolute right-3 top-3 cursor-pointer rounded-md p-0.5 text-[#a08060] hover:text-white"
          >
            <PhX :size="12" />
          </button>
        </div>

        <!-- Filter chip horizontal agar label tetap terbaca di HP -->
        <div class="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            v-for="tab in CATEGORY_TABS"
            :key="tab.id"
            type="button"
            @click="() => {
              safeSound(() => soundEngine.playClick?.());
              activeCategoryTab = tab.id;
            }"
            :class="[
              'flex min-h-11 shrink-0 snap-start cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all active:scale-[0.98]',
              activeCategoryTab === tab.id
                ? 'border-[#d9b94b] bg-[#315f20] text-white shadow-[0_3px_0_#173f12]'
                : 'border-[#5a3a18] bg-[#140c06]/90 text-[#c9a67d] hover:border-[#8b6f4e] hover:text-[#f0d060]'
            ]"
          >
            <span class="text-[9px] font-pixel leading-tight">{{ tab.label }}</span>
            <span :class="['rounded-md px-1.5 py-1 font-sans text-[9px] font-bold', activeCategoryTab === tab.id ? 'bg-black/20 text-[#f5e8a3]' : 'bg-[#2a1a0e] text-[#a98a65]']">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-2.5" aria-label="Memuat katalog stan">
        <div v-for="n in 4" :key="n" class="grid min-h-24 animate-pulse grid-cols-[56px_1fr] gap-3 rounded-2xl border border-[#4a301a] bg-[#18100a]/85 p-3.5">
          <div class="h-14 w-14 rounded-xl bg-[#3a2818]" />
          <div class="space-y-2 py-1">
            <div class="h-3 w-4/5 rounded bg-[#4a3524]" />
            <div class="h-2.5 w-2/5 rounded bg-[#342318]" />
            <div class="h-2.5 w-3/5 rounded bg-[#342318]" />
          </div>
        </div>
      </div>

      <!-- Daftar stan -->
      <section v-else-if="filteredStands.length > 0" class="space-y-2.5">
        <div class="flex items-end justify-between gap-3 px-1">
          <div>
            <p class="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#d0ad78]">Jelajahi Ormawa & UKM</p>
            <p class="mt-1 font-sans text-xs text-[#9f805e]">Pilih stan untuk melihat misi dan informasi.</p>
          </div>
          <span class="shrink-0 rounded-lg border border-[#5a3a18] bg-[#1b110a] px-2.5 py-1.5 font-mono text-[10px] text-[#facc15]">{{ filteredStands.length }} stan</span>
        </div>

        <div class="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <button
            v-for="stand in filteredStands"
            :key="stand.id"
            type="button"
            @click="openStandDetail(stand)"
            :class="[
              'group grid min-h-[94px] w-full grid-cols-[58px_1fr_34px] items-center gap-3 rounded-2xl border p-3.5 text-left shadow-[0_5px_16px_rgba(16,8,3,0.2)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#b9934f] active:translate-y-0 active:scale-[0.99]',
              gameStore.isStandVisited(stand.id)
                ? 'border-[#3b9a55] bg-[#142312]/95'
                : 'border-[#4f351e] bg-[#18100a]/94 hover:bg-[#21150d]'
            ]"
          >
            <!-- Logo Stan -->
            <div class="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-visible rounded-xl border-2 border-[#f5efe5] bg-[#f5efe5] shadow-[0_3px_0_#75583d]">
              <img v-if="stand.logoUrl" :src="stand.logoUrl" :alt="`Logo ${stand.name}`" class="h-full w-full rounded-[10px] object-contain p-1.5" />
              <PhStorefront v-else :size="25" weight="fill" class="text-[#5c4033]" />
              <PhCheckCircle v-if="gameStore.isStandVisited(stand.id)" :size="19" weight="fill" class="absolute -bottom-1.5 -right-1.5 rounded-full bg-[#142312] text-[#4ade80]" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="rounded bg-[#2e1d10] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#facc15] border border-[#6b4724]">
                  {{ stand.location.split('—')[1]?.trim() || 'Lantai 6' }}
                </span>
                <span class="truncate font-sans text-[10px] text-[#c9a67d]">
                  {{ getCategoryLabel(stand.category) }}
                </span>
              </div>
              <h3 class="mt-1 line-clamp-1 font-pixel text-xs font-bold text-[#fef08a] sm:text-sm">
                {{ stand.shortName || stand.name }}
              </h3>
              <p class="mt-0.5 line-clamp-1 font-sans text-[11px] text-[#d6c4a8]/80">
                {{ stand.tagline || stand.description }}
              </p>
              <div class="mt-2 flex items-center gap-2">
                <span :class="['rounded-md px-2 py-0.5 font-pixel text-[8px]', gameStore.isStandVisited(stand.id) ? 'bg-[#194020] text-[#86efac]' : 'bg-[#291b10] text-[#eab308]']">
                  {{ gameStore.isStandVisited(stand.id) ? 'STAMP TERKUMPUL' : `+${stand.xpReward ?? 75} XP REWARD` }}
                </span>
                <span v-if="gameStore.isStandInterested(stand.id)" class="rounded-md bg-[#3c1440] px-2 py-0.5 font-pixel text-[8px] text-pink-300">
                  MINAT
                </span>
              </div>
            </div>

            <div class="flex justify-end text-[#d4af37] transition-transform group-hover:translate-x-1">
              <PhCaretRight :size="18" weight="bold" />
            </div>
          </button>
        </div>
      </section>

      <!-- Empty State -->
      <div v-else class="rounded-2xl border border-[#4a301a] bg-[#18100a]/90 p-8 text-center space-y-2">
        <PhStorefront :size="32" class="mx-auto text-[#8b6f4e]" />
        <p class="text-xs text-[#c9a67d]">Tidak ada stan yang sesuai dengan pencarian Anda.</p>
        <button
          type="button"
          @click="searchQuery = ''; activeCategoryTab = 'ALL'"
          class="font-pixel text-[10px] text-[#facc15] hover:underline"
        >
          RESET FILTER
        </button>
      </div>
    </main>

    <!-- ================================================================= -->
    <!-- MODAL: QR Code Mahasiswa (Ditunjukkan ke PIC Ormawa)              -->
    <!-- ================================================================= -->
    <div
      v-if="showQrModal"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      @click.self="showQrModal = false; safeSound(() => soundEngine.playClick?.())"
    >
      <div class="w-full max-w-sm bg-[#1c1209] border-2 border-[#facc15] rounded-2xl p-5 text-center space-y-4 shadow-2xl relative">
        <button
          type="button"
          @click="showQrModal = false; safeSound(() => soundEngine.playClick?.())"
          class="absolute right-3 top-3 p-1.5 rounded-lg bg-[#2a1a0e] text-[#a08060] hover:text-white border border-[#5a3a18] cursor-pointer"
        >
          <PhX :size="14" />
        </button>

        <div class="space-y-1 pt-1">
          <div class="flex items-center justify-center gap-1.5 text-[#facc15]">
            <PhQrCode :size="18" weight="bold" />
            <span class="font-pixel text-xs font-bold uppercase tracking-wider">QR CODE PROFIL PETUALANG</span>
          </div>
          <p class="text-xs text-[#fef08a] font-bold">{{ gameStore.participant.name || 'Mahasiswa Baru UNU' }}</p>
          <p class="font-mono text-[10px] text-[#a08060]">NIM: {{ gameStore.participant.nim || '261100123' }}</p>
        </div>

        <!-- Big High-Contrast QR Code for PIC scanner -->
        <div class="w-52 h-52 sm:w-56 sm:h-56 mx-auto bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border-4 border-[#ca8a04]">
          <img
            v-if="mabaQrDataUrl"
            :src="mabaQrDataUrl"
            :alt="`QR Code ${gameStore.participant.nim || '261100123'}`"
            class="w-full h-full object-contain"
          />
          <div v-else class="text-black font-sans text-xs animate-pulse">
            Membuat QR Code...
          </div>
        </div>

        <p class="text-xs text-[#e6d5bc]/90 font-sans leading-relaxed">
          Tunjukkan QR Code ini ke PIC {{ activeStandDetail?.shortName || 'Ormawa/UKM' }} untuk dipindai agar stamp dan XP langsung tercatat di profilmu!
        </p>

        <button
          type="button"
          @click="showQrModal = false; safeSound(() => soundEngine.playClick?.())"
          class="w-full py-2.5 bg-[#2a1a0e] hover:bg-[#3d2714] text-[#facc15] font-pixel text-xs rounded-xl border border-[#8b6f4e] cursor-pointer transition-all active:scale-98 shadow"
        >
          TUTUP
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL: Detail Stand UKM / Ormawa                                  -->
    <!-- ================================================================= -->
    <div
      v-if="activeStandDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      @click.self="closeStandDetail"
    >
      <div class="w-full max-w-lg bg-[#1c1209] border-2 border-[#ca8a04] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        <!-- Modal Header -->
        <div class="grid grid-cols-[82px_1fr_auto] sm:grid-cols-[116px_1fr_auto] items-start gap-3 border-b border-[#3d2714] pb-4">
          <div class="aspect-square rounded-xl border-2 border-white bg-white shadow-[0_5px_0_#8b6f4e] overflow-hidden flex items-center justify-center">
            <img v-if="activeStandDetail.logoUrl" :src="activeStandDetail.logoUrl" :alt="`Logo ${activeStandDetail.name}`" class="h-full w-full object-contain p-2" />
            <PhStorefront v-else :size="42" weight="duotone" class="text-[#5c4033]" />
          </div>
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded-md bg-[#2d1b0d] border border-[#d97706]/50 text-[8.5px] font-pixel text-[#facc15]">
                HALL LANTAI 6
              </span>
              <span class="px-2 py-0.5 rounded-md bg-[#1e293b] border border-[#38bdf8]/40 text-[8.5px] font-pixel text-[#38bdf8]">
                {{ getCategoryLabel(activeStandDetail.category) }}
              </span>
            </div>
            <h2 class="font-pixel text-xs sm:text-base text-[#fef08a] font-bold leading-relaxed">
              {{ activeStandDetail.name }}
            </h2>
            <p v-if="activeStandDetail.tagline" class="text-xs text-[#e6d5bc]/80 italic">
              "{{ activeStandDetail.tagline }}"
            </p>
          </div>

          <button
            type="button"
            @click="closeStandDetail"
            class="p-1.5 rounded-lg bg-[#2a1a0e] text-[#a08060] hover:text-white border border-[#5a3a18] cursor-pointer"
          >
            <PhX :size="14" />
          </button>
        </div>

        <!-- Status Kunjungan -->
        <div
          v-if="gameStore.isStandVisited(activeStandDetail.id)"
          class="flex items-center gap-2 p-2.5 bg-[#142314] border border-[#22c55e] rounded-xl text-xs font-mono text-[#86efac]"
        >
          <PhCheckCircle :size="16" weight="fill" class="text-[#4ade80] shrink-0" />
          <span>Stamp stan ini sudah tercatat. +{{ activeStandDetail.xpReward ?? 75 }} XP telah diberikan.</span>
        </div>

        <!-- Location -->
        <div class="flex items-center gap-2 p-2 bg-[#120a05] rounded-xl border border-[#2e1d0f] text-xs font-mono text-[#facc15]">
          <PhMapPin :size="14" class="text-[#facc15] shrink-0" />
          <span>{{ activeStandDetail.location }}</span>
        </div>

        <!-- Deskripsi -->
        <div class="space-y-1">
          <h3 class="text-[10.5px] font-pixel text-[#d4af37] uppercase tracking-wider">TENTANG ORGANISASI</h3>
          <p class="text-xs text-[#e6d5bc] leading-relaxed">
            {{ activeStandDetail.description }}
          </p>
        </div>

        <!-- Petunjuk Stamp -->
        <div v-if="activeStandDetail.stampInstructions?.length" class="space-y-1.5 rounded-xl border border-[#854d0e]/60 bg-[#251508] p-3 text-xs text-[#fef08a]">
          <div class="flex items-center gap-1.5 font-pixel text-[10px] text-[#facc15]">
            <PhQrCode :size="14" weight="bold" />
            <span>CARA MENDAPATKAN STAMP</span>
          </div>
          <ol class="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-[#fef3c7]">
            <li v-for="(inst, i) in activeStandDetail.stampInstructions" :key="i">
              {{ inst }}
            </li>
          </ol>
        </div>

        <!-- Program Unggulan -->
        <div v-if="activeStandDetail.activities?.length" class="space-y-1.5">
          <div class="flex items-center gap-1.5 text-[10.5px] font-pixel text-[#d4af37] uppercase tracking-wider">
            <PhListChecks :size="13" />
            <span>PROGRAM & KEGIATAN UNGGULAN</span>
          </div>
          <ul class="space-y-1 text-xs text-[#e6d5bc]/90">
            <li
              v-for="(act, idx) in activeStandDetail.activities"
              :key="idx"
              class="flex items-start gap-2 bg-[#120a05] p-2 rounded-xl border border-[#2e1d0f]"
            >
              <span class="text-[#facc15] font-bold">&bull;</span>
              <span>{{ act }}</span>
            </li>
          </ul>
        </div>

        <!-- Syarat Bergabung -->
        <div v-if="activeStandDetail.requirements?.length" class="space-y-1.5">
          <div class="flex items-center gap-1.5 text-[10.5px] font-pixel text-[#38bdf8] uppercase tracking-wider">
            <PhFlag :size="13" />
            <span>SYARAT BERGABUNG</span>
          </div>
          <ul class="space-y-1 text-xs text-[#e6d5bc]/90">
            <li
              v-for="(req, idx) in activeStandDetail.requirements"
              :key="idx"
              class="flex items-start gap-2 bg-[#120a05] p-2 rounded-xl border border-[#2e1d0f]"
            >
              <span class="text-[#38bdf8] font-bold">&bull;</span>
              <span>{{ req }}</span>
            </li>
          </ul>
        </div>

        <!-- Social & Narahubung -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <a
            v-if="activeStandDetail.instagram"
            :href="instagramHref(activeStandDetail.instagram)"
            target="_blank"
            rel="noopener noreferrer"
            class="group min-h-14 flex items-center justify-between gap-2 px-3 py-2 bg-[#3b123f] hover:bg-[#581c5f] rounded-xl border-2 border-pink-500 text-white transition-all shadow-[0_3px_0_#831843] active:translate-y-0.5"
          >
            <span class="flex items-center gap-2 min-w-0">
              <PhInstagramLogo :size="20" weight="fill" class="text-pink-300 shrink-0" />
              <span class="truncate">
                <small class="block text-[8px] text-pink-200">BUKA INSTAGRAM</small>
                {{ activeStandDetail.instagram }}
              </span>
            </span>
            <span class="font-pixel text-[12px] text-pink-200">↗</span>
          </a>

          <a
            v-if="whatsappHref(activeStandDetail)"
            :href="whatsappHref(activeStandDetail)"
            target="_blank"
            rel="noopener noreferrer"
            class="group min-h-14 flex items-center justify-between gap-2 px-3 py-2 bg-[#103b23] hover:bg-[#14532d] rounded-xl border-2 border-green-500 text-white transition-all shadow-[0_3px_0_#166534] active:translate-y-0.5"
          >
            <span class="flex items-center gap-2 min-w-0">
              <PhPhone :size="20" weight="fill" class="text-green-300 shrink-0" />
              <span class="truncate">
                <small class="block text-[8px] text-green-200">CHAT WHATSAPP</small>
                {{ activeStandDetail.contactPerson || activeStandDetail.contactPhone }}
              </span>
            </span>
            <span class="font-pixel text-[12px] text-green-200">↗</span>
          </a>
        </div>

        <!-- CTA: Stamp & Berminat -->
        <div class="pt-2 border-t border-[#3d2714] space-y-2">
          <p class="text-[10.5px] text-[#facc15]/80 font-mono text-center">
            Selesaikan misi stan, lalu tunjukkan QR profilmu kepada PIC untuk menerima stamp.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-if="!gameStore.isStandInterested(activeStandDetail.id)"
              type="button"
              @click="openInterestModal"
              class="w-full py-2.5 bg-gradient-to-r from-[#166534] to-[#14532d] hover:from-[#14532d] hover:to-[#064e3b] text-[#86efac] font-pixel text-[10px] rounded-xl border border-[#166534] shadow active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <PhHeart weight="fill" :size="14" />
              <span>BERMINAT GABUNG</span>
            </button>
            <div 
              v-else 
              class="w-full py-2.5 bg-[#142314] text-[#86efac] font-pixel text-[10px] rounded-xl border border-[#22c55e] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
            >
              <PhCheckCircle :size="14" weight="fill" />
              <span>SUDAH BERMINAT</span>
            </div>

            <button
              type="button"
              @click="openStampQr"
              class="w-full py-2.5 bg-[#713f12] hover:bg-[#854d0e] text-[#fef08a] font-pixel text-xs rounded-xl border border-[#facc15] cursor-pointer transition-all active:scale-98 shadow flex items-center justify-center gap-1.5"
            >
              <PhQrCode :size="15" weight="bold" /> TUNJUKKAN QR PESERTA
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <OrmawaInterestModal
      v-if="activeStandDetail"
      v-model="isInterestModalOpen"
      :standId="activeStandDetail.id"
      :standName="activeStandDetail.name"
      @submit="submitInterestHandler"
    />
  </div>
</template>
