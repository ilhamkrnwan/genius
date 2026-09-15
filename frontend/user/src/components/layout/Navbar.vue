<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhTelevision,
  PhIdentificationBadge,
  PhBuildings,
  PhTrophy,
  PhHouse,
  PhGameController,
  PhCalendarCheck,
  PhStorefront,
  PhUsersThree,
  PhList,
  PhX,
  PhSparkle,
  PhUser,
  PhCaretRight,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import { soundEngine } from '@/lib/sound';

const route = useRoute();
const gameStore = useGameStore();

const mobileMenuOpen = ref(false);

const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const totalStamps = computed(() => gameStore.getTotalStampsCount());
const currentLevel = computed(() => gameStore.getCurrentLevel());
const currentXp = computed(() => gameStore.participant.totalXp || 0);
const playerName = computed(() => gameStore.participant.name || 'Mahasiswa Baru');

const playerAvatar = computed(() => {
  const isFemale =
    gameStore.participant.avatar === 'character_cewek' ||
    gameStore.participant.gender === 'perempuan';
  return isFemale
    ? '/character-cewek-avatar.png'
    : '/character-cowok-avatar.png';
});

const navLinks = [
  { href: '/', label: 'Beranda', icon: PhHouse },
  { href: '/play', label: 'Main', icon: PhGameController },
  { href: '/team', label: 'Regu', icon: PhUsersThree },
  { href: '/paspor', label: 'Profil', icon: PhIdentificationBadge },
  { href: '/presensi', label: 'Presensi', icon: PhCalendarCheck },
  { href: '/ormawa', label: 'Ormawa', icon: PhStorefront },
  { href: '/leaderboard', label: 'Peringkat', icon: PhTrophy },
];

const handleLinkClick = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  mobileMenuOpen.value = false;
};

