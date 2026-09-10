<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import AmbientEffects from '@/components/ambient/AmbientEffects.vue';
import {
  PhSparkle,
  PhGameController,
  PhIdentificationBadge,
  PhInfo,
  PhBuildings,
  PhCheckCircle,
  PhX,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhTelevision,
  PhGenderMale,
  PhGenderFemale,
  PhCrown,
  PhTrophy,
  PhCalendarCheck,
  PhQrCode,
  PhStorefront,
  PhTree,
  PhCaretDown,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { AVATAR_OPTIONS, UNU_FACULTIES } from '@/data/mockData';
import { soundEngine } from '@/lib/sound';
import { gsap, floatElement } from '@/lib/gsap';

const gameStore = useGameStore();

const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const totalStamps = computed(() => gameStore.getTotalStampsCount());
const currentLevel = computed(() => gameStore.getCurrentLevel());
const isCheckedInToday = computed(() => gameStore.isDayCheckedIn(gameStore.activeDay || 1));

import MabaAuthModal from '@/components/auth/MabaAuthModal.vue';

// Auth / Profile Onboarding Modal State
const isAuthModalOpen = ref(
  !gameStore.isLoggedIn || !gameStore.participant.isRegistered || !gameStore.participant.name
);
const authInitialStep = ref<'login' | 'profile'>(
  gameStore.isLoggedIn ? 'profile' : 'login'
);

const openLoginModal = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  authInitialStep.value = 'login';
  isAuthModalOpen.value = true;
};

const openProfileModal = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  authInitialStep.value = 'profile';
  isAuthModalOpen.value = true;
};

const handleAuthComplete = () => {
  isAuthModalOpen.value = false;
};

const handleSelectQuickAvatar = (avatarId: string) => {
  gameStore.setParticipantInfo({ avatar: avatarId });
  if (gameStore.soundEnabled) soundEngine.playSelect();
};

const scrollToStory = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  const el = document.getElementById('story-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  tl.from('.hero-topbar', { y: -25, opacity: 0, duration: 0.55 })
    .from('.hero-title-wrap', { y: 25, opacity: 0, duration: 0.55, ease: 'back.out(1.4)' }, '-=0.2')
    .from('.hero-char-box', { y: 20, opacity: 0, duration: 0.45 }, '-=0.25')
    .from('.hero-cta-main', { scale: 0.92, y: 15, opacity: 0, duration: 0.4, ease: 'back.out(1.8)' }, '-=0.2')
    .from('.hero-awwwards-dock', { y: 25, opacity: 0, duration: 0.5, ease: 'back.out(1.2)' }, '-=0.2');
});
</script>

