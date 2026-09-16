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
  PhCaretRight,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { ORMAWA_STANDS } from '@/data/ormawaData';
import { OrmawaStand } from '@/types/ormawa';
import OrmawaInterestModal from '@/components/ormawa/OrmawaInterestModal.vue';
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
watch(mabaQrValue, async (value) => {
  mabaQrDataUrl.value = await QRCode.toDataURL(value, {
    width: 360,
    margin: 2,
    color: { dark: '#111111', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}, { immediate: true });

// ─── Normalisasi Data API & Lantai 6 Focus ─────────────────────────────────────
const apiStands = ref<OrmawaStand[]>([]);

function normalizeApiData(data: any[]): OrmawaStand[] {
  return data.map((item: any, idx: number) => {
    // Seluruh stan expo Ormawa berpusat di Lantai 6 (Hall & Selasar Lantai 6)
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
      tagline: item.tagline || '',
      description: item.description || '',
      instagram: item.instagram || '',
      activities: Array.isArray(item.activities) ? item.activities : [],
      requirements: Array.isArray(item.requirements) ? item.requirements : [],
      stampInstructions: Array.isArray(item.stampInstructions) ? item.stampInstructions : [],
      xpReward: Number(item.xpReward ?? 2),
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
      stampInstructions: s.stampInstructions?.length ? s.stampInstructions : [
        'Datangi stan dan kenali program Ormawa atau UKM.',
        'Selesaikan misi yang diberikan oleh PIC stan.',
        'Buka QR profilmu dan minta PIC memindainya untuk menerima stamp.',
      ],
      xpReward: s.xpReward ?? 2,
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
  { id: 'ALL' as const, label: 'SEMUA' },
  { id: 'BAKAT' as const, label: 'MINAT BAKAT' },
  { id: 'PENALARAN' as const, label: 'PENALARAN & IT' },
  { id: 'SOSIAL' as const, label: 'SOSIAL & ASWAJA' },
];

function matchesCategory(stand: OrmawaStand, tabId: string): boolean {
  if (tabId === 'ALL') return true;
  const cat = (stand.category || '').toLowerCase();
  const name = (stand.name || '').toLowerCase();

  if (tabId === 'BAKAT') {
    return (
      cat.includes('olahraga') ||
      cat.includes('seni') ||
      cat.includes('musik') ||
      cat.includes('vokal') ||
      cat.includes('bela diri') ||
      cat.includes('beladiri') ||
      cat.includes('teater') ||
      cat.includes('pertunjukan') ||
      cat.includes('silat') ||
      name.includes('musik') ||
      name.includes('suara') ||
      name.includes('teater') ||
      name.includes('silat')
    );
  }

  if (tabId === 'PENALARAN') {
    return (
      cat.includes('penalaran') ||
      cat.includes('teknologi') ||
      cat.includes('sains') ||
      cat.includes('robotik') ||
      cat.includes('himpunan') ||
      cat.includes('it') ||
      name.includes('robotik') ||
      name.includes('himpunan') ||
      name.includes('elektro') ||
      name.includes('informatika')
    );
  }

  if (tabId === 'SOSIAL') {
    return (
      cat.includes('sosial') ||
      cat.includes('kemanusiaan') ||
      cat.includes('keagamaan') ||
      cat.includes('aswaja') ||
      cat.includes('pers') ||
      cat.includes('dialektika') ||
      cat.includes('relawan') ||
      name.includes('ksr') ||
      name.includes('pmi') ||
      name.includes('pers')
    );
  }

  return true;
}

function getTabCount(tabId: string): number {
  return stands.value.filter((s) => matchesCategory(s, tabId)).length;
}

const filteredStands = computed(() => {
  let list = stands.value;
  if (activeCategoryTab.value !== 'ALL') {
    list = list.filter((s) => matchesCategory(s, activeCategoryTab.value));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
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
  const normalized = digits.startsWith('62') ? digits : digits.startsWith('0') ? `62${digits.slice(1)}` : digits.startsWith('8') ? `62${digits}` : digits;
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

const submitInterestHandler = async (payload: { phoneNumber: string; instagramUsername: string; motivation?: string; experience?: string }) => {
  if (!activeStandDetail.value) return;
  const res = await gameStore.submitInterest(activeStandDetail.value.id, payload);
  if (res.success) {
    isInterestModalOpen.value = false;
    alert(res.message); // can use toast in real app
  } else {
    alert(res.message);
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
        background-image: url('/games/background.png');
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
    <!-- MAIN CONTENT: Simple, Clean & Focused (Sama Seperti Presensi)     -->
    <!-- ================================================================= -->
    <main class="relative z-20 mx-auto w-full max-w-2xl space-y-4">
      <!-- API Error Notice -->
      <div
        v-if="apiError"
        class="p-2.5 rounded-xl border border-[#f59e0b]/50 bg-[#20150d]/90 text-[10px] font-mono text-amber-300 flex items-center gap-2 shadow"
      >
        <PhWarning :size="15" class="text-[#f59e0b] shrink-0" />
        <span>{{ apiError }}</span>
      </div>

      <!-- Profil dan progres mahasiswa -->
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
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-[#2f8f4e]/70 bg-[#102315] p-3">
              <span class="block font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-[#86efac]">XP Ormawa</span>
              <div class="mt-1 flex items-end justify-between gap-2">
                <span class="font-pixel text-base font-bold text-[#facc15]">{{ gameStore.ormawaXpEarned }}</span>
                <span class="font-sans text-[9px] text-[#86efac]/75">{{ visitedCount }} stamp</span>
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

        <button
          type="button"
          @click="showQrModal = true; safeSound(() => soundEngine.playSelect?.())"
          class="group flex min-h-16 w-full cursor-pointer items-center gap-3 border-t border-[#5a3a18]/70 bg-[#120a05]/80 px-4 py-3 text-left transition-colors hover:bg-[#211409] active:bg-[#2a1a0e]"
        >
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#facc15] bg-[#ca8a04]/15 text-[#facc15]">
            <PhQrCode :size="22" weight="bold" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-sans text-[10px] text-[#a98a65]">Setelah menyelesaikan misi stan</span>
            <span class="mt-0.5 block text-[11px] font-bold text-white sm:text-xs">Tunjukkan QR profil ke PIC</span>
          </span>
          <span class="shrink-0 rounded-lg bg-[#facc15] px-3 py-2 text-[9px] font-bold text-[#1b1209] shadow-[0_3px_0_#9a6812] transition-transform group-active:translate-y-0.5">BUKA QR</span>
        </button>
      </section>

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
            <div class="flex items-start gap-2">
              <span class="line-clamp-2 text-xs font-bold leading-[1.35] text-white sm:text-[13px]">
                {{ stand.name }}
              </span>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-1.5 font-sans text-[9px]">
              <span class="rounded-md bg-[#17364b] px-1.5 py-1 text-[#7dd3fc]">{{ getCategoryLabel(stand.category) }}</span>
              <span class="rounded-md bg-[#33200e] px-1.5 py-1 text-[#e8c36b]">+{{ stand.xpReward ?? 2 }} XP</span>
            </div>

            <span class="mt-2 flex items-center gap-1 font-sans text-[10px] text-[#a98a65]">
              <PhMapPin :size="12" class="shrink-0 text-[#f59e0b]" />
              <span class="truncate">{{ stand.location || 'Hall Lantai 6' }}</span>
            </span>
          </div>

          <span :class="['flex h-8 w-8 items-center justify-center rounded-lg border transition-transform group-hover:translate-x-0.5', gameStore.isStandVisited(stand.id) ? 'border-[#3b9a55] bg-[#1d4729] text-[#86efac]' : 'border-[#674526] bg-[#2a1a0e] text-[#f0d060]']">
            <PhCheckCircle v-if="gameStore.isStandVisited(stand.id)" :size="17" weight="fill" />
            <PhCaretRight v-else :size="16" weight="bold" />
          </span>
        </button>
        </div>
      </section>

      <!-- Empty State -->
      <div
        v-else
        class="p-8 text-center bg-[#18100a]/90 border border-dashed border-[#5a3a18] rounded-xl space-y-2 font-mono"
      >
        <PhStorefront :size="32" class="text-amber-400 mx-auto opacity-40" />
        <p class="text-xs text-amber-200">Tidak ada stan yang cocok dengan pencarian.</p>
        <button
          type="button"
          @click="searchQuery = ''; activeCategoryTab = 'ALL'; safeSound(() => soundEngine.playClick?.())"
          class="text-[10px] text-[#facc15] underline cursor-pointer"
        >
          Reset Filter & Pencarian
        </button>
      </div>
    </main>

    <!-- ================================================================= -->
    <!-- MODAL: BIG HIGH-CONTRAST QR SCANNER MODAL                         -->
    <!-- ================================================================= -->
    <div
      v-if="showQrModal"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      @click.self="showQrModal = false; safeSound(() => soundEngine.playClick?.())"
    >
      <div class="w-full max-w-sm bg-[#1c1209] border-2 border-[#facc15] rounded-2xl p-5 text-center space-y-4 shadow-2xl relative">
        <div class="flex items-center justify-between border-b border-[#3d2714] pb-2.5">
          <div class="flex items-center gap-1.5 text-xs font-pixel text-[#facc15]">
            <PhQrCode :size="16" weight="fill" />
            <span>QR PROFIL MAHASISWA</span>
          </div>
          <button
            type="button"
            @click="showQrModal = false; safeSound(() => soundEngine.playClick?.())"
            class="p-1 rounded-lg bg-[#2a1a0e] hover:bg-[#3d2714] text-[#a08560] hover:text-white cursor-pointer"
          >
            <PhX :size="16" />
          </button>
        </div>

        <div class="space-y-0.5">
          <h3 class="font-pixel text-sm sm:text-base text-[#fef08a]">
            {{ gameStore.participant.name || 'Mahasiswa Baru UNU' }}
          </h3>
          <p class="font-mono text-xs text-[#fbbf24]">
            NIM: {{ gameStore.participant.nim || '261100123' }}
          </p>
        </div>

        <!-- Big High-Contrast QR Code for PIC scanner -->
        <div class="w-52 h-52 sm:w-56 sm:h-56 mx-auto bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border-4 border-[#ca8a04]">
          <img
            :src="mabaQrDataUrl"
            :alt="`QR Code ${gameStore.participant.nim || '261100123'}`"
            class="w-full h-full object-contain"
          />
        </div>

        <p class="text-xs text-[#e6d5bc]/90 font-sans leading-relaxed">
          Tunjukkan QR Code ini ke PIC {{ activeStandDetail?.shortName || 'Ormawa/UKM' }} untuk dipindai agar stamp dan XP langsung tercatat.
        </p>

        <button
          type="button"
          @click="showQrModal = false; safeSound(() => soundEngine.playClick?.())"
          class="w-full py-2 bg-[#2a1a0e] hover:bg-[#3d2714] border border-[#8b6f4e] text-[#facc15] font-pixel text-xs rounded-xl cursor-pointer transition-colors active:scale-98 shadow"
        >
          TUTUP
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL: STAND DETAIL                                               -->
    <!-- ================================================================= -->
    <div
      v-if="activeStandDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
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
              <span class="text-[10px] text-[#38bdf8] font-mono">
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
            class="p-1.5 rounded-lg bg-[#2a1a0e] hover:bg-[#3d2714] text-[#a08560] hover:text-white shrink-0 cursor-pointer"
          >
            <PhX :size="18" />
          </button>
        </div>

        <!-- Visited Badge -->
        <div
          v-if="gameStore.isStandVisited(activeStandDetail.id)"
          class="flex items-center gap-2 p-2.5 bg-[#142314] border border-[#22c55e] rounded-xl text-xs font-mono text-[#86efac]"
        >
          <PhCheckCircle :size="16" weight="fill" class="text-[#4ade80] shrink-0" />
          <span>Stamp stan ini sudah tercatat. +{{ activeStandDetail.xpReward ?? 2 }} XP Ormawa telah diberikan.</span>
        </div>

        <!-- Location -->
        <div v-if="activeStandDetail.location" class="flex items-center gap-1.5 text-xs text-[#facc15] font-mono bg-[#140d06] p-2 rounded-xl border border-[#3d2714]">
          <PhMapPin :size="15" class="text-[#f59e0b] shrink-0" />
          <span>{{ activeStandDetail.location }}</span>
        </div>

        <!-- Description -->
        <div v-if="activeStandDetail.description" class="space-y-1">
          <span class="text-[10px] text-[#a08560] font-mono font-bold uppercase block">
            TENTANG UKM / ORGANISASI
          </span>
          <p class="text-xs text-[#e6d5bc] leading-relaxed">
            {{ activeStandDetail.description }}
          </p>
        </div>

        <!-- Cara Mendapat Stamp -->
        <div class="space-y-2 rounded-xl border-2 border-[#facc15]/70 bg-[#2a1a0e] p-3">
          <span class="text-[10px] text-[#facc15] font-pixel font-bold uppercase flex items-center gap-1.5">
            <PhQrCode :size="15" weight="bold" />
            <span>CARA DAPAT STAMP</span>
          </span>
          <ol class="space-y-2 text-xs text-[#f7e7c6]">
            <li v-for="(step, idx) in activeStandDetail.stampInstructions" :key="`${idx}-${step}`" class="grid grid-cols-[24px_1fr] gap-2 items-start">
              <span class="h-6 w-6 rounded-full bg-[#facc15] text-[#2a1a0e] font-pixel text-[9px] font-bold flex items-center justify-center">{{ idx + 1 }}</span>
              <span class="leading-relaxed pt-0.5">{{ step }}</span>
            </li>
          </ol>
          <p class="text-[9px] font-mono text-[#d8b878] border-t border-[#5a3a18] pt-2">Reward stamp: +{{ activeStandDetail.xpReward ?? 2 }} XP Ormawa</p>
        </div>

        <!-- Kegiatan Rutin -->
        <div v-if="activeStandDetail.activities?.length" class="space-y-1.5">
          <span class="text-[10px] text-[#a08560] font-mono font-bold uppercase flex items-center gap-1">
            <PhListChecks :size="14" class="text-[#facc15]" />
            <span>KEGIATAN UTAMA & AGENDA</span>
          </span>
          <ul class="space-y-1 text-xs text-[#e6d5bc]">
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
          <span class="text-[10px] text-[#a08560] font-mono font-bold uppercase flex items-center gap-1">
            <PhFlag :size="14" class="text-[#38bdf8]" />
            <span>SYARAT BERGABUNG</span>
          </span>
          <ul class="space-y-1 text-xs text-[#e6d5bc]">
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
          <a v-if="activeStandDetail.instagram" :href="instagramHref(activeStandDetail.instagram)" target="_blank" rel="noopener noreferrer" class="group min-h-14 flex items-center justify-between gap-2 px-3 py-2 bg-[#3b123f] hover:bg-[#581c5f] rounded-xl border-2 border-pink-500 text-white transition-all shadow-[0_3px_0_#831843] active:translate-y-0.5">
            <span class="flex items-center gap-2 min-w-0"><PhInstagramLogo :size="20" weight="fill" class="text-pink-300 shrink-0" /><span class="truncate"><small class="block text-[8px] text-pink-200">BUKA INSTAGRAM</small>{{ activeStandDetail.instagram }}</span></span>
            <span class="font-pixel text-[12px] text-pink-200">↗</span>
          </a>

          <a
            v-if="whatsappHref(activeStandDetail)"
            :href="whatsappHref(activeStandDetail)"
            target="_blank"
            rel="noopener noreferrer"
            class="group min-h-14 flex items-center justify-between gap-2 px-3 py-2 bg-[#103b23] hover:bg-[#14532d] rounded-xl border-2 border-green-500 text-white transition-all shadow-[0_3px_0_#166534] active:translate-y-0.5"
          >
            <span class="flex items-center gap-2 min-w-0"><PhPhone :size="20" weight="fill" class="text-green-300 shrink-0" /><span class="truncate"><small class="block text-[8px] text-green-200">CHAT WHATSAPP</small>{{ activeStandDetail.contactPerson || activeStandDetail.contactPhone }}</span></span>
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
              class="w-full py-2 bg-gradient-to-r from-[#166534] to-[#14532d] hover:from-[#14532d] hover:to-[#064e3b] text-[#86efac] font-pixel text-[10px] rounded-xl border border-[#166534] shadow active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <PhHeart weight="fill" :size="14" />
              <span>BERMINAT GABUNG</span>
            </button>
            <div 
              v-else 
              class="w-full py-2 bg-[#142314] text-[#86efac] font-pixel text-[10px] rounded-xl border border-[#22c55e] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
            >
              <PhCheckCircle :size="14" weight="fill" />
              <span>SUDAH BERMINAT</span>
            </div>

            <button
              type="button"
              @click="openStampQr"
              class="w-full py-2 bg-[#713f12] hover:bg-[#854d0e] text-[#fef08a] font-pixel text-xs rounded-xl border border-[#facc15] cursor-pointer transition-all active:scale-98 shadow flex items-center justify-center gap-1.5"
            >
              <PhQrCode :size="15" weight="bold" /> STAMP
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