const isLinkActive = (href: string) => {
  if (href === '/') return route.path === '/';
  if (href === '/play') {
    return (
      route.path.startsWith('/play') ||
      route.path.startsWith('/floor') ||
      route.path.startsWith('/dashboard') ||
      route.path.startsWith('/booth')
    );
  }
  if (href === '/team') {
    return (
      route.path.startsWith('/team') ||
      route.path.startsWith('/regu') ||
      route.path.startsWith('/kelompok')
    );
  }
  if (href === '/paspor') {
    return (
      route.path.startsWith('/paspor') ||
      route.path.startsWith('/passport') ||
      route.path.startsWith('/stamps')
    );
  }
  if (href === '/presensi') {
    return route.path.startsWith('/presensi') || route.path.startsWith('/attendance');
  }
  if (href === '/ormawa') {
    return route.path.startsWith('/ormawa') || route.path.startsWith('/expo');
  }
  if (href === '/leaderboard') {
    return route.path.startsWith('/leaderboard');
  }
  return route.path.startsWith(href);
};
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full bg-[#1e130a]/95 backdrop-blur-md border-b-2 border-[#6d4520] shadow-[0_4px_24px_rgba(0,0,0,0.65)] shrink-0 h-[60px] sm:h-[66px] flex items-center transition-all duration-300"
  >
    <div class="w-full max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-2">
      <!-- 1. Brand & Logo -->
      <RouterLink
        to="/"
        @click="handleLinkClick"
        class="flex items-center gap-2 group shrink-0 select-none"
        title="Halaman Beranda PKKMB UNU 2026"
      >
        <div
          class="w-8 h-8 sm:w-9 sm:h-9 bg-[#2b180d] border-2 border-[#8b6f4e] group-hover:border-[#f0d060] rounded-xl flex items-center justify-center shadow-md transition-all group-hover:scale-105 overflow-hidden"
        >
          <img
            src="/unu.png"
            alt="UNU Logo"
            width="28"
            height="28"
            class="h-6 sm:h-7 w-auto object-contain"
          />
        </div>
        <div>
          <div
            class="font-pixel text-xs sm:text-sm font-bold text-[#f0d060] group-hover:text-white tracking-wider leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-colors"
          >
            GENIUS
          </div>
          <div class="flex items-center gap-1 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
            <span class="text-[8.5px] sm:text-[9.5px] text-[#86efac] font-pixel leading-tight">
              UNU YOGYA
            </span>
          </div>
        </div>
      </RouterLink>

      <!-- 2. Desktop Navigation Links (Responsive lg+) -->
      <nav class="hidden lg:flex items-center gap-1 xl:gap-1.5">
        <RouterLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          @click="handleLinkClick"
          :class="[
            'flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 text-[11px] xl:text-xs font-pixel rounded-xl border transition-all cursor-pointer select-none',
            isLinkActive(link.href)
              ? 'bg-gradient-to-b from-[#38761d] to-[#254f13] text-[#fef08a] border-2 border-[#facc15] font-bold shadow-[0_2px_8px_rgba(250,204,21,0.35)] scale-[1.02]'
              : 'bg-[#24170d] hover:bg-[#342013] text-[#e2d4c0] hover:text-[#fef08a] border-[#5a3a18] hover:border-[#d4a373] shadow-sm active:translate-y-0.5'
          ]"
        >
          <component
            :is="link.icon"
            :size="16"
            :weight="isLinkActive(link.href) ? 'fill' : 'bold'"
            :class="isLinkActive(link.href) ? 'text-[#facc15]' : 'text-[#c4956a]'"
          />
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <!-- 3. Right Controls & Player Profile HUD -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Player Profile Pill (Clickable -> /profile) -->
        <RouterLink
          to="/profile"
          @click="handleLinkClick"
          class="flex items-center gap-2 px-2 py-1 bg-[#24170d] hover:bg-[#342013] border border-[#8b6f4e] hover:border-[#f0d060] rounded-xl transition-all shadow cursor-pointer group active:scale-95 select-none"
          title="Buka KTM & Profil Petualang"
        >
          <div
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#120a05] border border-[#f0d060] overflow-hidden shrink-0"
          >
            <img
              :src="playerAvatar"
              :alt="playerName"
              class="w-full h-full object-cover object-top"
            />
          </div>
          <div class="hidden sm:block text-left leading-tight">
            <div
              class="text-[9.5px] font-bold text-[#86efac] font-pixel group-hover:text-[#fde047] transition-colors truncate max-w-[85px] xl:max-w-[110px]"
            >
              {{ playerName }}
            </div>
            <div class="text-[7.5px] text-[#facc15] font-pixel">
              {{ currentLevel }}
            </div>
          </div>
        </RouterLink>

        <!-- Floor & Stamp Stats Badge (Desktop Extra-Large) -->
        <div
          class="hidden 2xl:flex items-center gap-2 bg-[#191009] px-2.5 py-1 border border-[#5a3a18] rounded-xl text-[10px] font-pixel shadow-inner"
        >
          <span class="text-[#f0d060] flex items-center gap-1">
            <PhBuildings :size="12" weight="fill" />
            {{ completedFloors }}/6 Lt
          </span>
          <span class="text-[#5a3a18]">•</span>
          <span class="text-[#86efac] flex items-center gap-1">
            <PhIdentificationBadge :size="12" weight="fill" />
            {{ totalStamps }}/9 Stempel
          </span>
        </div>

        <!-- Total XP Badge (XL Screens) -->
        <div
          class="hidden xl:flex items-center gap-1 bg-[#24170d] px-2 py-1 rounded-lg border border-[#8b6f4e] text-[10px] font-pixel text-[#facc15] font-bold shadow-sm"
        >
          <PhSparkle :size="12" weight="fill" />
          <span>+{{ currentXp }} XP</span>
        </div>

        <!-- Audio Toggle Button -->
        <button
          type="button"
          @click="gameStore.toggleSound"
          :title="gameStore.soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'"
          :class="[
            'p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm',
            gameStore.soundEnabled
              ? 'bg-[#1b2b14] text-[#86efac] border-[#22c55e]/60 hover:border-[#86efac]'
              : 'bg-[#24170d] text-[#a08060] border-[#5a3a18] hover:border-[#8b6f4e]'
          ]"
        >
          <PhSpeakerHigh v-if="gameStore.soundEnabled" :size="16" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="16" weight="bold" />
        </button>

        <!-- CRT Display Toggle Button -->
        <button
          type="button"
          @click="gameStore.toggleCrt"
          title="Efek Layar CRT"
          :class="[
            'p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm',
            gameStore.crtEffect
              ? 'bg-[#2b2210] text-[#facc15] border-[#facc15]/60 hover:border-[#facc15]'
              : 'bg-[#24170d] text-[#a08060] border-[#5a3a18] hover:border-[#8b6f4e]'
          ]"
        >
          <PhTelevision :size="16" weight="bold" />
        </button>

        <!-- Mobile / Tablet Hamburger Toggle (lg:hidden) -->
        <button
          type="button"
          @click="() => {
            if (gameStore.soundEnabled) soundEngine.playClick();
            mobileMenuOpen = !mobileMenuOpen;
          }"
          class="lg:hidden p-1.5 sm:p-2 bg-[#24170d] text-[#f0d060] border border-[#8b6f4e] hover:border-[#f0d060] hover:bg-[#342013] rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow"
          aria-label="Buka Menu Navigasi"
        >
          <PhX v-if="mobileMenuOpen" :size="18" weight="bold" />
          <PhList v-else :size="18" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Mobile & Tablet Slide-down Drawer Menu -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 top-[60px] sm:top-[66px] z-50 bg-[#0d0905]/85 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-start animate-in fade-in duration-200 shadow-2xl lg:hidden"
      @click="mobileMenuOpen = false"
    >
      <div
        class="bg-[#1c120a] border-2 border-[#8b6f4e] rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xl max-w-md mx-auto w-full"
        @click.stop
      >
        <!-- Header: User Card & Close Button -->
        <div class="flex items-center justify-between border-b border-[#3d2b1e] pb-2.5">
          <RouterLink
            to="/profile"
            @click="handleLinkClick"
            class="flex items-center gap-2.5 group"
          >
            <div class="w-8 h-8 rounded-lg bg-[#120a05] border border-[#f0d060] overflow-hidden">
              <img :src="playerAvatar" :alt="playerName" class="w-full h-full object-cover object-top" />
            </div>
            <div>
              <div class="text-xs font-bold text-[#86efac] font-pixel group-hover:text-[#fde047] transition-colors">
                {{ playerName }}
              </div>
              <div class="text-[8.5px] text-[#c4956a] font-pixel">
                NIM: {{ gameStore.participant.nim || '2026' }} • {{ currentLevel }}
              </div>
            </div>
          </RouterLink>

          <button
            type="button"
            @click="mobileMenuOpen = false"
            class="p-1 rounded-lg text-[#a08060] hover:text-[#f0d060] hover:bg-[#2d1b0e]"
          >
            <PhX :size="18" weight="bold" />
          </button>
        </div>

        <!-- Nav Links List -->
        <div class="grid grid-cols-1 gap-1.5 pt-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            @click="handleLinkClick"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl font-pixel text-xs border transition-all',
              isLinkActive(link.href)
                ? 'bg-gradient-to-r from-[#38761d] to-[#254f13] text-[#fef08a] border-[#facc15] font-bold shadow'
                : 'bg-[#24170d] text-[#e2d4c0] hover:text-[#fef08a] border-[#4a2e14] hover:bg-[#342013]'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <component
                :is="link.icon"
                :size="18"
                :weight="isLinkActive(link.href) ? 'fill' : 'bold'"
                :class="isLinkActive(link.href) ? 'text-[#facc15]' : 'text-[#c4956a]'"
              />
              <span>{{ link.label }}</span>
            </div>
            <PhCaretRight :size="12" weight="bold" class="opacity-60" />
          </RouterLink>
        </div>

        <!-- Footer Stats in Drawer -->
        <div class="pt-2.5 border-t border-[#3d2b1e] flex items-center justify-between text-[10px] font-pixel text-[#a08060]">
          <span class="text-[#f0d060]">✦ {{ completedFloors }}/6 Lantai</span>
          <span class="text-[#86efac]">✦ {{ totalStamps }}/9 Stempel</span>
          <span class="text-[#facc15]">✦ {{ currentXp }} XP</span>
        </div>
      </div>
    </div>
  </header>
</template>
