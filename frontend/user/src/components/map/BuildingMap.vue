<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import { animatePageEnter, staggerFadeUp, bouncePop } from '@/lib/gsap';
import {
  PhTrophy,
  PhCheckCircle,
  PhArrowRight,
  PhPlay,
  PhGameController,
} from '@phosphor-icons/vue';
import { FLOORS_DATA } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';
import { normalizePlayableMission } from '@/lib/game-adapter';
import type { Booth } from '@/types/game';
import type { PlayableMission } from '@genius-unu/shared';

import { useGameSessionStore } from '@/store/gameSessionStore';
import { BOOTHS_DATA } from '@/data/mockData';
import { useRoute } from 'vue-router';

const gameStore = useGameStore();
const gameSessionStore = useGameSessionStore();
const route = useRoute();
const selectedFloorNumber = ref<number>(1);

const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const selectedFloor = computed(
  () => FLOORS_DATA.find((f) => f.number === selectedFloorNumber.value) || FLOORS_DATA[0]
);

onMounted(async () => {
  animatePageEnter('.map-top-bar', { y: 15, duration: 0.4 });
  staggerFadeUp('.map-floor-btn', 0.03, { delay: 0.1 });
  bouncePop('.map-floor-detail', { delay: 0.25 });

  await gameSessionStore.fetchMyTeamSessions();
  
  if (route.query.floor) {
    const floorParam = parseInt(route.query.floor as string, 10);
    if (!isNaN(floorParam) && floorParam >= 1 && floorParam <= 9) {
      selectedFloorNumber.value = floorParam;
    }
  } else {
    // If no floor param, default to the floor with an active mission!
    const activeSession = gameSessionStore.mySessions.find((s: any) => s.status !== 'COMPLETED');
    if (activeSession) {
      selectedFloorNumber.value = activeSession.floorNumber;
    } else {
      // If no active mission, find the latest completed floor or default to 1
      const completedSessions = gameSessionStore.mySessions.filter((s: any) => s.status === 'COMPLETED');
      if (completedSessions.length > 0) {
        // Sort to find the highest floor number completed
        const highestCompleted = Math.max(...completedSessions.map((s: any) => s.floorNumber));
        selectedFloorNumber.value = highestCompleted;
      }
    }
  }
});

const backendBoothsForFloor = computed(() => {
  const floorSessions = gameSessionStore.mySessions.filter((s: any) => s.floorNumber === selectedFloorNumber.value);
  
  return floorSessions.map((session: any) => {
    // Extract letter A/B/C from locationCode (e.g. "B2-A" -> "a")
    const letter = session.locationCode?.slice(-1)?.toLowerCase() || 'a';
    // Match with the mockData.ts booth ID format (e.g. 'booth-2a')
    const templateId = `booth-${session.floorNumber}${letter}`;
    
    const template = BOOTHS_DATA[templateId] || BOOTHS_DATA['booth-1a'];

    return {
      id: session.missionId,
      code: session.locationCode || template.code,
      name: session.missionName || template.name,
      stampIcon: template.stampIcon,
      tipe_game: session.gameType?.toLowerCase() || template.tipe_game,
      status: session.status,
      floorNumber: session.floorNumber
    };
  });
});

function boothPath(booth: any) {
  return `/play/floor/${booth.floorNumber}/spot/${booth.id}`;
}

watch(selectedFloorNumber, () => {
  nextTick(() => {
    bouncePop('.map-floor-detail', { duration: 0.35 });
  });
});

const handleSelectFloor = (floorNum: number) => {
  selectedFloorNumber.value = floorNum;
  if (gameStore.soundEnabled) soundEngine.playSelect();
};

