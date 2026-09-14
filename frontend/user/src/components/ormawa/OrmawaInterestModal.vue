<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div 
      class="relative w-full max-w-md bg-[#fbf6e9] border-4 border-[#3a2818] rounded-xl shadow-[8px_8px_0px_#000000] p-6 flex flex-col animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
    >
      <button 
        @click="close"
        class="absolute -top-4 -right-4 h-10 w-10 bg-[#e11d48] border-2 border-[#3a2818] rounded-full text-white font-bold flex items-center justify-center hover:bg-[#be123c] shadow-[2px_2px_0px_#3a2818] z-10"
      >
        <PhX class="h-5 w-5" />
      </button>

      <div class="text-center space-y-2 mb-6">
        <h3 class="font-pixel text-[#3a2818] text-lg font-bold">FORMULIR MINAT</h3>
        <p class="text-xs font-mono text-[#5c4033] leading-relaxed">
          Tunjukkan minat Anda untuk bergabung dengan <b>{{ standName }}</b>.
        </p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-[#3a2818] mb-1">Nomor WhatsApp *</label>
          <input 
            v-model="form.phoneNumber" 
            type="text" 
            required 
            placeholder="0812xxxx"
            class="w-full bg-white border-2 border-[#3a2818] rounded-lg p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-[#3a2818] mb-1">Motivasi Bergabung (Opsional)</label>
          <textarea 
            v-model="form.motivation" 
            rows="3"
            placeholder="Mengapa Anda tertarik bergabung?"
            class="w-full bg-white border-2 border-[#3a2818] rounded-lg p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-[#3a2818] mb-1">Pengalaman Terkait (Opsional)</label>
          <textarea 
            v-model="form.experience" 
            rows="2"
            placeholder="Sebutkan pengalaman Anda jika ada"
            class="w-full bg-white border-2 border-[#3a2818] rounded-lg p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
          ></textarea>
        </div>

        <!-- Warning Disclaimer -->
        <div class="bg-[#fefce8] border-2 border-[#ca8a04] p-3 rounded-lg flex items-start gap-3 mt-4">
          <input 
            type="checkbox" 
            id="agreement" 
            v-model="isAgreed"
            required
            class="mt-1 w-4 h-4 text-[#166534] border-2 border-[#3a2818] rounded focus:ring-[#166534]"
          >
          <label for="agreement" class="text-[10px] font-mono text-[#854d0e] leading-tight">
            Saya menyatakan benar-benar berminat untuk bergabung dengan ormawa/ukm ini. 
            Data yang saya berikan dapat diakses oleh admin ormawa terkait untuk keperluan rekrutmen.
          </label>
        </div>

        <button 
          type="submit"
          :disabled="isSubmitting || !isAgreed"
          class="w-full mt-4 bg-[#166534] hover:bg-[#14532d] disabled:bg-gray-400 text-white font-pixel py-3 rounded-lg border-2 border-[#3a2818] shadow-[4px_4px_0px_#3a2818] transition-all flex items-center justify-center gap-2"
        >
          <PhSpinner v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <span>{{ isSubmitting ? 'MENGIRIM...' : 'KIRIM FORMULIR' }}</span>
        </button>
      </form>
      
      <p v-if="errorMessage" class="mt-4 text-xs font-mono text-red-600 text-center">
        {{ errorMessage }}
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { PhX, PhSpinner } from '@phosphor-icons/vue';

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
  if (!form.phoneNumber) {
    errorMessage.value = "Nomor WhatsApp wajib diisi.";
    return;
  }
  
  isSubmitting.value = true;
  emit('submit', { ...form });
  // Parent will handle the actual API call and close the modal
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
