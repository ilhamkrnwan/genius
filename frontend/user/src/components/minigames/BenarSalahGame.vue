<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  PhCheck,
  PhX,
  PhCheckCircle,
  PhXCircle,
  PhArrowRight,
  PhShieldCheck,
} from '@phosphor-icons/vue';
import { BenarSalahContent } from '@/types/game';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';

interface Props {
  content?: BenarSalahContent;
  isCompleted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
});

const emit = defineEmits<{
  (e: 'complete', score: number, totalQuestions: number): void;
}>();

const gameStore = useGameStore();
const statements = computed(() => props.content?.statements || []);

const currentIndex = ref<number>(0);
const selectedChoice = ref<boolean | null>(null);
const isRoundSubmitted = ref<boolean>(false);
const totalScore = ref<number>(0);

const currentStatement = computed(() => statements.value[currentIndex.value]);

const isUserCorrect = computed(() => {
  return selectedChoice.value !== null && currentStatement.value && selectedChoice.value === currentStatement.value.isCorrect;
});

const handleAnswer = (choice: boolean) => {
  if (isRoundSubmitted.value || !currentStatement.value) return;

  selectedChoice.value = choice;
  isRoundSubmitted.value = true;

  const isCorrect = choice === currentStatement.value.isCorrect;
  if (isCorrect) {
    if (gameStore.soundEnabled) soundEngine.playCorrect();
    const roundScore = currentStatement.value.score ?? Math.round(100 / statements.value.length);
    totalScore.value += roundScore;
  } else {
    if (gameStore.soundEnabled) soundEngine.playWrong();
  }
};

const handleNextStatement = () => {
  if (currentIndex.value < statements.value.length - 1) {
    currentIndex.value += 1;
    selectedChoice.value = null;
    isRoundSubmitted.value = false;
    if (gameStore.soundEnabled) soundEngine.playClick();
  } else {
    emit('complete', totalScore.value, statements.value.length);
  }
};
</script>

<template>
  <div v-if="currentStatement" class="h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2 select-none">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-1.5 shrink-0">
      <div class="flex items-center gap-1.5">
        <div class="p-1 bg-[#170f07] border border-[#f0d060] rounded text-[#f0d060]">
          <PhShieldCheck :size="14" weight="fill" />
        </div>
        <div>
          <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-[#f0d060]">
            UJI BENAR / SALAH
          </h3>
        </div>
      </div>

      <PixelBadge variant="emerald" size="sm">
        Pernyataan {{ currentIndex + 1 }}/{{ statements.length }}
      </PixelBadge>
    </div>

    <!-- Statement Card with Transition -->
    <Transition name="slide-fade" mode="out-in">
      <div :key="currentStatement.statement" class="sdv-card-elevated p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-center text-center">
        <div class="flex items-center justify-between border-b border-[#5a3a18] pb-1">
          <span class="font-pixel text-[8px] text-[#7ec850] uppercase tracking-wider drop-shadow-md">
            PERNYATAAN #{{ currentIndex + 1 }}
          </span>
          <span class="font-pixel text-[8px] text-[#f0d060]">
            PILIH BENAR / SALAH
          </span>
        </div>

        <div class="bg-[#170f07] p-3 sm:p-4 border-2 border-[#5a3a18] rounded-xl shadow-inner my-auto relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent pointer-events-none"></div>
          <p class="font-sans text-xs sm:text-sm font-semibold text-white leading-relaxed text-justify break-words drop-shadow-md relative z-10">
            &ldquo;{{ currentStatement?.statement || 'Memuat butir pernyataan...' }}&rdquo;
          </p>
        </div>

        <!-- Dual Action Buttons -->
        <div v-if="!isRoundSubmitted" class="grid grid-cols-2 gap-3 pt-2">
          <!-- BENAR Button -->
          <button
            type="button"
            @click="handleAnswer(true)"
            class="btn-pushable py-3.5 px-4 rounded-xl border-2 border-[#7ec850] bg-gradient-to-b from-[#3d7828] to-[#255018] text-white font-pixel text-xs sm:text-sm font-bold shadow-[0_6px_0_#122808,0_10px_20px_rgba(61,120,40,0.4)] hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
          >
            <PhCheck :size="18" weight="bold" class="text-[#f0d060] drop-shadow-md" />
            <span class="drop-shadow-md">BENAR</span>
          </button>

          <!-- SALAH Button -->
          <button
            type="button"
            @click="handleAnswer(false)"
            class="btn-pushable py-3.5 px-4 rounded-xl border-2 border-[#d44040] bg-gradient-to-b from-[#8b3a2b] to-[#5a1e14] text-white font-pixel text-xs sm:text-sm font-bold shadow-[0_6px_0_#2d0a06,0_10px_20px_rgba(212,64,64,0.4)] hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
          >
            <PhX :size="18" weight="bold" class="text-white drop-shadow-md" />
            <span class="drop-shadow-md">SALAH</span>
          </button>
        </div>

        <!-- Feedback Card -->
        <div
          v-else
          :class="[
            'p-3 rounded-xl border-2 text-left space-y-1.5 animate-pop shadow-lg',
            isUserCorrect
              ? 'bg-gradient-to-b from-[#1f3a2b] to-[#142318] border-[#7ec850] text-[#e0f0d0] shadow-[0_0_15px_rgba(126,200,80,0.3)]'
              : 'bg-gradient-to-b from-[#3a1814] to-[#2d1210] border-[#d44040] text-[#ffd0d0] shadow-[0_0_15px_rgba(212,64,64,0.3)] animate-shake'
          ]"
        >
          <div class="flex items-center gap-1.5 font-pixel text-[10px] font-bold">
            <template v-if="isUserCorrect">
              <PhCheckCircle :size="16" weight="fill" class="text-[#7ec850] drop-shadow-md" />
              <span class="text-[#7ec850] drop-shadow-md">
                PILIHAN TEPAT! (Kunci: {{ currentStatement.isCorrect ? 'BENAR' : 'SALAH' }})
              </span>
            </template>
            <template v-else>
              <PhXCircle :size="16" weight="fill" class="text-[#ff8080] drop-shadow-md" />
              <span class="text-[#ff8080] drop-shadow-md">
                Kurang Tepat (Kunci: {{ currentStatement.isCorrect ? 'BENAR' : 'SALAH' }})
              </span>
            </template>
          </div>
          <p class="font-sans text-[11px] sm:text-xs leading-relaxed text-justify break-words mt-1 drop-shadow-sm opacity-90">
            {{ currentStatement.explanation }}
          </p>
        </div>
      </div>
    </Transition>

    <!-- Footer Navigation -->
    <div class="border-t border-[#5a3a18] pt-1.5 flex items-center justify-between gap-2 shrink-0">
      <div class="text-[10px] font-sans text-[#a08060]">
        {{ isRoundSubmitted ? 'Pernyataan dinilai' : 'Pilih BENAR atau SALAH' }}
      </div>

      <button
        v-if="isRoundSubmitted"
        type="button"
        @click="handleNextStatement"
        class="rpg-btn-primary py-2 px-4 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5"
      >
        <span>
          {{ currentIndex < statements.length - 1 ? 'Lanjut Soal' : 'Selesai' }}
        </span>
        <PhArrowRight :size="14" weight="bold" />
      </button>
    </div>
  </div>
  <div v-else class="p-6 text-center font-sans text-xs text-[#c4956a]">
    Data soal Benar / Salah tidak ditemukan.
  </div>
</template>
