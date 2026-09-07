<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono animate-in fade-in duration-200"
    @click.self="closeModal"
  >
    <div
      ref="modalContainer"
      class="relative w-full max-w-2xl bg-[#140e0a] border-4 border-[#ca8a04] shadow-[0_0_50px_rgba(202,138,4,0.3)] rounded-lg overflow-hidden flex flex-col max-h-[95vh]"
    >
      <!-- Ambient Top Glow -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ca8a04] via-[#facc15] to-[#ca8a04]"></div>

      <!-- Header Section -->
      <div class="px-5 py-3.5 bg-[#1e150e] border-b-2 border-[#523e2b] flex items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="h-8 w-8 rounded bg-[#ca8a04]/20 border border-[#facc15] flex items-center justify-center">
            <QrCode class="h-4 w-4 text-[#facc15]" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] tracking-wider uppercase">
                {{ activeTitle }}
              </h2>
              <span
                :class="[
                  'px-1.5 py-0.5 text-[9px] font-pixel rounded border uppercase',
                  autoRefreshEnabled
                    ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-400 animate-pulse'
                    : 'border-gray-600 bg-gray-800/80 text-gray-300'
                ]"
              >
                {{ autoRefreshEnabled ? 'LIVE 5 MENIT' : 'STATIS' }}
              </span>
            </div>
            <p class="text-[10px] text-gray-400 font-sans">
              {{ activeSubtitle }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Fullscreen Toggle -->
          <button
            @click="toggleFullscreen"
            class="h-8 w-8 pixel-btn bg-[#2b2014] text-[#facc15] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
            :title="isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Proyektor'"
          >
            <Minimize2 v-if="isFullscreen" class="h-4 w-4" />
            <Maximize2 v-else class="h-4 w-4" />
          </button>

          <!-- Close Button -->
          <button
            @click="closeModal"
            class="h-8 w-8 pixel-btn bg-[#2b1814] text-red-400 border-red-900/60 flex items-center justify-center hover:bg-[#3d1e18] cursor-pointer"
            title="Tutup (ESC)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Quick Switcher Bar / Active Session Info Bar -->
      <div v-if="activeSession" class="px-5 py-2.5 bg-[#18110b] border-b border-[#3d2a1b] flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-400">SESI AKTIF:</span>
          <span
            :class="[
              'px-2 py-0.5 text-[9px] font-pixel rounded border font-bold flex items-center gap-1',
              activeSession.type === 'CHECK_IN'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-400'
                : 'bg-sky-950/70 border-sky-500 text-sky-400'
            ]"
          >
            <CheckCircle2 v-if="activeSession.type === 'CHECK_IN'" class="h-3 w-3 text-emerald-400" />
            <LogOut v-else class="h-3 w-3 text-sky-400" />
            {{ activeSession.type === 'CHECK_IN' ? 'CHECK-IN (PRESENSI MASUK)' : 'CHECK-OUT (KEPULANGAN)' }}
          </span>
          <span class="text-[10px] text-[#facc15] font-bold border border-[#ca8a04]/40 bg-[#2b2014] px-1.5 py-0.5 rounded font-mono">
            +{{ activeSession.xpReward }} XP
          </span>
        </div>

        <div class="text-[11px] text-gray-400 flex items-center gap-1.5">
          <span class="text-[10px]">Token Dasar:</span>
          <code class="px-1.5 py-0.5 bg-black/50 border border-[#523e2b] rounded text-[#facc15] font-mono text-[10px] font-bold">
            {{ activeSession.qrToken }}
          </code>
        </div>
      </div>

      <div v-else-if="!customCard" class="px-5 py-2.5 bg-[#18110b] border-b border-[#3d2a1b] flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <!-- Day Selector Fallback -->
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-gray-400 mr-1">Hari:</span>
          <button
            v-for="d in 3"
            :key="d"
            @click="selectedDay = d as 1 | 2 | 3"
            :class="[
              'px-2.5 py-1 text-[10px] font-pixel rounded border transition-all cursor-pointer',
              selectedDay === d
                ? 'bg-[#ca8a04] text-black border-[#facc15] font-bold shadow'
                : 'bg-[#22170f] text-gray-400 border-[#4a3624] hover:text-white'
            ]"
          >
            H{{ d }}
          </button>
        </div>

        <!-- Masuk vs Pulang Selector Fallback -->
        <div class="flex items-center gap-1">
          <button
            @click="selectedGateType = 'MASUK'"
            :class="[
              'px-3 py-1 text-[10px] font-pixel rounded border transition-all cursor-pointer flex items-center gap-1',
              selectedGateType === 'MASUK'
                ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                : 'bg-[#152216] text-emerald-400/80 border-[#2d4d2f] hover:bg-[#1a2d1c]'
            ]"
          >
            <CheckCircle2 class="h-3 w-3" />
            <span>MASUK (PAGI)</span>
          </button>

          <button
            @click="selectedGateType = 'PULANG'"
            :class="[
              'px-3 py-1 text-[10px] font-pixel rounded border transition-all cursor-pointer flex items-center gap-1',
              selectedGateType === 'PULANG'
                ? 'bg-sky-600 text-white border-sky-400 font-bold shadow'
                : 'bg-[#12232f] text-sky-400/80 border-[#264359] hover:bg-[#182e3e]'
            ]"
          >
            <LogOut class="h-3 w-3" />
            <span>PULANG (SORE)</span>
          </button>
        </div>
      </div>

      <!-- Main QR Display Area -->
      <div class="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-4 text-center">
        <!-- Big QR Box -->
        <div class="relative p-4 sm:p-5 bg-white border-4 border-black rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center">
          <div v-if="qrLoading" class="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <RotateCw class="h-10 w-10 text-gray-500 animate-spin" />
          </div>
          <img
            v-else
            :src="currentQrDataUrl"
            :alt="currentActiveToken"
            class="w-64 h-64 sm:w-72 sm:h-72 object-contain transition-all duration-300"
          />

          <!-- Token String Display with Copy Action -->
          <div
            @click="copyToken"
            class="mt-3 px-3 py-1 bg-[#1c140d] border border-[#523e2b] rounded text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer hover:border-[#facc15] transition-all"
            title="Klik untuk salin token"
          >
            <span class="text-[#facc15] tracking-wider">{{ currentActiveToken }}</span>
            <Copy class="h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>

        <!-- Live Countdown & Progress Bar (5 Menit) -->
        <div class="w-full max-w-md space-y-2">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="flex items-center gap-1.5 text-gray-300">
              <Clock class="h-3.5 w-3.5 text-[#f59e0b]" />
              <span v-if="autoRefreshEnabled">Berganti otomatis dalam:</span>
              <span v-else class="text-amber-400">Pembaruan otomatis dijeda:</span>
            </span>

            <span
              :class="[
                'font-pixel text-sm font-bold px-2 py-0.5 rounded border',
                autoRefreshEnabled
                  ? remainingSeconds <= 30
                    ? 'bg-red-950/80 border-red-500 text-red-400 animate-bounce'
                    : 'bg-[#2b2014] border-[#ca8a04] text-[#facc15]'
                  : 'bg-gray-800 border-gray-600 text-gray-400'
              ]"
            >
              {{ autoRefreshEnabled ? formattedCountdown : 'DIJEDA' }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full h-2 bg-[#22160d] rounded-full overflow-hidden border border-[#4a3624]">
            <div
              class="h-full transition-all duration-1000 ease-linear rounded-full"
              :style="{ width: `${autoRefreshEnabled ? progressPercentage : 100}%` }"
              :class="[
                remainingSeconds <= 30
                  ? 'bg-red-500'
                  : remainingSeconds <= 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              ]"
            ></div>
          </div>
        </div>

        <!-- Student Instructions Badge -->
        <div class="text-[11px] font-mono text-gray-400 border border-[#3d2a1b] bg-[#1a120b] px-4 py-2 rounded max-w-md text-left space-y-1">
          <p class="font-bold text-[#facc15] flex items-center gap-1">
            <Smartphone class="h-3.5 w-3.5" />
            <span>PETUNJUK MAHASISWA BARU:</span>
          </p>
          <p>1. Buka aplikasi <strong>GENIUS UNU</strong> di smartphone Anda.</p>
          <p>2. Tekan menu <strong>PRESENSI</strong> lalu arahkan kamera ke layar ini.</p>
        </div>
      </div>

      <!-- Bottom Controls Bar -->
      <div class="px-5 py-3 bg-[#1e150e] border-t-2 border-[#523e2b] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <!-- Auto-Refresh Toggle -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="toggleAutoRefresh()"
            :class="[
              'h-8 px-3 rounded font-pixel text-[10px] border flex items-center gap-1.5 transition-all cursor-pointer',
              autoRefreshEnabled
                ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300 hover:bg-emerald-800/80'
                : 'bg-[#2b2014] border-[#523e2b] text-gray-400 hover:text-white'
            ]"
          >
            <ToggleRight v-if="autoRefreshEnabled" class="h-4 w-4 text-emerald-400" />
            <ToggleLeft v-else class="h-4 w-4 text-gray-400" />
            <span>{{ autoRefreshEnabled ? 'AUTO-REFRESH: AKTIF (5 MENIT)' : 'AUTO-REFRESH: NONAKTIF' }}</span>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            @click="triggerManualRandomize"
            class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#ca8a04] text-black border-[#facc15] flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer"
            title="Generate kode QR baru sekarang"
          >
            <RotateCw class="h-3.5 w-3.5" :class="isRotating && 'animate-spin'" />
            <span>ACAK SEKARANG</span>
          </button>

          <button
            type="button"
            @click="closeModal"
            class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#271d15] text-gray-300 border-[#523e2b] hover:bg-[#3d2d1e] cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import {
  QrCode,
  X,
  Maximize2,
  Minimize2,
  Clock,
  RotateCw,
  Copy,
  CheckCircle2,
  LogOut,
  Smartphone,
  ToggleRight,
  ToggleLeft,
} from "lucide-vue-next";
import { useDynamicQr } from "@/composables/useDynamicQr";

