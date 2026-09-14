<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/layout/Navbar.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import { useGameStore } from '@/store/gameStore';
import { PhLockKey, PhCheckCircle, PhUser, PhArrowRight, PhStar, PhTrophy, PhHourglass } from '@phosphor-icons/vue';
import { LEVEL_CONFIG } from '@/data/mockData';
import BuildingMap from '@/components/map/BuildingMap.vue';

const router = useRouter();

const gameStore = useGameStore();
const participant = computed(() => gameStore.participant);

const currentLevelStr = computed(() => gameStore.getCurrentLevel());
const completedFloorsCount = computed(() => gameStore.getCompletedFloorsCount());
const totalXp = computed(() => participant.value.totalXp);

const levelInfo = computed(() => {
  return LEVEL_CONFIG.find(l => l.level === currentLevelStr.value) || LEVEL_CONFIG[0];
});

const progressPercent = computed(() => {
  // Max floors untuk pos kuis resmi = 6
  return Math.min((completedFloorsCount.value / 6) * 100, 100);
});

const avatarImage = computed(() => {
  if (participant.value.gender === 'P') {
    return '/character-cewek-avatar.png';
  }
  return '/character-cowok-avatar.png';
});

onMounted(() => {
  gameStore.syncWithServer();
});


</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-[#2d1b0e] text-[#f0e0c0] font-sans">
    <CrtScanlines />
    <Navbar />
    
    <main class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto w-full max-w-4xl mx-auto z-10 animate-fade-in">
      
      <!-- Header & Avatar Section -->
      <section class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 bg-[#3a2818] p-5 sm:p-6 rounded-2xl border-4 border-[#5c4033] shadow-[0_6px_0_#1a0f08] transition-transform">
        <div class="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-[#5c4033] rounded-xl overflow-hidden border-4 border-[#7ec850] shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]">
          <img :src="avatarImage" alt="User Avatar" class="w-full h-full object-cover pixelated" />
        </div>
        
        <div class="flex-1 text-center sm:text-left w-full flex flex-col justify-center min-h-[6rem] sm:min-h-[8rem]">
          <h1 class="text-xl sm:text-3xl lg:text-4xl font-bold text-[#fbf6e9] tracking-wider mb-1.5 font-pixel text-shadow leading-tight">{{ participant.name || 'Mahasiswa Baru' }}</h1>
          <p class="text-[#7ec850] font-bold text-[10px] sm:text-xs uppercase font-pixel tracking-wide mb-4">{{ participant.nim }} • {{ participant.prodi }}</p>
          
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <div class="inline-flex items-center gap-1.5 bg-[#1b120a] px-3 py-2 rounded-lg border-2 border-[#5c4033] shadow-[0_4px_0_#0a0704]">
              <PhUser :size="16" class="text-[#f59e0b]" weight="bold" />
              <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] font-pixel">
                {{ participant.gender === 'P' ? 'Perempuan' : 'Laki-Laki' }}
              </span>
            </div>
            
            <div class="inline-flex items-center gap-1.5 bg-[#1b120a] px-3 py-2 rounded-lg border-2 border-[#5c4033] shadow-[0_4px_0_#0a0704]">
              <PhStar :size="16" class="text-[#facc15]" weight="fill" />
              <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#facc15] font-pixel">
                {{ totalXp }} XP
              </span>
            </div>

            <div class="inline-flex items-center gap-1.5 bg-[#1b120a] px-3 py-2 rounded-lg border-2 shadow-[0_4px_0_#0a0704]" :style="{ borderColor: levelInfo.color }">
              <PhTrophy :size="16" :style="{ color: levelInfo.color }" weight="fill" />
              <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest font-pixel" :style="{ color: levelInfo.color }">
                {{ levelInfo.title }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- XP/Level Progress Bar Section -->
      <section class="mb-8 sm:mb-10">
        <div class="bg-[#1b120a] border-4 border-[#3a2818] rounded-xl p-3 sm:p-5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]">
          <div class="flex justify-between items-end mb-2 sm:mb-3 px-1">
            <div class="flex flex-col gap-1">
              <span class="text-[9px] sm:text-[11px] font-pixel text-[#a89078] uppercase tracking-wider">Progres Level Saat Ini</span>
              <span class="text-xs sm:text-sm font-pixel font-bold drop-shadow-sm" :style="{ color: levelInfo.color }">
                {{ levelInfo.title }}
              </span>
            </div>
            <div class="text-right flex flex-col gap-1">
              <span class="text-[9px] sm:text-[11px] font-pixel text-[#a89078] uppercase tracking-wider">Misi Utama</span>
              <span class="text-[10px] sm:text-xs font-pixel text-white">{{ completedFloorsCount }} / 6 Lantai (9 Pos)</span>
            </div>
          </div>
          <div class="w-full h-4 sm:h-5 bg-[#2d1b0e] rounded-full overflow-hidden border-2 border-[#0a0704] relative shadow-[0_2px_0_rgba(255,255,255,0.1)]">
            <div class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.2)_6px,rgba(0,0,0,0.2)_12px)] z-10 pointer-events-none"></div>
            <div class="h-full transition-all duration-1000 ease-out shadow-[inset_0_0_8px_rgba(255,255,255,0.3)] relative"
                 :style="{ width: `${progressPercent}%`, backgroundColor: levelInfo.color }">
              <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Peta Section (BuildingMap) -->
      <section class="flex-1 min-h-[400px]">
        <BuildingMap />
      </section>

    </main>
  </div>
</template>
<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
.text-shadow {
  text-shadow: 2px 2px 0px #1b120a;
}
</style>
