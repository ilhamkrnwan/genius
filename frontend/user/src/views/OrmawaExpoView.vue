<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  PhStorefront,
  PhMagnifyingGlass,
  PhCheckCircle,
  PhMapPin,
  PhSparkle,
  PhInfo,
  PhX,
  PhInstagramLogo,
  PhPhone,
  PhListChecks,
  PhFlag,
  PhQrCode,
  PhSpinner,
  PhWarning,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { ORMAWA_STANDS } from '@/data/ormawaData';
import { OrmawaStand } from '@/types/ormawa';
import PixelCard from '@/components/ui/PixelCard.vue';
import PixelButton from '@/components/ui/PixelButton.vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';

const gameStore = useGameStore();

// ─── State ────────────────────────────────────────────────────────────────────
const selectedFloor = ref<number | 'ALL'>('ALL');
const searchQuery = ref('');
const activeStandDetail = ref<OrmawaStand | null>(null);
const isLoading = ref(false);
const apiError = ref<string | null>(null);

// Katalog stan: akan diisi dari API, fallback ke data lokal
const apiStands = ref<OrmawaStand[]>([]);
const stands = computed(() => apiStands.value.length > 0 ? apiStands.value : ORMAWA_STANDS);

// QR Code Maba — menampilkan NIM sebagai QR agar bisa di-scan PIC Ormawa
const mabaQrValue = computed(() => {
  const nim = gameStore.participant.nim || 'BELUM-REGISTRASI';
  return `GENIUS-MABA-${nim}`;
});
const mabaQrUrl = computed(() => {
  const encoded = encodeURIComponent(mabaQrValue.value);
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=220x220&color=f0d060&bgcolor=1a1109&qzone=1`;
});

// ─── Fetch Data dari API ───────────────────────────────────────────────────────
onMounted(async () => {
  isLoading.value = true;
  apiError.value = null;
  try {
    const res = await api.getOrmawaBooths();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      // Normalisasi data dari backend ke format OrmawaStand yang diharapkan UI
      apiStands.value = res.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        shortName: item.shortName || item.name,
        category: item.category,
        floor: item.floorNumber || 3,
        location: item.floorName ? `Selasar Lantai ${item.floorNumber} — ${item.floorName}` : `Lantai ${item.floorNumber}`,
        qrToken: item.qrCode,
        tagline: item.description || '',
        description: item.description || '',
        instagram: item.instagram || '',
        badgeTitle: item.name,
        badgeColor: item.badgeColor || '#16a34a',
        activities: [],
        requirements: [],
        contactPerson: item.contactPerson || '',
        logoUrl: item.logoUrl || null,
      }));
    }
  } catch (err) {
    apiError.value = 'Gagal memuat katalog stan dari server. Menampilkan data sementara.';
    console.warn('[OrmawaExpo] API fetch failed, using local fallback:', err);
  } finally {
    isLoading.value = false;
  }
});

// ─── Filter & Computed ────────────────────────────────────────────────────────
const filteredStands = computed(() => {
  let list = stands.value;
  if (selectedFloor.value !== 'ALL') {
    list = list.filter((s) => s.floor === selectedFloor.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }
  return list;
});

const visitedCount = computed(() => gameStore.visitedOrmawaCount);
const xpEarned = computed(() => gameStore.ormawaXpEarned);
const isCapped = computed(() => gameStore.isOrmawaCapped);

// ─── UI Actions ───────────────────────────────────────────────────────────────
const openStandDetail = (stand: OrmawaStand) => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  activeStandDetail.value = stand;
};

const closeStandDetail = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
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
  <div class="min-h-[100dvh] bg-[#140e08] text-amber-100 pb-16 pt-2 px-3 sm:px-6">
    <div class="max-w-4xl mx-auto space-y-4">

      <!-- Top Hero Header -->
      <PixelCard variant="gold" class="p-4 sm:p-5 relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <PixelBadge variant="warning" class="text-[9px] font-pixel uppercase tracking-widest">
                HARI KE-3 &bull; EXPO KAMPUS
              </PixelBadge>
              <span class="text-[10px] text-amber-300/80 font-mono">Selasar Lt 3, 4, 5</span>
            </div>
            <h1 class="font-pixel text-base sm:text-xl text-[#f0d060] font-bold tracking-wide">
              ORMAWA EXPO DISCOVERY
            </h1>
            <p class="font-sans text-xs text-amber-200/90 leading-relaxed max-w-xl">
              Kunjungi stan UKM & Himpunan Mahasiswa UNU Yogyakarta. <strong>Tunjukkan QR Code kamu</strong> kepada PIC stan untuk mendapatkan lencana dan bonus XP!
            </p>
          </div>

          <!-- XP Counter Badge -->
          <div class="shrink-0 flex flex-col items-center justify-center bg-[#1a1109] border-2 border-[#ca8a04]/60 rounded-xl p-3 min-w-[90px] text-center">
            <PhSparkle :size="22" weight="fill" class="text-[#facc15] mb-1" />
            <span class="font-pixel text-[#fef08a] text-lg font-bold leading-none">+{{ xpEarned }}</span>
            <span class="font-mono text-[10px] text-amber-300/70 mt-0.5">XP TERKUMPUL</span>
          </div>
        </div>
      </PixelCard>

      <!-- API Error Notice -->
      <div
        v-if="apiError"
        class="p-3 rounded-lg border border-[#f59e0b]/50 bg-[#201609] text-xs font-mono text-amber-300 flex items-center gap-2"
      >
        <PhWarning :size="16" class="text-[#f59e0b] shrink-0" />
        <span>{{ apiError }}</span>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!--   QR CODE MABA — Tunjukkan ke PIC Ormawa untuk di-scan   -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="bg-[#1a1109] border-2 border-[#ca8a04] rounded-xl p-4 sm:p-5 space-y-3 shadow-[0_0_20px_rgba(202,138,4,0.15)]">
        <div class="flex items-center gap-2">
          <PhQrCode :size="18" weight="fill" class="text-[#facc15]" />
          <span class="font-pixel text-[#fef08a] text-xs font-bold uppercase tracking-wide">
            QR Code Paspor Kamu
          </span>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <!-- QR Image -->
          <div class="shrink-0 relative">
            <div class="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] bg-[#1a1109] border-4 border-[#ca8a04] rounded-xl overflow-hidden flex items-center justify-center">
              <img
                v-if="gameStore.isLoggedIn && gameStore.participant.nim"
                :src="mabaQrUrl"
                :alt="`QR Code ${gameStore.participant.nim}`"
                class="w-full h-full object-contain"
                loading="lazy"
              />
              <div v-else class="text-center p-3">
                <PhQrCode :size="48" class="text-amber-400/30 mx-auto" />
                <p class="text-[9px] text-amber-300/60 font-mono mt-1">Login dulu ya!</p>
              </div>
            </div>
            <!-- Glow ring -->
            <div class="absolute inset-0 rounded-xl ring-2 ring-[#facc15]/20 pointer-events-none"></div>
          </div>

          <!-- Info Text -->
          <div class="space-y-2 text-center sm:text-left">
            <div v-if="gameStore.isLoggedIn && gameStore.participant.nim">
              <p class="font-pixel text-[#fef08a] text-sm font-bold">{{ gameStore.participant.name || 'Mahasiswa' }}</p>
              <p class="font-mono text-amber-300 text-xs mt-0.5">NIM: {{ gameStore.participant.nim }}</p>
            </div>

            <div class="space-y-1.5 text-xs font-sans text-amber-200/80 leading-relaxed">
              <p class="flex items-start gap-1.5">
                <span class="text-[#facc15] font-bold mt-0.5">1.</span>
                Datangi stan UKM/Himpunan yang ingin kamu kunjungi.
              </p>
              <p class="flex items-start gap-1.5">
                <span class="text-[#facc15] font-bold mt-0.5">2.</span>
                <strong>Tunjukkan QR Code ini</strong> kepada PIC/petugas stan.
              </p>
              <p class="flex items-start gap-1.5">
                <span class="text-[#facc15] font-bold mt-0.5">3.</span>
                Petugas akan scan QR kamu — lencana & XP otomatis masuk ke paspormu!
              </p>
            </div>

            <!-- Progress mini -->
            <div class="pt-1">
              <div class="flex items-center justify-between text-[10px] font-mono mb-1">
                <span class="text-amber-300/70">{{ visitedCount }}/10 stan dikunjungi</span>
                <span :class="isCapped ? 'text-[#86efac]' : 'text-amber-300/70'">
                  {{ isCapped ? '✓ KUOTA PENUH' : `+${xpEarned} XP` }}
                </span>
              </div>
              <div class="w-full bg-[#100a06] h-2 rounded-full border border-[#3d2613] overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#ca8a04] via-[#eab308] to-[#22c55e]"
                  :style="{ width: `${Math.min(100, (visitedCount / 10) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!--   KATALOG STAN UKM & HIMPUNAN          -->
      <!-- ═══════════════════════════════════════ -->

      <!-- Section Title -->
      <div class="flex items-center gap-2 pt-1">
        <PhStorefront :size="16" weight="fill" class="text-[#c084fc]" />
        <span class="font-pixel text-xs text-amber-200 uppercase tracking-wide">Katalog Stan Expo</span>
        <span class="ml-auto font-mono text-[10px] text-amber-300/60">{{ stands.length }} stan terdaftar</span>
      </div>

      <!-- Filters & Floor Selector -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <!-- Floor Chips -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-pixel text-[9px] sm:text-[10px]">
          <button
            type="button"
            @click="selectedFloor = 'ALL'"
            :class="[
              'px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer',
              selectedFloor === 'ALL'
                ? 'bg-[#ca8a04] text-[#140e08] font-bold border-[#facc15]'
                : 'bg-[#1f150c] text-amber-200 border-[#5a3a18] hover:border-[#8b6538]'
            ]"
          >
            SEMUA ({{ stands.length }})
          </button>
          <button
            type="button"
            v-for="floorNum in [3, 4, 5]"
            :key="floorNum"
            @click="selectedFloor = floorNum"
            :class="[
              'px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer',
              selectedFloor === floorNum
                ? 'bg-[#ca8a04] text-[#140e08] font-bold border-[#facc15]'
                : 'bg-[#1f150c] text-amber-200 border-[#5a3a18] hover:border-[#8b6538]'
            ]"
          >
            LANTAI {{ floorNum }}
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari stan, robotika, seni..."
            class="w-full bg-[#1b1209] border border-[#5a3a18] focus:border-[#facc15] rounded-lg pl-8 pr-3 py-1.5 text-xs text-amber-100 placeholder-amber-200/40 outline-none font-mono"
          />
          <PhMagnifyingGlass :size="14" class="text-amber-400/60 absolute left-2.5 top-2.5" />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-10 gap-3 text-amber-300/70 font-mono text-xs">
        <PhSpinner :size="20" class="animate-spin text-[#facc15]" />
        <span>Memuat katalog stan...</span>
      </div>

      <!-- Stands Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div
          v-for="stand in filteredStands"
          :key="stand.id"
          :class="[
            'p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between space-y-3',
            gameStore.isStandVisited(stand.id)
              ? 'bg-[#172216] border-[#22c55e]/60 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
              : 'bg-[#1b1209] border-[#442c17] hover:border-[#78512b]'
          ]"
        >
          <div class="space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Logo jika tersedia dari backend -->
                <img
                  v-if="(stand as any).logoUrl"
                  :src="(stand as any).logoUrl"
                  :alt="stand.shortName"
                  class="w-8 h-8 rounded-full object-cover border border-[#ca8a04]/40 shrink-0"
                />
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded bg-[#2b1c11] border border-[#ca8a04]/40 text-[8px] font-pixel text-[#facc15]">
                      LT {{ stand.floor }}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-[#101824] border border-[#0284c7]/40 text-[8px] font-mono text-[#38bdf8]">
                      {{ getCategoryLabel(stand.category) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Visited Badge -->
              <span
                v-if="gameStore.isStandVisited(stand.id)"
                class="px-2 py-0.5 rounded bg-[#142314] border border-[#22c55e] text-[8px] font-pixel text-[#86efac] flex items-center gap-1 shrink-0"
              >
                <PhCheckCircle :size="11" weight="fill" />
                <span>TERVERIFIKASI</span>
              </span>
              <span v-else class="text-[8px] text-amber-400/60 font-mono italic shrink-0">
                Belum Dikunjungi
              </span>
            </div>

            <!-- Stand Title & Tagline -->
            <div>
              <h3 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold leading-snug">
                {{ stand.name }}
              </h3>
              <p v-if="stand.tagline" class="font-sans text-[11px] text-amber-200/70 italic mt-0.5">
                "{{ stand.tagline }}"
              </p>
            </div>

            <!-- Location -->
            <div v-if="stand.location" class="flex items-center gap-1 text-[10px] text-gray-300 font-mono pt-1">
              <PhMapPin :size="13" class="text-[#f59e0b] shrink-0" />
              <span class="line-clamp-1">{{ stand.location }}</span>
            </div>
          </div>

          <!-- Action Button -->
          <div class="pt-2 border-t border-[#3d2613]">
            <button
              type="button"
              @click="openStandDetail(stand)"
              class="w-full h-8 px-2 bg-[#2a1d12] hover:bg-[#3d2919] border border-[#6b4724] text-amber-200 font-pixel text-[9px] rounded flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
            >
              <PhInfo :size="13" />
              <span>LIHAT DETAIL STAN</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!isLoading && filteredStands.length === 0"
        class="p-8 text-center bg-[#1b1209] border-2 border-dashed border-[#5a3a18] rounded-xl space-y-2 font-mono"
      >
        <PhStorefront :size="32" class="text-amber-400 mx-auto opacity-40" />
        <p class="text-xs text-amber-200">Tidak ada stan yang cocok dengan pencarian.</p>
        <button
          type="button"
          @click="searchQuery = ''; selectedFloor = 'ALL'"
          class="text-[10px] text-[#facc15] underline cursor-pointer"
        >
          Reset Filter & Pencarian
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════ -->
    <!-- Stand Detail Modal                -->
    <!-- ══════════════════════════════════ -->
    <div
      v-if="activeStandDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="closeStandDetail"
    >
      <div class="w-full max-w-lg bg-[#1a1109] border-2 border-[#f59e0b] rounded-xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-3 border-b border-[#3d2613] pb-3">
          <div class="flex items-center gap-3">
            <!-- Logo -->
            <img
              v-if="(activeStandDetail as any).logoUrl"
              :src="(activeStandDetail as any).logoUrl"
              :alt="activeStandDetail.shortName"
              class="w-12 h-12 rounded-full object-cover border-2 border-[#ca8a04]/50 shrink-0"
            />
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-[#2b1c11] border border-[#ca8a04]/40 text-[8px] font-pixel text-[#facc15]">
                  LANTAI {{ activeStandDetail.floor }}
                </span>
                <span class="text-[10px] text-gray-400 font-mono">
                  {{ getCategoryLabel(activeStandDetail.category) }}
                </span>
              </div>
              <h2 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold">
                {{ activeStandDetail.name }}
              </h2>
              <p v-if="activeStandDetail.tagline" class="text-xs text-amber-200/80 italic">
                "{{ activeStandDetail.tagline }}"
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="closeStandDetail"
            class="p-1 rounded bg-[#2a1d12] hover:bg-[#3d2919] text-gray-300 hover:text-white shrink-0 cursor-pointer"
          >
            <PhX :size="18" />
          </button>
        </div>

        <!-- Visited Badge -->
        <div
          v-if="gameStore.isStandVisited(activeStandDetail.id)"
          class="flex items-center gap-2 p-2.5 bg-[#142314] border border-[#22c55e] rounded-lg text-xs font-mono text-[#86efac]"
        >
          <PhCheckCircle :size="16" weight="fill" class="text-[#4ade80] shrink-0" />
          <span>Anda sudah mengunjungi stan ini! Lencana sudah tercatat di paspor.</span>
        </div>

        <!-- Description -->
        <div v-if="activeStandDetail.description" class="space-y-1">
          <span class="text-[10px] text-gray-400 font-mono font-bold uppercase block">
            TENTANG UKM / ORGANISASI
          </span>
          <p class="text-xs text-amber-100/90 leading-relaxed">
            {{ activeStandDetail.description }}
          </p>
        </div>

        <!-- Kegiatan Rutin -->
        <div v-if="activeStandDetail.activities?.length" class="space-y-1.5">
          <span class="text-[10px] text-gray-400 font-mono font-bold uppercase flex items-center gap-1">
            <PhListChecks :size="14" class="text-[#facc15]" />
            <span>KEGIATAN UTAMA & AGENDA</span>
          </span>
          <ul class="space-y-1 text-xs text-amber-100/85">
            <li
              v-for="(act, idx) in activeStandDetail.activities"
              :key="idx"
              class="flex items-start gap-2 bg-[#120b06] p-2 rounded border border-[#2e1d0f]"
            >
              <span class="text-[#facc15] font-bold">&bull;</span>
              <span>{{ act }}</span>
            </li>
          </ul>
        </div>

        <!-- Syarat Bergabung -->
        <div v-if="activeStandDetail.requirements?.length" class="space-y-1.5">
          <span class="text-[10px] text-gray-400 font-mono font-bold uppercase flex items-center gap-1">
            <PhFlag :size="14" class="text-[#38bdf8]" />
            <span>SYARAT BERGABUNG</span>
          </span>
          <ul class="space-y-1 text-xs text-amber-100/85">
            <li
              v-for="(req, idx) in activeStandDetail.requirements"
              :key="idx"
              class="flex items-start gap-2 bg-[#120b06] p-2 rounded border border-[#2e1d0f]"
            >
              <span class="text-[#38bdf8] font-bold">&bull;</span>
              <span>{{ req }}</span>
            </li>
          </ul>
        </div>

        <!-- Social & Narahubung -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <div v-if="activeStandDetail.instagram" class="flex items-center gap-2 p-2 bg-[#120b06] rounded border border-[#2e1d0f] text-gray-300">
            <PhInstagramLogo :size="16" class="text-pink-400 shrink-0" />
            <span>{{ activeStandDetail.instagram }}</span>
          </div>

          <div
            v-if="activeStandDetail.contactPerson"
            class="flex items-center gap-2 p-2 bg-[#120b06] rounded border border-[#2e1d0f] text-gray-300"
          >
            <PhPhone :size="16" class="text-green-400 shrink-0" />
            <span>{{ activeStandDetail.contactPerson }}</span>
          </div>
        </div>

        <!-- CTA: Petunjuk Cara Mendapat Lencana -->
        <div class="pt-2 border-t border-[#3d2613] space-y-2">
          <p class="text-[10px] text-amber-300/70 font-mono text-center">
            Datangi stan ini & tunjukkan QR Code paspormu kepada petugas untuk mendapat lencana!
          </p>
          <button
            type="button"
            @click="closeStandDetail"
            class="w-full h-9 bg-[#2a1d12] hover:bg-[#3d2919] text-amber-200 font-pixel text-[10px] rounded border border-[#6b4724] cursor-pointer transition-all"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
