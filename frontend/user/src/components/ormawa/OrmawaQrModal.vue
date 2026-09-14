<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      @click="close"
    />

    <!-- Modal Content -->
    <div 
      class="relative w-full max-w-sm bg-[#fbf6e9] border-[3.5px] border-[#3a2818] rounded-2xl shadow-[inset_0_0_0_2px_#d4b886,0_20px_50px_rgba(0,0,0,0.85)] p-5 sm:p-6 flex flex-col items-center animate-in zoom-in-95 duration-200 z-10"
    >
      <!-- Close Button (Inside card, cleanly aligned) -->
      <button 
        type="button"
        @click="close"
        class="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2a1a0e] hover:bg-[#3d2714] text-[#f0d060] hover:text-white border border-[#8b6f4e] hover:border-[#f0d060] flex items-center justify-center transition-all cursor-pointer shadow active:scale-95 z-20"
        title="Tutup QR"
      >
        <PhX :size="15" weight="bold" />
      </button>

      <div class="text-center space-y-1.5 mb-4 pr-6 sm:pr-0">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ede3cb] border border-[#c4a97d] text-[8.5px] font-pixel text-[#5c4033] uppercase">
          <PhQrCode :size="12" weight="fill" class="text-[#2e6822]" />
          <span>SCAN STAN ORMAWA</span>
        </div>

        <h3 class="font-pixel text-[#2d1b0e] text-base font-bold tracking-wide">
          QR PASPOR ANDA
        </h3>

        <p class="text-xs font-sans text-[#5c4033] leading-relaxed">
          Tunjukkan QR Code ini kepada panitia stan <strong class="text-[#2e6822]">{{ standName }}</strong> untuk dipindai.
        </p>
      </div>

      <!-- QR Code Area -->
      <div class="bg-white p-3.5 border-2 border-[#8b6f4e] rounded-xl shadow-inner mb-4 relative">
        <!-- Corner decorations -->
        <div class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#2e6822]" />
        <div class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#2e6822]" />
        <div class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#2e6822]" />
        <div class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#2e6822]" />
        
        <img 
          :src="`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('GENIUS-MABA-' + participantNim)}`"
          alt="QR Code Maba"
          class="w-44 h-44 sm:w-52 sm:h-52 object-contain"
        />
      </div>

      <!-- Maba Identity Pill -->
      <div class="w-full bg-[#ede3cb] border border-[#c4a97d] rounded-xl p-2.5 text-center space-y-0.5 shadow-inner">
        <div class="font-pixel text-[#2d1b0e] font-bold text-xs sm:text-sm">
          {{ participantName }}
        </div>
        <div class="font-sans text-[11px] text-[#7a5836]">
          NIM: {{ participantNim }}
        </div>
      </div>

      <!-- Auto close timer -->
      <div class="mt-3.5 flex items-center gap-1.5 text-[10px] font-sans text-[#8c6b4a]">
        <PhTimer :size="13" class="text-[#b45309]" />
        <span>Menutup otomatis dalam <strong class="font-mono text-[#2d1b0e]">{{ timeLeft }}s</strong>...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { PhX, PhTimer, PhQrCode } from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';

const props = defineProps<{
  modelValue: boolean;
  standName: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const store = useGameStore();
const participantName = computed(() => store.participant?.name || 'Mahasiswa Baru');
const participantNim = computed(() => store.participant?.nim || store.participant?.username || '261100123');

const timeLeft = ref(60);
let timer: any = null;

const close = () => {
  emit('update:modelValue', false);
};

const startTimer = () => {
  timeLeft.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timer);
      close();
    }
  }, 1000);
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    startTimer();
  } else {
    if (timer) clearInterval(timer);
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
