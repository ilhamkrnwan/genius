<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  PhCheckCircle,
  PhLockKey,
  PhArrowRight,
  PhCompass,
  PhSparkle,
  PhDoorOpen,
  PhGameController,
} from '@phosphor-icons/vue';
import { FLOORS_DATA } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { gsap } from '@/lib/gsap';

const router = useRouter();
const gameStore = useGameStore();

const floorsRootRef = ref<HTMLElement | null>(null);
const floorsHeaderRef = ref<HTMLElement | null>(null);
const floorsPillsRef = ref<HTMLElement | null>(null);
const floorsDetailRef = ref<HTMLElement | null>(null);

const selectedFloorNumber = ref<number>(1);

const selectedFloor = computed(() => {
  return FLOORS_DATA.find((f) => f.number === selectedFloorNumber.value) || FLOORS_DATA[0];
});

const isFloorUnlocked = (floorNum: number) => {
  return gameStore.participant.unlockedFloors?.includes(floorNum) ?? (floorNum === 1);
};

const handleSelectFloor = (floorNum: number) => {
  selectedFloorNumber.value = floorNum;
  if (gameStore.soundEnabled) soundEngine.playSelect();
  if (floorsDetailRef.value) {
    gsap.fromTo(
      floorsDetailRef.value,
      { opacity: 0.85, scale: 0.99 },
      { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
    );
  }
};

const handleExplore = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  if (selectedFloorNumber.value === 1) {
    router.push('/floor/1');
  } else {
    router.push(`/play/floor/${selectedFloorNumber.value}/intro`);
  }
};

