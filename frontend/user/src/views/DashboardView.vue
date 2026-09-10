<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/layout/Navbar.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import { useGameStore } from '@/store/gameStore';
import { PhLockKey, PhCheckCircle, PhUser, PhArrowRight, PhStar, PhTrophy, PhHourglass } from '@phosphor-icons/vue';
import { LEVEL_CONFIG } from '@/data/mockData';

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
  // Max floors = 9
  return Math.min((completedFloorsCount.value / 9) * 100, 100);
});

const avatarImage = computed(() => {
  if (participant.value.gender === 'P') {
    return '/character-cewek-avatar.png';
  }
  return '/character-cowok-avatar.png';
});

// Assuming we have 9 floors based on the game design
const floors = Array.from({ length: 9 }, (_, i) => i + 1);

const isFloorUnlocked = (floorNumber: number) => {
  return participant.value.unlockedFloors?.includes(floorNumber) ?? false;
};

const getFloorStatus = (floorNumber: number) => {
  return gameStore.getFloorStatus(floorNumber);
};

const getFloorCardClass = (floor: number) => {
  if (!isFloorUnlocked(floor)) {
    return 'bg-[#1b120a] border-[#3a2818] shadow-[0_4px_0_#0a0704] sm:shadow-[0_6px_0_#0a0704] opacity-90 cursor-not-allowed';
  }
  const status = getFloorStatus(floor);
  if (status === 'completed') {
    return 'bg-[#38761d] border-[#7ec850] shadow-[0_4px_0_#1e3d0f] sm:shadow-[0_6px_0_#1e3d0f] hover:-translate-y-1 hover:shadow-[0_8px_0_#1e3d0f] active:translate-y-2 active:shadow-[0_0px_0_#1e3d0f] cursor-pointer z-10';
  } else if (status === 'partial') {
    return 'bg-[#a16207] border-[#facc15] shadow-[0_4px_0_#713f12] sm:shadow-[0_6px_0_#713f12] hover:-translate-y-1 hover:shadow-[0_8px_0_#713f12] active:translate-y-2 active:shadow-[0_0px_0_#713f12] cursor-pointer z-10';
  } else {
    // Unlocked but not started
    return 'bg-[#2d1b0e] border-[#a89078] shadow-[0_4px_0_#1b120a] sm:shadow-[0_6px_0_#1b120a] hover:-translate-y-1 hover:shadow-[0_8px_0_#1b120a] active:translate-y-2 active:shadow-[0_0px_0_#1b120a] cursor-pointer z-10';
  }
};

const getFloorIconColor = (floor: number) => {
  if (!isFloorUnlocked(floor)) return 'bg-[#2d1b0e] border-[#5c4033]';
  const status = getFloorStatus(floor);
  if (status === 'completed') return 'bg-[#7ec850]/20 border-[#7ec850]';
  if (status === 'partial') return 'bg-[#facc15]/20 border-[#facc15]';
  return 'bg-[#a89078]/20 border-[#a89078]';
};

const getFloorTextColor = (floor: number) => {
  if (!isFloorUnlocked(floor)) return 'text-[#5c4033]';
  const status = getFloorStatus(floor);
  if (status === 'completed') return 'text-[#a4f075]';
  if (status === 'partial') return 'text-[#fef08a]';
  return 'text-[#d6c3ae]';
};

const getFloorStatusText = (floor: number) => {
  if (!isFloorUnlocked(floor)) return 'TERKUNCI';
  const status = getFloorStatus(floor);
  if (status === 'completed') return 'SELESAI';
  if (status === 'partial') return 'PROGRES';
  return 'TERBUKA';
};

const handleFloorClick = (floorNumber: number) => {
  if (!isFloorUnlocked(floorNumber)) return;
  // Only floor 1 has a dedicated page for now
  if (floorNumber === 1) {
    router.push('/floor/1');
  } else {
    router.push(`/play/floor/${floorNumber}/intro`);
  }
};
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
              <span class="text-[10px] sm:text-xs font-pixel text-white">{{ completedFloorsCount }} / 9 Lantai</span>
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

      <!-- Floors Grid Section -->
      <section>
        <div class="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 class="text-lg sm:text-2xl font-bold text-[#fbf6e9] flex items-center gap-3 font-pixel text-shadow">
            <span class="w-2 sm:w-3 h-5 sm:h-6 bg-[#7ec850] border-2 border-[#1e3d0f] shadow-[2px_2px_0_#1b120a]"></span>
            Eksplorasi Lantai
          </h2>
          <p class="text-[8px] sm:text-[10px] text-[#a89078] font-pixel px-3 py-1.5 bg-[#1b120a] rounded border-2 border-[#3a2818] uppercase tracking-wider shadow-[0_2px_0_#0a0704]">Misi Utama</p>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pb-8">
          <div 
            v-for="floor in floors" 
            :key="floor"
            class="relative overflow-hidden rounded-xl border-4 transition-all duration-150 transform"
            :class="getFloorCardClass(floor)"
            @click="handleFloorClick(floor)"
          >
            <div class="p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 min-h-[120px] sm:min-h-[140px]">
              <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-colors" 
                :class="getFloorIconColor(floor)">
                <PhLockKey v-if="!isFloorUnlocked(floor)" :size="24" class="text-[#8a6b52] sm:w-8 sm:h-8" weight="fill" />
                <PhCheckCircle v-else-if="getFloorStatus(floor) === 'completed'" :size="24" class="text-[#7ec850] drop-shadow-md sm:w-8 sm:h-8" weight="fill" />
                <PhHourglass v-else-if="getFloorStatus(floor) === 'partial'" :size="24" class="text-[#facc15] drop-shadow-md sm:w-8 sm:h-8" weight="fill" />
                <PhArrowRight v-else :size="24" class="text-[#a89078] drop-shadow-md sm:w-8 sm:h-8" weight="bold" />
              </div>
              
              <div class="flex flex-col gap-1">
                <h3 class="font-bold text-[11px] sm:text-[14px] font-pixel" :class="isFloorUnlocked(floor) ? 'text-white text-shadow' : 'text-[#8a6b52]'">
                  Lantai {{ floor }}
                </h3>
                <span class="text-[8px] sm:text-[9px] uppercase tracking-widest font-pixel" 
                  :class="getFloorTextColor(floor)">
                  {{ getFloorStatusText(floor) }}
                </span>
              </div>

              <!-- Arrow hint for unlocked but not completed -->
              <div v-if="isFloorUnlocked(floor) && getFloorStatus(floor) !== 'completed'" 
                   class="flex items-center gap-1 mt-1 px-2 py-1 rounded-sm bg-black/20" 
                   :class="getFloorStatus(floor) === 'partial' ? 'text-[#facc15]' : 'text-[#a89078]'">
                <span class="font-pixel text-[8px] sm:text-[9px] tracking-widest">{{ getFloorStatus(floor) === 'partial' ? 'LANJUTKAN' : 'MASUK' }}</span>
              </div>
            </div>
            
            <!-- Scanline overlay (CSS based instead of image) -->
            <div class="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(transparent,transparent_2px,#000_2px,#000_4px)] mix-blend-overlay"></div>
          </div>
        </div>
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
