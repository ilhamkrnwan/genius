<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhArrowLeft,
  PhBookOpen,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhMagnifyingGlass,
  PhX,
  PhFootprints,
  PhSealCheck,
  PhStorefront,
  PhCalendarCheck,
  PhShieldCheck,
  PhWarningCircle,
  PhWifiHigh,
  PhLightbulbFilament,
  PhMapTrifold,
  PhIdentificationBadge,
} from '@phosphor-icons/vue';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';

const gameStore = useGameStore();
const isMuted = ref(!gameStore.soundEnabled);

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

// ─── Segmented Filter & Search ────────────────────────────────────────────────
type CategoryId = 'ALL' | 'GAME' | 'PASPOR' | 'ORMAWA' | 'FAQ';
const activeCategoryTab = ref<CategoryId>('ALL');
const searchQuery = ref('');

const CATEGORY_TABS = [
  { id: 'ALL' as const, label: 'SEMUA' },
  { id: 'GAME' as const, label: 'ALUR GAME' },
  { id: 'PASPOR' as const, label: 'STEMPEL' },
  { id: 'ORMAWA' as const, label: 'ORMAWA' },
  { id: 'FAQ' as const, label: 'KENDALA' },
];

interface GuideItem {
  id: string;
  category: 'GAME' | 'PASPOR' | 'ORMAWA' | 'FAQ';
  categoryLabel: string;
  icon: any;
  iconColor: string;
  title: string;
  points: string[];
  tip?: string;
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'alur-petualangan',
    category: 'GAME',
    categoryLabel: 'Alur Petualangan',
    icon: PhFootprints,
    iconColor: '#38bdf8',
    title: 'Penjelajahan 9 Lantai Kampus',
    points: [
      'Mahasiswa baru menjelajahi Lantai 1 hingga Lantai 9 Kampus Terpadu UNU Yogyakarta didampingi oleh Kakak Pendamping (Buddy) kelompok masing-masing.',
      'Setiap lantai mengangkat pilar keilmuan khusus dan diperkenalkan melalui prolog karakter pemandu sebelum memulai misi.',
      'Gunakan menu Peta Kampus untuk mengetahui tata letak ruangan, jalur tangga darurat, lift, dan toilet di setiap lantai.',
    ],
    tip: 'Utamakan menggunakan tangga manual jika berpindah 1–2 lantai agar lift tidak mengalami antrean panjang.',
  },
  {
    id: 'aturan-stempel',
    category: 'PASPOR',
    categoryLabel: 'Stempel & Paspor',
    icon: PhSealCheck,
    iconColor: '#facc15',
    title: 'Syarat & Perolehan Stempel Emas',
    points: [
      'Terdapat 2 spot tantangan interaktif di setiap lantai, dengan total 18 stempel digital yang harus dikumpulkan di Paspor.',
      'Batas skor minimal kelulusan adalah 70% pada setiap mini-game untuk berhak mengklaim stempel emas.',
      'Jika skor belum mencapai 70%, kamu dapat langsung mengulang tantangan di spot tersebut tanpa batas percobaan.',
      'Setiap stempel yang diraih otomatis tercatat di Paspor Digital dan menambah akumulasi poin kelompok di papan Leaderboard.',
    ],
    tip: 'Periksa menu Paspor Digital untuk memantau kelengkapan stempel dan status sertifikat kelulusanmu.',
  },
  {
    id: 'stan-ormawa',
    category: 'ORMAWA',
    categoryLabel: 'Ormawa Expo',
    icon: PhStorefront,
    iconColor: '#86efac',
    title: 'Kunjungan Expo Ormawa di Lantai 6',
    points: [
      'Seluruh stan UKM, organisasi mahasiswa, dan komunitas kampus berpusat di Hall dan Selasar Lantai 6.',
      'Buka halaman Ormawa Expo pada menu, lalu pilih tombol "Buka QR Paspor".',
      'Tunjukkan kode QR Paspor Mahasiswa tersebut kepada petugas stan untuk dipindai (scan) sebagai bukti kunjungan stan.',
      'Kunjungi minimal 10 stan pilihan untuk melengkapi pencapaian lencana expo ormawa.',
    ],
    tip: 'Kamu dapat membaca deskripsi kegiatan, profil, dan kontak tiap organisasi langsung di halaman Ormawa.',
  },
  {
    id: 'presensi-harian',
    category: 'GAME',
    categoryLabel: 'Presensi & Kehadiran',
    icon: PhCalendarCheck,
    iconColor: '#f472b6',
    title: 'Alur Presensi & Verifikasi Buddy',
    points: [
      'Presensi kehadiran wajib dilakukan 2 kali sehari: Sesi Datang (pagi) dan Sesi Pulang (sore) selama 3 hari rangkaian acara.',
      'Verifikasi kehadiran dilakukan langsung oleh Kakak Pendamping (Buddy) resmi kelompok masing-masing.',
      'Setelah presensi terverifikasi, isikan refleksi harian singkat pada formulir di halaman Presensi.',
    ],
    tip: 'Selalu berkumpul bersama kelompok Genius-mu tepat waktu sebelum batas sesi presensi berakhir.',
  },
  {
    id: 'tata-tertib',
    category: 'GAME',
    categoryLabel: 'Tata Tertib',
    icon: PhShieldCheck,
    iconColor: '#a78bfa',
    title: 'Tata Tertib & Etika di Gedung Kampus',
    points: [
      'Wajib mengenakan pakaian sopan, rapi, dan atribut resmi PKKMB UNU Yogyakarta 2026 sesuai ketentuan hari berjalan.',
      'Menjaga ketertiban dan ketenangan saat melintasi ruang perkuliahan aktif, laboratorium, ruang rapat, dan kantor pengelola.',
      'Membuang sampah pada tempat yang tersedia serta merawat fasilitas kampus dengan penuh tanggung jawab.',
    ],
    tip: 'Tunjukkan keramahan, rasa saling menghargai, dan nilai luhur Aswaja sepanjang kegiatan berlangsung.',
  },
  {
    id: 'kendala-kamera',
    category: 'FAQ',
    categoryLabel: 'Kendala Teknis',
    icon: PhWarningCircle,
    iconColor: '#fb923c',
    title: 'Kamera HP Gagal Memindai Barcode',
    points: [
      'Pastikan izin akses kamera (Camera Permission) telah diizinkan pada browser smartphone-mu (Chrome atau Safari).',
      'Jika kamera mengalami kendala buram atau pencahayaan minim, mintalah Kode Cadangan Manual kepada panitia penjaga spot.',
      'Ketikkan kode manual tersebut pada layar game untuk langsung membuka tantangan spot.',
    ],
    tip: 'Bersihkan lensa kamera dari debu/minyak dan hindari bayangan yang menutupi barcode saat memindai.',
  },
  {
    id: 'wifi-baterai',
    category: 'FAQ',
    categoryLabel: 'Fasilitas & Posko',
    icon: PhWifiHigh,
    iconColor: '#38bdf8',
    title: 'Koneksi Wi-Fi & Posko Baterai Darurat',
    points: [
      'Gedung kampus UNU menyediakan jaringan Wi-Fi publik "UNU-FREE-WIFI" di sepanjang koridor tanpa kata sandi.',
      'Aplikasi GENIUS dirancang offline-first sehingga data stempel dan progresmu tetap tersimpan aman di perangkat.',
      'Posko pengisian daya baterai (Charging Station) darurat tersedia di Lantai 1 (Welcome Hall) dan Lantai 5.',
    ],
    tip: 'Bila mengalami kendala kesehatan atau kondisi darurat, segera lapor ke Buddy atau Posko Medis di Lantai 1.',
  },
];

