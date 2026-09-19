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
  PhGraduationCap,
  PhScroll,
  PhTarget,
  PhLightning,
  PhCheckCircle,
  PhChartLineUp,
  PhBuildings,
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

// Kategori Penghargaan & Apresiasi Resmi PKKMB UNU Yogyakarta 2026
const awardCategories = [
  {
    stepIndex: 1,
    id: 'grand-champion',
    badgeTitle: 'PENGHARGAAN UTAMA • JUARA UMUM INDIVIDU',
    name: 'Grand Champion Rektorat',
    subtitle: 'Mahasiswa Baru dengan Akumulasi XP & Akurasi Misi Tertinggi',
    themeColor: '#f0d060',
    glowColor: 'rgba(240, 208, 96, 0.4)',
    icon: PhCrown,
    criteria: [
      'Akumulasi XP tertinggi dari 9 Pos Kuis di 6 Lantai Kampus Terpadu',
      'Kecepatan & ketepatan penyelesaian mini-game tanpa penalti',
      'Presensi lengkap 3 hari penuh & refleksi diri harian',
    ],
    description:
      'Penghargaan tertinggi bagi mahasiswa baru yang membuktikan ketajaman intelektual, ketangkasan problem-solving, serta integritas nilai Ahlussunnah wal Jamaah sepanjang petualangan PKKMB.',
    prizes: [
      { title: 'Piala Bergilir Rektorat UNU Yogyakarta (Piala Emas)', icon: PhTrophy },
      { title: 'Beasiswa Penuh Prestasi Akademik Selama 1 Tahun', icon: PhGraduationCap },
      { title: 'Plakat Kehormatan Emas & Medali Emas Murni PKKMB 2026', icon: PhCrown },
      { title: 'Gelar & Golden Badge "Master Explorer 2026" di Profil Akun', icon: PhStar },
    ],
  },
  {
    stepIndex: 2,
    id: 'best-team',
    badgeTitle: 'KATEGORI KOLABORATIF • 50 REGU GENIUS',
    name: 'Best Team Expedition',
    subtitle: 'Kelompok Maba dengan Sinergi, Kekompakan & Rata-rata Skor Tertinggi',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    icon: PhUsersThree,
    criteria: [
      'Rata-rata akumulasi XP anggota kelompok tertinggi di leaderboard',
      'Skor evaluasi kekompakan FGD terbaik dari Game Master Buddy',
      'Ketuntasan seluruh pos kuis dan keterlibatan 100% anggota regu',
    ],
    description:
      'Apresiasi bagi regu dari 50 Kelompok Genius yang menunjukkan kepemimpinan kolektif, saling mendukung dalam memecahkan teka-teki, dan membuktikan budaya kerja sama luhur.',
    prizes: [
      { title: 'Piala Bergilir Tim Terbaik PKKMB UNU Yogyakarta 2026', icon: PhTrophy },
      { title: 'Piagam Apresiasi Rektorat untuk Seluruh Anggota Regu', icon: PhScroll },
      { title: 'Paket Eksklusif Starter Kit & Merchandise Inovator UNU', icon: PhCertificate },
      { title: 'Pengabadian Nama Regu di Wall of Fame Universitas', icon: PhSparkle },
    ],
  },
  {
    stepIndex: 3,
    id: 'inspiring-explorer',
    badgeTitle: 'KATEGORI SPESIAL • INSPIRASI & KEAKTIFAN',
    name: 'Most Active & Inspiring Explorer',
    subtitle: 'Dedikasi, Empati Sosial & Eksplorasi Kampus Paling Berkesan',
    themeColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    icon: PhSparkle,
    criteria: [
      'Keaktifan bertanya dan berdiskusi dalam sesi materi & FGD',
      'Kunjungan dan pemindaian stan Ormawa & UKM Expo terbanyak',
      'Catatan apresiasi kualitatif istimewa dari Game Master Buddy',
    ],
    description:
      'Penghargaan khusus untuk mahasiswa baru yang menebar aura positif, kepedulian sesama, inisiatif kepemimpinan, dan antusiasme tinggi selama orientasi kampus.',
    prizes: [
      { title: 'Medali Kehormatan Maba Inspiratif PKKMB 2026', icon: PhMedal },
      { title: 'Beasiswa Apresiasi Mahasiswa Teladan Semester 1', icon: PhGraduationCap },
      { title: 'Smart Tablet & Digital Stylus Penunjang Riset Pembelajaran', icon: PhCertificate },
      { title: 'Sertifikat Kehormatan Rektorat Mahasiswa Berprestasi', icon: PhScroll },
    ],
  },
  {
    stepIndex: 4,
    id: 'faculty-champions',
    badgeTitle: 'KATEGORI FAKULTAS • 5 FAKULTAS UNU YOGYAKARTA',
    name: 'Faculty Champion Honors',
    subtitle: 'Duta Prestasi Terbaik dari Setiap Fakultas',
    themeColor: '#7ec850',
    glowColor: 'rgba(126, 200, 80, 0.4)',
    icon: PhBuildings,
    criteria: [
      'Peringkat #1 di masing-masing fakultas pada klasemen akhir',
      'Penguasaan materi kuis distingtif sains dan nilai fakultas',
      'Konsistensi nilai kehadiran dan kedisiplinan rute',
    ],
    description:
      'Apresiasi istimewa bagi representasi bintang baru dari Fakultas Industri Halal, Fakultas Teknologi Informasi, Fakultas Ilmu Pendidikan, Fakultas Ekonomi, dan Fakultas Dirasah Islamiyah.',
    prizes: [
      { title: 'Medali Kehormatan Bintang Fakultas PKKMB 2026', icon: PhMedal },
      { title: 'Piagam Apresiasi Dekanat Fakultas Terkait', icon: PhScroll },
      { title: 'Prioritas Rekomendasi Program Magang & Laboratorium Riset', icon: PhStar },
      { title: 'Pin Emas Duta Akademik Fakultas UNU 2026', icon: PhCrown },
    ],
  },
];

