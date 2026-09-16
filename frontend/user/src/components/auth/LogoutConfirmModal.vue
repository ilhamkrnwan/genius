<script setup lang="ts">
import {
  PhSignOut,
  PhX,
  PhWarning,
  PhShieldCheck,
  PhUser,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const gameStore = useGameStore();

const handleCancel = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  emit('close');
};

const handleConfirmLogout = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  gameStore.logoutMaba();
  emit('confirm');
  emit('close');
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0a0604]/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans"
    @click.self="handleCancel"
  >
    <div
      class="w-full max-w-md bg-gradient-to-b from-[#2d1b0e] to-[#1a1008] border-[3.5px] border-[#f0d060] rounded-2xl p-4 sm:p-6 shadow-[inset_0_0_0_2px_#6b4f2e,0_16px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(240,208,96,0.3)] relative text-[#f0e0c0]"
    >
      <!-- Tombol Tutup X -->
      <button
        type="button"
        @click="handleCancel"
        class="absolute top-3.5 right-3.5 text-[#f0d060] hover:text-white bg-[#3d2b1e] border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg w-7 h-7 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer font-pixel text-xs"
        title="Batal dan Tutup"
      >
        <PhX :size="14" weight="bold" />
      </button>

      <!-- Icon & Header -->
      <div class="text-center space-y-2 mb-4">
        <div
          class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#451208]/80 border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.35)] p-2 mx-auto"
        >
          <PhSignOut :size="28" weight="bold" class="text-red-400" />
        </div>

        <h2 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold tracking-wider uppercase">
          KONFIRMASI KELUAR
        </h2>
        <p class="text-[11px] sm:text-xs text-[#d5c3aa] leading-relaxed">
          Apakah kamu yakin ingin keluar dari akun petualang?
        </p>
      </div>

      <!-- Detail Kartu Petualang yang akan logout -->
      <div class="bg-[#1c120a]/90 border border-[#5c3e23] rounded-xl p-3 mb-5 flex items-center gap-3">
        <div class="w-11 h-11 rounded-lg border-2 border-[#f0d060]/70 overflow-hidden bg-black/40 shrink-0">
          <img
            :src="gameStore.participant.avatar === 'character_cewek' ? '/character-cewek-avatar.png' : '/character-cowok-avatar.png'"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="font-pixel text-[10px] text-[#f0d060] truncate">
            {{ gameStore.participant.name || 'Mahasiswa Baru' }}
          </div>
          <div class="font-mono text-[9px] text-[#a0d870] truncate">
            NIM: {{ gameStore.participant.nim || '-' }}
          </div>
          <div class="text-[9px] text-[#c4956a] truncate">
            {{ gameStore.participant.prodi || 'UNU Yogyakarta' }}
          </div>
        </div>
      </div>

      <!-- Info Tambahan / Catatan Progres -->
      <div class="flex items-start gap-2 text-[10px] text-[#a89078] bg-[#140e08]/70 border border-[#402917] rounded-lg p-2.5 mb-5">
        <PhShieldCheck :size="16" weight="fill" class="text-[#7ec850] shrink-0 mt-0.5" />
        <span class="leading-tight">
          Progres petualangan, stempel profil, dan XP Anda tetap tersimpan di akun Anda dan dapat dilanjutkan saat masuk kembali.
        </span>
      </div>

      <!-- Tombol Aksi -->
      <div class="grid grid-cols-2 gap-2.5 font-pixel">
        <button
          type="button"
          @click="handleCancel"
          class="py-2.5 sm:py-3 px-3 rounded-xl border-2 border-[#5a3a18] bg-[#22160d] hover:bg-[#322013] text-[#d5c3aa] hover:text-white text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          BATAL
        </button>

        <button
          type="button"
          @click="handleConfirmLogout"
          class="py-2.5 sm:py-3 px-3 rounded-xl border-2 border-red-500 bg-gradient-to-r from-red-800 to-red-950 hover:from-red-700 hover:to-red-900 text-white text-[10px] sm:text-[11px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(220,38,38,0.4)] hover:brightness-110 cursor-pointer transition-all active:scale-95"
        >
          <PhSignOut :size="14" weight="bold" />
          <span>YA, KELUAR</span>
        </button>
      </div>
    </div>
  </div>
</template>