onMounted(async () => {
  await nextTick();
  if (!floorsRootRef.value) return;

  // Header reveal
  if (floorsHeaderRef.value) {
    gsap.fromTo(floorsHeaderRef.value,
      { y: 35, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
        scrollTrigger: {
          trigger: floorsHeaderRef.value,
          start: 'top 88%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  }

  // Floor Selector Pills
  if (floorsPillsRef.value) {
    const pills = floorsPillsRef.value.querySelectorAll<HTMLElement>('.floor-pill-btn');
    if (pills.length > 0) {
      gsap.fromTo(pills,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.04, duration: 0.45, ease: 'power1.out',
          scrollTrigger: {
            trigger: floorsPillsRef.value,
            start: 'top 87%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }
  }

  // Showcase Card
  if (floorsDetailRef.value) {
    gsap.fromTo(floorsDetailRef.value,
      { scale: 0.95, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: 0.65, ease: 'back.out(1.3)',
        scrollTrigger: {
          trigger: floorsDetailRef.value,
          start: 'top 85%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  }
});

onUnmounted(() => {
  gsap.killTweensOf([floorsHeaderRef.value, floorsPillsRef.value, floorsDetailRef.value]);
});
</script>

<template>
  <section
    id="floors-preview"
    ref="floorsRootRef"
    class="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#24150a] border-t-4 border-[#5a3a18] text-[#f0e0c0]"
  >
    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section Header with GSAP Reveal -->
      <div ref="floorsHeaderRef" class="floors-header text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <h2 class="font-pixel text-2xl sm:text-4xl font-extrabold text-[#fbf6e9] leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Menara Kampus <span class="text-[#7ec850]">9 Tingkat Kemegahan</span>
        </h2>
        
        <p class="font-sans text-sm sm:text-base text-[#d6c3ae] leading-relaxed">
          Setiap lantai di Gedung Kampus Terpadu UNU Yogyakarta menyimpan cerita, misteri pilar karakter, dan booth interaktif unik. Pilih lantai untuk melihat pratinjau!
        </p>
      </div>

      <!-- Floor Selector Pills with GSAP Stagger -->
      <div ref="floorsPillsRef" class="floors-pills-bar flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar max-w-full">
        <button
          v-for="floor in FLOORS_DATA"
          :key="floor.number"
          type="button"
          @click="handleSelectFloor(floor.number)"
          :class="[
            'floor-pill-btn px-3 sm:px-4 py-2 rounded-lg font-pixel text-[10px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer border-2 shadow-md flex items-center gap-1.5 will-change-transform',
            selectedFloorNumber === floor.number
              ? 'bg-[#f0d060] text-[#1b120a] border-[#d4af37] scale-105 shadow-[0_0_12px_rgba(240,208,96,0.5)]'
              : 'bg-[#2d1b0e] text-[#a89078] border-[#5a3a18] hover:border-[#8b6f4e] hover:text-[#f0e0c0]'
          ]"
        >
          <span>LT {{ floor.number }}</span>
          <PhCheckCircle
            v-if="gameStore.getFloorStatus(floor.number) === 'completed'"
            :size="14"
            weight="fill"
            class="text-[#22c55e]"
          />
        </button>
      </div>

      <!-- Selected Floor Detail Showcase (Stardew Valley Card) with GSAP Reveal -->
      <div ref="floorsDetailRef" class="floors-detail-card sdv-card-gold p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        <div class="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <!-- Floor Basic Info & Theme -->
          <div class="flex-1">
            <div class="mb-3">
              <span class="font-pixel text-xs tracking-wider uppercase" :style="{ color: selectedFloor.accentColor }">
                {{ selectedFloor.theme }}
              </span>
            </div>

            <h3 class="font-pixel text-xl sm:text-2xl font-bold text-[#fbf6e9] mb-3 leading-snug">
              {{ selectedFloor.name }}
            </h3>

            <p class="font-sans text-sm text-[#d6c3ae] leading-relaxed mb-6">
              {{ selectedFloor.storyIntro?.narrative || selectedFloor.description }}
            </p>

            <!-- Learning Highlights -->
            <div v-if="selectedFloor.storyIntro?.keyLearning" class="space-y-2 mb-6">
              <span class="font-pixel text-[10px] text-[#f0d060] uppercase tracking-wider block">
                POKOK PEMBELAJARAN LANTAI:
              </span>
              <ul class="space-y-1.5">
                <li
                  v-for="(point, pIdx) in selectedFloor.storyIntro.keyLearning"
                  :key="pIdx"
                  class="flex items-start gap-2 text-xs sm:text-sm text-[#c4b5a2]"
                >
                  <PhSparkle :size="15" weight="fill" class="text-[#7ec850] shrink-0 mt-0.5" />
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>

            <!-- Action Button -->
            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                @click="handleExplore"
                class="rpg-btn-primary px-5 py-2.5 font-pixel text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <PhGameController :size="16" weight="bold" />
                <span>JELAJAHI LANTAI {{ selectedFloor.number }}</span>
              </button>

              <span class="text-xs text-[#a08060] font-sans">
                {{ selectedFloor.boothIds.length }} Booth Misi Tersedia
              </span>
            </div>
          </div>

          <!-- Floor Visual Tower Card (Mini Badge) -->
          <div class="w-full lg:w-72 bg-[#1b1107] border-2 border-[#5a3a18] rounded-xl p-5 shrink-0 flex flex-col items-center text-center shadow-inner">
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center border-2 mb-3 shadow-lg"
              :style="{
                backgroundColor: `${selectedFloor.accentColor}15`,
                borderColor: selectedFloor.accentColor
              }"
            >
              <PhDoorOpen :size="32" weight="duotone" :style="{ color: selectedFloor.accentColor }" />
            </div>

            <div class="font-pixel text-2xl font-black text-white mb-1">
              LT {{ selectedFloor.number }}
            </div>
            <div class="font-sans text-xs text-[#a89078] mb-4">
              {{ selectedFloor.name.split('-')[1]?.trim() || selectedFloor.theme }}
            </div>

            <div class="w-full pt-3 border-t border-[#3a2818] space-y-2 text-left">
              <div class="flex justify-between text-[11px]">
                <span class="text-[#8b6f4e]">Status Akses:</span>
                <span :class="isFloorUnlocked(selectedFloor.number) ? 'text-[#7ec850] font-bold' : 'text-[#facc15]'">
                  {{ isFloorUnlocked(selectedFloor.number) ? 'Bisa Dimainkan' : 'Misi Terkunci' }}
                </span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span class="text-[#8b6f4e]">Mini-Game:</span>
                <span class="text-[#fbf6e9] font-medium">Kuis & Logika</span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span class="text-[#8b6f4e]">Target Skor:</span>
                <span class="text-[#f0d060] font-bold">Min. 70%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
