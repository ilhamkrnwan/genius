<template>
  <div class="md:col-span-2 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <label class="text-[9px] font-pixel text-gray-400">LOGO ORMAWA / UKM</label>
      <span class="text-[9px] text-amber-300">PNG, JPG, atau WebP · maks. 2 MB</span>
    </div>
    <div class="grid grid-cols-[96px_1fr] gap-3 rounded-lg border border-[#523e2b] bg-[#0d0a07] p-3">
      <div class="aspect-square overflow-hidden rounded-md border-2 border-white bg-white flex items-center justify-center">
        <img v-if="modelValue" :src="modelValue" alt="Pratinjau logo Ormawa" class="h-full w-full object-contain p-1" />
        <ImageIcon v-else class="h-8 w-8 text-gray-400" />
      </div>
      <div class="min-w-0 flex flex-col justify-center gap-2">
        <p class="text-[10px] leading-relaxed text-gray-300">
          Gunakan logo persegi dengan <strong class="text-white">latar belakang putih</strong>. Rekomendasi minimal 300 × 300 piksel.
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="pixel-btn min-h-9 px-3 bg-[#4a2d0d] border-[#f59e0b] text-amber-100 text-[9px] font-pixel flex items-center gap-2" @click="fileInput?.click()">
            <Upload class="h-3.5 w-3.5" /> {{ modelValue ? 'GANTI LOGO' : 'UNGGAH LOGO' }}
          </button>
          <button v-if="modelValue" type="button" class="min-h-9 px-3 rounded border border-red-900 bg-red-950/30 text-red-300 text-[9px]" @click="clearLogo">HAPUS</button>
        </div>
        <p v-if="errorMessage" role="alert" class="text-[10px] text-red-300">{{ errorMessage }}</p>
      </div>
    </div>
    <input ref="fileInput" type="file" class="hidden" accept="image/png,image/jpeg,image/webp" @change="handleFile" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ImageIcon, Upload } from 'lucide-vue-next';

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const fileInput = ref<HTMLInputElement | null>(null);
const errorMessage = ref('');
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function clearLogo() {
  emit('update:modelValue', '');
  errorMessage.value = '';
  if (fileInput.value) fileInput.value.value = '';
}

function handleFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!ALLOWED_TYPES.has(file.type)) {
    errorMessage.value = 'Format file harus PNG, JPG, atau WebP.';
    input.value = '';
    return;
  }
  if (file.size > MAX_BYTES) {
    errorMessage.value = 'Ukuran logo melebihi batas 2 MB.';
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    emit('update:modelValue', String(reader.result || ''));
    errorMessage.value = '';
  };
  reader.onerror = () => { errorMessage.value = 'File logo tidak dapat dibaca. Pilih file lain.'; };
  reader.readAsDataURL(file);
}
</script>
