<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  PhCheck,
  PhArrowCounterClockwise,
  PhLightbulb,
  PhSparkle,
  PhArrowRight,
  PhCheckCircle,
  PhXCircle,
} from '@phosphor-icons/vue';
import { TebakKataContent } from '@/types/game';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';

interface PlacedLetter {
  id: string;
  char: string;
  originalIndex: number;
}

interface Props {
  content?: TebakKataContent;
  isCompleted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
});

const emit = defineEmits<{
  (e: 'complete', score: number, totalQuestions: number): void;
}>();

const gameStore = useGameStore();
const items = computed(() => props.content?.items || []);

const currentIndex = ref<number>(0);
const selectedLetters = ref<PlacedLetter[]>([]);
const usedTileIndices = ref<number[]>([]);
const isRoundSubmitted = ref<boolean>(false);
const isRoundCorrect = ref<boolean>(false);
const totalScore = ref<number>(0);
const showHint = ref<boolean>(false);
const shuffledLetters = ref<{ char: string; sourceIndex: number }[]>([]);

const currentItem = computed(() => items.value[currentIndex.value]);
const cleanTargetWord = computed(() => (currentItem.value?.targetWord || '').replace(/\s+/g, '').toUpperCase());
const targetLength = computed(() => cleanTargetWord.value.length);
const currentWordAttempt = computed(() => selectedLetters.value.map((l) => l.char).join(''));

const shuffleCurrentLetters = () => {
  shuffledLetters.value = currentItem.value?.scrambledLetters.map((char, sourceIndex) => ({
    char,
    sourceIndex,
  })) || [];

  for (let index = shuffledLetters.value.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledLetters.value[index], shuffledLetters.value[randomIndex]] = [
      shuffledLetters.value[randomIndex],
      shuffledLetters.value[index],
    ];
  }

  if (
    shuffledLetters.value.length > targetLength.value &&
    shuffledLetters.value
      .slice(0, targetLength.value)
      .map(({ char }) => char)
      .join('')
      .toUpperCase() === cleanTargetWord.value
  ) {
    [shuffledLetters.value[0], shuffledLetters.value[targetLength.value]] = [
      shuffledLetters.value[targetLength.value],
      shuffledLetters.value[0],
    ];
  }
};

watch(currentIndex, shuffleCurrentLetters, { immediate: true });

const wordGroups = computed(() => {
  if (!currentItem.value) return [];
  const words = currentItem.value.targetWord.toUpperCase().split(' ');
  let offset = 0;
  return words.map((w) => {
    const startIdx = offset;
    offset += w.length;
    return {
      word: w,
      length: w.length,
      startIndex: startIdx,
    };
  });
});

const handleSelectPoolTile = (char: string, index: number) => {
  if (isRoundSubmitted.value) return;
  if (selectedLetters.value.length >= targetLength.value) return;
  if (usedTileIndices.value.includes(index)) return;

  if (gameStore.soundEnabled) soundEngine.playSelect();

  selectedLetters.value.push({
    id: `${char}-${index}-${Date.now()}`,
    char,
    originalIndex: index,
  });
  usedTileIndices.value.push(index);
};

const handleRemovePlacedLetter = (letterIndex: number) => {
  if (isRoundSubmitted.value) return;
  const letterToRemove = selectedLetters.value[letterIndex];
  if (!letterToRemove) return;

  if (gameStore.soundEnabled) soundEngine.playClick();

  selectedLetters.value = selectedLetters.value.filter((_, idx) => idx !== letterIndex);
  usedTileIndices.value = usedTileIndices.value.filter(
    (origIdx) => origIdx !== letterToRemove.originalIndex
  );
};

const handleClearAll = () => {
  if (isRoundSubmitted.value) return;
  selectedLetters.value = [];
  usedTileIndices.value = [];
  if (gameStore.soundEnabled) soundEngine.playClick();
};

const handleCheckWord = () => {
  if (!currentItem.value || selectedLetters.value.length !== targetLength.value) return;

  const isMatch = currentWordAttempt.value.toUpperCase() === cleanTargetWord.value;
  isRoundSubmitted.value = true;
  isRoundCorrect.value = isMatch;

  if (isMatch) {
    if (gameStore.soundEnabled) soundEngine.playCorrect();
    const roundScore = currentItem.value.score ?? Math.round(100 / items.value.length);
    totalScore.value += roundScore;
  } else {
    if (gameStore.soundEnabled) soundEngine.playWrong();
  }
};