const props = defineProps<{
  modelValue: boolean;
  initialDay?: 1 | 2 | 3;
  initialType?: "MASUK" | "PULANG";
  activeSession?: {
    id: string;
    title: string;
    type: "CHECK_IN" | "CHECK_OUT";
    qrToken: string;
    xpReward: number;
    description?: string;
    [key: string]: any;
  } | null;
  customCard?: {
    code: string;
    name?: string;
    title?: string;
    subtitle?: string;
    [key: string]: any;
  } | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
}>();

const {
  autoRefreshEnabled,
  remainingSeconds,
  formattedCountdown,
  progressPercentage,
  getDynamicToken,
  randomizeAll,
  toggleAutoRefresh,
  renderQrDataUrl,
} = useDynamicQr();

const selectedDay = ref<1 | 2 | 3>(props.initialDay || 1);
const selectedGateType = ref<"MASUK" | "PULANG">(props.initialType || "MASUK");
const currentQrDataUrl = ref<string>("");
const qrLoading = ref(false);
const isRotating = ref(false);
const isFullscreen = ref(false);
const modalContainer = ref<HTMLElement | null>(null);

// Gate base codes dictionary (fallback)
const gateCodes = {
  1: {
    MASUK: "UNU-PRESENSI-H1-GATE-2026",
    PULANG: "UNU-PRESENSI-H1-CHECKOUT-2026",
  },
  2: {
    MASUK: "UNU-PRESENSI-H2-GATE-2026",
    PULANG: "UNU-PRESENSI-H2-CHECKOUT-2026",
  },
  3: {
    MASUK: "UNU-PRESENSI-H3-GATE-2026",
    PULANG: "UNU-PRESENSI-H3-CHECKOUT-2026",
  },
};

