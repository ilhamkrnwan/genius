<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { animatePageEnter, staggerFadeUp, bouncePop } from '@/lib/gsap';
import {
  PhTrophy,
  PhCheckCircle,
  PhArrowRight,
  PhPlay,
  PhGameController,
  PhLock,
} from '@phosphor-icons/vue';
import { FLOORS_DATA, BOOTHS_DATA } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import { soundEngine } from '@/lib/sound';

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
    if (!isNaN(floorParam) && floorParam >= 1 && floorParam <= 6) {
      selectedFloorNumber.value = floorParam;
    }
  } else {
    // Default to active session floor, or highest completed floor, or 1
    const activeSession = gameSessionStore.mySessions.find((s: any) => s.status !== 'COMPLETED');
    if (activeSession) {
      selectedFloorNumber.value = activeSession.floorNumber;
    } else {
      const completedSessions = gameSessionStore.mySessions.filter((s: any) => s.status === 'COMPLETED');
      if (completedSessions.length > 0) {
        const highestCompleted = Math.max(...completedSessions.map((s: any) => s.floorNumber));
        selectedFloorNumber.value = highestCompleted;
      }
    }
  }
});

watch(selectedFloorNumber, () => {
  nextTick(() => {
    bouncePop('.map-floor-detail', { duration: 0.35 });
  });
});

const backendBoothsForFloor = computed(() => {
  const localIds = selectedFloor.value.boothIds || [];
  const floorSessions = gameSessionStore.mySessions.filter((s: any) => s.floorNumber === selectedFloorNumber.value);

  return localIds.map((bId) => {
    const template = BOOTHS_DATA[bId] || BOOTHS_DATA['booth-1a'];
    if (!template) return null;

    const matchingSessions = floorSessions.filter((s: any) =>
      s.locationCode === template.code ||
      s.missionId === template.id ||
      (template.code && s.locationCode?.startsWith(template.code))
    );

    const bestSession = matchingSessions.find((s: any) => s.status === 'COMPLETED')
      || matchingSessions.find((s: any) => s.status === 'ACTIVE')
      || matchingSessions.find((s: any) => s.status === 'READY')
      || matchingSessions[matchingSessions.length - 1];

    const isCompleted = gameStore.isBoothCompleted(bId) || bestSession?.status === 'COMPLETED';

    return {
      id: bestSession?.missionId || bId,
      originalBoothId: bId,
      code: bestSession?.locationCode || template.code,
      name: bestSession?.missionName || template.name,
      stampIcon: template?.stampIcon || 'trophy',
      tipe_game: bestSession?.gameType?.toLowerCase() || template.tipe_game,
      status: isCompleted ? 'COMPLETED' : (bestSession?.status || 'PENDING'),
      floorNumber: template.floorNumber
    };
  }).filter(Boolean) as any[];
});

function boothPath(booth: any) {
  return `/play/floor/${booth.floorNumber}/spot/${booth.id}`;
}

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
  <div class="w-full space-y-2.5">
    <!-- Top Status Bar -->
    <div class="map-top-bar bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-md shrink-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-[#2d1b0e] border border-[#8b6f4e] flex items-center justify-center text-[#f0d060] shrink-0 shadow">
          <PhGameController :size="16" weight="bold" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-pixel text-[10px] sm:text-xs font-bold text-[#f0d060] leading-tight">
            PROGRES EKSPLORASI
          </div>
          <div class="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-sans text-[#c4956a] flex-wrap mt-0.5">
            <span>{{ completedFloors }}/6 Lantai</span>
            <span>•</span>
            <span class="text-[#7ec850]">{{ gameStore.getTotalStampsCount() }}/9 Stempel</span>
            <span>•</span>
            <span class="text-[#f0d060]">{{ gameStore.participant.totalXp }} XP</span>
          </div>
        </div>
      </div>

      <RouterLink to="/play" class="shrink-0">
        <button
          type="button"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="rpg-btn-primary py-1.5 px-2.5 text-[9.5px] sm:text-[10px] font-pixel font-bold flex items-center gap-1 shadow"
        >
          <PhPlay :size="11" weight="fill" />
          <span>Mulai</span>
        </button>
      </RouterLink>
    </div>

    <!-- 6 Floors Horizontal Selector -->
    <div class="bg-[#19110a]/95 backdrop-blur-md p-2 border border-[#8b6f4e] rounded-xl shrink-0 space-y-1.5 shadow">
      <div class="flex items-center justify-between px-1">
        <span class="text-[8.5px] font-pixel text-[#a08060] uppercase tracking-wider">
          PILIH LANTAI:
        </span>
        <span class="text-[8.5px] font-pixel text-[#f0d060]">
          Lantai Aktif: L{{ selectedFloorNumber }}
        </span>
      </div>

      <div class="grid grid-cols-6 gap-1 sm:gap-1.5">
        <button
          v-for="floor in FLOORS_DATA"
          :key="floor.number"
          type="button"
          @click="handleSelectFloor(floor.number)"
          :class="[
            'map-floor-btn py-1.5 px-1 rounded-lg text-center border font-pixel text-[9.5px] sm:text-xs transition-all cursor-pointer flex flex-col items-center justify-center relative',
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
    <div class="map-floor-detail bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-lg">
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
            class="rpg-btn-primary py-1.5 px-2.5 text-[9.5px] sm:text-[10px] font-pixel font-bold flex items-center gap-1 shadow"
          >
            <span>Lihat Intro</span>
            <PhArrowRight :size="11" weight="bold" />
          </button>
        </RouterLink>
      </div>

      <!-- Spots Grid -->
      <div class="space-y-2 py-1 flex-1 flex flex-col justify-center">
        <div class="text-[8.5px] font-pixel text-[#a08060] uppercase px-0.5">
          {{ gameSessionStore.status === 'loading' ? 'Memuat data misi...' : backendBoothsForFloor.length + ' Pos Misi Tersedia' }}
        </div>

        <div v-if="backendBoothsForFloor.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <!-- Dynamic Booth Cards -->
          <div
            v-for="(booth) in backendBoothsForFloor"
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
                  class="py-1 px-2.5 rounded text-[9.5px] sm:text-[10px] font-pixel font-bold cursor-pointer transition-all rpg-btn-primary"
                >
                  Main
                </button>
              </RouterLink>
              <button
                v-else
                type="button"
                disabled
                class="py-1 px-2.5 rounded text-[9.5px] sm:text-[10px] font-pixel font-bold transition-all bg-[#2d1b0e] text-[#7ec850] border border-[#4a8030] cursor-not-allowed"
              >
                Tuntas
              </button>
            </div>
          </div>
        </div>
        <div v-else class="border-2 border-dashed border-[#5a3a18] bg-[#1a0f07] p-4 text-center rounded-xl space-y-2">
          <div class="flex justify-center text-[#c4956a]">
            <PhLock :size="24" weight="bold" />
          </div>
          <p class="text-xs text-[#a08060] font-sans">
            Game Master belum membuka akses pos apa pun untuk tim Anda di Lantai {{ selectedFloorNumber }}.
          </p>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="border-t border-[#3d2b1e] pt-1.5 text-center text-[9px] font-sans text-[#a08060] shrink-0">
        Selesaikan seluruh tantangan di lantai ini untuk membuka stempel petualangan!
      </div>
    </div>
  </div>
</template>
