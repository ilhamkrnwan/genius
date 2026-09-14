<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  PhTimer,
  PhCheckCircle,
  PhXCircle,
  PhArrowRight,
  PhCheck,
  PhLightning,
} from '@phosphor-icons/vue';
import { KuisCepatContent, Question } from '@/types/game';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';
import PixelBadge from '@/components/ui/PixelBadge.vue';

interface Props {
  content?: KuisCepatContent;
  fallbackQuestions?: Question[];
  isCompleted?: boolean;
  serverSessionId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
});

const emit = defineEmits<{
  (e: 'complete', score: number, totalQuestions: number): void;
}>();

const gameStore = useGameStore();
const gameSessionStore = useGameSessionStore();
const questions = computed(() => props.content?.questions || props.fallbackQuestions || []);
const timeLimit = computed(() => props.content?.timeLimitSeconds || 18);

const currentIndex = ref<number>(0);
const timeLeft = ref<number>(timeLimit.value);
const selectedOptionIndex = ref<number | null>(null);
const isQuestionSubmitted = ref<boolean>(false);
const isTimeUp = ref<boolean>(false);
const totalScore = ref<number>(0);
const serverAnswerResult = ref<{ isCorrect?: boolean; scoreEarned?: number } | null>(null);
const waitingForGameMaster = ref<boolean>(false);

let timerInterval: any = null;
let pollInterval: any = null;

const currentQuestion = computed(() => questions.value[currentIndex.value]);

const clearTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const startTimer = () => {
  clearTimer();
  if (isQuestionSubmitted.value || props.isCompleted || !currentQuestion.value) return;

  timeLeft.value = timeLimit.value;
  isTimeUp.value = false;

  timerInterval = setInterval(() => {
    if (timeLeft.value <= 1) {
      clearTimer();
      timeLeft.value = 0;
      isTimeUp.value = true;
      isQuestionSubmitted.value = true;
      if (gameStore.soundEnabled) soundEngine.playWrong();
    } else {
      timeLeft.value -= 1;
    }
  }, 1000);
};

watch(
  [currentIndex, isQuestionSubmitted, () => props.isCompleted],
  () => {
    if (!isQuestionSubmitted.value && !props.isCompleted) {
      startTimer();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  clearTimer();
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});

const handleSelectOption = (index: number) => {
  if (isQuestionSubmitted.value || isTimeUp.value) return;
  if (gameStore.soundEnabled) soundEngine.playSelect();
  selectedOptionIndex.value = index;
};

const handleCheckAnswer = async () => {
  if (selectedOptionIndex.value === null || isQuestionSubmitted.value || !currentQuestion.value) return;

  clearTimer();
  isQuestionSubmitted.value = true;

  if (props.serverSessionId) {
    const answerResult = await gameSessionStore.submitAnswer({
      questionId: currentQuestion.value.id,
      answer: selectedOptionIndex.value,
      elapsedMs: Math.max(0, (timeLimit.value - timeLeft.value) * 1000),
    });
    if (!answerResult) {
      isQuestionSubmitted.value = false;
      startTimer();
    } else {
      serverAnswerResult.value = answerResult;
      waitingForGameMaster.value = true;
      if (answerResult.isCorrect) {
        if (gameStore.soundEnabled) soundEngine.playCorrect();
      } else if (gameStore.soundEnabled) {
        soundEngine.playWrong();
      }
    }
    return;
  }

  const isCorrect = selectedOptionIndex.value === currentQuestion.value.correctAnswerIndex;
  if (isCorrect) {
    if (gameStore.soundEnabled) soundEngine.playCorrect();
    totalScore.value += 1;
  } else {
    if (gameStore.soundEnabled) soundEngine.playWrong();
  }
};

const startPollingForGameMaster = () => {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    const updatedSession = await gameSessionStore.refreshSession();
    if (!updatedSession) return;
    
    if (updatedSession.status === 'COMPLETED') {
      clearInterval(pollInterval);
      pollInterval = null;
      const evaluation = (updatedSession.result || {}) as any;
      emit('complete', evaluation.score || 0, questions.value.length);
    } else if (
      updatedSession.metadata &&
      typeof updatedSession.metadata.currentQuestionIndex === 'number' &&
      updatedSession.metadata.currentQuestionIndex > currentIndex.value
    ) {
      // Game Master advanced the question
      currentIndex.value = updatedSession.metadata.currentQuestionIndex;
      selectedOptionIndex.value = null;
      serverAnswerResult.value = null;
      isQuestionSubmitted.value = false;
      isTimeUp.value = false;
      waitingForGameMaster.value = false;
      if (gameStore.soundEnabled) soundEngine.playClick();
    }
  }, 3000);
};

// Start continuous polling if we are in server mode
if (props.serverSessionId) {
  startPollingForGameMaster();
}