const handleNextRound = () => {
  if (currentIndex.value < items.value.length - 1) {
    currentIndex.value += 1;
    selectedLetters.value = [];
    usedTileIndices.value = [];
    isRoundSubmitted.value = false;
    isRoundCorrect.value = false;
    showHint.value = false;
    if (gameStore.soundEnabled) soundEngine.playClick();
  } else {
    emit('complete', totalScore.value, items.value.length);
  }
};

const handleRetryRound = () => {
  selectedLetters.value = [];
  usedTileIndices.value = [];
  isRoundSubmitted.value = false;
  isRoundCorrect.value = false;
  if (gameStore.soundEnabled) soundEngine.playClick();
};

const handleUseHint = () => {
  showHint.value = true;
  if (gameStore.soundEnabled) soundEngine.playSelect();
};
</script>

<template>
  <div v-if="currentItem" class="h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2 select-none">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-1.5 shrink-0">
      <div class="flex items-center gap-1.5">
        <div class="p-1 bg-[#170f07] border border-[#f0d060] rounded text-[#f0d060]">
          <PhSparkle :size="14" weight="fill" />
        </div>
        <div>
          <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-[#f0d060]">
            TEBAK KATA
          </h3>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <PixelBadge variant="emerald" size="sm">
          {{ totalScore }} Pts
        </PixelBadge>
        <PixelBadge variant="gold" size="sm">
          Kata {{ currentIndex + 1 }}/{{ items.length }}
        </PixelBadge>
      </div>
    </div>

    <!-- Clue Card -->
    <div class="sdv-card-elevated p-2 sm:p-2.5 space-y-1 shrink-0">
      <div class="flex items-center justify-between text-[8px] font-pixel">
        <span class="text-[#7ec850] uppercase">
          PETUNJUK #{{ currentIndex + 1 }}
        </span>
        <span class="text-[#f0d060]">
          {{ targetLength }} Huruf
        </span>
      </div>

      <p class="font-sans text-[11px] sm:text-xs text-white font-medium leading-relaxed text-justify break-words">
        {{ currentItem.clue }}
      </p>

      <div v-if="showHint && currentItem.hint" class="bg-[#170f07] p-1.5 rounded border border-[#f0d060]/50 text-[10px] font-sans text-[#f0d060] flex items-center gap-1.5 animate-in fade-in">
        <PhLightbulb :size="12" weight="fill" class="shrink-0 text-[#f0d060]" />
        <span class="break-words text-justify"><strong>Petunjuk:</strong> {{ currentItem.hint }}</span>
      </div>
    </div>

    <!-- Answer Slots (Letter Boxes) -->
    <div class="space-y-1.5 text-center shrink-0">
      <div v-for="(group, gIdx) in wordGroups" :key="gIdx" class="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 py-0.5">
        <button
          v-for="(_, wIdx) in Array.from({ length: group.length })"
          :key="`${gIdx}-${wIdx}`"
          type="button"
          @click="selectedLetters[group.startIndex + wIdx] && handleRemovePlacedLetter(group.startIndex + wIdx)"
          :disabled="isRoundSubmitted"
          :class="[
            'w-7 h-8 sm:w-9 sm:h-10 rounded-lg border font-pixel text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer',
            selectedLetters[group.startIndex + wIdx]
              ? isRoundSubmitted
                ? isRoundCorrect
                  ? 'bg-[#1f3a2b] border-[#7ec850] text-[#7ec850] shadow-[0_0_8px_rgba(126,200,80,0.5)]'
                  : 'bg-[#3a1814] border-[#d44040] text-[#ff8080]'
                : 'bg-gradient-to-b from-[#3d7828] to-[#255018] border-[#f0d060] text-white shadow-md'
              : 'bg-[#170f07] border-dashed border-[#5a3a18] text-[#5a3a18]'
          ]"
        >
          {{ selectedLetters[group.startIndex + wIdx] ? selectedLetters[group.startIndex + wIdx].char : '' }}
        </button>
      </div>
    </div>

    <!-- Scrambled Pool Tiles -->
    <div v-if="!isRoundSubmitted" class="space-y-1.5 text-center bg-[#170f07] p-2 rounded-xl border border-[#5a3a18] shrink-0">
      <div class="flex flex-wrap items-center justify-center gap-1.5">
        <button
          v-for="(tile, tileIdx) in shuffledLetters"
          :key="tile.sourceIndex"
          type="button"
          @click="handleSelectPoolTile(tile.char, tileIdx)"
          :disabled="usedTileIndices.includes(tileIdx)"
          :class="[
            'w-7 h-8 sm:w-9 sm:h-10 rounded-lg border font-pixel text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center cursor-pointer',
            usedTileIndices.includes(tileIdx)
              ? 'bg-[#120b06] border-[#3d2b1e] text-[#5a3a18] opacity-30 pointer-events-none'
              : 'bg-[#281c12] border-[#8b6f4e] hover:border-[#f0d060] text-[#f0e0c0] hover:text-[#f0d060] active:scale-95 shadow-sm'
          ]"
        >
          {{ tile.char }}
        </button>
      </div>

      <div class="flex items-center justify-center gap-2 pt-0.5">
        <button
          type="button"
          @click="handleClearAll"
          :disabled="selectedLetters.length === 0"
          class="py-1 px-2.5 text-[9px] font-pixel text-[#a08060] hover:text-[#f0d060] bg-[#23160c] border border-[#5a3a18] rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <PhArrowCounterClockwise :size="10" weight="bold" />
          <span>Hapus</span>
        </button>

        <button
          v-if="!showHint && currentItem.hint"
          type="button"
          @click="handleUseHint"
          class="py-1 px-2.5 text-[9px] font-pixel text-[#f0d060] bg-[#2d1b0e] hover:bg-[#3d2b1e] border border-[#8b6f4e] rounded transition-colors flex items-center gap-1 cursor-pointer"
        >
          <PhLightbulb :size="10" weight="bold" />
          <span>Petunjuk</span>
        </button>
      </div>
    </div>

    <!-- Feedback Card -->
    <div
      v-if="isRoundSubmitted"
      :class="[
        'p-2 rounded-lg border text-left space-y-0.5 animate-in fade-in shrink-0',
        isRoundCorrect
          ? 'bg-[#14230f] border-[#7ec850] text-[#e0f0d0]'
          : 'bg-[#2d1210] border-[#d44040] text-[#ffd0d0]'
      ]"
    >
      <div class="flex items-center gap-1 font-pixel text-[10px] font-bold">
        <template v-if="isRoundCorrect">
          <PhCheckCircle :size="14" weight="fill" class="text-[#7ec850]" />
          <span class="text-[#7ec850]">
            TEPAT! (+{{ currentItem.score ?? 20 }} Pts) KATA: {{ currentItem.targetWord }}
          </span>
        </template>
        <template v-else>
          <PhXCircle :size="14" weight="fill" class="text-[#ff8080]" />
          <span class="text-[#ff8080]">Belum Tepat, Coba Lagi!</span>
        </template>
      </div>
      <p class="font-sans text-[10px] sm:text-[11px] leading-relaxed text-justify break-words">
        {{ currentItem.explanation }}
      </p>
    </div>

    <!-- Action Footer -->
    <div class="border-t border-[#5a3a18] pt-1.5 flex items-center justify-between gap-2 shrink-0">
      <div class="text-[10px] font-sans text-[#c4956a]">
        {{ selectedLetters.length }}/{{ targetLength }} huruf terpasang
      </div>

      <div class="shrink-0">
        <button
          v-if="!isRoundSubmitted"
          type="button"
          @click="handleCheckWord"
          :disabled="selectedLetters.length !== targetLength"
          class="rpg-btn-primary py-2 px-4 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
        >
          <PhCheck :size="14" weight="bold" />
          <span>CEK KATA</span>
        </button>
        <button
          v-else-if="isRoundCorrect"
          type="button"
          @click="handleNextRound"
          class="rpg-btn-primary py-2 px-4 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5"
        >
          <span>
            {{ currentIndex < items.length - 1 ? 'Lanjut Kata' : 'Selesai' }}
          </span>
          <PhArrowRight :size="14" weight="bold" />
        </button>
        <button
          v-else
          type="button"
          @click="handleRetryRound"
          class="rpg-btn-wood py-2 px-4 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5"
        >
          <PhArrowCounterClockwise :size="14" weight="bold" />
          <span>Susun Ulang</span>
        </button>
      </div>
    </div>
  </div>
  <div v-else class="p-6 text-center font-sans text-xs text-[#c4956a]">
    Data soal Tebak Kata tidak ditemukan.
  </div>
</template>
