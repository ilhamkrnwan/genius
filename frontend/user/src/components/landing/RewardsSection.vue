<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhCrown,
  PhMedal,
  PhTrophy,
  PhStar,
  PhArrowRight,
  PhUsersThree,
  PhCertificate,
  PhSparkle,
  PhQuotes,
  PhGraduationCap,
  PhScroll,
  PhTarget,
  PhLightning,
  PhCaretDown,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const gameStore = useGameStore();

const rewardsRootRef = ref<HTMLElement | null>(null);
const leftPodiumRef = ref<HTMLElement | null>(null);
const stepRefs = ref<HTMLElement[]>([]);

const setStepRef = (el: any, index: number) => {
  if (el) {
    stepRefs.value[index] = el;
  }
};

const activeStep = ref(0);
let scrollTriggers: ScrollTrigger[] = [];

// Data Juara 3, 2, 1 lengkap dengan biografi, catatan juri, statistik, dan hadiah
const championsData = {
  juara3: {
    stepIndex: 1,
    rank: 3,
    badgeTitle: 'JUARA III • MEDALI PERUNGGU',
    name: 'Muhammad Fatih Ar-Rasyid',
    group: 'Genius 03 — Al-Biruni',
    prodi: 'S1 Informatika • Fakultas Teknologi Informasi',
    characterImg: '/champion-juara-3.webp',
    xp: 15480,
    accuracy: '94.2%',
    completedBooths: '18 / 18 Booth',
    duration: '42m 15s',
    themeColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    quote: 'Kompak sampai akhir! Di UNU, kami belajar bahwa kolaborasi tim mampu mengubah teka-teki paling rumit menjadi pencapaian manis.',
    biography:
      'Dikenal dengan keuletan analisis dan ketenangan saat memecahkan teka-teki logika kriptografi di Lab Komputasi lantai 5. Fatih memimpin pembagian peran kelompok Al-Biruni secara sangat disiplin dan terstruktur.',
    evaluationNote:
      'Mampu menyelesaikan simulasi algoritma berkecepatan tinggi tanpa pernah terkena penalti waktu. Kerja sama tim yang solid menjadikannya teladan bagi petualang sains terapan.',
    prizes: [
      { title: 'Medali Perunggu Kehormatan PKKMB 2026', icon: PhMedal },
      { title: 'Piagam Apresiasi Rektorat Mahasiswa Berprestasi', icon: PhScroll },
      { title: 'Paket Eksklusif Starter Kit Inovator UNU', icon: PhCertificate },
    ],
  },
  juara2: {
    stepIndex: 2,
    rank: 2,
    badgeTitle: 'JUARA II • MEDALI PERAK',
    name: 'Aisyah Nur Salsabila',
    group: 'Genius 02 — Ibnu Sina',
    prodi: 'S1 Farmasi • Fakultas Ilmu Kesehatan',
    characterImg: '/champion-juara-2.webp',
    xp: 15920,
    accuracy: '97.5%',
    completedBooths: '18 / 18 Booth',
    duration: '38m 40s',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    quote: 'Belajar bukan sekadar mengejar deretan angka, melainkan mengasah empati untuk menebar kemanfaatan bagi almamater dan masyarakat.',
    biography:
      'Menunjukkan kepemimpinan empatik dan pemahaman materi yang memukau pada pos Simulasi Medis lantai 6 dan Konservasi Hijau lantai 7. Aisyah berhasil menggerakkan timnya dengan komunikasi terbuka.',
    evaluationNote:
      'Meraih skor sempurna pada 15 pos tantangan berturut-turut. Ketelitian dalam studi kasus etika profesi kesehatan menjadi poin krusial yang mengantarkannya ke podium kehormatan.',
    prizes: [
      { title: 'Medali Perak Kehormatan PKKMB 2026', icon: PhMedal },
      { title: 'Beasiswa Apresiasi Mahasiswa Teladan Semester 1', icon: PhGraduationCap },
      { title: 'Smart Tablet & Digital Stylus Penunjang Riset', icon: PhCertificate },
    ],
  },
  juara1: {
    stepIndex: 3,
    rank: 1,
    badgeTitle: 'JUARA I • GRAND CHAMPION REKTORAT',
    name: 'Ahmad Zaky Pratama',
    group: 'Genius 01 — Ahmad Dahlan',
    prodi: 'S1 Dirasah Islamiyah & Sains Interdisipliner',
    characterImg: '/champion-juara-1.webp',
    xp: 16500,
    accuracy: '99.4% (Rekor Tertinggi)',
    completedBooths: '18 / 18 Booth',
    duration: '35m 10s',
    themeColor: '#f0d060',
    glowColor: 'rgba(240, 208, 96, 0.5)',
    quote: 'Alhamdulillah! Kemenangan ini adalah buah ikhtiar bersama seluruh tim, doa para kiai dan dosen, serta semangat membara untuk terus Upgrade New You!',
    biography:
      'Mencatatkan performa gemilang tertinggi sepanjang sejarah orientasi interaktif PKKMB UNU Yogyakarta. Ahmad Zaky membuktikan perpaduan ideal antara wawasan keislaman Aswaja yang kokoh dan ketangkasan sains modern.',
    evaluationNote:
      'Menaklukkan tantangan mini-game integrasi di Monumen Rektorat lantai 9 dengan akurasi nyaris tanpa cela serta waktu tercepat. Pantas menyandang predikat Juara Umum PKKMB 2026.',
    prizes: [
      { title: 'Piala Bergilir Rektorat UNU Yogyakarta (Piala Emas Murni)', icon: PhTrophy },
      { title: 'Plakat Kehormatan Emas & Medali Emas Murni PKKMB 2026', icon: PhCrown },
      { title: 'Beasiswa Penuh Prestasi Akademik Selama 1 Tahun', icon: PhGraduationCap },
      { title: 'Gelar & Golden Badge "Master Explorer 2026" di Profil Akun', icon: PhStar },
    ],
  },
};