const handleNextQuestion = async () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1;
    selectedOptionIndex.value = null;
    serverAnswerResult.value = null;
    isQuestionSubmitted.value = false;
    isTimeUp.value = false;
    if (gameStore.soundEnabled) soundEngine.playClick();
  } else {
    if (props.serverSessionId) {
      const result = await gameSessionStore.completeSession();
      if (!result) return;
      const evaluation = result.evaluation as { totalTeamScore?: number };
      emit('complete', evaluation.totalTeamScore || 0, questions.value.length);
      return;
    }
    emit('complete', totalScore.value, questions.value.length);
  }
};

const isCurrentCorrect = computed(() => {
  if (props.serverSessionId) return serverAnswerResult.value?.isCorrect === true;
  return currentQuestion.value && selectedOptionIndex.value === currentQuestion.value.correctAnswerIndex;
});

const timerPercentage = computed(() => {
  return (timeLeft.value / timeLimit.value) * 100;
});

const timerColorClass = computed(() => {
  if (timeLeft.value > timeLimit.value * 0.5) return 'bg-[#7ec850]';
  if (timeLeft.value > timeLimit.value * 0.25) return 'bg-[#f0d060]';
  return 'bg-[#d44040] animate-pulse';
});
</script>

<template>
  <div v-if="currentQuestion" class="h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2 select-none">
    <!-- Top Compact Timer & Question Count Header -->
    <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-1.5 shrink-0">
      <div class="flex items-center gap-1.5">
        <div class="p-1 bg-[#170f07] border border-[#f0d060] rounded text-[#f0d060]">
          <PhLightning :size="14" weight="fill" />
        </div>
        <div>
          <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-[#f0d060]">
            KUIS CEPAT
          </h3>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Timer Display -->
        <div class="flex items-center gap-1 bg-[#170f07] border border-[#5a3a18] px-2 py-0.5 rounded-md text-[10px] font-pixel">
          <PhTimer :size="12" weight="bold" class="text-[#f0d060]" />
          <span
            :class="[
              'font-mono font-bold',
              timeLeft <= 5 ? 'text-[#ff8080] animate-bounce' : 'text-[#7ec850]'
            ]"
          >
            {{ timeLeft }}s
          </span>
        </div>

        <PixelBadge variant="gold" size="sm">
          {{ currentIndex + 1 }}/{{ questions.length }}
        </PixelBadge>
      </div>
    </div>

    <!-- Countdown Timer Line Bar -->
    <div class="w-full h-2 bg-[#120b06] border-2 border-[#5a3a18] rounded-full overflow-hidden shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
      <div
        :class="['h-full transition-all duration-1000 shadow-[0_0_8px_currentColor]', timerColorClass]"
        :style="{ width: `${timerPercentage}%` }"
      />
    </div>

    <!-- Question & Options with Transition -->
    <Transition name="slide-fade" mode="out-in">
      <div :key="currentQuestion.id" class="flex flex-col gap-1.5 sm:gap-2 flex-1">
        
        <!-- Question Card -->
        <div class="rpg-card-glass p-3 sm:p-4 rounded-xl shrink-0">
          <span class="font-pixel text-[8px] text-[#7ec850] uppercase tracking-wider block mb-1.5 drop-shadow-md">
            SOAL #{{ currentIndex + 1 }}:
          </span>
          <h4 class="font-sans text-xs sm:text-sm font-bold text-white leading-relaxed text-justify break-words">
            {{ currentQuestion.text }}
          </h4>
        </div>

        <!-- Multiple Choice Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 flex-1 overflow-y-auto py-1 px-0.5">
          <button
            v-for="(option, optIdx) in currentQuestion.options"
            :key="optIdx"
            type="button"
            @click="handleSelectOption(optIdx)"
            :disabled="isQuestionSubmitted || isTimeUp"
            :class="[
              'btn-pushable w-full text-left p-2.5 sm:p-3 rounded-xl border-2 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none',
                (isQuestionSubmitted || isTimeUp)
                ? props.serverSessionId
                  ? selectedOptionIndex === optIdx
                    ? isCurrentCorrect
                      ? 'bg-gradient-to-b from-[#1f3a2b] to-[#142318] border-[#7ec850] text-[#f0ffd0] shadow-[0_4px_12px_rgba(126,200,80,0.3)] font-medium animate-pop'
                      : 'bg-gradient-to-b from-[#3a1814] to-[#2d1210] border-[#d44040] text-[#ffd0d0] shadow-[0_4px_12px_rgba(212,64,64,0.3)] animate-shake'
                    : 'bg-[#170f07] border-[#5a3a18] text-[#a08060] opacity-70'
                  : optIdx === currentQuestion.correctAnswerIndex
                    ? 'bg-gradient-to-b from-[#1f3a2b] to-[#142318] border-[#7ec850] text-[#f0ffd0] shadow-[0_4px_12px_rgba(126,200,80,0.3)] font-medium animate-pop'
                    : selectedOptionIndex === optIdx && !isCurrentCorrect
                    ? 'bg-gradient-to-b from-[#3a1814] to-[#2d1210] border-[#d44040] text-[#ffd0d0] shadow-[0_4px_12px_rgba(212,64,64,0.3)] animate-shake'
                    : 'bg-[#170f07] border-[#5a3a18] text-[#a08060] opacity-70'
                : selectedOptionIndex === optIdx
                ? 'bg-gradient-to-b from-[#4d3b2e] to-[#2d1b0e] border-[#f0d060] text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-medium'
                : 'bg-gradient-to-b from-[#281c12] to-[#170f07] border-[#5a3a18] text-[#f0e0c0] shadow-[0_4px_8px_rgba(0,0,0,0.4)] hover:border-[#8b6f4e]'
            ]"
          >
            <span class="font-pixel text-[9px] w-6 h-6 flex items-center justify-center rounded-md bg-[#120b06] text-[#f0d060] border border-[#5a3a18] shadow-inner shrink-0 font-bold">
              {{ String.fromCharCode(65 + optIdx) }}
            </span>
            <span class="font-sans text-[12px] sm:text-[13px] leading-snug flex-1 drop-shadow-sm">
              {{ option }}
            </span>
            <PhCheckCircle
              v-if="(isQuestionSubmitted || isTimeUp) && ((props.serverSessionId && selectedOptionIndex === optIdx && isCurrentCorrect) || (!props.serverSessionId && optIdx === currentQuestion.correctAnswerIndex))"
              :size="20"
              weight="fill"
              class="text-[#7ec850] shrink-0 drop-shadow-[0_0_4px_rgba(126,200,80,0.6)]"
            />
            <PhXCircle
              v-if="isQuestionSubmitted && selectedOptionIndex === optIdx && !isCurrentCorrect"
              :size="20"
              weight="fill"
              class="text-[#ff8080] shrink-0 drop-shadow-[0_0_4px_rgba(255,128,128,0.6)]"
            />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Feedback Alert Card -->
    <div
      v-if="isQuestionSubmitted || isTimeUp"
      :class="[
        'p-2 rounded-lg border text-left animate-in fade-in shrink-0',
        isCurrentCorrect
          ? 'bg-[#14230f] border-[#7ec850] text-[#e0f0d0]'
          : 'bg-[#2d1210] border-[#d44040] text-[#ffd0d0]'
      ]"
    >
      <div class="flex items-center gap-1.5 font-pixel text-[10px] font-bold">
        <template v-if="isTimeUp && selectedOptionIndex === null">
          <PhTimer :size="14" weight="fill" class="text-[#ff8080]" />
          <span class="text-[#ff8080]">Waktu Habis!</span>
        </template>
        <template v-else-if="isCurrentCorrect">
          <PhCheckCircle :size="14" weight="fill" class="text-[#7ec850]" />
          <span class="text-[#7ec850]">Jawaban Tepat!</span>
        </template>
        <template v-else>
          <PhXCircle :size="14" weight="fill" class="text-[#ff8080]" />
          <span class="text-[#ff8080]">Kurang Tepat!</span>
        </template>
      </div>
      <p class="font-sans text-[10px] sm:text-[11px] leading-relaxed mt-0.5 text-justify break-words">
        {{ props.serverSessionId ? (isCurrentCorrect ? 'Jawabanmu diterima oleh server.' : 'Jawabanmu sudah dicatat oleh server. Lanjutkan ke soal berikutnya.') : currentQuestion.explanation }}
      </p>
    </div>

    <!-- Footer Actions -->
    <div class="border-t border-[#5a3a18] pt-1.5 flex items-center justify-between gap-2 shrink-0">
      <div class="text-[10px] font-sans text-[#a08060]">
        <template v-if="waitingForGameMaster">
          <span class="animate-pulse">Menunggu Game Master...</span>
        </template>
        <template v-else>
          {{ selectedOptionIndex !== null ? 'Siap dikirim' : 'Pilih 1 jawaban' }}
        </template>
      </div>

      <div class="shrink-0">
        <button
          v-if="!isQuestionSubmitted && !isTimeUp"
          type="button"
          @click="handleCheckAnswer"
          :disabled="selectedOptionIndex === null"
          class="rpg-btn-primary py-2 px-4 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
        >
          <PhCheck :size="14" weight="bold" />
          <span>KIRIM JAWABAN</span>
        </button>
        <button
          v-else-if="!props.serverSessionId"
          type="button"
          @click="handleNextQuestion"
          class="rpg-btn-primary py-2 px-4 text-[10px] sm:text-xs font-pixel font-bold flex items-center justify-center gap-1.5"
        >
          <span>
            {{ currentIndex < questions.length - 1 ? 'Lanjut Soal' : 'Selesai' }}
          </span>
          <PhArrowRight :size="14" weight="bold" />
        </button>
      </div>
    </div>
  </div>
  <div v-else class="p-6 text-center font-sans text-xs text-[#c4956a]">
    Data soal Kuis Cepat tidak ditemukan.
  </div>
</template>
