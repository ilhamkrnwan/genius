<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import {
  PhCaretDown,
  PhChatsTeardrop,
  PhPhoneCall,
  PhInfo,
} from '@phosphor-icons/vue';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { gsap } from '@/lib/gsap';

const gameStore = useGameStore();

const faqRootRef = ref<HTMLElement | null>(null);
const faqHeaderRef = ref<HTMLElement | null>(null);
const faqListRef = ref<HTMLElement | null>(null);
const faqHelpdeskRef = ref<HTMLElement | null>(null);

const faqs = [
  {
    q: 'Apakah misi harus diselesaikan berurutan dari Lantai 1?',
    a: 'Sangat disarankan memulai dari Lantai 1 (Welcome Hall) untuk menyerap fondasi karakter dan nilai luhur Aswaja. Namun urutan kunjungan booth dapat fleksibel mengikuti arahan Kakak Pendamping (Buddy) masing-masing kelompok.',
  },
  {
    q: 'Bagaimana jika kamera HP gagal memindai QR Code di booth?',
    a: 'Pastikan izin akses kamera telah diizinkan di browser smartphone-mu (Chrome/Safari). Jika tetap bermasalah karena pencahayaan atau kendala lensa, panitia di setiap booth memegang Kode Cadangan Manual yang bisa kamu masukkan langsung di sistem.',
  },
  {
    q: 'Apakah game ini dikerjakan perorangan atau berkelompok?',
    a: 'Keduanya! Setiap mahasiswa memainkan kuis dan teka-teki melalui smartphone masing-masing, namun setiap stempel dan XP yang kamu peroleh akan otomatis terkumpul menjadi skor besar untuk Kelompok Genius-mu di Leaderboard.',
  },
  {
    q: 'Berapa skor minimal agar berhasil mendapatkan Stempel Emas?',
    a: 'Skor minimal kelulusan mini-game adalah 70%. Jika skor pertamamu di bawah 70%, jangan berkecil hati! Kamu bisa langsung mengulang permainan tersebut di booth hingga berhasil meraih stempel emas.',
  },
  {
    q: 'Bagaimana jika baterai HP atau kuota internet menipis saat acara?',
    a: 'Kampus Terpadu UNU Yogyakarta menyediakan jaringan Wi-Fi publik tanpa sandi di seluruh koridor lantai, serta Posko Charging Darurat yang berada di Lantai 1 dan Lantai 5. Kamu juga bisa melapor ke Posko Panitia terdekat.',
  },
];

const openFaqIndex = ref<number | null>(0);

const toggleFaq = (idx: number) => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  openFaqIndex.value = openFaqIndex.value === idx ? null : idx;
};

onMounted(async () => {
  await nextTick();
  if (!faqRootRef.value) return;

  // Header reveal
  if (faqHeaderRef.value) {
    gsap.fromTo(faqHeaderRef.value,
      { y: 35, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
        scrollTrigger: {
          trigger: faqHeaderRef.value,
          start: 'top 88%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  }

  // Accordion List Stagger
  if (faqListRef.value) {
    const items = faqListRef.value.querySelectorAll<HTMLElement>('.faq-accordion-item');
    if (items.length > 0) {
      gsap.fromTo(items,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power1.out',
          scrollTrigger: {
            trigger: faqListRef.value,
            start: 'top 85%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }
  }

  // Helpdesk Banner reveal
  if (faqHelpdeskRef.value) {
    gsap.fromTo(faqHelpdeskRef.value,
      { y: 25, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
        scrollTrigger: {
          trigger: faqHelpdeskRef.value,
          start: 'top 90%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  }
});

onUnmounted(() => {
  gsap.killTweensOf([faqHeaderRef.value, faqListRef.value, faqHelpdeskRef.value]);
});
</script>

<template>
  <section
    id="faq-section"
    ref="faqRootRef"
    class="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#24150a] border-t-4 border-[#5a3a18] text-[#f0e0c0]"
  >
    <div class="relative z-10 max-w-4xl mx-auto">
      <!-- Section Header with GSAP Reveal -->
      <div ref="faqHeaderRef" class="faq-header text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <h2 class="font-pixel text-2xl sm:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Pertanyaan Seputar <span class="text-[#f0d060]">Petualangan PKKMB</span>
        </h2>
        
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Punya kendala teknis atau pertanyaan seputar aturan main? Simak panduan jawaban cepat di bawah ini.
        </p>
      </div>

      <!-- Accordion List with GSAP Stagger -->
      <div ref="faqListRef" class="faq-list-wrap space-y-4 mb-12">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="faq-accordion-item sdv-card transition-all overflow-hidden border-2 will-change-transform"
          :class="openFaqIndex === idx ? 'border-[#f0d060] bg-[#342214]' : 'border-[#5a3a18] hover:border-[#8b6f4e]'"
        >
          <button
            type="button"
            @click="toggleFaq(idx)"
            class="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer select-none"
          >
            <span class="font-pixel text-xs sm:text-sm font-bold text-[#fbf6e9]">
              {{ faq.q }}
            </span>
            <div
              class="w-7 h-7 rounded-md bg-[#1c1107] border border-[#5a3a18] flex items-center justify-center shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180 text-[#f0d060] border-[#f0d060]': openFaqIndex === idx }"
            >
              <PhCaretDown :size="14" weight="bold" />
            </div>
          </button>

          <div
            v-show="openFaqIndex === idx"
            class="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 font-sans text-xs sm:text-sm text-[#d6c3ae] leading-relaxed border-t border-[#5a3a18]/40 mt-1"
          >
            {{ faq.a }}
          </div>
        </div>
      </div>

      <!-- Emergency Helpdesk Contact Banner with GSAP Reveal -->
      <div ref="faqHelpdeskRef" class="faq-helpdesk-banner p-6 rounded-xl bg-[#1b1107] border-2 border-[#8b6f4e] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-[#22c55e]/20 border border-[#22c55e] flex items-center justify-center shrink-0">
            <PhChatsTeardrop :size="24" weight="fill" class="text-[#86efac]" />
          </div>
          <div>
            <div class="font-pixel text-xs sm:text-sm text-[#fbf6e9] font-bold">
              Masih Mengalami Kendala di Lapangan?
            </div>
            <div class="text-xs text-[#a08060] font-sans">
              Hubungi langsung Posko Informasi & Panitia Teknis PKKMB 2026.
            </div>
          </div>
        </div>

        <a
          href="https://wa.me/6281234567890?text=Halo%20Panitia%20PKKMB%20UNU%202026,%20saya%20membutuhkan%20bantuan%20teknis"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0"
        >
          <button
            type="button"
            class="px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0f2411] font-pixel text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <PhPhoneCall :size="16" weight="bold" />
            <span>HUBUNGI HELPDESK</span>
          </button>
        </a>
      </div>
    </div>
  </section>
</template>
