<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhTrophy,
  PhCrown,
  PhMedal,
  PhStar,
  PhArrowRight,
  PhUsersThree,
  PhCertificate,
} from '@phosphor-icons/vue';
import { INITIAL_LEADERBOARD_GROUPS } from '@/data/mockData';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { gsap } from '@/lib/gsap';

const gameStore = useGameStore();

const rewardsRootRef = ref<HTMLElement | null>(null);
const rewardsHeaderRef = ref<HTMLElement | null>(null);
const rewardsCardsRef = ref<HTMLElement | null>(null);
const rewardsLbRef = ref<HTMLElement | null>(null);

const topGroups = ref(INITIAL_LEADERBOARD_GROUPS.slice(0, 3));

const rewards = [
  {
    title: 'Juara Umum Kelompok',
    badge: 'KATEGORI KELOMPOK',
    desc: 'Piala Bergilir Rektorat, Plakat Kehormatan Emas, dan Paket Hadiah Eksklusif PKKMB 2026.',
    icon: PhCrown,
    color: '#f0d060',
  },
  {
    title: 'Petualang Teladan',
    badge: 'KATEGORI INDIVIDU',
    desc: 'Piagam Apresiasi Mahasiswa Berprestasi dan Merchandise Kit Resmi UNU Yogyakarta.',
    icon: PhMedal,
    color: '#38bdf8',
  },
  {
    title: 'Gelar "Upgraded You"',
    badge: 'SELURUH TAMAT 9 LT',
    desc: 'Sertifikat Digital Resmi Kelulusan Orientasi & Pin Logam Khusus Petualang Sejati.',
    icon: PhCertificate,
    color: '#a855f7',
  },
];