const getGameTypeLabel = (type: string) => {
  switch (type) {
    case 'tts':
      return 'TTS';
    case 'tebak_kata':
      return 'Tebak Kata';
    case 'tebak_posisi':
      return 'Tebak Posisi';
    case 'tebak_gambar':
      return 'Tebak Gambar';
    case 'kuis_balapan':
      return 'Quiz';
    case 'memory_match':
      return 'Memory Match';
    case 'kuis_cepat':
      return 'Quiz';
    case 'benar_salah':
      return 'Benar / Salah';
    default:
      return 'Mini-Game';
  }
};
</script>

<template>
  <div class="w-full h-full max-w-5xl mx-auto px-2.5 sm:px-6 py-2 sm:py-4 flex flex-col justify-between overflow-hidden gap-2">
    <!-- Top Status Bar -->
    <div class="map-top-bar bg-[#1f140a] border-2 border-[#5a3a18] rounded-xl p-2 sm:p-3 flex items-center justify-between gap-2 shadow-md shrink-0">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div class="w-8 h-8 sm:w-9 sm:h-9 bg-[#2d1b0e] border border-[#8b6f4e] rounded-lg flex items-center justify-center text-[#f0d060] shrink-0">
          <PhGameController :size="18" weight="bold" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-pixel text-[11px] sm:text-xs font-bold text-white leading-tight">
            PETA EKSPLORASI KAMPUS
          </div>
          <div class="flex items-center gap-1.5 text-[10px] sm:text-xs font-sans text-[#c4956a] flex-wrap">
            <span>{{ completedFloors }} Lantai Tuntas</span>
            <span>•</span>
            <span class="text-[#7ec850]">{{ gameStore.participant.completedBooths.length }}/18 Stempel</span>
            <span>•</span>
            <span class="text-[#f0d060]">{{ gameStore.participant.totalXp }} XP</span>
          </div>
        </div>
      </div>

      <RouterLink to="/play" class="shrink-0">
        <button
          type="button"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="rpg-btn-primary py-1.5 sm:py-2 px-3 text-[10px] sm:text-xs font-pixel font-bold flex items-center gap-1.5"
        >
          <PhPlay :size="12" weight="fill" />
          <span>Mulai</span>
        </button>
      </RouterLink>
    </div>

    <!-- 9 Floors Horizontal Selector -->
    <div class="bg-[#170f07] p-1.5 sm:p-2 border-2 border-[#5a3a18] rounded-xl shrink-0">
      <div class="flex items-center justify-between px-1 pb-1">
        <span class="text-[9px] font-pixel text-[#a08060] uppercase">
          PILIH LANTAI:
        </span>
        <span class="text-[9px] font-pixel text-[#f0d060]">
          Lantai Aktif: L{{ selectedFloorNumber }}
        </span>
      </div>

      <div class="grid grid-cols-9 gap-1 sm:gap-2">
        <button
          v-for="floor in FLOORS_DATA"
          :key="floor.number"
          type="button"
          @click="handleSelectFloor(floor.number)"
          :class="[
            'map-floor-btn py-1.5 sm:py-2 px-0.5 rounded-lg text-center border font-pixel text-[9px] sm:text-xs transition-all cursor-pointer flex flex-col items-center justify-center relative',
            selectedFloorNumber === floor.number
              ? 'bg-[#3d7828] border-[#f0d060] text-white font-bold shadow-[0_0_8px_rgba(240,208,96,0.4)] scale-[1.02]'
              : gameStore.getFloorStatus(floor.number) === 'completed'
              ? 'bg-[#1f3a2b] border-[#4a8030] text-[#7ec850] hover:bg-[#284a37]'
              : 'bg-[#23160c] border-[#3d2b1e] text-[#c4956a] hover:bg-[#2d1b0e]'
          ]"
        >
          <span>L{{ floor.number }}</span>
          <span
            v-if="gameStore.getFloorStatus(floor.number) === 'completed'"
            class="w-1.5 h-1.5 bg-[#7ec850] rounded-full mt-0.5"
          />
        </button>
      </div>
    </div>

    <!-- Selected Floor Details Card -->
    <div class="map-floor-detail flex-1 sdv-card p-3 sm:p-4 flex flex-col justify-between overflow-hidden shadow-lg">
      <!-- Floor Header -->
      <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-2 shrink-0">
        <div class="min-w-0 flex-1">
          <span class="font-pixel text-[8px] sm:text-[9px] text-[#7ec850] uppercase tracking-wider block">
            ZONA LANTAI {{ selectedFloor.number }}
          </span>
          <h2 class="font-pixel text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug break-words">
            {{ selectedFloor.name }}
          </h2>
        </div>

        <RouterLink v-if="backendBoothsForFloor.length > 0" :to="`/play/floor/${selectedFloor.number}/intro`" class="shrink-0">
          <button
            type="button"
            @click="() => gameStore.soundEnabled && soundEngine.playClick()"
            class="rpg-btn-primary py-1.5 px-3 text-[10px] sm:text-xs font-pixel font-bold flex items-center gap-1.5 shadow"
          >
            <span>Lihat Intro</span>
            <PhArrowRight :size="12" weight="bold" />
          </button>
        </RouterLink>
      </div>

      <!-- 2 Spots Grid -->
      <div class="space-y-2 py-2 flex-1 flex flex-col justify-center">
        <div class="text-[9px] font-pixel text-[#a08060] uppercase px-0.5">
          {{ gameSessionStore.status === 'loading' ? 'Memuat data misi...' : backendBoothsForFloor.length + ' Pos Misi Tersedia' }}
        </div>

        <div v-if="backendBoothsForFloor.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <!-- Dynamic Booth Cards -->
          <div
            v-for="(booth, index) in backendBoothsForFloor"
            :key="booth.id"
            :class="[
              'p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all',
              booth.status === 'COMPLETED'
                ? 'bg-[#1a2e1a] border-[#4a8030]'
                : 'bg-[#170f07] border-[#3d2b1e] hover:border-[#5a3a18]'
            ]"
          >
            <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#23160c] border border-[#5a3a18] flex items-center justify-center shrink-0">
                <StampIcon :name="booth.stampIcon" :size="16" class="text-[#f0d060]" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-pixel text-[8px] text-[#f0d060]">
                    {{ booth.code }}
                  </span>
                  <PixelBadge variant="gold" size="sm">
                    {{ getGameTypeLabel(booth.tipe_game) }}
                  </PixelBadge>
                </div>
                <h4 class="font-pixel text-[9px] sm:text-[10px] font-bold text-white leading-normal break-words mt-0.5">
                  {{ booth.name }}
                </h4>
              </div>
            </div>

            <div class="shrink-0">
              <RouterLink v-if="booth.status !== 'COMPLETED'" :to="boothPath(booth)">
                <button
                  type="button"
                  @click="() => gameStore.soundEnabled && soundEngine.playClick()"
                  class="py-1 px-2.5 rounded text-[10px] sm:text-[11px] font-pixel font-bold cursor-pointer transition-all rpg-btn-primary"
                >
                  Main
                </button>
              </RouterLink>
              <button
                v-else
                type="button"
                disabled
                class="py-1 px-2.5 rounded text-[10px] sm:text-[11px] font-pixel font-bold transition-all bg-[#2d1b0e] text-[#7ec850] border border-[#4a8030] cursor-not-allowed"
              >
                ✓ Tuntas
              </button>
            </div>
          </div>
        </div>
        <div v-else class="border-2 border-dashed border-[#5a3a18] bg-[#1a0f07] p-4 text-center rounded-xl space-y-2">
          <span class="text-3xl">🔒</span>
          <p class="text-xs text-[#a08060] font-sans">
            Game Master belum membuka akses pos apa pun untuk tim Anda di Lantai {{ selectedFloorNumber }}.
          </p>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="border-t border-[#3d2b1e] pt-1.5 text-center text-[9px] font-sans text-[#a08060] shrink-0">
        Setiap lantai memiliki 2 spot mini-game. Selesaikan keduanya untuk membuka stempel!
      </div>
    </div>
  </div>
</template>
