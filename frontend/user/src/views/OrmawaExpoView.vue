<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
  PhBookOpen,
  PhArrowLeft,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhArrowsClockwise,
  PhCalendarCheck,
  PhMapTrifold,
  PhIdentificationBadge,
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
const isQrModalOpen = ref(false);
const isInterestModalOpen = ref(false);

// QR Code Maba — menampilkan NIM sebagai QR agar bisa di-scan PIC Ormawa
const mabaQrValue = computed(() => {
  const nim = gameStore.participant.nim || '261100123';
  return `GENIUS-MABA-${nim}`;
});

const mabaQrUrlBig = computed(() => {
  const encoded = encodeURIComponent(mabaQrValue.value);
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=320x320&color=111111&bgcolor=ffffff&qzone=1`;
});

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
      tagline: item.description || '',
      description: item.description || '',
      instagram: item.instagram || '',
      badgeTitle: item.name,
      badgeColor: item.badgeColor || '#16a34a',
      activities: Array.isArray(item.activities) ? item.activities : [],
      requirements: Array.isArray(item.requirements) ? item.requirements : [],
      contactPerson: item.contactPerson || '',
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

onMounted(() => {
  fetchBooths();
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
  isQrModalOpen.value = true;
};

const openInterestModal = () => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  isInterestModalOpen.value = true;
};

const submitInterestHandler = async (payload: { phoneNumber: string; motivation?: string; experience?: string }) => {
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
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-5 px-3 sm:px-6"
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
    <div class="fixed inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85 pointer-events-none z-0" />

    <!-- ================================================================= -->
    <!-- TOP HEADER: Sesuai Format Halaman Presensi & Play View             -->
    <!-- ================================================================= -->
    <header class="relative z-20 w-full max-w-xl mx-auto flex items-center justify-between gap-2 pb-2 shrink-0">
      <!-- Left: Back to Menu -->
      <RouterLink
        to="/play"
        @click="() => safeSound(() => soundEngine.playClick?.())"
        class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all text-[9.5px] sm:text-[10px] flex items-center gap-1.5 cursor-pointer active:scale-95 shadow shrink-0"
        title="Kembali ke Menu Utama"
      >
        <PhArrowLeft :size="13" weight="bold" />
        <span class="font-pixel">MENU</span>
      </RouterLink>

      <!-- Center: Title Badge -->
      <div class="px-3 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e] rounded-full shadow flex items-center gap-1.5 shrink-0">
        <PhStorefront :size="14" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
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
          class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
        >
          <PhArrowsClockwise :size="13" :class="{ 'animate-spin': isRefreshing }" />
        </button>

        <!-- Sound Toggle -->
        <button
          type="button"
          @click="toggleSound"
          class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
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
    <main class="relative z-20 w-full max-w-xl mx-auto space-y-2.5 my-auto">
      <!-- API Error Notice -->
      <div
        v-if="apiError"
        class="p-2.5 rounded-xl border border-[#f59e0b]/50 bg-[#20150d]/90 text-[10px] font-mono text-amber-300 flex items-center gap-2 shadow"
      >
        <PhWarning :size="15" class="text-[#f59e0b] shrink-0" />
        <span>{{ apiError }}</span>
      </div>

      <!-- 1. STATUS CARD MAHASISWA & PROFIL EXPO (Format Sama Persis Presensi) -->
      <section class="bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-xl p-3 shadow-lg space-y-2 text-left">
        <!-- Row A: Mahasiswa Info & Total Kunjungan -->
        <div class="flex items-center justify-between gap-2.5 pb-2 border-b border-[#4a2e14]/70">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-lg bg-[#120a05] border border-[#f0d060] overflow-hidden shrink-0 shadow">
              <img
                :src="avatarData.avatarImage"
                :alt="gameStore.participant.name || 'Avatar'"
                class="w-full h-full object-cover object-top"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs sm:text-sm font-bold text-[#86efac] leading-tight truncate">
                {{ gameStore.participant.name || 'Mahasiswa Baru UNU' }}
              </div>
              <div class="text-[9px] sm:text-[10px] text-[#c4956a] font-sans truncate mt-0.5">
                NIM: {{ gameStore.participant.nim || '261100123' }} • Hall Lantai 6
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="text-[8px] text-[#a08060] font-sans block">Kunjungan:</span>
            <span class="font-pixel text-[10.5px] sm:text-xs text-[#facc15] font-bold">
              {{ visitedCount }} / 10 Stan
            </span>
          </div>
        </div>

        <!-- Row B: Action Strip Buka QR Profil -->
        <div class="flex items-center justify-between gap-2 bg-[#120a05]/70 rounded-lg px-2.5 py-1.5 border border-[#5a3a18]/60">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="w-5 h-5 rounded-md bg-[#ca8a04]/20 border border-[#facc15] flex items-center justify-center text-[#facc15] shrink-0">
              <PhQrCode :size="13" weight="bold" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[7.5px] text-[#a08060] font-sans block leading-none">Profil Digital Mahasiswa:</span>
              <span class="text-[10px] sm:text-[11px] font-bold text-white block leading-tight truncate mt-0.5">
                Tunjukkan QR ke Petugas Stan
              </span>
            </div>
          </div>

          <button
            type="button"
            @click="showQrModal = true; safeSound(() => soundEngine.playSelect?.())"
            class="text-[8px] sm:text-[8.5px] font-pixel text-[#140e08] font-bold bg-[#facc15] hover:bg-white px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 shadow flex items-center gap-1 shrink-0"
          >
            <PhQrCode :size="11" weight="bold" />
            <span>BUKA QR PROFIL</span>
          </button>
        </div>

        <!-- Progress Bar Strip -->
        <div class="pt-0.5 space-y-1">
          <div class="flex items-center justify-between text-[8.5px] font-mono">
            <span class="text-[#a08060]">Target 10 Stan Ormawa • Lantai 6</span>
            <span class="text-[#facc15] font-bold">{{ visitedCount }} / 10 Dikunjungi</span>
          </div>
          <div class="w-full bg-[#120a05] h-1.5 rounded-full border border-[#3d2714] overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#d97706] via-[#facc15] to-[#22c55e]"
              :style="{ width: `${Math.min(100, (visitedCount / 10) * 100)}%` }"
            />
          </div>
        </div>
      </section>

      <!-- Stamp Grid Collection -->
      <OrmawaStampGrid :maxStamps="10" />

      <!-- 2. SEGMENTED TABS & SEARCH (Sama Seperti Tab Hari di Presensi) -->
      <section class="space-y-1.5">
        <!-- Search Input -->
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari stan UKM, robotika, seni, silat..."
            class="w-full bg-[#140c06]/95 border border-[#5a3a18] focus:border-[#f0d060] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#fef08a] placeholder-[#8b6f4e] outline-none font-sans"
          />
          <PhMagnifyingGlass :size="14" class="text-[#8b6f4e] absolute left-2.5 top-2.5" />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''; safeSound(() => soundEngine.playClick?.())"
            class="absolute right-2.5 top-2 text-[#a08060] hover:text-white cursor-pointer"
          >
            <PhX :size="12" />
          </button>
        </div>

        <!-- Segmented Category Control -->
        <div class="grid grid-cols-4 gap-1 bg-[#140c06]/90 p-1 rounded-xl border border-[#5a3a18]">
          <button
            v-for="tab in CATEGORY_TABS"
            :key="tab.id"
            type="button"
            @click="() => {
              safeSound(() => soundEngine.playClick?.());
              activeCategoryTab = tab.id;
            }"
            :class="[
              'py-1.5 px-1 rounded-lg transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95',
              activeCategoryTab === tab.id
                ? 'bg-[#38761d] text-white border border-[#f0d060] font-bold shadow'
                : 'text-[#c4956a] hover:text-[#f0d060]'
            ]"
          >
            <span class="text-[8.5px] sm:text-[9.5px] font-pixel leading-tight">{{ tab.label }}</span>
            <span class="text-[7px] sm:text-[7.5px] opacity-75 font-sans mt-0.5">{{ getTabCount(tab.id) }} Stan</span>
          </button>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-10 gap-3 text-[#facc15] font-mono text-xs">
        <PhSpinner :size="20" class="animate-spin" />
        <span>Memuat katalog stan Lantai 6...</span>
      </div>

      <!-- 3. LIST STAN ORMAWA LANTAI 6 (Format Card Sesi Sama Persis Presensi) -->
      <section v-else-if="filteredStands.length > 0" class="space-y-2">
        <div
          v-for="stand in filteredStands"
          :key="stand.id"
          @click="openStandDetail(stand)"
          :class="[
            'border rounded-xl p-2.5 sm:p-3 transition-all flex items-start gap-2.5 text-left backdrop-blur-md cursor-pointer hover:border-[#f0d060] active:scale-[0.99] shadow-sm',
            gameStore.isStandVisited(stand.id)
              ? 'bg-[#142312]/95 border-[#22c55e]'
              : 'bg-[#18100a]/90 border-[#4a301a] hover:bg-[#22150c]'
          ]"
        >
          <!-- Status / Category Icon Box (Sama Seperti Kotak Ikon Presensi) -->
          <div
            :class="[
              'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
              gameStore.isStandVisited(stand.id)
                ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#4ade80]'
                : 'bg-[#1a110a] border-[#5a3a18] text-[#facc15]'
            ]"
          >
            <PhCheckCircle v-if="gameStore.isStandVisited(stand.id)" :size="18" weight="fill" />
            <PhStorefront v-else :size="17" weight="fill" />
          </div>

          <!-- Stand Details (2-Row Design for Zero Truncation) -->
          <div class="min-w-0 flex-1">
            <!-- Row 1: Title -->
            <div class="flex items-center gap-2">
              <span class="text-[11px] sm:text-xs font-bold text-white leading-tight">
                {{ stand.name }}
              </span>
            </div>

            <!-- Row 2: Tagline / Deskripsi Singkat -->
            <p v-if="stand.tagline" class="text-[9.5px] text-[#c4956a] font-sans line-clamp-1 mt-0.5">
              "{{ stand.tagline }}"
            </p>

            <!-- Row 3: Location (Lantai 6), Category, & Status Badge -->
            <div class="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
              <span class="text-[9px] text-[#a08060] font-sans flex items-center gap-1">
                <PhMapPin :size="11" class="text-[#f59e0b] shrink-0" />
                <span>{{ stand.location || 'Hall Lantai 6' }}</span>
                <span class="text-[#38bdf8] font-mono">• {{ getCategoryLabel(stand.category) }}</span>
              </span>

              <span
                :class="[
                  'text-[7.5px] sm:text-[8px] font-mono px-2 py-0.5 rounded border uppercase font-bold shrink-0',
                  gameStore.isStandVisited(stand.id)
                    ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#86efac]'
                    : 'bg-black/40 border-[#5a3a18] text-[#facc15]'
                ]"
              >
                {{ gameStore.isStandVisited(stand.id) ? 'TERVERIFIKASI' : 'LIHAT DETAIL' }}
              </span>
            </div>
          </div>
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
    <!-- 4. BOTTOM FOOTER NAVIGATION                                       -->
    <!-- ================================================================= -->
    <footer class="flex items-center justify-center pt-2 pb-3 shrink-0 relative z-20">
      <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#120a05]/90 backdrop-blur-md border border-[#5a3a18] text-[9px] text-[#a08060] font-pixel shadow-lg">
        <RouterLink
          to="/peta"
          @click="() => safeSound(() => soundEngine.playClick?.())"
          class="hover:text-[#60a5fa] flex items-center gap-1 transition-colors"
        >
          <PhMapTrifold :size="12" />
          <span>PETA KAMPUS</span>
        </RouterLink>
        <span>•</span>
        <RouterLink
          to="/presensi"
          @click="() => safeSound(() => soundEngine.playClick?.())"
          class="hover:text-[#facc15] flex items-center gap-1 transition-colors"
        >
          <PhCalendarCheck :size="12" />
          <span>PRESENSI</span>
        </RouterLink>
        <span>•</span>
        <RouterLink
          to="/profile"
          @click="() => safeSound(() => soundEngine.playClick?.())"
          class="hover:text-[#86efac] flex items-center gap-1 transition-colors"
        >
          <PhIdentificationBadge :size="12" />
          <span>PROFIL</span>
        </RouterLink>
      </div>
    </footer>

    <!-- ================================================================= -->
    <!-- MODAL: BIG HIGH-CONTRAST QR SCANNER MODAL                         -->
    <!-- ================================================================= -->
    <div
      v-if="showQrModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
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
            :src="mabaQrUrlBig"
            :alt="`QR Code ${gameStore.participant.nim || '261100123'}`"
            class="w-full h-full object-contain"
          />
        </div>

        <p class="text-xs text-[#e6d5bc]/90 font-sans leading-relaxed">
          Tunjukkan QR Code ini ke petugas stan Ormawa/UKM Lantai 6 untuk dipindai (scan) agar lencana dan bonus XP langsung tercatat di profilmu!
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
        <div class="flex items-start justify-between gap-3 border-b border-[#3d2714] pb-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded-md bg-[#2d1b0d] border border-[#d97706]/50 text-[8.5px] font-pixel text-[#facc15]">
                HALL LANTAI 6
              </span>
              <span class="text-[10px] text-[#38bdf8] font-mono">
                {{ getCategoryLabel(activeStandDetail.category) }}
              </span>
            </div>
            <h2 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold">
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
          <span>Kamu sudah mengunjungi stan ini! Lencana sudah tercatat di profil.</span>
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
          <div v-if="activeStandDetail.instagram" class="flex items-center gap-2 p-2 bg-[#120a05] rounded-xl border border-[#2e1d0f] text-[#d6c4a8]">
            <PhInstagramLogo :size="16" class="text-pink-400 shrink-0" />
            <span>{{ activeStandDetail.instagram }}</span>
          </div>

          <div
            v-if="activeStandDetail.contactPerson"
            class="flex items-center gap-2 p-2 bg-[#120a05] rounded-xl border border-[#2e1d0f] text-[#d6c4a8]"
          >
            <PhPhone :size="16" class="text-green-400 shrink-0" />
            <span>{{ activeStandDetail.contactPerson }}</span>
          </div>
        </div>

        <!-- CTA: Petunjuk Cara Mendapat Lencana & Berminat -->
        <div class="pt-2 border-t border-[#3d2714] space-y-2">
          <p class="text-[10.5px] text-[#facc15]/80 font-mono text-center">
            Datangi stan ini di Hall Lantai 6 & tunjukkan QR Code profilmu ke petugas untuk klaim lencana!
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
              @click="closeStandDetail"
              class="w-full py-2 bg-[#2a1a0e] hover:bg-[#3d2714] text-[#facc15] font-pixel text-xs rounded-xl border border-[#8b6f4e] cursor-pointer transition-all active:scale-98 shadow"
            >
              TUTUP
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
