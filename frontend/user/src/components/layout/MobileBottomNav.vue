<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import {
  PhHouse,
  PhGameController,
  PhBuildings,
  PhIdentificationBadge,
  PhList,
  PhX,
  PhCalendarCheck,
  PhStorefront,
  PhTrophy,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhTelevision,
} from '@phosphor-icons/vue';

const route = useRoute();
const gameStore = useGameStore();
const showMoreMenu = ref(false);

const bottomNavLinks = [
  { href: '/', label: 'Beranda', icon: PhHouse },
  { href: '/play', label: 'Main', icon: PhGameController },
  { href: '/paspor', label: 'Profil', icon: PhIdentificationBadge },
];

const handleLinkClick = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  showMoreMenu.value = false;
};

const toggleMoreMenu = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  showMoreMenu.value = !showMoreMenu.value;
};

const isLinkActive = (href: string) => {
  if (href === '/') return route.path === '/';
  if (href === '/play') return route.path.startsWith('/play') || route.path.startsWith('/dashboard') || route.path.startsWith('/booth') || route.path.startsWith('/floor');
  if (href === '/paspor') return route.path.startsWith('/paspor') || route.path.startsWith('/passport') || route.path.startsWith('/passpor');
  return false;
};
</script>

<template>
  <nav class="xl:hidden fixed bottom-0 left-0 w-full z-50 bg-[#1c120a]/95 backdrop-blur-md border-t-2 border-[#5a3a18] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] safe-area-bottom">
    <div class="flex items-center justify-around w-full max-w-lg mx-auto px-1 py-1.5 h-[64px]">
      <RouterLink
        v-for="link in bottomNavLinks"
        :key="link.href"
        :to="link.href"
        @click="handleLinkClick"
        class="flex flex-col items-center justify-center w-full gap-1 p-2 rounded-xl transition-all relative"
        :class="isLinkActive(link.href) ? 'text-[#f0d060]' : 'text-[#8b6f4e] active:scale-95 hover:text-[#c4956a]'"
      >
        <component 
          :is="link.icon" 
          :size="24" 
          :weight="isLinkActive(link.href) ? 'fill' : 'regular'"
          :class="isLinkActive(link.href) ? 'animate-bounce-short drop-shadow-[0_2px_4px_rgba(240,208,96,0.3)]' : ''"
        />
        <span class="text-[9px] font-pixel tracking-wide" :class="isLinkActive(link.href) ? 'font-bold' : ''">
          {{ link.label }}
        </span>
        
        <!-- Active indicator dot -->
        <div 
          v-if="isLinkActive(link.href)"
          class="absolute -bottom-1 w-1 h-1 rounded-full bg-[#f0d060] shadow-[0_0_8px_rgba(240,208,96,0.8)]"
        ></div>
      </RouterLink>
      <button
        @click="toggleMoreMenu"
        class="flex flex-col items-center justify-center w-full gap-1 p-2 rounded-xl transition-all relative text-[#8b6f4e] active:scale-95 hover:text-[#c4956a]"
        :class="showMoreMenu ? 'text-[#f0d060]' : ''"
      >
        <component 
          :is="showMoreMenu ? PhX : PhList" 
          :size="24" 
          :weight="showMoreMenu ? 'bold' : 'regular'"
        />
        <span class="text-[9px] font-pixel tracking-wide" :class="showMoreMenu ? 'font-bold' : ''">
          Lainnya
        </span>
      </button>
    </div>

    <!-- More Menu Popup -->
    <div 
      v-if="showMoreMenu" 
      class="absolute bottom-[64px] right-2 w-48 bg-[#1c120a] border-2 border-[#5a3a18] rounded-xl shadow-xl flex flex-col p-2 gap-1 animate-in slide-in-from-bottom-2 fade-in duration-200"
    >
      <div class="px-2 pb-1 border-b border-[#3d2b1e] mb-1">
        <span class="text-[9px] font-pixel text-[#a08060] uppercase">Menu Lainnya</span>
      </div>
      
      <RouterLink to="/presensi" @click="handleLinkClick" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-pixel text-[10px] text-[#f0e0c0] hover:bg-[#2d1b0e] transition-colors">
        <PhCalendarCheck :size="16" weight="bold" class="text-[#f0d060]" />
        <span>Presensi</span>
      </RouterLink>
      
      <RouterLink to="/ormawa" @click="handleLinkClick" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-pixel text-[10px] text-[#f0e0c0] hover:bg-[#2d1b0e] transition-colors">
        <PhStorefront :size="16" weight="bold" class="text-[#f0d060]" />
        <span>Ormawa</span>
      </RouterLink>
      
      <RouterLink to="/leaderboard" @click="handleLinkClick" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-pixel text-[10px] text-[#f0e0c0] hover:bg-[#2d1b0e] transition-colors">
        <PhTrophy :size="16" weight="bold" class="text-[#f0d060]" />
        <span>Peringkat</span>
      </RouterLink>

      <div class="px-2 pt-2 mt-1 border-t border-[#3d2b1e] flex items-center justify-between">
        <span class="text-[9px] font-pixel text-[#a08060]">Pengaturan</span>
        <div class="flex items-center gap-2">
          <button @click="gameStore.toggleSound" class="p-1.5 rounded-md border transition-all cursor-pointer" :class="gameStore.soundEnabled ? 'bg-[#2d1b0e] text-[#7ec850] border-[#7ec850]' : 'bg-[#23160c] text-[#a08060] border-[#5a3a18]'">
            <PhSpeakerHigh v-if="gameStore.soundEnabled" :size="14" weight="bold" />
            <PhSpeakerSimpleSlash v-else :size="14" weight="bold" />
          </button>
          
          <button @click="gameStore.toggleCrt" class="p-1.5 rounded-md border transition-all cursor-pointer" :class="gameStore.crtEffect ? 'bg-[#2d1b0e] text-[#f0d060] border-[#f0d060]' : 'bg-[#23160c] text-[#a08060] border-[#5a3a18]'">
            <PhTelevision :size="14" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
@keyframes bounce-short {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.animate-bounce-short {
  animation: bounce-short 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
