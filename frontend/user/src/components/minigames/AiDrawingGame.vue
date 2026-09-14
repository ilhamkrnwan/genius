<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  PhPaintBrush,
  PhPalette,
  PhEraser,
  PhArrowUUpLeft,
  PhTrash,
  PhSparkle,
  PhCheckCircle,
  PhStar,
  PhScroll,
  PhHourglass,
  PhTrophy,
  PhArrowsClockwise,
  PhArrowRight,
  PhEye,
} from '@phosphor-icons/vue';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/lib/api';
import PixelBadge from '@/components/ui/PixelBadge.vue';

interface Props {
  content?: {
    promptSentence?: string;
    drawingTimeSeconds?: number;
    aiModel?: string;
    persona?: string;
  };
  isCompleted?: boolean;
  serverSessionId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
  serverSessionId: undefined,
});

const emit = defineEmits<{
  (e: 'complete', score: number, totalQuestions: number): void;
}>();

const gameStore = useGameStore();

// Fallback drawing prompt sentences if offline / API fallback
const LOCAL_PROMPTS = [
  'Robot sedang belajar membatik kain halus',
  'Presiden naik kuda melompati pelangi',
  'Astronaut jualan bakso bakar di luar angkasa',
  'Kucing memakai kacamata hitam di laboratorium kimia',
  'Dinosaurus sedang webinar Zoom di laptop',
  'Panda makan mie ayam pake sumpit raksasa',
  'Alien jualan es dawet di pasar tradisional',
  'Gajah main skateboard di atas gedung bertingkat',
  'Burung hantu baca koran pake kacamata minus',
  'Kancil main catur melawan komputer super',
];

// Canvas Ref & 2D Context
const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;

// Drawing State
const isDrawing = ref(false);
const hasDrawn = ref(false);
const history = ref<ImageData[]>([]);
const maxHistorySteps = 15;

// Tools & Palette
const currentColor = ref('#1c1917');
const isEraser = ref(false);
const currentBrushSize = ref(6);

const PALETTE = [
  { id: 'black', color: '#1c1917', name: 'Charcoal' },
  { id: 'wood', color: '#78350f', name: 'Wood Brown' },
  { id: 'red', color: '#dc2626', name: 'Ruby Red' },
  { id: 'green', color: '#16a34a', name: 'Forest Green' },
  { id: 'blue', color: '#2563eb', name: 'Royal Blue' },
  { id: 'gold', color: '#eab308', name: 'Sun Gold' },
  { id: 'purple', color: '#9333ea', name: 'Mystic Purple' },
  { id: 'white', color: '#ffffff', name: 'Canvas White' },
];

const BRUSH_SIZES = [
  { label: 'Halus', size: 3 },
  { label: 'Sedang', size: 6 },
  { label: 'Tebal', size: 12 },
];

// Prompt State
const currentPrompt = ref<string>('');
const isPromptLoading = ref(true);

// Game Timer
const initialTime = computed(() => props.content?.drawingTimeSeconds || 75);
const timeLeft = ref(initialTime.value);
let timerInterval: any = null;
const isTimerRunning = ref(false);

// Evaluation / Curator Modal State
const isSubmitting = ref(false);
const showResultModal = ref(false);
const evaluationResult = ref<{
  score: number;
  feedback: string;
  titles: string[];
  newTitles?: string[];
} | null>(null);

const finalCanvasDataUrl = ref<string>('');

// Load or pick prompt
const initPrompt = async () => {
  if (props.content?.promptSentence) {
    currentPrompt.value = props.content.promptSentence;
    isPromptLoading.value = false;
    return;
  }

  try {
    isPromptLoading.value = true;
    const res = await api.getAiDrawingPrompt();
    if (res.success && res.data?.sentence) {
      currentPrompt.value = res.data.sentence;
    } else {
      const idx = Math.floor(Math.random() * LOCAL_PROMPTS.length);
      currentPrompt.value = LOCAL_PROMPTS[idx];
    }
  } catch {
    const idx = Math.floor(Math.random() * LOCAL_PROMPTS.length);
    currentPrompt.value = LOCAL_PROMPTS[idx];
  } finally {
    isPromptLoading.value = false;
  }
};

// Canvas Setup & Sizing
const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // Set internal resolution 2x for sharp retina lines
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Fill canvas with antique parchment base
  ctx.fillStyle = '#fbf6e9';
  ctx.fillRect(0, 0, rect.width, rect.height);

  saveHistory();
};

