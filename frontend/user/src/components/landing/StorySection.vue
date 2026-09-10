<script setup lang="ts">
import {
  PhScroll,
  PhScales,
  PhCompass,
  PhHandshake,
  PhShieldCheck,
  PhSparkle,
  PhQuotes,
} from '@phosphor-icons/vue';

const pillars = [
  {
    title: 'Tawasuth',
    subtitle: 'Sikap Moderat & Berimbang',
    desc: 'Menghargai keberagaman pandangan, menghindari ekstremisme, dan mengedepankan dialog rasional serta santun.',
    icon: PhCompass,
    color: '#60a5fa',
    badge: 'Pilar I',
  },
  {
    title: 'Tawazun',
    subtitle: 'Keseimbangan Hidup & Ilmu',
    desc: 'Harmoni antara ketajaman intelektual sains modern dengan kedalaman spiritual akhlak mulia.',
    icon: PhScales,
    color: '#34d399',
    badge: 'Pilar II',
  },
  {
    title: 'Tasamuh',
    subtitle: 'Toleransi & Keterbukaan',
    desc: 'Rukun dan inklusif terhadap sesama, menciptakan ekosistem kampus yang ramah bagi siapapun.',
    icon: PhHandshake,
    color: '#facc15',
    badge: 'Pilar III',
  },
  {
    title: "I'tidal",
    subtitle: 'Keadilan & Keteguhan',
    desc: 'Menjunjung tinggi kebenaran moral, integritas akademik, dan keberpihakan pada nilai-nilai keadilan.',
    icon: PhShieldCheck,
    color: '#f87171',
    badge: 'Pilar IV',
  },
];
</script>

<template>
  <section id="story-section" class="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#24150a] border-t-4 border-[#5a3a18] text-[#f0e0c0] overflow-hidden">
    <!-- Background Ambient Grid Glow -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(126,200,80,0.12)_0%,_transparent_65%)] pointer-events-none" />
    <div class="absolute -left-20 top-1/2 w-64 h-64 bg-[#f0d060]/5 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -right-20 bottom-10 w-64 h-64 bg-[#7ec850]/5 rounded-full blur-3xl pointer-events-none" />

    <div class="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1007] border border-[#f0d060]/50 shadow-md mb-3">
          <PhScroll :size="16" weight="fill" class="text-[#f0d060]" />
          <span class="font-pixel text-[9px] sm:text-[10px] text-[#f0d060] uppercase tracking-wider">
            KISAH PETUALANGAN GENIUS
          </span>
        </div>
        
        <h2 class="font-pixel text-2xl sm:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Bukan Ospek Biasa, Ini Adalah <span class="text-[#f0d060] underline decoration-[#7ec850] decoration-4 underline-offset-4">Ekspedisi Transformasi</span>
        </h2>
        
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Selamat datang di Kampus Terpadu 9 Lantai UNU Yogyakarta! Di sini, perjalanan orientasimu dirancang sebagai petualangan interaktif RPG. Kumpulkan pengetahuan, selesaikan misteri tiap lantai, dan upgrade dirimu menjadi generasi unggul siap masa depan.
        </p>
      </div>

      <!-- 4 Pillars Cards Grid (Stardew Wood RPG Style) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full mb-12">
        <div
          v-for="(pillar, idx) in pillars"
          :key="idx"
          class="sdv-card p-5 sm:p-6 flex flex-col justify-between hover:-translate-y-1 hover:border-[#f0d060] transition-all duration-200 group"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="font-pixel text-[9px] px-2 py-0.5 rounded bg-[#1f1309] border border-[#8b6f4e] text-[#a08060]">
                {{ pillar.badge }}
              </span>
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110"
                :style="{ backgroundColor: `${pillar.color}20`, borderColor: pillar.color }"
              >
                <component :is="pillar.icon" :size="22" weight="duotone" :style="{ color: pillar.color }" />
              </div>
            </div>

            <h3 class="font-pixel text-base sm:text-lg font-bold text-[#fbf6e9] mb-1 group-hover:text-[#f0d060] transition-colors">
              {{ pillar.title }}
            </h3>
            <p class="font-sans text-xs font-semibold text-[#a89078] mb-3">
              {{ pillar.subtitle }}
            </p>
            <p class="font-sans text-xs text-[#c4b5a2] leading-relaxed">
              {{ pillar.desc }}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-[#5a3a18]/60 flex items-center gap-1.5 text-[#7ec850] text-[11px] font-medium">
            <PhSparkle :size="14" weight="fill" />
            <span>Karakter Mahasiswa UNU</span>
          </div>
        </div>
      </div>

      <!-- Inspiring Quote Banner (Parchment Style) -->
      <div class="w-full bg-[#342214] border-2 border-[#8b6f4e] rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div class="absolute -right-6 -bottom-6 text-[#f0d060]/10 pointer-events-none">
          <PhQuotes :size="120" weight="fill" />
        </div>

        <div class="w-14 h-14 rounded-full bg-[#f0d060]/20 border-2 border-[#f0d060] flex items-center justify-center shrink-0 shadow-md">
          <PhSparkle :size="28" weight="fill" class="text-[#f0d060]" />
        </div>

        <div class="flex-1 text-center md:text-left">
          <blockquote class="font-serif italic text-base sm:text-lg text-[#fbf6e9] leading-relaxed mb-2">
            "Jadilah petualang sejati yang berakar kokoh pada tradisi keilmuan Islam Ahlussunnah wal Jama'ah, berintegritas moral tinggi, dan terbang tinggi menaklukkan tantangan sains teknologi global."
          </blockquote>
          <div class="font-pixel text-[10px] text-[#f0d060] tracking-wider uppercase">
            — Semangat PKKMB UNU Yogyakarta 2026
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