const currentBaseCode = computed(() => {
  if (props.customCard) {
    return props.customCard.code;
  }
  if (props.activeSession?.qrToken) {
    return props.activeSession.qrToken;
  }
  return gateCodes[selectedDay.value]?.[selectedGateType.value] || "UNU-PRESENSI-GATE-2026";
});

const currentActiveToken = computed(() => {
  return getDynamicToken(currentBaseCode.value);
});

const activeTitle = computed(() => {
  if (props.customCard) {
    return props.customCard.title || props.customCard.name || props.customCard.code;
  }
  if (props.activeSession?.title) {
    return `${props.activeSession.title} • ${props.activeSession.type === "CHECK_IN" ? "CHECK-IN" : "CHECK-OUT"}`;
  }
  const typeText = selectedGateType.value === "MASUK" ? "PRESENSI MASUK PAGI" : "PRESENSI PULANG SORE";
  return `${typeText} • SESI AKTIF`;
});

const activeSubtitle = computed(() => {
  if (props.customCard) {
    return props.customCard.subtitle || "Pindai QR ini melalui aplikasi GENIUS";
  }
  if (props.activeSession) {
    return `Hadiah: +${props.activeSession.xpReward} XP • ${props.activeSession.description || "Pindai menggunakan menu Presensi di aplikasi GENIUS"}`;
  }
  return "Gerbang Masuk / Pintu Hall Utama UNU Yogyakarta";
});

// Update QR data url whenever active token changes
async function updateQrImage() {
  qrLoading.value = true;
  try {
    currentQrDataUrl.value = await renderQrDataUrl(currentActiveToken.value);
  } finally {
    qrLoading.value = false;
  }
}

watch(
  [() => currentActiveToken.value, () => props.modelValue],
  () => {
    if (props.modelValue) {
      updateQrImage();
    }
  },
  { immediate: true }
);

function triggerManualRandomize() {
  isRotating.value = true;
  randomizeAll([currentBaseCode.value]);
  updateQrImage();
  setTimeout(() => {
    isRotating.value = false;
  }, 500);
}

function copyToken() {
  if (!currentActiveToken.value) return;
  navigator.clipboard.writeText(currentActiveToken.value);
}

function closeModal() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  emit("update:modelValue", false);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    modalContainer.value?.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(() => {});
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch(() => {});
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.modelValue) {
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = Boolean(document.fullscreenElement);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>