function getTabCount(tabId: CategoryId): number {
  if (tabId === 'ALL') return GUIDE_ITEMS.length;
  return GUIDE_ITEMS.filter((item) => item.category === tabId).length;
}

const filteredGuides = computed(() => {
  let list = GUIDE_ITEMS;
  if (activeCategoryTab.value !== 'ALL') {
    list = list.filter((item) => item.category === activeCategoryTab.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.points.some((p) => p.toLowerCase().includes(q)) ||
        (item.tip && item.tip.toLowerCase().includes(q))
    );
  }
  return list;
});
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
    <!-- TOP HEADER: Sesuai Format Halaman Presensi & Ormawa Expo           -->
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
        <PhBookOpen :size="14" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
          PANDUAN
        </span>
      </div>

      <!-- Right: Sound Toggle -->
      <div class="flex items-center gap-1.5 shrink-0">
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
    <!-- MAIN CONTENT: Menampilkan Panduan Aja (Fokus, Bersih, Rapi)       -->
    <!-- ================================================================= -->
    <main class="relative z-20 w-full max-w-xl mx-auto space-y-2.5 my-auto">
      <!-- 1. HERO / RINGKASAN PANDUAN -->
      <section class="bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-xl p-3 shadow-lg space-y-2 text-left">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg bg-[#ca8a04]/20 border border-[#facc15] flex items-center justify-center text-[#facc15] shrink-0 shadow">
            <PhBookOpen :size="18" weight="fill" />
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="text-xs sm:text-sm font-bold text-[#86efac] leading-tight">
              Panduan Orientasi & Aturan Main
            </h1>
            <p class="text-[9px] sm:text-[10px] text-[#c4956a] font-sans leading-tight mt-0.5">
              Pedoman resmi penjelajahan 9 lantai, stempel, dan kegiatan PKKMB UNU 2026.
            </p>
          </div>
        </div>

        <!-- Mini Highlights Strip -->
        <div class="grid grid-cols-3 gap-1 pt-1 border-t border-[#4a2e14]/70 text-center font-mono">
          <div class="bg-[#120a05] p-1.5 rounded-lg border border-[#3d2714]">
            <span class="text-[7.5px] text-[#a08060] block">Jelajah</span>
            <span class="text-[9.5px] font-bold text-[#facc15]">9 Lantai</span>
          </div>
          <div class="bg-[#120a05] p-1.5 rounded-lg border border-[#3d2714]">
            <span class="text-[7.5px] text-[#a08060] block">Target Misi</span>
            <span class="text-[9.5px] font-bold text-[#86efac]">18 Stempel</span>
          </div>
          <div class="bg-[#120a05] p-1.5 rounded-lg border border-[#3d2714]">
            <span class="text-[7.5px] text-[#a08060] block">Kelulusan</span>
            <span class="text-[9.5px] font-bold text-[#38bdf8]">Min. 70%</span>
          </div>
        </div>
      </section>

      <!-- 2. SEARCH & SEGMENTED TABS -->
      <section class="space-y-1.5">
        <!-- Search Bar -->
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari topik panduan (kamera, stempel, ormawa, wifi)..."
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
        <div class="grid grid-cols-5 gap-1 bg-[#140c06]/90 p-1 rounded-xl border border-[#5a3a18]">
          <button
            v-for="tab in CATEGORY_TABS"
            :key="tab.id"
            type="button"
            @click="() => {
              safeSound(() => soundEngine.playClick?.());
              activeCategoryTab = tab.id;
            }"
            :class="[
              'py-1.5 px-0.5 rounded-lg transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95',
              activeCategoryTab === tab.id
                ? 'bg-[#38761d] text-white border border-[#f0d060] font-bold shadow'
                : 'text-[#c4956a] hover:text-[#f0d060]'
            ]"
          >
            <span class="text-[8px] sm:text-[9px] font-pixel leading-tight">{{ tab.label }}</span>
            <span class="text-[6.5px] sm:text-[7px] opacity-75 font-sans mt-0.5">{{ getTabCount(tab.id) }} Info</span>
          </button>
        </div>
      </section>

      <!-- 3. LIST KARTU PANDUAN -->
      <section v-if="filteredGuides.length > 0" class="space-y-2">
        <div
          v-for="item in filteredGuides"
          :key="item.id"
          class="bg-[#18100a]/90 backdrop-blur-md border border-[#4a301a] rounded-xl p-3 shadow-sm text-left space-y-2 transition-all hover:border-[#8b6f4e]"
        >
          <!-- Header Item -->
          <div class="flex items-start gap-2.5">
            <div
              class="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 shadow"
              :style="{
                backgroundColor: `${item.iconColor}15`,
                borderColor: item.iconColor,
                color: item.iconColor,
              }"
            >
              <component :is="item.icon" :size="16" weight="bold" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1.5 flex-wrap">
                <h2 class="text-[11px] sm:text-xs font-bold text-white leading-tight">
                  {{ item.title }}
                </h2>
                <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-[#120a05] border border-[#5a3a18] text-[#c4956a]">
                  {{ item.categoryLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- Points list -->
          <ul class="space-y-1.5 text-[10px] sm:text-[10.5px] text-[#e6d5bc] font-sans pl-1">
            <li
              v-for="(pt, idx) in item.points"
              :key="idx"
              class="flex items-start gap-2 leading-relaxed"
            >
              <span class="text-[#facc15] font-bold select-none mt-0.5">•</span>
              <span class="flex-1">{{ pt }}</span>
            </li>
          </ul>

          <!-- Tip Box (if available) -->
          <div
            v-if="item.tip"
            class="p-2 rounded-lg bg-[#120a05] border border-[#5a3a18]/60 flex items-start gap-2 text-[9px] sm:text-[9.5px] text-[#c4956a] font-sans"
          >
            <PhLightbulbFilament :size="14" weight="fill" class="text-[#facc15] shrink-0 mt-0.5" />
            <span class="leading-tight"><strong class="text-[#fef08a] font-pixel">TIPS:</strong> {{ item.tip }}</span>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div
        v-else
        class="p-8 text-center bg-[#18100a]/90 border border-dashed border-[#5a3a18] rounded-xl space-y-2 font-mono"
      >
        <PhBookOpen :size="32" class="text-amber-400 mx-auto opacity-40" />
        <p class="text-xs text-amber-200">Tidak ada topik panduan yang cocok.</p>
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
          to="/play"
          @click="() => safeSound(() => soundEngine.playClick?.())"
          class="hover:text-[#facc15] flex items-center gap-1 transition-colors"
        >
          <span>MENU UTAMA</span>
        </RouterLink>
        <span>•</span>
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
          to="/paspor"
          @click="() => safeSound(() => soundEngine.playClick?.())"
          class="hover:text-[#86efac] flex items-center gap-1 transition-colors"
        >
          <PhIdentificationBadge :size="12" />
          <span>PASPOR</span>
        </RouterLink>
      </div>
    </footer>
  </div>
</template>