<template>
  <div class="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden select-none">
    <!-- Background Image: Bright & Clearly Visible UNU Campus 9 Floors Building -->
    <div class="absolute inset-0 z-0 pointer-events-none">
      <img
        src="/unu-hero.jpeg"
        alt="Gedung Kampus Terpadu UNU Yogyakarta"
        class="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05] saturate-[1.05] animate-ken-burns"
      />
      <!-- Soft, translucent warm gradient overlay so building stays clearly visible -->
      <div class="absolute inset-0 bg-gradient-to-b from-[#120b06]/75 via-transparent to-[#160d07]/90 pointer-events-none" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(18,11,6,0.4)_100%)] pointer-events-none" />
    </div>

    <!-- Ambient Nature Effects: Birds & Clouds -->
    <AmbientEffects :active="Boolean(gameStore.ambientEffects)" />

    <!-- Top Bar: Institutional Logo & Audio Controls -->
    <div class="hero-topbar relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 sm:pt-4 flex items-center justify-between gap-2 shrink-0">
      <!-- Partner / Institution Badge (Logo only on mobile, expands with text on desktop) -->
      <div
        class="backdrop-blur-md bg-[#140e0a]/85 border border-[#f0d060]/50 rounded-full p-1 sm:px-4 sm:py-1.5 flex items-center gap-2 sm:gap-3 shadow-lg shrink-0"
        title="UNU Yogyakarta — Orientasi Mahasiswa Baru 2026"
      >
        <img
          src="/unu.png"
          alt="Logo UNU Yogyakarta"
          class="h-6 sm:h-8 w-6 sm:w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        />
        <div class="hidden sm:block w-[1px] h-4 sm:h-6 bg-[#f0d060]/40" />
        <div class="hidden sm:flex flex-col text-left leading-none">
          <span class="font-pixel text-[8px] sm:text-[10px] text-[#f0d060] font-bold tracking-wider">
            UNU YOGYAKARTA
          </span>
          <span class="font-sans text-[8px] sm:text-[11px] text-[#a0d870] font-medium pt-0.5">
            Orientasi Mahasiswa Baru
          </span>
        </div>
      </div>

      <!-- Top Right Quick Controls & Student Profile -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Student Profile Button (Square box matching buttons beside it) -->
        <button
          type="button"
          @click="openProfileModal"
          class="p-1 sm:p-1.5 bg-[#2d1b0e]/90 border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg text-[#f0d060] transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 shrink-0"
          :title="`Profil: ${gameStore.participant.name || 'Mahasiswa Baru'} (Klik untuk ubah)`"
        >
          <div class="w-full h-full rounded border border-[#f0d060]/70 overflow-hidden bg-black/40">
            <img
              :src="gameStore.participant.avatar === 'character_cewek' ? '/character-cewek-avatar.png' : '/character-cowok-avatar.png'"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
          </div>
        </button>

        <button
          type="button"
          @click="gameStore.toggleSound"
          :title="gameStore.soundEnabled ? 'Matikan Suara 8-Bit' : 'Nyalakan Suara 8-Bit'"
          class="p-1.5 sm:p-2 bg-[#2d1b0e]/90 border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg text-[#f0d060] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <PhSpeakerHigh v-if="gameStore.soundEnabled" :size="16" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="16" weight="bold" />
        </button>

        <button
          type="button"
          @click="gameStore.toggleCrt"
          :title="gameStore.crtEffect ? 'Matikan Layar CRT' : 'Nyalakan Layar CRT'"
          class="p-1.5 sm:p-2 bg-[#2d1b0e]/90 border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg text-[#f0d060] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <PhTelevision :size="16" weight="bold" />
        </button>

        <button
          type="button"
          @click="gameStore.toggleAmbient"
          :title="gameStore.ambientEffects ? 'Matikan Efek Alam (Burung & Awan)' : 'Nyalakan Efek Alam (Burung & Awan)'"
          :class="[
            'p-1.5 sm:p-2 bg-[#2d1b0e]/90 border rounded-lg transition-all shadow-md active:scale-95 cursor-pointer',
            gameStore.ambientEffects
              ? 'border-[#7ec850] text-[#7ec850]'
              : 'border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060]'
          ]"
        >
          <PhTree :size="16" weight="bold" />
        </button>

        <RouterLink to="/bantuan" class="inline-block">
          <button
            type="button"
            @click="() => gameStore.soundEnabled && soundEngine.playClick()"
            class="p-1.5 sm:p-2 bg-[#2d1b0e]/90 border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg text-[#f0d060] transition-all shadow-md active:scale-95 cursor-pointer"
            title="Panduan Petualang"
          >
            <PhInfo :size="16" weight="bold" />
          </button>
        </RouterLink>
      </div>
    </div>

    <!-- Main Menu Center Content -->
    <div class="relative z-10 w-full max-w-lg mx-auto px-3 sm:px-6 my-auto flex flex-col items-center justify-center text-center">
      <!-- Grand Title -->
      <div class="hero-title-wrap space-y-0.5 sm:space-y-1 mb-2.5 sm:mb-4">
        <h1
          class="font-pixel text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#f0d060] tracking-[4px] sm:tracking-[10px] animate-title-pulse drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)]"
          style="text-shadow: 2px 2px 0 #6b4f2e, 4px 4px 0 #1b120a, 0 0 20px rgba(240, 208, 96, 0.4);"
        >
          GENIUS
        </h1>
        <div
          class="font-pixel text-xs sm:text-xl md:text-2xl text-white tracking-[2px] sm:tracking-[4px]"
          style="text-shadow: 1px 1px 0 #2d1b0e, 0 2px 8px rgba(0,0,0,0.9);"
        >
          UPGRADE NEW YOU
        </div>
        <p
          class="font-pixel text-[8px] sm:text-[10px] text-[#a0d870] tracking-[1px] pt-0.5 uppercase"
          style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);"
        >
          ORIENTASI MAHASISWA BARU 2026
        </p>
      </div>

      <!-- Character Quick-Select Bar -->
      <div class="hero-char-box backdrop-blur-md bg-[#19120c]/90 border border-[#8b6f4e] rounded-xl p-2 mb-2.5 sm:mb-3 max-w-sm w-full shadow-md">
        <div class="flex items-center justify-between gap-2 px-1 mb-1.5">
          <div class="min-w-0 text-left">
            <span class="font-pixel text-[8px] text-[#f0d060] uppercase block">
              Karakter Petualang:
            </span>
            <span class="text-[9.5px] text-[#86efac] font-bold truncate block">
              {{ gameStore.participant.name || 'Mahasiswa Baru' }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="av in AVATAR_OPTIONS"
            :key="av.id"
            type="button"
            @click="handleSelectQuickAvatar(av.id)"
            :class="[
              'p-1.5 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer',
              gameStore.participant.avatar === av.id
                ? 'bg-gradient-to-r from-[#3d7828] to-[#255018] border-[#f0d060] shadow-[0_0_10px_rgba(126,200,80,0.4)]'
                : 'bg-[#170f07]/80 border-[#5a3a18] hover:border-[#8b6f4e]'
            ]"
          >
            <div class="w-8 h-8 rounded-md overflow-hidden bg-[#170f07] border border-[#f0d060] shrink-0 relative">
              <img
                :src="av.avatarImage"
                :alt="av.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="min-w-0">
              <div class="font-pixel text-[8px] text-white font-bold flex items-center gap-1">
                <span>{{ av.gender === 'pria' ? 'Cowok' : 'Cewek' }}</span>
                <PhGenderMale v-if="av.gender === 'pria'" :size="10" weight="bold" class="text-[#60a8d8]" />
                <PhGenderFemale v-else :size="10" weight="bold" class="text-[#ff8080]" />
              </div>
              <div class="font-sans text-[9px] text-[#c4956a]">
                {{ av.gender === 'pria' ? 'Peci & Jas' : 'Hijab & Jas' }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Main Action Button -->
      <div class="w-full max-w-sm flex flex-col items-center">
        <!-- Primary Action Button -->
        <RouterLink to="/play" class="hero-cta-main w-full">
          <button
            type="button"
            @click="() => gameStore.soundEnabled && soundEngine.playClick()"
            class="w-full py-2.5 sm:py-3.5 px-4 text-xs sm:text-sm font-pixel font-bold uppercase tracking-wider rpg-btn-primary flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <PhGameController :size="18" weight="bold" />
            <span>{{ totalStamps > 0 ? 'LANJUTKAN PENJELAJAHAN' : 'MULAI PERJALANAN' }}</span>
          </button>
        </RouterLink>

        <!-- Smooth Scroll to Story/Guide Section Button -->
        <button
          type="button"
          @click="scrollToStory"
          class="mt-2 text-[9px] sm:text-[10px] font-pixel text-[#f0d060]/90 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 rounded bg-black/40 border border-[#8b6f4e]/60 hover:border-[#f0d060] shadow-sm active:scale-95"
          title="Scroll ke panduan petualangan lengkap"
        >
          <span>📜 JELAJAHI MISI & PANDUAN</span>
          <PhCaretDown :size="12" weight="bold" class="animate-bounce text-[#7ec850]" />
        </button>
      </div>
    </div>

    <!-- Bottom Awwwards-style Floating Menu Dock -->
    <div class="hero-awwwards-dock relative z-20 w-full mx-auto px-2 sm:px-4 pb-3 sm:pb-5 shrink-0 flex flex-col items-center">
      <!-- Floating Dock Container (Snug w-fit, compact gap, NO pills, pure Awwwards layout) -->
      <nav
        class="w-fit max-w-full backdrop-blur-xl bg-[#140e09]/95 border border-[#8b6f4e]/80 rounded-2xl p-1.5 sm:p-2 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar"
        aria-label="Navigasi Utama"
      >
        <!-- 1. Presensi Box -->
        <RouterLink
          to="/presensi"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-[#22160d] border border-[#5c3e23] hover:border-[#f0d060] hover:bg-[#322013] transition-all flex items-center justify-center shrink-0 group cursor-pointer shadow-sm relative active:scale-95"
          :class="isCheckedInToday ? 'border-[#22c55e]/70 bg-[#162713]/80' : ''"
          :title="isCheckedInToday ? 'Presensi Harian (Sudah Hadir)' : 'Presensi Kehadiran Harian'"
        >
          <PhCalendarCheck
            :size="19"
            weight="fill"
            :class="isCheckedInToday ? 'text-[#86efac]' : 'text-[#f59e0b] group-hover:scale-110 transition-transform'"
          />
          <span v-if="isCheckedInToday" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#22c55e] ring-1 ring-[#162713] animate-pulse" />
        </RouterLink>

        <!-- 3. Ormawa Expo Box -->
        <RouterLink
          to="/ormawa"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-[#22160d] border border-[#5c3e23] hover:border-[#c084fc] hover:bg-[#322013] transition-all flex items-center justify-center shrink-0 group cursor-pointer shadow-sm active:scale-95"
          title="Ormawa Expo & Stand UKM"
        >
          <PhStorefront :size="19" weight="fill" class="text-[#c084fc] group-hover:scale-110 transition-transform" />
        </RouterLink>

        <!-- 4. Paspor Digital Box -->
        <RouterLink
          to="/paspor"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-[#22160d] border border-[#5c3e23] hover:border-[#facc15] hover:bg-[#322013] transition-all flex items-center justify-center shrink-0 group cursor-pointer shadow-sm active:scale-95"
          title="Paspor Petualang & Stempel Corner"
        >
          <PhIdentificationBadge :size="19" weight="bold" class="text-[#facc15] group-hover:scale-110 transition-transform" />
        </RouterLink>

        <!-- 5. Peringkat / Leaderboard Box -->
        <RouterLink
          to="/leaderboard"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-[#22160d] border border-[#5c3e23] hover:border-[#facc15] hover:bg-[#322013] transition-all flex items-center justify-center shrink-0 group cursor-pointer shadow-sm active:scale-95"
          title="Papan Peringkat / Leaderboard XP"
        >
          <PhTrophy :size="19" weight="fill" class="text-[#facc15] group-hover:scale-110 transition-transform" />
        </RouterLink>

        <!-- 6. Panduan Box -->
        <RouterLink
          to="/bantuan"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-[#22160d] border border-[#5c3e23] hover:border-[#86efac] hover:bg-[#322013] transition-all flex items-center justify-center shrink-0 group cursor-pointer shadow-sm active:scale-95"
          title="Panduan Petualangan & Aturan Main"
        >
          <PhInfo :size="19" weight="bold" class="text-[#86efac] group-hover:scale-110 transition-transform" />
        </RouterLink>

        <!-- 7. Right Highlighted CTA Box -->
        <RouterLink
          to="/play"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="shrink-0"
          :title="totalStamps > 0 ? 'Lanjutkan Penjelajahan Kampus' : 'Mulai Eksplorasi Kampus'"
        >
          <button
            type="button"
            class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-[#fbf6e9] hover:bg-[#fef08a] border-2 border-[#d4af37] text-[#1b120a] flex items-center justify-center shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer group"
          >
            <PhGameController :size="21" weight="bold" class="text-[#1b120a] group-hover:scale-110 transition-transform" />
          </button>
        </RouterLink>
      </nav>
    </div>

    <!-- Modal Login & Profile Setup Mahasiswa Baru (Onboarding Flow) -->
    <MabaAuthModal
      :isOpen="isAuthModalOpen"
      :initialStep="authInitialStep"
      @close="isAuthModalOpen = false"
      @complete="handleAuthComplete"
    />
  </div>
</template>