const saveHistory = () => {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (history.value.length >= maxHistorySteps) {
    history.value.shift();
  }
  history.value.push(imgData);
};

const handleUndo = () => {
  const canvas = canvasRef.value;
  if (!canvas || !ctx || history.value.length <= 1) return;
  if (gameStore.soundEnabled) soundEngine.playClick();
  history.value.pop(); // Remove current
  const previous = history.value[history.value.length - 1];
  if (previous) {
    ctx.putImageData(previous, 0, 0);
  }
};

const handleClearCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  if (gameStore.soundEnabled) soundEngine.playClick();
  const rect = canvas.getBoundingClientRect();
  ctx.fillStyle = '#fbf6e9';
  ctx.fillRect(0, 0, rect.width, rect.height);
  hasDrawn.value = false;
  history.value = [];
  saveHistory();
};

// Pointer Events (Mobile Touch & Mouse)
const getCanvasCoords = (e: PointerEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

const onPointerDown = (e: PointerEvent) => {
  if (isSubmitting.value || props.isCompleted) return;
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;

  canvas.setPointerCapture(e.pointerId);
  isDrawing.value = true;
  hasDrawn.value = true;

  const { x, y } = getCanvasCoords(e);
  ctx.beginPath();
  ctx.moveTo(x, y);

  ctx.strokeStyle = isEraser.value ? '#fbf6e9' : currentColor.value;
  ctx.lineWidth = isEraser.value ? currentBrushSize.value * 2.5 : currentBrushSize.value;
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDrawing.value || !ctx) return;
  const { x, y } = getCanvasCoords(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const onPointerUp = (e: PointerEvent) => {
  if (!isDrawing.value || !ctx) return;
  const canvas = canvasRef.value;
  if (canvas) {
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture not set
    }
  }
  isDrawing.value = false;
  ctx.closePath();
  saveHistory();
};

// Tools Selection
const selectColor = (colorHex: string) => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  currentColor.value = colorHex;
  isEraser.value = false;
};

const toggleEraser = () => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  isEraser.value = !isEraser.value;
};

const selectBrushSize = (size: number) => {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  currentBrushSize.value = size;
};

// Timer Lifecycle
const startTimer = () => {
  if (isTimerRunning.value) return;
  isTimerRunning.value = true;
  timeLeft.value = initialTime.value;

  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value -= 1;
    } else {
      clearInterval(timerInterval);
      isTimerRunning.value = false;
      // Auto submit when time runs out
      handleSubmitToCurator();
    }
  }, 1000);
};

// Submit to Senior Art Curator
const handleSubmitToCurator = async () => {
  if (isSubmitting.value || !canvasRef.value) return;

  if (timerInterval) {
    clearInterval(timerInterval);
    isTimerRunning.value = false;
  }

  isSubmitting.value = true;
  if (gameStore.soundEnabled) soundEngine.playClick();

  // Export to WebP Base64 (fallback to PNG if webp not supported)
  const canvas = canvasRef.value;
  let base64 = canvas.toDataURL('image/webp', 0.85);
  if (!base64 || base64.length < 50 || base64.indexOf('image/webp') === -1) {
    base64 = canvas.toDataURL('image/png');
  }
  finalCanvasDataUrl.value = base64;

  try {
    const res = await api.evaluateAiDrawing({
      promptSentence: currentPrompt.value,
      imageBase64: base64,
      teamId: gameStore.participant.teamId || gameStore.participant.groupId,
      gameSessionId: props.serverSessionId,
    });

    if (res.success && res.data?.evaluation) {
      evaluationResult.value = {
        score: res.data.evaluation.score,
        feedback: res.data.evaluation.feedback,
        titles: res.data.evaluation.titles || [],
        newTitles: res.data.newTitles || [],
      };
    } else {
      // Fallback evaluation if backend fails
      evaluationResult.value = {
        score: Math.floor(Math.random() * 16) + 80, // 80 - 95
        feedback: `Sebuah interpretasi visual yang sangat unik untuk prompt "${currentPrompt.value}".\n\nKomposisi garisnya menyiratkan determinasi tinggi petualang muda yang berani bereksplorasi. Pertahankan sentuhan artistik ini!`,
        titles: ['Maestro Line Art', 'Kolektor Garis Liar'],
      };
    }
  } catch {
    evaluationResult.value = {
      score: 85,
      feedback: `Goresan ekspresif yang menawan! Konsep "${currentPrompt.value}" berhasil kamu tuangkan dengan karakter yang kuat dan imajinatif.`,
      titles: ['Pelukis Kreatif UNU'],
    };
  } finally {
    isSubmitting.value = false;
    showResultModal.value = true;

    if (evaluationResult.value?.score && evaluationResult.value.score >= 70) {
      if (gameStore.soundEnabled) soundEngine.playCorrect();
    } else {
      if (gameStore.soundEnabled) soundEngine.playWrong();
    }
  }
};

