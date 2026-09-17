<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  PhSparkle,
  PhCards,
  PhCheckCircle,
  PhArrowCounterClockwise,
  PhStar,
} from '@phosphor-icons/vue';
import { MemoryMatchContent } from '@/types/game';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';

interface Props {
  content?: MemoryMatchContent;
  isCompleted?: boolean;
  serverSessionId?: string;
}

interface CardItem {
  uid: string;
  pairId: string;
  type: 'A' | 'B';
  text: string;
  tag?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
});

const emit = defineEmits<{
  (e: 'complete', score: number, totalQuestions: number): void;
}>();

const gameStore = useGameStore();
const gameSessionStore = useGameSessionStore();
const pairs = computed(() => props.content?.pairs || []);

const cards = ref<CardItem[]>([]);
const flippedIndices = ref<number[]>([]);
const matchedPairIds = ref<string[]>([]);
const movesCount = ref<number>(0);
const isProcessing = ref<boolean>(false);
const isFinished = ref<boolean>(props.isCompleted);
const isSubmitting = ref<boolean>(false);
const isWrongMatch = ref<boolean>(false);

const initCards = () => {
  if (pairs.value.length === 0) return;

  const deck: CardItem[] = [];
  pairs.value.forEach((pair) => {
    deck.push({
      uid: `${pair.id}-A`,
      pairId: pair.id,
      type: 'A',
      text: pair.labelA,
      tag: pair.tag,
    });
    deck.push({
      uid: `${pair.id}-B`,
      pairId: pair.id,
      type: 'B',
      text: pair.labelB,
      tag: pair.tag,
    });
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  cards.value = deck;
  flippedIndices.value = [];
  matchedPairIds.value = [];
  movesCount.value = 0;
  isProcessing.value = false;
  isFinished.value = false;
  isWrongMatch.value = false;
};

watch(
  () => props.content,
  () => {
    initCards();
  },
  { immediate: true }
);

const handleCardClick = (index: number) => {
  if (isProcessing.value || isFinished.value) return;
  if (flippedIndices.value.includes(index)) return;
  const clickedCard = cards.value[index];
  if (matchedPairIds.value.includes(clickedCard.pairId)) return;

  if (gameStore.soundEnabled) soundEngine.playSelect();

  const newFlipped = [...flippedIndices.value, index];
  flippedIndices.value = newFlipped;

  if (newFlipped.length === 2) {
    movesCount.value += 1;
    isProcessing.value = true;

    const firstCard = cards.value[newFlipped[0]];
    const secondCard = cards.value[newFlipped[1]];

    if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
      setTimeout(() => {
        if (gameStore.soundEnabled) soundEngine.playCorrect();
        matchedPairIds.value.push(firstCard.pairId);
        flippedIndices.value = [];
        isProcessing.value = false;

        if (matchedPairIds.value.length === pairs.value.length) {
          void finishGame();
        }
      }, 500);
    } else {
      isWrongMatch.value = true;
      setTimeout(() => {
        if (gameStore.soundEnabled) soundEngine.playWrong();
        flippedIndices.value = [];
        isWrongMatch.value = false;
        isProcessing.value = false;
      }, 900);
    }
  }
};

const currentScore = computed(() => {
  return pairs.value
    .filter((p) => matchedPairIds.value.includes(p.id))
    .reduce((acc, p) => acc + (p.score ?? Math.round(100 / pairs.value.length)), 0);
});

const finishGame = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  const totalMemoryScore = pairs.value.reduce((acc, p) => acc + (p.score ?? Math.round(100 / pairs.value.length)), 0);
  if (props.serverSessionId) {
    const result = await gameSessionStore.completeSession([
      {
        action: 'MEMORY_MATCH',
        score: totalMemoryScore,
        answer: { moves: movesCount.value, matchedPairs: matchedPairIds.value.length },
      },
    ]);
    if (!result) {
      isSubmitting.value = false;
      return;
    }
    const evaluation = result.evaluation as { totalTeamScore?: number; totalScore?: number; participantScore?: number };
    isFinished.value = true;
    const finalScore = evaluation.participantScore ?? evaluation.totalScore ?? totalMemoryScore;
    emit('complete', Math.min(100, Math.max(0, Number(finalScore))), pairs.value.length);
    return;
  }
  isFinished.value = true;
  emit('complete', totalMemoryScore, pairs.value.length);
};

const handleResetGame = () => {
  initCards();
  if (gameStore.soundEnabled) soundEngine.playClick();
};
</script>