const navigationSteps = [
  { id: 0, label: 'Pengantar', icon: PhScroll },
  { id: 1, label: 'Grand Champion', icon: PhCrown, color: '#f0d060' },
  { id: 2, label: 'Best Team', icon: PhUsersThree, color: '#38bdf8' },
  { id: 3, label: 'Mahasiswa Inspiratif', icon: PhSparkle, color: '#d97706' },
  { id: 4, label: 'Bintang Fakultas', icon: PhBuildings, color: '#7ec850' },
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

  stepRefs.value.forEach((stepEl, idx) => {
    if (!stepEl) return;

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
      onToggle: (self) => {
        if (self.isActive) {
          activeStep.value = idx;
        }
      },
    });
    scrollTriggers.push(st);

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
    class="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#24160a] text-[#f0e0c0]"
  >
    <!-- Ambient Glow Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute top-1/3 left-1/12 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-25 transition-all duration-700"
        :style="{
          backgroundColor:
            activeStep === 1
              ? '#f0d060'
              : activeStep === 2
              ? '#38bdf8'
              : activeStep === 3
              ? '#d97706'
              : activeStep === 4
              ? '#7ec850'
              : '#f0d060',
        }"
      ></div>
      <div class="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[100px] bg-[#f0d060]/10"></div>
    </div>

    <div class="relative z-10 max-w-6xl mx-auto">
      <!-- Section Title Header -->
      <div class="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div class="inline-flex items-center gap-2 text-xs font-pixel text-[#f0d060] uppercase tracking-widest mb-3">
          <PhSparkle :size="16" weight="fill" />
          <span>Sistem Penghargaan & Prestasi</span>
          <PhSparkle :size="16" weight="fill" />
        </div>
        <h2 class="font-pixel text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Panggung Kehormatan <span class="text-[#f0d060]">PKKMB UNU 2026</span>
        </h2>
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Kompilasi penghargaan bergengsi bagi petualang individu dan regu terbaik yang menunjukkan keunggulan sains, dedikasi rute, dan integritas nilai Aswaja.
        </p>
      </div>

      <!-- Scrollytelling Two-Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <!-- ================================================================= -->
        <!-- LEFT COLUMN: STICKY PODIUM & QUICK NAV                            -->
        <!-- ================================================================= -->
        <div class="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24 self-start z-20">
          <div ref="leftPodiumRef" class="flex flex-col items-center select-none">
            <!-- Header Status Mimbar -->
            <div class="w-full flex items-center justify-between pb-3 mb-2 border-b border-[#5a3a18]/60">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-300"
                  :style="{
                    backgroundColor:
                      activeStep === 1
                        ? '#f0d06025'
                        : activeStep === 2
                        ? '#38bdf825'
                        : activeStep === 3
                        ? '#d9770625'
                        : activeStep === 4
                        ? '#7ec85025'
                        : '#f0d06020',
                  }"
                >
                  <PhCrown v-if="activeStep === 1" :size="20" weight="fill" class="text-[#f0d060]" />
                  <PhUsersThree v-else-if="activeStep === 2" :size="20" weight="fill" class="text-[#38bdf8]" />
                  <PhSparkle v-else-if="activeStep === 3" :size="20" weight="fill" class="text-[#d97706]" />
                  <PhBuildings v-else-if="activeStep === 4" :size="20" weight="fill" class="text-[#7ec850]" />
                  <PhTrophy v-else :size="20" weight="fill" class="text-[#f0d060]" />
                </div>

                <div>
                  <div class="font-pixel text-[11px] sm:text-xs text-[#fbf6e9] tracking-wider uppercase">
                    <span v-if="activeStep === 0">Mimbar Penghargaan</span>
                    <span v-else-if="activeStep === 1" class="text-[#f0d060]">Grand Champion</span>
                    <span v-else-if="activeStep === 2" class="text-[#38bdf8]">Best Team</span>
                    <span v-else-if="activeStep === 3" class="text-[#d97706]">Maba Inspiratif</span>
                    <span v-else-if="activeStep === 4" class="text-[#7ec850]">Bintang Fakultas</span>
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
                  activeStep === 1
                    ? 'bg-[#f0d060]/20 text-[#f0d060]'
                    : activeStep === 2
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                    : activeStep === 3
                    ? 'bg-[#d97706]/20 text-[#d97706]'
                    : activeStep === 4
                    ? 'bg-[#7ec850]/20 text-[#7ec850]'
                    : 'bg-[#5a3a18]/40 text-[#c4956a]',
                ]"
              >
                {{ activeStep === 0 ? 'PENGANTAR' : `KATEGORI #${activeStep}` }}
              </span>
            </div>

            <!-- Mimbar Podium Image -->
            <div class="relative w-full aspect-[1376/1000] flex items-center justify-center my-2">
              <div
                class="absolute inset-0 pointer-events-none transition-all duration-500 rounded-full blur-2xl"
                :style="{
                  backgroundColor:
                    activeStep === 1
                      ? 'rgba(240, 208, 96, 0.2)'
                      : activeStep === 2
                      ? 'rgba(56, 189, 248, 0.18)'
                      : activeStep === 3
                      ? 'rgba(217, 119, 6, 0.18)'
                      : activeStep === 4
                      ? 'rgba(126, 200, 80, 0.18)'
                      : 'rgba(240, 208, 96, 0.1)',
                }"
              ></div>

              <img
                src="/mimbar-podium.webp"
                alt="Mimbar Podium Penghargaan PKKMB UNU 2026"
                class="w-full h-full object-contain filter drop-shadow-[0_16px_30px_rgba(0,0,0,0.95)] transition-transform duration-500"
                :class="[activeStep > 0 ? 'scale-[1.02]' : 'scale-100']"
              />
            </div>

            <!-- Category Navigation Chips -->
            <div class="w-full grid grid-cols-2 gap-1.5 pt-2">
              <button
                v-for="step in navigationSteps.slice(1)"
                :key="step.id"
                type="button"
                @click="scrollToStep(step.id)"
                class="p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer"
                :class="[
                  activeStep === step.id
                    ? 'bg-[#2a1a0e] border-[#f0d060] shadow-md'
                    : 'bg-[#180f08]/80 border-[#5a3a18]/60 hover:border-[#8b6f4e] text-[#a08060]',
                ]"
              >
                <component
                  :is="step.icon"
                  :size="15"
                  weight="fill"
                  :class="activeStep === step.id ? 'text-[#f0d060]' : 'text-[#8b6f4e]'"
                />
                <span
                  class="font-pixel text-[9.5px] truncate"
                  :class="activeStep === step.id ? 'text-[#fbf6e9] font-bold' : 'text-[#c4956a]'"
                >
                  {{ step.label }}
                </span>
              </button>
            </div>

            <!-- Direct Leaderboard CTA Box -->
            <div class="w-full mt-4 p-3 rounded-xl bg-[#180f08]/90 border border-[#5a3a18] flex items-center justify-between gap-3 shadow">
              <div class="flex items-center gap-2 min-w-0">
                <PhChartLineUp :size="20" weight="fill" class="text-[#f0d060] shrink-0" />
                <div class="min-w-0">
                  <div class="font-pixel text-[10px] text-[#f0d060] leading-tight">
                    Papan Peringkat Terbuka
                  </div>
                  <div class="text-[9.5px] text-[#a08060] font-sans truncate">
                    Pantau akumulasi XP secara langsung
                  </div>
                </div>
              </div>
              <RouterLink
                to="/leaderboard"
                @click="() => gameStore.soundEnabled && soundEngine.playClick()"
                class="shrink-0 px-3 py-1.5 rounded-lg bg-[#3d7828] hover:bg-[#4d9432] text-[#f0d060] border border-[#f0d060] font-pixel text-[9px] uppercase tracking-wider transition-all active:scale-95 shadow"
              >
                Lihat Skor
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- RIGHT COLUMN: DETAILED CATEGORY SHOWCASES                         -->
        <!-- ================================================================= -->
        <div class="lg:col-span-7 xl:col-span-7 space-y-16">
          <!-- ------------------------------------------------------------- -->
          <!-- STEP 0: PENGANTAR SISTEM PENILAIAN                            -->
          <!-- ------------------------------------------------------------- -->
          <div
            :ref="(el) => setStepRef(el, 0)"
            id="reward-step-0"
            class="min-h-[50vh] flex flex-col justify-center scroll-mt-28 py-4"
          >
            <div class="space-y-4">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3a2210] border border-[#7a4e28] text-xs font-pixel text-[#f0d060]">
                <PhTrophy :size="14" weight="fill" />
                <span>MEKANISME PERINGKAT & APRESIASI RESMI</span>
              </div>

              <h3 class="font-pixel text-xl sm:text-2xl text-[#fbf6e9] font-bold leading-tight">
                Penilaian Transparan, Terintegrasi & Realtime
              </h3>

              <p class="text-xs sm:text-sm text-[#d6c3ae] font-sans leading-relaxed">
                Seluruh aktivitas Anda selama PKKMB UNU Yogyakarta 2026 dihargai secara objektif melalui sistem gamifikasi digital. Skor tercatat otomatis pada buku paspor digital dan disiarkan ke Papan Peringkat Realtime.
              </p>

              <!-- 4 Pilar Penilaian -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div class="p-3 rounded-xl bg-[#180f08]/90 border border-[#5a3a18] space-y-1">
                  <div class="flex items-center gap-2 text-[#f0d060] font-pixel text-[10.5px]">
                    <PhTarget :size="15" weight="fill" />
                    <span>9 Pos Kuis 6 Lantai</span>
                  </div>
                  <p class="text-[11px] text-[#a08060] font-sans leading-relaxed">
                    Setiap stempel pos kuis bernilai XP tinggi dengan bonus akurasi dan waktu tercepat.
                  </p>
                </div>

                <div class="p-3 rounded-xl bg-[#180f08]/90 border border-[#5a3a18] space-y-1">
                  <div class="flex items-center gap-2 text-[#38bdf8] font-pixel text-[10.5px]">
                    <PhUsersThree :size="15" weight="fill" />
                    <span>Evaluasi FGD Buddy</span>
                  </div>
                  <p class="text-[11px] text-[#a08060] font-sans leading-relaxed">
                    Penilaian dinamika kelompok, keaktifan diskusi, dan solidaritas regu oleh Game Master.
                  </p>
                </div>

                <div class="p-3 rounded-xl bg-[#180f08]/90 border border-[#5a3a18] space-y-1">
                  <div class="flex items-center gap-2 text-[#7ec850] font-pixel text-[10.5px]">
                    <PhCheckCircle :size="15" weight="fill" />
                    <span>Presensi QR 3 Hari</span>
                  </div>
                  <p class="text-[11px] text-[#a08060] font-sans leading-relaxed">
                    Kedisiplinan check-in/out harian serta ketuntasan jurnal refleksi diri menambah XP regu.
                  </p>
                </div>

                <div class="p-3 rounded-xl bg-[#180f08]/90 border border-[#5a3a18] space-y-1">
                  <div class="flex items-center gap-2 text-[#d97706] font-pixel text-[10.5px]">
                    <PhSparkle :size="15" weight="fill" />
                    <span>Eksplorasi Ormawa Expo</span>
                  </div>
                  <p class="text-[11px] text-[#a08060] font-sans leading-relaxed">
                    Pindai QR stan UKM & Ormawa untuk mengumpulkan poin minat serta rekor keaktifan.
                  </p>
                </div>
              </div>

              <!-- Next Button -->
              <div class="pt-3">
                <button
                  type="button"
                  @click="scrollToStep(1)"
                  class="inline-flex items-center gap-2 text-xs font-pixel text-[#f0d060] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Pelajari Kategori Juara Utama (Grand Champion) ↓</span>
                  <PhArrowRight :size="14" weight="bold" />
                </button>
              </div>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STEP 1 TO 4: CATEGORY SHOWCASES                               -->
          <!-- ------------------------------------------------------------- -->
          <div
            v-for="cat in awardCategories"
            :key="cat.id"
            :ref="(el) => setStepRef(el, cat.stepIndex)"
            :id="`reward-step-${cat.stepIndex}`"
            class="min-h-[60vh] flex flex-col justify-center scroll-mt-28 py-6"
          >
            <div class="space-y-5">
              <!-- Top Header: Title & Badge -->
              <div
                class="border-b pb-4"
                :style="{ borderColor: `${cat.themeColor}50` }"
              >
                <div
                  class="flex items-center gap-2 font-pixel text-[11px] tracking-wider mb-1"
                  :style="{ color: cat.themeColor }"
                >
                  <component :is="cat.icon" :size="18" weight="fill" />
                  <span>{{ cat.badgeTitle }}</span>
                  <PhSparkle :size="14" weight="fill" />
                </div>
                <h3
                  class="font-pixel text-2xl sm:text-3xl font-extrabold leading-tight drop-shadow"
                  :style="{ color: cat.themeColor }"
                >
                  {{ cat.name }}
                </h3>
                <div class="font-sans text-xs sm:text-sm text-[#d6c3ae] mt-1">
                  {{ cat.subtitle }}
                </div>
              </div>

              <!-- Description -->
              <p class="text-xs sm:text-sm text-[#e6d5c3] font-sans leading-relaxed">
                {{ cat.description }}
              </p>

              <!-- Kriteria Penilaian -->
              <div
                class="pl-4 py-1.5 border-l-2 space-y-1.5"
                :style="{ borderColor: cat.themeColor }"
              >
                <div
                  class="font-pixel text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                  :style="{ color: cat.themeColor }"
                >
                  <PhTarget :size="14" weight="fill" />
                  <span>Kriteria & Indikator Penilaian:</span>
                </div>
                <ul class="space-y-1">
                  <li
                    v-for="(crit, cIdx) in cat.criteria"
                    :key="cIdx"
                    class="text-xs text-[#fbf6e9] font-sans flex items-start gap-2"
                  >
                    <span :style="{ color: cat.themeColor }">•</span>
                    <span>{{ crit }}</span>
                  </li>
                </ul>
              </div>

              <!-- Apresiasi & Hadiah yang Diberikan -->
              <div class="space-y-2 pt-1">
                <div
                  class="font-pixel text-[9.5px] uppercase tracking-wider flex items-center gap-1.5"
                  :style="{ color: cat.themeColor }"
                >
                  <PhTrophy :size="13" weight="fill" />
                  <span>Penghargaan & Fasilitas Kehormatan:</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    v-for="(prz, pIdx) in cat.prizes"
                    :key="pIdx"
                    class="p-2 rounded-lg bg-[#180f08]/80 border border-[#5a3a18]/60 flex items-center gap-2.5 text-xs text-[#fbf6e9] font-sans"
                  >
                    <component
                      :is="prz.icon"
                      :size="16"
                      weight="fill"
                      :style="{ color: cat.themeColor }"
                      class="shrink-0"
                    />
                    <span class="text-[11px] leading-snug">{{ prz.title }}</span>
                  </div>
                </div>
              </div>

              <!-- Next Step or Leaderboard CTA -->
              <div
                v-if="cat.stepIndex < awardCategories.length"
                @click="scrollToStep(cat.stepIndex + 1)"
                class="pt-3 border-t border-[#5a3a18]/40 flex items-center justify-between text-xs text-[#f0d060] hover:text-white cursor-pointer group transition-colors"
              >
                <span class="font-pixel text-[9px]">
                  Lanjut ke Kategori Berikutnya ({{ awardCategories[cat.stepIndex]?.name }}) ↓
                </span>
                <PhArrowRight :size="14" weight="bold" class="group-hover:translate-x-1 transition-transform" />
              </div>

              <!-- Final CTA at bottom of last step -->
              <div
                v-else
                class="pt-6 border-t border-[#f0d060]/40 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div class="flex items-center gap-2 text-xs text-[#a08060]">
                  <PhUsersThree :size="16" weight="fill" class="text-[#f0d060]" />
                  <span>Ingin melihat klasemen sementara mahasiswa dan regumu?</span>
                </div>

                <RouterLink to="/leaderboard" class="w-full sm:w-auto">
                  <button
                    type="button"
                    @click="() => gameStore.soundEnabled && soundEngine.playClick()"
                    class="rpg-btn-primary w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 font-pixel text-xs tracking-wider cursor-pointer active:scale-95 shadow"
                  >
                    <span>Lihat Papan Peringkat Realtime</span>
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
