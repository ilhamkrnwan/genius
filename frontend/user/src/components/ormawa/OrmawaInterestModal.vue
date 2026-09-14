<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
    <!-- Backdrop with blur -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      @click="close"
    />

    <!-- Modal Card (Polished Retro RPG Parchment Card) -->
    <div 
      class="relative w-full max-w-md bg-[#fbf6e9] border-[3.5px] border-[#3a2818] rounded-2xl shadow-[inset_0_0_0_2px_#d4b886,0_20px_50px_rgba(0,0,0,0.85)] p-4 sm:p-6 flex flex-col max-h-[92vh] overflow-y-auto z-10 select-none animate-in zoom-in-95 duration-200"
    >
      <!-- Close Button (Inside card, cleanly aligned) -->
      <button 
        type="button"
        @click="close"
        class="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2a1a0e] hover:bg-[#3d2714] text-[#f0d060] hover:text-white border border-[#8b6f4e] hover:border-[#f0d060] flex items-center justify-center transition-all cursor-pointer shadow active:scale-95 z-20"
        title="Tutup Formulir"
      >
        <PhX :size="15" weight="bold" />
      </button>

      <!-- Modal Header -->
      <div class="text-center space-y-1.5 mb-4 pr-6 sm:pr-0">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ede3cb] border border-[#c4a97d] text-[8.5px] font-pixel text-[#5c4033] uppercase">
          <PhHandshake :size="13" weight="fill" class="text-[#2e6822]" />
          <span>REKRUTMEN MAHASISWA BARU</span>
        </div>

        <h3 class="font-pixel text-[#2d1b0e] text-base sm:text-lg font-bold tracking-wide">
          FORMULIR MINAT
        </h3>

        <p class="text-xs font-sans text-[#5c4033] leading-relaxed max-w-xs mx-auto">
          Tunjukkan minat Anda untuk bergabung dengan <br class="hidden sm:block" />
          <strong class="text-[#2e6822] font-bold">{{ standName }}</strong>.
        </p>
      </div>

      <!-- Form Content -->
      <form @submit.prevent="submit" class="space-y-3.5 text-left">
        <!-- Field 1: WhatsApp -->
        <div class="space-y-1">
          <label class="block font-pixel text-[9px] sm:text-[9.5px] text-[#3a2818] uppercase tracking-wider">
            Nomor WhatsApp <span class="text-red-600">*</span>
          </label>
          <div class="relative">
            <PhWhatsappLogo :size="16" weight="fill" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#2e6822]" />
            <input 
              v-model="form.phoneNumber" 
              type="tel" 
              required 
              placeholder="Contoh: 081234567890"
              class="w-full bg-[#f3ecd8] hover:bg-[#fffdf7] focus:bg-white border-2 border-[#8b6f4e] focus:border-[#2e6822] rounded-xl pl-9 pr-3 py-2 font-sans text-xs sm:text-sm text-[#2d1b0e] placeholder-[#a08060] focus:outline-none focus:ring-2 focus:ring-[#2e6822]/20 shadow-inner transition-colors"
            />
          </div>
        </div>

        <!-- Field 2: Motivasi -->
        <div class="space-y-1">
          <label class="block font-pixel text-[9px] sm:text-[9.5px] text-[#3a2818] uppercase tracking-wider">
            Motivasi Bergabung <span class="text-[#8c7860] lowercase font-sans text-[10px]">(opsional)</span>
          </label>
          <textarea 
            v-model="form.motivation" 
            rows="2"
            placeholder="Apa yang membuat Anda tertarik bergabung dengan organisasi ini?"
            class="w-full bg-[#f3ecd8] hover:bg-[#fffdf7] focus:bg-white border-2 border-[#8b6f4e] focus:border-[#2e6822] rounded-xl p-2.5 font-sans text-xs sm:text-sm text-[#2d1b0e] placeholder-[#a08060] focus:outline-none focus:ring-2 focus:ring-[#2e6822]/20 shadow-inner transition-colors resize-none"
          ></textarea>
        </div>

        <!-- Field 3: Pengalaman -->
        <div class="space-y-1">
          <label class="block font-pixel text-[9px] sm:text-[9.5px] text-[#3a2818] uppercase tracking-wider">
            Pengalaman Terkait <span class="text-[#8c7860] lowercase font-sans text-[10px]">(opsional)</span>
          </label>
          <textarea 
            v-model="form.experience" 
            rows="2"
            placeholder="Pernah ikut kegiatan serupa saat di SMA/MA? (tuliskan jika ada)"
            class="w-full bg-[#f3ecd8] hover:bg-[#fffdf7] focus:bg-white border-2 border-[#8b6f4e] focus:border-[#2e6822] rounded-xl p-2.5 font-sans text-xs sm:text-sm text-[#2d1b0e] placeholder-[#a08060] focus:outline-none focus:ring-2 focus:ring-[#2e6822]/20 shadow-inner transition-colors resize-none"
          ></textarea>
        </div>

        <!-- Warning Disclaimer / Agreement -->
        <div class="bg-[#ede3cb] border border-[#c4a97d] p-3 rounded-xl flex items-start gap-2.5 shadow-inner mt-1">
          <input 
            type="checkbox" 
            id="agreement" 
            v-model="isAgreed"
            required
            class="mt-0.5 w-4 h-4 text-[#2e6822] accent-[#2e6822] border-2 border-[#8b6f4e] rounded cursor-pointer shrink-0"
          >
          <label for="agreement" class="text-[10px] sm:text-[10.5px] font-sans text-[#4a341e] leading-snug cursor-pointer select-none">
            Saya menyatakan benar-benar berminat bergabung dengan <strong>{{ standName }}</strong>. Kontak yang saya berikan dapat diakses panitia stan untuk rekrutmen.
          </label>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          :disabled="isSubmitting || !isAgreed || !form.phoneNumber.trim()"
          class="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl font-pixel text-xs sm:text-sm font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed border-2 active:scale-[0.99]"
          :class="[
            (isAgreed && form.phoneNumber.trim())
              ? 'bg-gradient-to-b from-[#38761d] to-[#275314] hover:from-[#438d22] hover:to-[#2e6217] text-[#fbf6e9] border-[#1d3d0f] shadow-[0_4px_0_#1d3d0f,0_6px_12px_rgba(0,0,0,0.2)]'
              : 'bg-[#d8ceba] text-[#8c7860] border-[#b0a088] shadow-none opacity-80'
          ]"
        >
          <PhSpinner v-if="isSubmitting" :size="16" class="animate-spin text-white" />
          <PhPaperPlaneTilt v-else :size="15" weight="fill" class="text-[#f0d060]" />
          <span>{{ isSubmitting ? 'MENGIRIM...' : 'KIRIM FORMULIR MINAT' }}</span>
        </button>
      </form>
      
      <div v-if="errorMessage" class="mt-3 p-2 rounded-lg bg-red-100 border border-red-400 text-xs font-sans text-red-700 text-center flex items-center justify-center gap-1.5">
        <PhWarningCircle :size="14" weight="fill" class="shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { 
  PhX, 
  PhSpinner, 
  PhPaperPlaneTilt, 
  PhWhatsappLogo, 
  PhHandshake, 
  PhWarningCircle 
} from '@phosphor-icons/vue';

const props = defineProps<{
  modelValue: boolean;
  standId: string;
  standName: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: { phoneNumber: string; motivation?: string; experience?: string }): void;
}>();

const isSubmitting = ref(false);
const isAgreed = ref(false);
const errorMessage = ref('');

const form = reactive({
  phoneNumber: '',
  motivation: '',
  experience: '',
});

const close = () => {
  if (!isSubmitting.value) {
    emit('update:modelValue', false);
  }
};

const submit = () => {
  if (!isAgreed.value) {
    errorMessage.value = "Anda harus menyetujui pernyataan di atas.";
    return;
  }
  if (!form.phoneNumber.trim()) {
    errorMessage.value = "Nomor WhatsApp wajib diisi.";
    return;
  }
  
  isSubmitting.value = true;
  emit('submit', { ...form, phoneNumber: form.phoneNumber.trim() });
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // Reset form on open
    form.phoneNumber = '';
    form.motivation = '';
    form.experience = '';
    isAgreed.value = false;
    isSubmitting.value = false;
    errorMessage.value = '';
  }
});
</script>