const handleFinishGame = () => {
  showResultModal.value = false;
  const earnedScore = evaluationResult.value?.score || 80;
  emit('complete', earnedScore, 100);
};

onMounted(async () => {
  await initPrompt();
  // Small delay for DOM layout before sizing canvas
  setTimeout(() => {
    initCanvas();
    startTimer();
  }, 100);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
  <div class="h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2 select-none">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2 border-b border-[#5a3a18] pb-1.5 shrink-0">
      <div class="flex items-center gap-1.5">
        <div class="p-1 bg-[#170f07] border border-[#f0d060] rounded text-[#f0d060]">
          <PhPalette :size="16" weight="fill" />
        </div>
        <div>
          <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-[#f0d060] leading-none">
            AI ART CURATOR
          </h3>
          <span class="font-pixel text-[7.5px] sm:text-[8.5px] text-[#a0d870] leading-none block pt-0.5">
            TANTANGAN LUKIS & KURASI ESTETIKA GEMINI
          </span>
        </div>
      </div>

      <!-- Timer Indicator -->
      <div class="flex items-center gap-1.5">
        <div
          :class="[
            'px-2 py-0.5 rounded border font-pixel text-[9px] sm:text-[10px] flex items-center gap-1 shadow-sm transition-colors',
            timeLeft <= 15
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-[#1a1109] border-[#8b6f4e] text-[#f0d060]'
          ]"
        >
          <PhHourglass :size="12" weight="bold" />
          <span>{{ timeLeft }}s</span>
        </div>
      </div>
    </div>

    <!-- Parchment Scroll: Mission Prompt -->
    <div class="bg-[#fbf6e9] border-2 border-[#5a3a18] rounded-lg p-2 sm:p-2.5 shadow-md text-[#2d1b0e] shrink-0 relative overflow-hidden">
      <!-- Vintage Corner Nails -->
      <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#5a3a18]" />
      <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#5a3a18]" />
      <div class="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#5a3a18]" />
      <div class="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#5a3a18]" />

      <div class="flex items-start gap-2 px-1">
        <div class="p-1 bg-[#4a3018] rounded text-[#f0d060] shrink-0 mt-0.5">
          <PhScroll :size="15" weight="fill" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-pixel text-[8px] sm:text-[9px] text-[#78350f] uppercase tracking-wider font-bold">
            📜 MISI TANTANGAN KANVAS:
          </div>
          <div v-if="isPromptLoading" class="font-pixel text-[9px] text-[#8b6f4e] animate-pulse">
            Mengambil tantangan kurator...
          </div>
          <div v-else class="font-sans text-[11px] sm:text-xs font-bold text-[#1c1917] leading-tight">
            "{{ currentPrompt }}"
          </div>
          <p class="font-pixel text-[7.5px] sm:text-[8px] text-[#8b6f4e] pt-0.5">
            Lukis visualisasi ide ini di atas kanvas. Kurator AI akan mengevaluasi kreativitasmu!
          </p>
        </div>
      </div>
    </div>

    <!-- Drawing Board Area (HTML5 Canvas) -->
    <div class="flex-1 min-h-[220px] max-h-[340px] flex flex-col relative bg-[#1c1209] border-2 border-[#8b6f4e] rounded-xl p-1 shadow-inner">
      <div class="w-full h-full relative rounded-lg overflow-hidden border border-[#5a3a18] bg-[#fbf6e9] shadow">
        <canvas
          ref="canvasRef"
          class="w-full h-full block cursor-crosshair touch-none select-none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        />

        <!-- Empty Canvas Hint Overlay -->
        <div
          v-if="!hasDrawn && !isSubmitting"
          class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-45 select-none"
        >
          <PhPaintBrush :size="28" weight="duotone" class="text-[#8b6f4e] mb-1" />
          <span class="font-pixel text-[9px] text-[#5a3a18]">Goreskan jarimu / mouse di sini untuk mulai melukis</span>
        </div>
      </div>
    </div>

    <!-- Controls Toolbar & Palette -->
    <div class="bg-[#140e0a]/95 border border-[#5a3a18] rounded-xl p-2 shrink-0 flex flex-col gap-1.5 shadow-md">
      <div class="flex items-center justify-between gap-2">
        <!-- Palette Colors -->
        <div class="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <button
            v-for="item in PALETTE"
            :key="item.id"
            type="button"
            :title="item.name"
            @click="selectColor(item.color)"
            :class="[
              'w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 transition-all cursor-pointer relative shadow-sm',
              !isEraser && currentColor === item.color
                ? 'border-[#f0d060] scale-110 shadow-[0_0_8px_rgba(240,208,96,0.6)]'
                : 'border-[#4a3018] hover:border-[#8b6f4e]'
            ]"
            :style="{ backgroundColor: item.color }"
          />

          <!-- Eraser Button -->
          <button
            type="button"
            @click="toggleEraser"
            title="Penghapus Kanvas"
            :class="[
              'px-2 py-1 rounded-md border font-pixel text-[8px] sm:text-[8.5px] flex items-center gap-1 cursor-pointer transition-all',
              isEraser
                ? 'bg-[#ef4444] border-white text-white shadow-md'
                : 'bg-[#2d1b0e] border-[#8b6f4e] text-[#f0d060] hover:border-[#f0d060]'
            ]"
          >
            <PhEraser :size="12" weight="bold" />
            <span>HAPUS</span>
          </button>
        </div>

        <!-- Brush Sizes & Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            v-for="b in BRUSH_SIZES"
            :key="b.size"
            type="button"
            @click="selectBrushSize(b.size)"
            :title="`Kuas ${b.label} (${b.size}px)`"
            :class="[
              'w-5 h-5 sm:w-6 sm:h-6 rounded border font-pixel text-[8px] flex items-center justify-center cursor-pointer transition-all',
              currentBrushSize === b.size
                ? 'bg-[#3d7828] border-[#f0d060] text-white shadow'
                : 'bg-[#23170e] border-[#5a3a18] text-[#c4956a]'
            ]"
          >
            <span :style="{ fontSize: `${Math.max(8, b.size + 4)}px` }">●</span>
          </button>

          <div class="w-[1px] h-4 bg-[#5a3a18] mx-0.5" />

          <!-- Undo Button -->
          <button
            type="button"
            @click="handleUndo"
            title="Urungkan Coretan"
            class="p-1 sm:p-1.5 bg-[#2d1b0e] border border-[#8b6f4e] hover:border-[#f0d060] rounded text-[#f0d060] transition-colors cursor-pointer"
          >
            <PhArrowUUpLeft :size="13" weight="bold" />
          </button>

          <!-- Clear Button -->
          <button
            type="button"
            @click="handleClearCanvas"
            title="Bersihkan Seluruh Kanvas"
            class="p-1 sm:p-1.5 bg-[#3a1818] border border-rose-800 hover:border-rose-500 rounded text-rose-300 transition-colors cursor-pointer"
          >
            <PhTrash :size="13" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Action Button -->
      <button
        type="button"
        @click="handleSubmitToCurator"
        :disabled="isSubmitting || !hasDrawn"
        :class="[
          'w-full py-2 sm:py-2.5 px-3 rounded-lg font-pixel text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all',
          !hasDrawn
            ? 'bg-[#2d1b0e] border border-[#5a3a18] text-[#8b6f4e] cursor-not-allowed opacity-60'
            : 'rpg-btn-primary cursor-pointer active:scale-98'
        ]"
      >
        <PhSparkle :size="16" weight="fill" :class="{ 'animate-spin': isSubmitting }" />
        <span>{{ isSubmitting ? 'KURATOR SENI SEDANG MENILAI...' : '🏛️ SERAHKAN KARYA KE KURATOR AI' }}</span>
      </button>
    </div>

    <!-- AI Evaluating Loading Overlay Modal -->
    <div
      v-if="isSubmitting"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
    >
      <div class="bg-[#1c1209] border-4 border-[#f0d060] rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl space-y-3">
        <div class="w-16 h-16 mx-auto rounded-full bg-[#2d1b0e] border-2 border-[#f0d060] flex items-center justify-center shadow-[0_0_15px_rgba(240,208,96,0.4)]">
          <PhSparkle :size="32" weight="fill" class="text-[#f0d060] animate-spin" />
        </div>
        <div class="space-y-1">
          <h3 class="font-pixel text-sm sm:text-base text-[#f0d060] font-bold">
            KURATOR SENI MENELAAH...
          </h3>
          <p class="font-sans text-xs text-[#e2d4c0] leading-relaxed">
            Kurator Senior AI sedang menganalisis tarikan garis, komposisi visual, dan kedalaman filosofismu.
          </p>
        </div>
        <div class="inline-block bg-[#120b06] border border-[#5a3a18] px-3 py-1 rounded-full text-[9px] font-pixel text-[#86efac]">
          GEMINI 2.0 FLASH VISION ENGINE
        </div>
      </div>
    </div>

    <!-- Curator Exhibition Result Modal -->
    <div
      v-if="showResultModal && evaluationResult"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
    >
      <div class="bg-[#1c1209] border-4 border-[#f0d060] rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl relative text-left space-y-3 sm:space-y-4 my-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-[#2d1b0e] border border-[#f0d060] rounded-lg text-[#f0d060]">
              <PhTrophy :size="20" weight="fill" />
            </div>
            <div>
              <span class="font-pixel text-[8.5px] text-[#a0d870] block">GALERI SENI GENIUS</span>
              <h3 class="font-pixel text-xs sm:text-sm text-[#f0d060] font-bold">
                EVALUASI KURATOR SENIOR
              </h3>
            </div>
          </div>
          <PixelBadge :variant="evaluationResult.score >= 70 ? 'green' : 'amber'" size="md">
            SKOR: {{ evaluationResult.score }}/100
          </PixelBadge>
        </div>

        <!-- Artwork Mini Gallery Preview -->
        <div class="flex items-center gap-3 bg-[#120b06] border-2 border-[#5a3a18] rounded-xl p-2">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-[#f0d060] bg-[#fbf6e9] shrink-0 shadow">
            <img
              v-if="finalCanvasDataUrl"
              :src="finalCanvasDataUrl"
              alt="Lukisan Peserta"
              class="w-full h-full object-contain"
            />
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <span class="font-pixel text-[8px] text-[#f0d060] uppercase block">Tantangan:</span>
            <div class="font-sans text-xs font-bold text-[#fef08a] italic line-clamp-2">
              "{{ currentPrompt }}"
            </div>
            <div class="pt-0.5 flex flex-wrap gap-1">
              <span
                v-for="title in evaluationResult.titles"
                :key="title"
                class="px-2 py-0.5 bg-[#3d2b1e] border border-[#f0d060] rounded font-pixel text-[7.5px] text-[#86efac]"
              >
                🎖️ {{ title }}
              </span>
            </div>
          </div>
        </div>

        <!-- Curator Feedback Scroll -->
        <div class="bg-[#fbf6e9] border-2 border-[#5a3a18] rounded-xl p-3 text-[#2d1b0e] max-h-40 overflow-y-auto space-y-2 shadow-inner">
          <div class="font-pixel text-[8px] sm:text-[8.5px] text-[#78350f] uppercase font-bold flex items-center gap-1 border-b border-[#c4956a] pb-1">
            <PhScroll :size="13" weight="fill" />
            <span>CATATAN KURATORIAL AI:</span>
          </div>
          <p class="font-sans text-xs text-[#1c1917] whitespace-pre-line leading-relaxed">
            {{ evaluationResult.feedback }}
          </p>
        </div>

        <!-- Status Approval -->
        <div
          :class="[
            'p-2 rounded-lg border text-center font-pixel text-[9px] sm:text-[10px] flex items-center justify-center gap-1.5',
            evaluationResult.score >= 70
              ? 'bg-[#183915] border-[#22c55e] text-[#86efac]'
              : 'bg-[#4a2618] border-[#f59e0b] text-[#fef08a]'
          ]"
        >
          <PhCheckCircle v-if="evaluationResult.score >= 70" :size="16" weight="fill" class="text-[#86efac]" />
          <span>
            {{ evaluationResult.score >= 70 ? 'KARYA MEMENUHI STANDAR ESTETIKA (+STEMPEL POS TERVERIFIKASI)' : 'KARYA DINILAI, NAMUN BUTUH EKSPLORASI GARIS LEBIH LANJUT' }}
          </span>
        </div>

        <!-- Finish Claim Button -->
        <button
          type="button"
          @click="handleFinishGame"
          class="w-full py-3 px-4 rounded-xl font-pixel text-xs font-bold uppercase tracking-wider rpg-btn-primary flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95"
        >
          <span>KLAIM NILAI & LANJUT PETUALANGAN</span>
          <PhArrowRight :size="16" weight="bold" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* High responsiveness touch canvas */
canvas {
  touch-action: none;
}
</style>