const navigationSteps = [
  { id: 0, label: 'Pengantar', icon: PhScroll },
  { id: 1, label: '#3 Fatih', icon: PhMedal, color: '#d97706' },
  { id: 2, label: '#2 Aisyah', icon: PhMedal, color: '#38bdf8' },
  { id: 3, label: '#1 Zaky', icon: PhCrown, color: '#f0d060' },
];

function scrollToStep(idx: number) {
  if (gameStore.soundEnabled) soundEngine.playClick();
  activeStep.value = idx;
  const target = stepRefs.value[idx];
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

onMounted(async () => {
  await nextTick();
  if (!rewardsRootRef.value) return;

  // Pasang GSAP ScrollTrigger pada setiap step naratif di sisi kanan
  stepRefs.value.forEach((stepEl, idx) => {
    if (!stepEl) return;

    // Trigger pergantian activeStep saat scroll ke bawah & ke atas
    const st = ScrollTrigger.create({
      trigger: stepEl,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => {
        activeStep.value = idx;
      },
      onEnterBack: () => {
        activeStep.value = idx;
      },
    });
    scrollTriggers.push(st);

    // Animasi entrance & reverse elemen saat di-scroll
    gsap.fromTo(
      stepEl,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: stepEl,
          start: 'top 85%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  });
});

onUnmounted(() => {
  scrollTriggers.forEach((st) => st.kill());
  scrollTriggers = [];
});
</script>

<template>
  <section
    id="rewards-section"
    ref="rewardsRootRef"
    class="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#24160a] text-[#f0e0c0] overflow-hidden"
  >
    <!-- Subtle Ambient Glow -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute top-1/3 left-1/12 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-25 transition-all duration-700"
        :style="{
          backgroundColor:
            activeStep === 3
              ? '#f0d060'
              : activeStep === 2
              ? '#38bdf8'
              : activeStep === 1
              ? '#d97706'
              : '#7ec850',
        }"
      ></div>
      <div class="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[100px] bg-[#f0d060]/10"></div>
    </div>

    <div class="relative z-10 max-w-6xl mx-auto">
      <!-- Section Title Header (Open Typography, No Card) -->
      <div class="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div class="inline-flex items-center gap-2 text-xs font-pixel text-[#f0d060] uppercase tracking-widest mb-3">
          <PhSparkle :size="16" weight="fill" />
          <span>Apresiasi Tertinggi Rektorat</span>
          <PhSparkle :size="16" weight="fill" />
        </div>
        <h2 class="font-pixel text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Panggung Kehormatan <span class="text-[#f0d060]">Mahasiswa Terbaik</span>
        </h2>
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Dedikasi, ketajaman intelektual, dan kekompakan tim dari 9 lantai gedung terpadu UNU Yogyakarta mengantarkan mereka ke puncak kejayaan.
        </p>
      </div>

      <!-- Scrollytelling Two-Column Layout (Completely Open, No Card Boxes) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <!-- ================================================================= -->
        <!-- LEFT COLUMN: STICKY MIMBAR PODIUM (OPEN PRESENTATION)             -->
        <!-- ================================================================= -->
        <div class="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24 z-20">
          <div ref="leftPodiumRef" class="flex flex-col items-center select-none">
            <!-- Header Status Mimbar (No Card Border) -->
            <div class="w-full flex items-center justify-between pb-3 mb-2 border-b border-[#5a3a18]/60">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-300"
                  :style="{
                    backgroundColor:
                      activeStep === 3
                        ? '#f0d06025'
                        : activeStep === 2
                        ? '#38bdf825'
                        : activeStep === 1
                        ? '#d9770625'
                        : '#7ec85025',
                  }"
                >
                  <PhTrophy
                    v-if="activeStep === 3"
                    :size="18"
                    weight="fill"
                    class="text-[#f0d060]"
                  />
                  <PhMedal
                    v-else-if="activeStep === 2"
                    :size="18"
                    weight="fill"
                    class="text-[#38bdf8]"
                  />
                  <PhMedal
                    v-else-if="activeStep === 1"
                    :size="18"
                    weight="fill"
                    class="text-[#d97706]"
                  />
                  <PhCrown v-else :size="18" weight="fill" class="text-[#f0d060]" />
                </div>

                <div>
                  <div class="font-pixel text-[11px] sm:text-xs text-[#fbf6e9] tracking-wider uppercase">
                    <span v-if="activeStep === 0">Mimbar Tiga Juara</span>
                    <span v-else-if="activeStep === 1" class="text-[#d97706]">Fokus: Juara 3 Fatih</span>
                    <span v-else-if="activeStep === 2" class="text-[#38bdf8]">Fokus: Juara 2 Aisyah</span>
                    <span v-else-if="activeStep === 3" class="text-[#f0d060]">Fokus: Juara 1 Zaky</span>
                  </div>
                  <div class="text-[10px] text-[#a08060] font-sans">
                    PKKMB UNU Yogyakarta 2026
                  </div>
                </div>
              </div>

              <!-- Step Tag -->
              <span
                class="font-pixel text-[9px] px-2.5 py-1 rounded transition-colors duration-300"
                :class="[
                  activeStep === 3
                    ? 'bg-[#f0d060]/20 text-[#f0d060]'
                    : activeStep === 2
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                    : activeStep === 1
                    ? 'bg-[#d97706]/20 text-[#d97706]'
                    : 'bg-[#5a3a18]/40 text-[#c4956a]',
                ]"
              >
                {{ activeStep === 0 ? 'PENGANTAR' : `JUARA #${4 - activeStep}` }}
              </span>
            </div>

            <!-- Mimbar Podium Image with Transparent Background & Spotlights (No Box Wrapper) -->
            <div class="relative w-full aspect-[1376/1000] flex items-center justify-center my-2">
              <!-- Radial Backlight for the active character -->
              <div
                class="absolute inset-0 pointer-events-none transition-all duration-500 rounded-full blur-2xl"
                :style="{
                  backgroundColor:
                    activeStep === 3
                      ? 'rgba(240, 208, 96, 0.18)'
                      : activeStep === 2
                      ? 'rgba(56, 189, 248, 0.15)'
                      : activeStep === 1
                      ? 'rgba(217, 119, 6, 0.15)'
                      : 'transparent',
                }"
              ></div>

              <!-- Main Podium Graphic (Free Standing) -->
              <img
                src="/podium-juara-lengkap.webp"
                alt="Mimbar Podium Tiga Juara Mahasiswa Berprestasi UNU 2026"
                class="w-full h-full object-contain filter drop-shadow-[0_16px_30px_rgba(0,0,0,0.95)] transition-transform duration-500"
                :class="[
                  activeStep === 3
                    ? 'scale-[1.03]'
                    : activeStep > 0
                    ? 'scale-[1.01]'
                    : 'scale-100',
                ]"
              />

              <!-- SPOTLIGHT OVERLAY: JUARA 2 (AISYAH - KIRI) -->
              <div
                class="absolute top-[32%] left-[28%] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
                :class="[
                  activeStep === 2
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75',
                ]"
              >
                <div class="w-16 h-24 rounded-full border-2 border-[#38bdf8] shadow-[0_0_25px_#38bdf8] animate-pulse"></div>
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#10202e]/90 text-[#38bdf8] font-pixel text-[8px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-[#38bdf8]/60">
                  #2 AISYAH
                </div>
              </div>

              <!-- SPOTLIGHT OVERLAY: JUARA 1 (AHMAD ZAKY - TENGAH ATAS) -->
              <div
                class="absolute top-[16%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
                :class="[
                  activeStep === 3
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75',
                ]"
              >
                <div class="w-20 h-28 rounded-full border-2 border-[#f0d060] shadow-[0_0_35px_#f0d060] animate-pulse"></div>
                <div class="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#281c0c]/95 text-[#f0d060] font-pixel text-[8px] px-2.5 py-0.5 rounded shadow whitespace-nowrap border border-[#f0d060]/70">
                  <PhCrown :size="11" weight="fill" />
                  <span>#1 ZAKY</span>
                </div>
              </div>

              <!-- SPOTLIGHT OVERLAY: JUARA 3 (FATIH - KANAN) -->
              <div
                class="absolute top-[36%] left-[72%] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
                :class="[
                  activeStep === 1
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75',
                ]"
              >
                <div class="w-16 h-24 rounded-full border-2 border-[#d97706] shadow-[0_0_25px_#d97706] animate-pulse"></div>
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#26170a]/90 text-[#d97706] font-pixel text-[8px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-[#d97706]/60">
                  #3 FATIH
                </div>
              </div>
            </div>

            <!-- Floor Shadow under Podium -->
            <div class="w-3/4 h-3 bg-black/50 blur-md rounded-full -mt-2 mb-3"></div>

            <!-- Editorial Quote / Remark (Open Accent Bar, No Card) -->
            <div
              class="w-full pl-4 py-1 border-l-2 transition-all duration-300 min-h-[64px] flex items-center"
              :class="[
                activeStep === 3
                  ? 'border-[#f0d060]'
                  : activeStep === 2
                  ? 'border-[#38bdf8]'
                  : activeStep === 1
                  ? 'border-[#d97706]'
                  : 'border-[#5a3a18]',
              ]"
            >
              <div class="flex items-start gap-2">
                <PhQuotes :size="16" weight="fill" class="shrink-0 text-[#f0d060] mt-0.5" />
                <p class="font-sans italic text-xs sm:text-sm text-[#e6d5c3] leading-relaxed">
                  <span v-if="activeStep === 0">
                    "Tiga petualang terbaik yang membuktikan ketekunan, integritas, dan kekompakan sepanjang rute 9 lantai."
                  </span>
                  <span v-else-if="activeStep === 1">
                    "{{ championsData.juara3.quote }}"
                  </span>
                  <span v-else-if="activeStep === 2">
                    "{{ championsData.juara2.quote }}"
                  </span>
                  <span v-else-if="activeStep === 3">
                    "{{ championsData.juara1.quote }}"
                  </span>
                </p>
              </div>
            </div>

            <!-- Quick Jump Navigation Pills (Clean Minimal Buttons) -->
            <div class="w-full mt-4 pt-3 border-t border-[#5a3a18]/40">
              <div class="text-[10px] font-pixel text-[#a08060] mb-2 flex items-center justify-between">
                <span>Lompat ke Babak:</span>
                <span class="text-[#f0d060]">{{ activeStep + 1 }}/4</span>
              </div>
              <div class="grid grid-cols-4 gap-1.5">
                <button
                  v-for="nav in navigationSteps"
                  :key="nav.id"
                  type="button"
                  @click="scrollToStep(nav.id)"
                  class="font-pixel text-[9px] py-1.5 px-1 rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  :class="[
                    activeStep === nav.id
                      ? 'bg-[#3d2b1e] text-[#fbf6e9] shadow -translate-y-0.5'
                      : 'bg-transparent text-[#8b6f4e] hover:text-[#d6c3ae] hover:bg-[#2d1b0e]',
                  ]"
                >
                  <component
                    :is="nav.icon"
                    :size="13"
                    weight="fill"
                    :style="{ color: activeStep === nav.id ? (nav.color || '#f0d060') : 'inherit' }"
                  />
                  <span class="truncate max-w-full">{{ nav.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- RIGHT COLUMN: OPEN SCROLLYTELLING CONTENT (NO CARD BOXES)         -->
        <!-- ================================================================= -->
        <div class="lg:col-span-7 xl:col-span-7 flex flex-col space-y-24 sm:space-y-32">
          <!-- ------------------------------------------------------------- -->
          <!-- STEP 0: PENGANTAR, JUDUL, & KRITERIA EVALUASI                 -->
          <!-- ------------------------------------------------------------- -->
          <div
            :ref="(el) => setStepRef(el, 0)"
            id="reward-step-0"
            class="min-h-[55vh] flex flex-col justify-center scroll-mt-28 py-6"
          >
            <div class="space-y-5">
              <div class="flex items-center gap-2 text-[#f0d060]">
                <PhSparkle :size="18" weight="fill" />
                <span class="font-pixel text-[10px] tracking-wider uppercase">
                  Tahap 1: Pembuka Panggung Kehormatan
                </span>
              </div>

              <h3 class="font-pixel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#fbf6e9] leading-snug drop-shadow">
                Kilau Prestasi di Puncak Gedung UNU Yogyakarta
              </h3>

              <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
                Orientasi mahasiswa baru PKKMB UNU 2026 bertajuk <strong class="text-[#f0d060]">Upgrade New You</strong> mengajak ribuan petualang menembus 9 lantai tematik dan menuntaskan 18 booth interaktif. Nilai tertinggi diraih lewat perpaduan kecepatan intelektual, moralitas luhur, dan ketajaman logika tim.
              </p>

              <!-- 4 Kriteria Penilaian Mahasiswa Terbaik (Open List, No Cards) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-md bg-[#7ec850]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <PhTarget :size="16" weight="bold" class="text-[#7ec850]" />
                  </div>
                  <div>
                    <div class="font-pixel text-[11px] text-[#fbf6e9]">Akurasi & Integritas</div>
                    <div class="text-xs text-[#a08060] font-sans mt-0.5 leading-normal">
                      Ketepatan kuis mini-game di tiap lantai tanpa penalti curang.
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-md bg-[#38bdf8]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <PhLightning :size="16" weight="bold" class="text-[#38bdf8]" />
                  </div>
                  <div>
                    <div class="font-pixel text-[11px] text-[#fbf6e9]">Efisiensi Waktu</div>
                    <div class="text-xs text-[#a08060] font-sans mt-0.5 leading-normal">
                      Kelincahan navigasi dan penyelesaian misi terpadu.
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-md bg-[#f0d060]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <PhUsersThree :size="16" weight="bold" class="text-[#f0d060]" />
                  </div>
                  <div>
                    <div class="font-pixel text-[11px] text-[#fbf6e9]">Solidaritas Tim</div>
                    <div class="text-xs text-[#a08060] font-sans mt-0.5 leading-normal">
                      Seluruh anggota berkontribusi aktif menyelesaikan stempel paspor.
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-md bg-[#a855f7]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <PhGraduationCap :size="16" weight="bold" class="text-[#a855f7]" />
                  </div>
                  <div>
                    <div class="font-pixel text-[11px] text-[#fbf6e9]">Wawasan Aswaja & Sains</div>
                    <div class="text-xs text-[#a08060] font-sans mt-0.5 leading-normal">
                      Karakter luhur berwawasan global yang mencerminkan UNU.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Scroll Cue Prompt -->
              <div
                @click="scrollToStep(1)"
                class="pt-6 border-t border-[#5a3a18]/40 flex items-center justify-between text-xs text-[#f0d060] hover:text-white cursor-pointer group transition-colors"
              >
                <div class="flex items-center gap-2">
                  <PhCaretDown :size="18" weight="bold" class="animate-bounce" />
                  <span class="font-pixel text-[10px]">
                    Scroll ke bawah untuk melihat Juara ke-3 ↓
                  </span>
                </div>
                <span class="font-sans text-xs text-[#a08060] group-hover:text-[#f0d060] transition-colors">
                  Mulai Tur Juara →
                </span>
              </div>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STEP 1: JUARA KE-3 (MUHAMMAD FATIH AR-RASYID)                 -->
          <!-- ------------------------------------------------------------- -->
          <div
            :ref="(el) => setStepRef(el, 1)"
            id="reward-step-1"
            class="min-h-[60vh] flex flex-col justify-center scroll-mt-28 py-6"
          >
            <div class="space-y-6">
              <!-- Top Header: Rank & Points -->
              <div class="flex items-start justify-between border-b border-[#d97706]/40 pb-4">
                <div>
                  <div class="flex items-center gap-2 text-[#d97706] font-pixel text-[10px] tracking-wider mb-1">
                    <PhMedal :size="16" weight="fill" />
                    <span>{{ championsData.juara3.badgeTitle }}</span>
                  </div>
                  <h3 class="font-pixel text-2xl sm:text-3xl text-[#fbf6e9] font-bold">
                    {{ championsData.juara3.name }}
                  </h3>
                  <div class="font-sans text-xs sm:text-sm text-[#d6c3ae] mt-1">
                    {{ championsData.juara3.group }} • <span class="text-[#fbf6e9]">{{ championsData.juara3.prodi }}</span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-pixel text-lg sm:text-2xl text-[#7ec850] font-bold">
                    {{ championsData.juara3.xp.toLocaleString() }} XP
                  </div>
                  <div class="text-[11px] text-[#a08060] font-sans">
                    Akurasi: {{ championsData.juara3.accuracy }}
                  </div>
                </div>
              </div>

              <!-- Main Content: Sprite & Details -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <!-- Character Sprite (Free Standing, No Box) -->
                <div class="sm:col-span-4 flex flex-col items-center">
                  <div class="relative group">
                    <div class="absolute inset-0 bg-[#d97706]/20 blur-xl rounded-full pointer-events-none"></div>
                    <img
                      :src="championsData.juara3.characterImg"
                      :alt="championsData.juara3.name"
                      class="relative z-10 w-32 h-44 sm:w-36 sm:h-52 object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div class="w-24 h-3 bg-black/50 blur-sm rounded-full -mt-2"></div>
                </div>

                <!-- Stats & Biografi Narrative -->
                <div class="sm:col-span-8 space-y-4">
                  <!-- Quick Stats Chips -->
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="px-3 py-1 rounded bg-[#180f08] border border-[#5a3a18]/60 text-[#fbf6e9] font-sans">
                      Pos Selesai: <strong class="text-[#f0d060]">{{ championsData.juara3.completedBooths }}</strong>
                    </span>
                    <span class="px-3 py-1 rounded bg-[#180f08] border border-[#5a3a18]/60 text-[#fbf6e9] font-sans">
                      Durasi Rute: <strong class="text-[#f0d060]">{{ championsData.juara3.duration }}</strong>
                    </span>
                  </div>

                  <!-- Biografi & Catatan Penilai (Open Accent Block) -->
                  <div class="pl-4 py-1 border-l-2 border-[#d97706] space-y-1">
                    <div class="font-pixel text-[10px] text-[#d97706] uppercase tracking-wider">
                      Catatan Penilai & Rekam Jejak:
                    </div>
                    <p class="text-xs sm:text-sm text-[#e6d5c3] font-sans leading-relaxed">
                      {{ championsData.juara3.biography }}
                    </p>
                    <p class="text-xs text-[#a08060] font-sans pt-1">
                      {{ championsData.juara3.evaluationNote }}
                    </p>
                  </div>

                  <!-- Hadiah yang Diterima -->
                  <div class="space-y-1.5 pt-1">
                    <div class="font-pixel text-[9px] text-[#d97706] uppercase tracking-wider">
                      Penghargaan & Apresiasi:
                    </div>
                    <div
                      v-for="(prz, pIdx) in championsData.juara3.prizes"
                      :key="pIdx"
                      class="flex items-center gap-2 text-xs text-[#fbf6e9] font-sans"
                    >
                      <component :is="prz.icon" :size="15" weight="fill" class="text-[#d97706] shrink-0" />
                      <span>{{ prz.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Next Trigger Link -->
              <div
                @click="scrollToStep(2)"
                class="pt-4 border-t border-[#5a3a18]/40 flex items-center justify-between text-xs text-[#38bdf8] hover:text-white cursor-pointer group transition-colors"
              >
                <span class="font-pixel text-[9px]">Lanjut ke Juara ke-2 (Aisyah) ↓</span>
                <PhArrowRight :size="14" weight="bold" class="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STEP 2: JUARA KE-2 (AISYAH NUR SALSABILA)                     -->
          <!-- ------------------------------------------------------------- -->
          <div
            :ref="(el) => setStepRef(el, 2)"
            id="reward-step-2"
            class="min-h-[60vh] flex flex-col justify-center scroll-mt-28 py-6"
          >
            <div class="space-y-6">
              <!-- Top Header: Rank & Points -->
              <div class="flex items-start justify-between border-b border-[#38bdf8]/40 pb-4">
                <div>
                  <div class="flex items-center gap-2 text-[#38bdf8] font-pixel text-[10px] tracking-wider mb-1">
                    <PhMedal :size="16" weight="fill" />
                    <span>{{ championsData.juara2.badgeTitle }}</span>
                  </div>
                  <h3 class="font-pixel text-2xl sm:text-3xl text-[#fbf6e9] font-bold">
                    {{ championsData.juara2.name }}
                  </h3>
                  <div class="font-sans text-xs sm:text-sm text-[#d6c3ae] mt-1">
                    {{ championsData.juara2.group }} • <span class="text-[#fbf6e9]">{{ championsData.juara2.prodi }}</span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-pixel text-lg sm:text-2xl text-[#7ec850] font-bold">
                    {{ championsData.juara2.xp.toLocaleString() }} XP
                  </div>
                  <div class="text-[11px] text-[#a08060] font-sans">
                    Akurasi: {{ championsData.juara2.accuracy }}
                  </div>
                </div>
              </div>

              <!-- Main Content: Sprite & Details -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <!-- Character Sprite (Free Standing, No Box) -->
                <div class="sm:col-span-4 flex flex-col items-center">
                  <div class="relative group">
                    <div class="absolute inset-0 bg-[#38bdf8]/20 blur-xl rounded-full pointer-events-none"></div>
                    <img
                      :src="championsData.juara2.characterImg"
                      :alt="championsData.juara2.name"
                      class="relative z-10 w-32 h-44 sm:w-36 sm:h-52 object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div class="w-24 h-3 bg-black/50 blur-sm rounded-full -mt-2"></div>
                </div>

                <!-- Stats & Biografi Narrative -->
                <div class="sm:col-span-8 space-y-4">
                  <!-- Quick Stats Chips -->
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="px-3 py-1 rounded bg-[#180f08] border border-[#5a3a18]/60 text-[#fbf6e9] font-sans">
                      Pos Selesai: <strong class="text-[#38bdf8]">{{ championsData.juara2.completedBooths }}</strong>
                    </span>
                    <span class="px-3 py-1 rounded bg-[#180f08] border border-[#5a3a18]/60 text-[#fbf6e9] font-sans">
                      Durasi Rute: <strong class="text-[#38bdf8]">{{ championsData.juara2.duration }}</strong>
                    </span>
                  </div>

                  <!-- Biografi & Catatan Penilai (Open Accent Block) -->
                  <div class="pl-4 py-1 border-l-2 border-[#38bdf8] space-y-1">
                    <div class="font-pixel text-[10px] text-[#38bdf8] uppercase tracking-wider">
                      Catatan Penilai & Rekam Jejak:
                    </div>
                    <p class="text-xs sm:text-sm text-[#e6d5c3] font-sans leading-relaxed">
                      {{ championsData.juara2.biography }}
                    </p>
                    <p class="text-xs text-[#a08060] font-sans pt-1">
                      {{ championsData.juara2.evaluationNote }}
                    </p>
                  </div>

                  <!-- Hadiah yang Diterima -->
                  <div class="space-y-1.5 pt-1">
                    <div class="font-pixel text-[9px] text-[#38bdf8] uppercase tracking-wider">
                      Penghargaan & Apresiasi:
                    </div>
                    <div
                      v-for="(prz, pIdx) in championsData.juara2.prizes"
                      :key="pIdx"
                      class="flex items-center gap-2 text-xs text-[#fbf6e9] font-sans"
                    >
                      <component :is="prz.icon" :size="15" weight="fill" class="text-[#38bdf8] shrink-0" />
                      <span>{{ prz.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Next Trigger Link -->
              <div
                @click="scrollToStep(3)"
                class="pt-4 border-t border-[#5a3a18]/40 flex items-center justify-between text-xs text-[#f0d060] hover:text-white cursor-pointer group transition-colors"
              >
                <span class="font-pixel text-[9px]">Lanjut ke Puncak: Juara 1 (Ahmad Zaky) ↓</span>
                <PhArrowRight :size="14" weight="bold" class="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STEP 3: JUARA KE-1 (AHMAD ZAKY PRATAMA)                       -->
          <!-- ------------------------------------------------------------- -->
          <div
            :ref="(el) => setStepRef(el, 3)"
            id="reward-step-3"
            class="min-h-[65vh] flex flex-col justify-center scroll-mt-28 py-6"
          >
            <div class="space-y-6">
              <!-- Top Header: Grand Champion & Points -->
              <div class="flex items-start justify-between border-b border-[#f0d060]/50 pb-4">
                <div>
                  <div class="flex items-center gap-2 text-[#f0d060] font-pixel text-[11px] tracking-wider mb-1">
                    <PhCrown :size="18" weight="fill" />
                    <span>{{ championsData.juara1.badgeTitle }}</span>
                    <PhSparkle :size="14" weight="fill" />
                  </div>
                  <h3 class="font-pixel text-2xl sm:text-3xl lg:text-4xl text-[#f0d060] font-extrabold drop-shadow-[0_2px_12px_rgba(240,208,96,0.4)]">
                    {{ championsData.juara1.name }}
                  </h3>
                  <div class="font-sans text-xs sm:text-sm text-[#d6c3ae] mt-1">
                    {{ championsData.juara1.group }} • <span class="text-[#fbf6e9]">{{ championsData.juara1.prodi }}</span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-pixel text-xl sm:text-3xl text-[#f0d060] font-extrabold drop-shadow">
                    {{ championsData.juara1.xp.toLocaleString() }} XP
                  </div>
                  <div class="text-[11px] text-[#a08060] font-sans">
                    Akurasi: {{ championsData.juara1.accuracy }}
                  </div>
                </div>
              </div>

              <!-- Main Content: Sprite & Details -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <!-- Character Sprite (Free Standing with Gold Aura, No Box) -->
                <div class="sm:col-span-4 flex flex-col items-center">
                  <div class="relative group">
                    <div class="absolute inset-0 bg-[#f0d060]/30 blur-2xl rounded-full pointer-events-none"></div>
                    <img
                      :src="championsData.juara1.characterImg"
                      :alt="championsData.juara1.name"
                      class="relative z-10 w-36 h-48 sm:w-40 sm:h-56 object-contain filter drop-shadow-[0_16px_28px_rgba(240,208,96,0.35)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div class="w-28 h-3 bg-black/60 blur-sm rounded-full -mt-2"></div>
                </div>

                <!-- Stats & Biografi Narrative -->
                <div class="sm:col-span-8 space-y-4">
                  <!-- Quick Stats Chips -->
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="px-3 py-1 rounded bg-[#180f08] border border-[#f0d060]/40 text-[#fbf6e9] font-sans">
                      Pos Selesai: <strong class="text-[#f0d060]">{{ championsData.juara1.completedBooths }}</strong>
                    </span>
                    <span class="px-3 py-1 rounded bg-[#180f08] border border-[#f0d060]/40 text-[#fbf6e9] font-sans">
                      Durasi Rekor: <strong class="text-[#f0d060]">{{ championsData.juara1.duration }}</strong>
                    </span>
                  </div>

                  <!-- Biografi & Catatan Penilai (Open Accent Block) -->
                  <div class="pl-4 py-1 border-l-2 border-[#f0d060] space-y-1">
                    <div class="font-pixel text-[10px] text-[#f0d060] uppercase tracking-wider flex items-center gap-1.5">
                      <PhTrophy :size="13" weight="fill" />
                      <span>Catatan Penilai & Rekam Jejak Tertinggi:</span>
                    </div>
                    <p class="text-xs sm:text-sm text-[#f7ecd9] font-sans leading-relaxed">
                      {{ championsData.juara1.biography }}
                    </p>
                    <p class="text-xs text-[#a08060] font-sans pt-1">
                      {{ championsData.juara1.evaluationNote }}
                    </p>
                  </div>

                  <!-- Hadiah Utama Grand Champion -->
                  <div class="space-y-1.5 pt-1">
                    <div class="font-pixel text-[9px] text-[#f0d060] uppercase tracking-wider flex items-center gap-1">
                      <PhCrown :size="12" weight="fill" />
                      <span>Apresiasi Grand Champion Rektorat:</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div
                        v-for="(prz, pIdx) in championsData.juara1.prizes"
                        :key="pIdx"
                        class="flex items-center gap-2 text-xs text-[#fbf6e9] font-sans"
                      >
                        <component :is="prz.icon" :size="16" weight="fill" class="text-[#f0d060] shrink-0" />
                        <span class="text-[11px] leading-snug">{{ prz.title }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Leaderboard Button CTA (Open, No Card) -->
              <div class="pt-6 border-t border-[#f0d060]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-2 text-xs text-[#a08060]">
                  <PhUsersThree :size="16" weight="fill" class="text-[#f0d060]" />
                  <span>Ingin mengecek perolehan poin kelompokmu?</span>
                </div>

                <RouterLink to="/leaderboard" class="w-full sm:w-auto">
                  <button
                    type="button"
                    @click="() => gameStore.soundEnabled && soundEngine.playClick()"
                    class="rpg-btn-primary w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 font-pixel text-xs tracking-wider"
                  >
                    <span>Lihat Leaderboard Lengkap</span>
                    <PhArrowRight :size="14" weight="bold" />
                  </button>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
