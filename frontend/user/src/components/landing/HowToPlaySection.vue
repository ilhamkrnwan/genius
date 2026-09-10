<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhGameController,
  PhMapPin,
  PhQrCode,
  PhMedal,
  PhFootprints,
  PhArrowRight,
  PhLightbulbFilament,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { gsap } from '@/lib/gsap';

const gameStore = useGameStore();

const htpRootRef = ref<HTMLElement | null>(null);
let htpCtx: gsap.Context | null = null;

const steps = [
  {
    num: '01',
    title: 'Kunjungi Titik Misi',
    subtitle: 'Jelajahi Lantai 1 s/d 9',
    desc: 'Telusuri gedung megah UNU Yogyakarta bersama kelompokmu. Temukan booth ormawa, perpustakaan, laboratorium AI, hingga rooftop.',
    tip: 'Gunakan fitur Peta Interaktif untuk memandu rute perjalananmu.',
    icon: PhFootprints,
    accent: '#38bdf8',
  },
  {
    num: '02',
    title: 'Pindai Barcode Fisik',
    subtitle: 'Scan QR di Lokasi Spot',
    desc: 'Setiap booth memiliki barcode unik. Arahkan kamera smartphone untuk memindai dan memicu tantangan interaktif.',
    tip: 'Pastikan izin akses kamera sudah kamu aktifkan di browser.',
    icon: PhQrCode,
    accent: '#facc15',
  },
  {
    num: '03',
    title: 'Taklukkan Tantangan',
    subtitle: 'Mini-Game Interaktif Seru',
    desc: 'Hadapi kuis balapan kilat, tebak gambar tokoh, dan teka-teki logika seputar sejarah, prodi, dan budaya UNU.',
    tip: 'Kumpulkan skor minimal 70% agar berhasil lolos tantangan.',
    icon: PhGameController,
    accent: '#7ec850',
  },
  {
    num: '04',
    title: 'Koleksi Stempel & XP',
    subtitle: 'Raih Puncak Leaderboard',
    desc: 'Dapatkan stempel emas digital di Paspor Petualangmu. Setiap keberhasilan menambah XP untuk Kelompok Genius-mu!',
    tip: 'Kelompok dengan XP tertinggi berhak atas Piagam & Hadiah Utama.',
    icon: PhMedal,
    accent: '#f472b6',
  },
];

onMounted(() => {
  htpCtx = gsap.context(() => {
    // Header reveal
    gsap.from('.htp-header', {
      scrollTrigger: {
        trigger: '.htp-header',
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
      y: 35,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
    });

    // 4 Steps Cards Stagger
    gsap.from('.htp-card', {
      scrollTrigger: {
        trigger: '.htp-grid',
        start: 'top 82%',
        toggleActions: 'play none none none',
        once: true,
      },
      y: 45,
      opacity: 0,
      scale: 0.95,
      duration: 0.65,
      stagger: 0.12,
      ease: 'power2.out',
    });

    // CTA buttons
    gsap.from('.htp-cta', {
      scrollTrigger: {
        trigger: '.htp-cta',
        start: 'top 88%',
        toggleActions: 'play none none none',
        once: true,
      },
      y: 25,
      opacity: 0,
      duration: 0.6,
      ease: 'back.out(1.5)',
    });
  }, htpRootRef.value || undefined);
});

onUnmounted(() => {
  htpCtx?.revert();
});
</script>

<template>
  <section
    id="how-to-play"
    ref="htpRootRef"
    class="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#2d1b0e] text-[#f0e0c0]"
  >
    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section Header with GSAP Reveal -->
      <div class="htp-header text-center max-w-2xl mx-auto mb-12 sm:mb-16 will-change-transform">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e130a] border border-[#7ec850]/50 shadow-md mb-3">
          <PhGameController :size="16" weight="fill" class="text-[#7ec850]" />
          <span class="font-pixel text-[9px] sm:text-[10px] text-[#7ec850] uppercase tracking-wider">
            ATURAN MAIN & PANDUAN
          </span>
        </div>
        
        <h2 class="font-pixel text-2xl sm:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          4 Langkah Menjadi <span class="text-[#f0d060]">Petualang Genius Sejati</span>
        </h2>
        
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Ikuti alur petualangan mudah ini untuk mengumpulkan seluruh stempel emas dan membawa kelompokmu menjadi nomor satu di PKKMB 2026.
        </p>
      </div>

      <!-- 4 Steps Cards Grid with GSAP Stagger -->
      <div class="htp-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div
          v-for="step in steps"
          :key="step.num"
          class="htp-card sdv-card-elevated p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#f0d060] transition-all duration-200 will-change-transform"
        >
          <!-- Background Step Number Watermark -->
          <div class="absolute -right-2 -bottom-4 font-pixel text-7xl font-black text-white/5 select-none pointer-events-none group-hover:text-[#f0d060]/10 transition-colors">
            {{ step.num }}
          </div>

          <div>
            <div class="flex items-center justify-between mb-4">
              <span
                class="font-pixel text-xs px-2.5 py-1 rounded-md border font-bold"
                :style="{ backgroundColor: `${step.accent}15`, borderColor: step.accent, color: step.accent }"
              >
                LANGKAH {{ step.num }}
              </span>
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110"
                :style="{ backgroundColor: `${step.accent}20`, borderColor: step.accent }"
              >
                <component :is="step.icon" :size="24" weight="duotone" :style="{ color: step.accent }" />
              </div>
            </div>

            <h3 class="font-pixel text-lg font-bold text-[#fbf6e9] mb-1 group-hover:text-[#f0d060] transition-colors">
              {{ step.title }}
            </h3>
            <p class="font-sans text-xs font-semibold text-[#a89078] mb-3">
              {{ step.subtitle }}
            </p>
            <p class="font-sans text-sm text-[#d6c3ae] leading-relaxed mb-4">
              {{ step.desc }}
            </p>
          </div>

          <!-- Helpful Tip Box -->
          <div class="p-2.5 rounded-lg bg-[#19110a] border border-[#5a3a18] flex items-start gap-2 text-xs text-[#a08060]">
            <PhLightbulbFilament :size="16" weight="fill" class="text-[#facc15] shrink-0 mt-0.5" />
            <span class="text-[#c4b5a2] text-[11px] leading-snug">{{ step.tip }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Action CTA with GSAP Reveal -->
      <div class="htp-cta flex flex-col sm:flex-row items-center justify-center gap-4 will-change-transform">
        <RouterLink to="/peta">
          <button
            type="button"
            @click="() => gameStore.soundEnabled && soundEngine.playClick()"
            class="rpg-btn-primary px-6 py-3 font-pixel text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <PhMapPin :size="18" weight="bold" />
            <span>BUKA PETA PENJELAJAHAN</span>
          </button>
        </RouterLink>

        <RouterLink to="/bantuan">
          <button
            type="button"
            @click="() => gameStore.soundEnabled && soundEngine.playClick()"
            class="px-5 py-3 rounded-lg border-2 border-[#8b6f4e] hover:border-[#f0d060] bg-[#1f140c] text-[#f0d060] font-pixel text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>BACA FAQ & BANTUAN</span>
            <PhArrowRight :size="16" weight="bold" />
          </button>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