<template>
  <div class="h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2 select-none">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-1.5 shrink-0">
      <div class="flex items-center gap-1.5">
        <div class="p-1 bg-[#170f07] border border-[#f0d060] rounded text-[#f0d060]">
          <PhCards :size="14" weight="fill" />
        </div>
        <div>
          <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-[#f0d060]">
            MEMORY MATCH
          </h3>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <PixelBadge variant="emerald" size="sm">
          {{ currentScore }} Pts
        </PixelBadge>
        <PixelBadge variant="gold" size="sm">
          {{ matchedPairIds.length }}/{{ pairs.length }} Cocok
        </PixelBadge>
        <PixelBadge variant="wood" size="sm">
          {{ movesCount }} Coba
        </PixelBadge>
      </div>
    </div>

    <!-- 8 Cards Grid -->
    <div class="grid grid-cols-4 gap-2 sm:gap-3 flex-1 items-center select-none py-2 px-1">
      <button
        v-for="(card, idx) in cards"
        :key="card.uid"
        type="button"
        @click="handleCardClick(idx)"
        :disabled="flippedIndices.includes(idx) || matchedPairIds.includes(card.pairId) || isProcessing"
        class="group perspective-1000 h-24 sm:h-32 w-full cursor-pointer focus:outline-none"
      >
        <div 
          :class="[
            'relative w-full h-full transition-transform duration-500 preserve-3d',
            (flippedIndices.includes(idx) || matchedPairIds.includes(card.pairId)) ? 'rotate-y-180' : 'rotate-y-0',
            matchedPairIds.includes(card.pairId) ? 'animate-slide-up-fade' : '',
            (isWrongMatch && flippedIndices.includes(idx)) ? 'animate-shake' : ''
          ]"
        >
          <!-- Front of Card (Face Down) -->
          <div 
            class="absolute w-full h-full backface-hidden rounded-xl border-2 flex flex-col items-center justify-center bg-gradient-to-b from-[#281c12] to-[#170f07] border-[#5a3a18] shadow-[0_6px_12px_rgba(0,0,0,0.6)] group-hover:border-[#8b6f4e] transition-colors"
          >
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#120b06] border border-[#8b6f4e] flex items-center justify-center text-[#f0d060] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]">
              <PhStar :size="18" weight="fill" class="opacity-80 drop-shadow-[0_0_4px_rgba(240,208,96,0.5)]" />
            </div>
            <span class="font-pixel text-[8px] sm:text-[9px] text-[#8b6f4e] mt-2">
              #{{ idx + 1 }}
            </span>
          </div>

          <!-- Back of Card (Face Up) -->
          <div 
            :class="[
              'absolute w-full h-full backface-hidden rotate-y-180 rounded-xl border-2 p-1.5 sm:p-2 flex flex-col items-center justify-between shadow-[0_6px_16px_rgba(0,0,0,0.7)]',
              matchedPairIds.includes(card.pairId) 
                ? 'bg-gradient-to-b from-[#1f3a2b] to-[#142318] border-[#7ec850] text-[#f0ffd0] shadow-[0_0_20px_rgba(126,200,80,0.4)]'
                : (isWrongMatch && flippedIndices.includes(idx))
                ? 'bg-gradient-to-b from-[#3a1814] to-[#2d1210] border-[#d44040] text-[#ffd0d0] shadow-[0_0_20px_rgba(212,64,64,0.4)]'
                : 'bg-gradient-to-b from-[#4d3b2e] to-[#2d1b0e] border-[#f0d060] text-white'
            ]"
          >
            <span v-if="card.tag" class="font-pixel text-[7px] text-[#f0d060] bg-[#120b06]/90 px-1.5 py-0.5 rounded border border-[#5a3a18] break-words shadow-inner">
              {{ card.tag }}
            </span>

            <p class="font-sans text-[11px] sm:text-[13px] font-bold leading-tight my-auto px-1 break-words drop-shadow-md">
              {{ card.text }}
            </p>

            <div v-if="matchedPairIds.includes(card.pairId)" class="flex items-center gap-1 text-[8px] font-pixel text-[#7ec850] drop-shadow-[0_0_2px_rgba(126,200,80,0.8)]">
              <PhCheckCircle :size="12" weight="fill" />
              <span>COCOK</span>
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- Completion Banner -->
    <div v-if="isFinished" class="bg-[#14230f] border border-[#7ec850] p-2 rounded-lg text-center space-y-0.5 animate-in fade-in shrink-0">
      <div class="flex items-center justify-center gap-1.5 font-pixel text-[10px] sm:text-xs text-[#7ec850] font-bold">
        <PhCheckCircle :size="14" weight="fill" />
        <span>SEMUA KARTU COCOK DITEMUKAN!</span>
      </div>
      <p class="font-sans text-[10px] text-[#e0f0d0]">
        Tuntas dalam {{ movesCount }} percobaan.
      </p>
    </div>

    <!-- Action Footer -->
    <div class="border-t border-[#5a3a18] pt-1.5 flex items-center justify-between gap-2 shrink-0">
      <div class="text-[10px] font-sans text-[#a08060]">
        Cocokkan 4 pasang kartu istilah
      </div>

      <button
        type="button"
        @click="handleResetGame"
        class="rpg-btn-wood py-1.5 px-3 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <PhArrowCounterClockwise :size="12" weight="bold" />
        <span>Kocok Ulang</span>
      </button>
    </div>
  </div>
</template>