onMounted(async () => {
  try {
    const res = await api.getLeaderboard(3);
    if (res?.success && res?.data?.groups?.length) {
      topGroups.value = res.data.groups.slice(0, 3);
    }
  } catch (err) {
    // Graceful fallback to mock data
  }

  await nextTick();
  if (!rewardsRootRef.value) return;

  // Header reveal
  if (rewardsHeaderRef.value) {
    gsap.fromTo(rewardsHeaderRef.value,
      { y: 35, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', clearProps: 'all',
        scrollTrigger: {
          trigger: rewardsHeaderRef.value,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  // 3 Rewards Cards
  if (rewardsCardsRef.value) {
    const cards = rewardsCardsRef.value.querySelectorAll<HTMLElement>('.reward-item-card');
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { y: 40, opacity: 0, scale: 0.94 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.12,
          ease: 'back.out(1.4)', clearProps: 'all',
          scrollTrigger: {
            trigger: rewardsCardsRef.value,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  }

  // Leaderboard Teaser Card
  if (rewardsLbRef.value) {
    gsap.fromTo(rewardsLbRef.value,
      { y: 35, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', clearProps: 'all',
        scrollTrigger: {
          trigger: rewardsLbRef.value,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );
  }
});

onUnmounted(() => {
  gsap.killTweensOf([rewardsHeaderRef.value, rewardsCardsRef.value, rewardsLbRef.value]);
});
</script>

<template>
  <section
    id="rewards-section"
    ref="rewardsRootRef"
    class="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#2d1b0e] text-[#f0e0c0]"
  >
    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section Header with GSAP Reveal -->
      <div ref="rewardsHeaderRef" class="rewards-header text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b120a] border border-[#f0d060]/50 shadow-md mb-3">
          <PhTrophy :size="16" weight="fill" class="text-[#f0d060]" />
          <span class="font-pixel text-[9px] sm:text-[10px] text-[#f0d060] uppercase tracking-wider">
            REWARD & HALL OF FAME
          </span>
        </div>
        
        <h2 class="font-pixel text-2xl sm:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Rebut Penghargaan <span class="text-[#f0d060]">Mahasiswa Terbaik</span>
        </h2>
        
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Kekompakan kelompok dan ketelitianmu menuntaskan misi akan diganjar dengan apresiasi bergengsi langsung dari pimpinan universitas.
        </p>
      </div>

      <!-- 3 Highlighted Rewards Cards with GSAP Stagger -->
      <div ref="rewardsCardsRef" class="rewards-cards-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        <div
          v-for="(reward, idx) in rewards"
          :key="idx"
          class="reward-item-card sdv-card p-6 flex flex-col justify-between hover:-translate-y-1 hover:border-[#f0d060] transition-all group will-change-transform"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="font-pixel text-[9px] px-2 py-0.5 rounded bg-[#1e140c] border border-[#8b6f4e] text-[#f0d060]">
                {{ reward.badge }}
              </span>
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform"
                :style="{ backgroundColor: `${reward.color}20`, borderColor: reward.color }"
              >
                <component :is="reward.icon" :size="24" weight="duotone" :style="{ color: reward.color }" />
              </div>
            </div>

            <h3 class="font-pixel text-base sm:text-lg font-bold text-[#fbf6e9] mb-2 group-hover:text-[#f0d060] transition-colors">
              {{ reward.title }}
            </h3>

            <p class="font-sans text-xs sm:text-sm text-[#d6c3ae] leading-relaxed">
              {{ reward.desc }}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-[#5a3a18] flex items-center gap-1.5 text-xs text-[#f0d060]">
            <PhStar :size="14" weight="fill" />
            <span class="font-pixel text-[9px]">Apresiasi Rektorat</span>
          </div>
        </div>
      </div>

      <!-- Mini Top 3 Kelompok Leaderboard Teaser with GSAP Reveal -->
      <div ref="rewardsLbRef" class="rewards-lb-box sdv-card-elevated p-6 sm:p-8 max-w-3xl mx-auto shadow-xl">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-[#5a3a18] pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-[#f0d060]/20 border border-[#f0d060] flex items-center justify-center">
              <PhUsersThree :size="22" weight="fill" class="text-[#f0d060]" />
            </div>
            <div>
              <h4 class="font-pixel text-sm sm:text-base font-bold text-[#fbf6e9]">
                Top 3 Kelompok Genius Saat Ini
              </h4>
              <p class="text-xs text-[#a08060] font-sans">
                Peringkat diperbarui secara langsung dari aktivitas di tiap booth
              </p>
            </div>
          </div>

          <RouterLink to="/leaderboard">
            <button
              type="button"
              @click="() => gameStore.soundEnabled && soundEngine.playClick()"
              class="font-pixel text-[10px] text-[#f0d060] hover:text-white flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>Lihat Semua</span>
              <PhArrowRight :size="14" weight="bold" />
            </button>
          </RouterLink>
        </div>

        <!-- 3 Items Leaderboard List -->
        <div class="space-y-3">
          <div
            v-for="(grp, gIdx) in topGroups"
            :key="grp.id"
            class="flex items-center justify-between p-3 rounded-lg bg-[#19110a] border border-[#4a3422] hover:border-[#8b6f4e] transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-7 h-7 rounded-md flex items-center justify-center font-pixel text-xs font-bold"
                :class="[
                  gIdx === 0 ? 'bg-[#f0d060] text-[#1b120a]' :
                  gIdx === 1 ? 'bg-[#cbd5e1] text-[#1b120a]' :
                  'bg-[#d97706] text-white'
                ]"
              >
                #{{ gIdx + 1 }}
              </div>
              <div>
                <div class="font-pixel text-xs text-[#fbf6e9] font-bold">
                  {{ grp.name }}
                </div>
                <div class="text-[11px] text-[#a08060] font-sans">
                  {{ grp.memberCount }} Anggota • {{ grp.completedBoothsCount }} Booth Selesai
                </div>
              </div>
            </div>

            <div class="text-right">
              <div class="font-pixel text-xs text-[#7ec850] font-bold">
                {{ grp.totalXp.toLocaleString() }} XP
              </div>
              <div class="text-[10px] text-[#a08060]">
                Avg: {{ grp.averageScore }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
