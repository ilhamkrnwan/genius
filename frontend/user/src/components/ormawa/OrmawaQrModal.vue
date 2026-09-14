<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div 
      class="relative w-full max-w-sm bg-[#fbf6e9] border-4 border-[#3a2818] rounded-xl shadow-[8px_8px_0px_#000000] p-6 flex flex-col items-center animate-in fade-in zoom-in duration-200"
    >
      <button 
        @click="close"
        class="absolute -top-4 -right-4 h-10 w-10 bg-[#e11d48] border-2 border-[#3a2818] rounded-full text-white font-bold flex items-center justify-center hover:bg-[#be123c] shadow-[2px_2px_0px_#3a2818] z-10"
      >
        <PhX class="h-5 w-5" />
      </button>

      <div class="text-center space-y-2 mb-6">
        <h3 class="font-pixel text-[#3a2818] text-lg font-bold">QR PASPOR ANDA</h3>
        <p class="text-xs font-mono text-[#5c4033] leading-relaxed">
          Tunjukkan QR Code ini kepada petugas stan <b>{{ standName }}</b> untuk dipindai.
        </p>
      </div>

      <!-- QR Code Area -->
      <div class="bg-white p-4 border-2 border-[#3a2818] rounded-xl shadow-inner mb-6 relative">
        <!-- Corner decorations -->
        <div class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#166534]"></div>
        <div class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#166534]"></div>
        <div class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#166534]"></div>
        <div class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#166534]"></div>
        
        <img 
          :src="`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('GENIUS-MABA-' + participantNim)}`"
          alt="QR Code Maba"
          class="w-48 h-48 sm:w-56 sm:h-56 object-contain"
        />
      </div>

      <div class="w-full bg-[#f3ecd8] border-2 border-[#d4c3a3] rounded-lg p-3 text-center space-y-1">
        <div class="font-pixel text-[#3a2818] font-bold text-sm">{{ participantName }}</div>
        <div class="font-mono text-xs text-[#5c4033]">{{ participantNim }}</div>
      </div>

      <!-- Auto close timer -->
      <div class="mt-4 flex items-center gap-2 text-[10px] font-mono text-[#8c6b4a]">
        <PhTimer class="h-3 w-3" />
        <span>Menutup otomatis dalam {{ timeLeft }}s...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { PhX, PhTimer } from '@phosphor-icons/vue';
import { useGameStore } from '../../store/gameStore';

const props = defineProps<{
  modelValue: boolean;
  standName: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const store = useGameStore();
const participantName = store.participant.name;
const participantNim = store.participant.username || 'UNKNOWN';

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
