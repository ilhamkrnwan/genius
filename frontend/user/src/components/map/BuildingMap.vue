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
import { FLOORS_DATA, BOOTHS_DATA } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';
import { normalizePlayableMission } from '@/lib/game-adapter';
import type { Booth } from '@/types/game';
import type { PlayableMission } from '@genius-unu/shared';

const gameStore = useGameStore();
const selectedFloorNumber = ref<number>(1);
const backendMissions = ref<PlayableMission[]>([]);
const backendLoading = ref(false);

const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const selectedFloor = computed(
  () => FLOORS_DATA.find((f) => f.number === selectedFloorNumber.value) || FLOORS_DATA[0]
);
const boothsForFloor = computed<Booth[]>(() => {
  const backendList = backendMissions.value
    .filter((mission) => mission.floorNumber === selectedFloorNumber.value)
    .map((mission) => normalizePlayableMission(mission as any));
  if (backendList.length > 0) return backendList;

  const localIds = selectedFloor.value.boothIds || [];
  return localIds.map((id) => BOOTHS_DATA[id]).filter(Boolean) as Booth[];
});
const backendError = ref<string | null>(null);

function boothPath(booth: Booth) {
  return backendMissions.value.some((mission) => mission.id === booth.id)
    ? `/booth/${booth.id}`
    : `/play/floor/${booth.floorNumber}/spot/${booth.id}`;
}

onMounted(async () => {
  animatePageEnter('.map-top-bar', { y: 15, duration: 0.4 });
  staggerFadeUp('.map-floor-btn', 0.03, { delay: 0.1 });
  bouncePop('.map-floor-detail', { delay: 0.25 });

  if (!localStorage.getItem('genius_user_token')) {
    backendError.value = 'Login participant backend diperlukan untuk memuat mission.';
    return;
  }
  backendLoading.value = true;
  const response = await api.getAvailableMissions();
  if (response.success && response.data) backendMissions.value = response.data;
  else backendError.value = response.error?.message || 'Mission backend gagal dimuat.';
  backendLoading.value = false;
});

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
            <span class="text-[#7ec850]">{{ gameStore.participant.completedBooths.length }}/9 Stempel</span>
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

    <!-- 6 Floors Horizontal Selector -->
    <div class="bg-[#170f07] p-1.5 sm:p-2 border-2 border-[#5a3a18] rounded-xl shrink-0">
      <div class="flex items-center justify-between px-1 pb-1">
        <span class="text-[9px] font-pixel text-[#a08060] uppercase">
          PILIH LANTAI:
        </span>
        <span class="text-[9px] font-pixel text-[#f0d060]">
          Lantai Aktif: L{{ selectedFloorNumber }}
        </span>
      </div>

      <div class="grid grid-cols-6 gap-1 sm:gap-2">
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

        <RouterLink :to="`/play/floor/${selectedFloor.number}/intro`" class="shrink-0">
          <button
            type="button"
            @click="() => gameStore.soundEnabled && soundEngine.playClick()"
            class="rpg-btn-primary py-1.5 px-3 text-[10px] sm:text-xs font-pixel font-bold flex items-center gap-1.5 shadow"
          >
            <span>Mulai Lantai</span>
            <PhArrowRight :size="12" weight="bold" />
          </button>
        </RouterLink>
      </div>

      <!-- Spots Grid -->
      <div class="space-y-2 py-2 flex-1 flex flex-col justify-center">
        <div class="text-[9px] font-pixel text-[#a08060] uppercase px-0.5">
          {{ backendLoading ? 'Memuat mission backend...' : boothsForFloor.length + ' Spot Tantangan:' }}
        </div>

        <div v-if="boothsForFloor.length > 0" :class="['grid gap-2', boothsForFloor.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2']">
          <div
            v-for="spot in boothsForFloor"
            :key="spot.id"
            :class="[
              'p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all',
              gameStore.participant.completedBooths.includes(spot.id) || gameStore.participant.completedBooths.includes(spot.code)
                ? 'bg-[#1a2e1a] border-[#4a8030]'
                : 'bg-[#170f07] border-[#3d2b1e] hover:border-[#5a3a18]'
            ]"
          >
            <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#23160c] border border-[#5a3a18] flex items-center justify-center shrink-0">
                <StampIcon :name="spot.stampIcon" :size="16" class="text-[#f0d060]" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-pixel text-[8px] text-[#f0d060]">
                    {{ spot.code }}
                  </span>
                  <PixelBadge variant="gold" size="sm">
                    {{ getGameTypeLabel(spot.tipe_game) }}
                  </PixelBadge>
                </div>
                <h4 class="font-pixel text-[9px] sm:text-[10px] font-bold text-white leading-normal break-words mt-0.5">
                  {{ spot.name }}
                </h4>
              </div>
            </div>

            <div class="shrink-0">
              <RouterLink :to="boothPath(spot)">
                <button
                  type="button"
                  @click="() => gameStore.soundEnabled && soundEngine.playClick()"
                  :class="[
                    'py-1 px-2.5 rounded text-[10px] sm:text-[11px] font-pixel font-bold cursor-pointer transition-all',
                    gameStore.participant.completedBooths.includes(spot.id) || gameStore.participant.completedBooths.includes(spot.code)
                      ? 'bg-[#2d1b0e] text-[#a08060] border border-[#5a3a18] hover:text-white'
                      : 'rpg-btn-primary'
                  ]"
                >
                  {{ gameStore.participant.completedBooths.includes(spot.id) || gameStore.participant.completedBooths.includes(spot.code) ? 'Ulang' : 'Main' }}
                </button>
              </RouterLink>
            </div>
          </div>
        </div>
        <div v-else-if="!backendLoading" class="border border-[#d44040] bg-[#2d1210] p-4 text-center text-xs text-[#ffd0d0] font-sans">
          {{ backendError || 'Belum ada tantangan aktif di lantai ini.' }}
        </div>
      </div>

      <!-- Footer Note -->
      <div class="border-t border-[#3d2b1e] pt-1.5 text-center text-[9px] font-sans text-[#a08060] shrink-0">
        Selesaikan seluruh tantangan di lantai ini untuk membuka stempel petualangan!
      </div>
    </div>
  </div>
</template>
