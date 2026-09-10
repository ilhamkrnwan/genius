<script setup lang="ts">
import { RouterLink } from 'vue-router';
import {
  PhCaretUp,
  PhHeart,
  PhBuildings,
  PhShieldCheck,
  PhGlobe,
  PhMapPin,
} from '@phosphor-icons/vue';

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const navigationLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Dashboard Petualang', to: '/dashboard' },
  { label: 'Peta Interaktif', to: '/peta' },
  { label: 'Ormawa Expo', to: '/ormawa' },
  { label: 'Paspor Stempel', to: '/paspor' },
  { label: 'Papan Peringkat', to: '/leaderboard' },
  { label: 'Presensi Harian', to: '/presensi' },
  { label: 'Pusat Bantuan', to: '/bantuan' },
];
</script>

<template>
  <footer class="relative bg-[#170f08] border-t-4 border-[#5a3a18] text-[#c4b5a2] pt-14 pb-10 px-4 sm:px-6">
    <div class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#3a2818]">
        <!-- Brand & Campus Info -->
        <div class="md:col-span-6 space-y-4">
          <div class="flex items-center gap-3">
            <img
              src="/unu.png"
              alt="Logo UNU Yogyakarta"
              class="h-10 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
            <div>
              <div class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060]">
                UNU YOGYAKARTA
              </div>
              <div class="font-sans text-xs text-[#a0d870] font-medium">
                GENIUS — Upgrade New You 2026
              </div>
            </div>
          </div>

          <p class="font-sans text-xs text-[#a89078] leading-relaxed max-w-md">
            Platform eksplorasi gamifikasi resmi Pengenalan Kehidupan Kampus bagi Mahasiswa Baru (PKKMB) Universitas Nahdlatul Ulama Yogyakarta Tahun 2026.
          </p>

          <div class="flex items-center gap-2 text-xs text-[#8b6f4e]">
            <PhMapPin :size="16" weight="bold" class="text-[#f0d060] shrink-0" />
            <span>Jl. Ringroad Barat, Dowakan, Banyuraden, Gamping, Sleman, D.I. Yogyakarta 55293</span>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="md:col-span-4 space-y-3">
          <div class="font-pixel text-xs text-[#fbf6e9] font-bold uppercase tracking-wider">
            Navigasi Cepat
          </div>
          <ul class="grid grid-cols-2 gap-2 text-xs font-sans">
            <li v-for="link in navigationLinks" :key="link.to">
              <RouterLink
                :to="link.to"
                class="text-[#a89078] hover:text-[#f0d060] hover:underline transition-colors"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Scroll to Top Action -->
        <div class="md:col-span-2 flex flex-col items-start md:items-end justify-between">
          <button
            type="button"
            @click="scrollToTop"
            class="w-10 h-10 rounded-xl bg-[#281c12] border-2 border-[#5a3a18] hover:border-[#f0d060] text-[#f0d060] flex items-center justify-center shadow-md hover:-translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
            title="Kembali ke atas"
          >
            <PhCaretUp :size="20" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Copyright Bar -->
      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7a5a3a] font-sans">
        <div>
          © 2026 Universitas Nahdlatul Ulama Yogyakarta. Seluruh hak cipta dilindungi.
        </div>
        <div class="flex items-center gap-1">
          <span>Dirancang untuk Petualangan Mahasiswa Baru 2026</span>
          <PhHeart :size="13" weight="fill" class="text-[#ef4444]" />
        </div>
      </div>
    </div>
  </footer>
</template>
