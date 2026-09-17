<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  PhX,
  PhCheck,
  PhUser,
  PhLockKey,
  PhIdentificationCard,
  PhArrowLeft,
  PhSignIn,
  PhGenderMale,
  PhGenderFemale,
  PhCheckCircle,
  PhSignOut,
  PhUsersThree,
  PhGraduationCap,
  PhSparkle,
} from '@phosphor-icons/vue';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    initialStep?: 'login' | 'profile';
    reauthenticate?: boolean;
  }>(),
  {
    initialStep: 'login',
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'complete'): void;
  (e: 'requestLogout'): void;
}>();

const gameStore = useGameStore();

// Flow step: 'login' | 'profile'
const currentStep = ref<'login' | 'profile'>(props.initialStep);

// Login Form State
const loginNim = ref(gameStore.participant.nim || '');
const loginPassword = ref('');
const loginError = ref('');
const isSubmitting = ref(false);

const isUserFemale = computed(() => {
  const g = (gameStore.participant.gender || '').toUpperCase();
  return (
    g === 'FEMALE' ||
    g === 'P' ||
    g === 'PEREMPUAN' ||
    gameStore.participant.avatar === 'character_cewek'
  );
});

const avatarImg = computed(() => {
  return isUserFemale.value
    ? '/character-cewek-avatar.png'
    : '/character-cowok-avatar.png';
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      currentStep.value = props.initialStep || 'login';
      loginNim.value = gameStore.participant.nim || '';
      loginPassword.value = '';
      loginError.value = '';
    }
  }
);

watch(
  () => props.initialStep,
  (newStep) => {
    if (newStep) {
      currentStep.value = newStep;
    }
  }
);

// If reauthenticate is required, require valid auth before dismiss, otherwise let user close modal
const canDismiss = computed(() => {
  if (props.reauthenticate) {
    return Boolean(
      gameStore.isLoggedIn &&
      gameStore.participant?.isRegistered &&
      gameStore.participant?.name
    );
  }
  return true;
});

const handleLoginSubmit = async (e: Event) => {
  e.preventDefault();
  if (!loginNim.value.trim()) {
    loginError.value = 'Mohon masukkan NIM Mahasiswa Baru';
    return;
  }
  if (!loginPassword.value) {
    loginError.value = 'Mohon masukkan kata sandi Anda';
    return;
  }
  loginError.value = '';
  isSubmitting.value = true;
  if (gameStore.soundEnabled) soundEngine.playClick();

  try {
    const response = await api.loginMaba(loginNim.value.trim(), loginPassword.value);
    if (!response.success || !response.data?.user) {
      loginError.value = response.error?.message || 'Login gagal. Periksa kembali NIM dan kata sandi Anda.';
      return;
    }

    const user = response.data.user as any;
    const userGender = (user.gender || '').toUpperCase();
    const isFemale = userGender === 'FEMALE' || userGender === 'P' || userGender === 'PEREMPUAN';
    const lockedAvatar = isFemale ? 'character_cewek' : 'character_cowok';

    const groupNameFormatted = user.teamName
      ? (user.teamCode ? `${user.teamName} (${user.teamCode})` : user.teamName)
      : undefined;

    gameStore.loginMaba({
      id: user.id,
      name: user.fullName || loginNim.value.trim(),
      nim: user.username || loginNim.value.trim(),
      isRegistered: true,
      teamId: user.teamId || undefined,
      groupId: user.teamId || undefined,
      groupName: groupNameFormatted,
      faculty: user.faculty || undefined,
      prodi: user.prodi || undefined,
      gender: user.gender,
      avatar: lockedAvatar,
      totalXp: Number(user.totalScore || user.totalXp || 0),
    });

    if (gameStore.soundEnabled) soundEngine.playCorrect();

    void gameStore.syncWithServer();
    emit('complete');
    emit('close');
  } catch (err: any) {
    loginError.value = err.message || 'Terjadi kesalahan saat masuk ke sistem.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0a0604]/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans"
    @click.self="canDismiss && emit('close')"
  >
    <div
      class="w-full max-w-lg max-h-[94dvh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#2d1b0e] to-[#1a1008] border-[3.5px] border-[#f0d060] rounded-2xl p-4 sm:p-6 shadow-[inset_0_0_0_2px_#6b4f2e,0_16px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(240,208,96,0.3)] relative text-[#f0e0c0]"
    >
      <!-- Close button only if allowed -->
      <button
        v-if="canDismiss"
        type="button"
        @click="emit('close')"
        class="absolute top-3.5 right-3.5 text-[#f0d060] hover:text-white bg-[#3d2b1e] border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg w-7 h-7 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer font-pixel text-xs"
        title="Tutup"
      >
        <PhX :size="14" weight="bold" />
      </button>

      <!-- ======================================================= -->
      <!-- STEP 1: MODAL LOGIN MAHASISWA BARU                     -->
      <!-- ======================================================= -->
      <div v-if="currentStep === 'login'" class="space-y-4">
        <!-- Header -->
        <div class="text-center space-y-1">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1e130a] border-2 border-[#f0d060] shadow-md p-1 mx-auto mb-1">
            <img src="/unu.png" alt="UNU Logo" class="h-full w-auto object-contain" />
          </div>
          <h2 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold tracking-wide uppercase">
            PORTAL LOGIN MAHASISWA BARU
          </h2>
          <p class="text-[10px] text-[#c4956a]">
            PKKMB UNU Yogyakarta 2026. Masuk menggunakan data resmi Anda.
          </p>
        </div>

        <!-- Login Form -->
        <form @submit="handleLoginSubmit" class="space-y-3 font-mono">
          <div v-if="loginError" class="p-2 rounded bg-red-950/80 border border-red-600 text-red-300 text-xs text-center">
            {{ loginError }}
          </div>

          <div class="space-y-1">
            <label class="block font-pixel text-[8px] text-[#c4956a] uppercase">
              NIM (Nomor Induk Mahasiswa)
            </label>
            <div class="relative">
              <PhIdentificationCard :size="16" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#f0d060]" />
              <input
                type="text"
                v-model="loginNim"
                required
                placeholder="Contoh: 262221041"
                class="w-full pl-8 pr-3 py-2 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg text-xs text-white outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block font-pixel text-[8px] text-[#c4956a] uppercase">
              KATA SANDI
            </label>
            <div class="relative">
              <PhLockKey :size="16" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#f0d060]" />
              <input
                type="password"
                v-model="loginPassword"
                required
                placeholder="••••••••"
                class="w-full pl-8 pr-3 py-2 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="rpg-btn-primary w-full py-3 px-4 font-pixel text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2 disabled:opacity-50"
          >
            <PhSignIn :size="16" weight="bold" />
            <span>{{ isSubmitting ? 'MEMVERIFIKASI...' : 'MASUK KE PERMAINAN ▶' }}</span>
          </button>
        </form>
      </div>

      <!-- ======================================================= -->
      <!-- STEP 2: VERIFIED DIGITAL IDENTITY CARD (READ-ONLY)      -->
      <!-- ======================================================= -->
      <div v-else-if="currentStep === 'profile'" class="space-y-4">
        <!-- Header -->
        <div class="text-center space-y-1">
          <div class="inline-flex items-center gap-1.5 bg-[#162713] border border-[#22c55e] text-[#86efac] font-pixel text-[8.5px] px-3 py-1 rounded-full uppercase tracking-wider">
            <PhCheckCircle :size="12" weight="fill" class="text-[#22c55e]" />
            <span>DATA TERVERIFIKASI RESMI</span>
          </div>
          <h2 class="font-pixel text-xs sm:text-sm text-[#fef08a] font-bold tracking-wide uppercase">
            IDENTITAS MAHASISWA BARU
          </h2>
          <p class="text-[10px] text-[#c4956a]">
            Biodata dan karakter telah terkunci secara otomatis sesuai database resmi.
          </p>
        </div>

        <!-- Read-Only Identity Card -->
        <div class="space-y-3 font-sans">
          <!-- Karakter RPG Terkunci Sesuai Gender -->
          <div class="p-3 rounded-xl border-2 border-[#f0d060] bg-gradient-to-r from-[#28180c] via-[#331e0f] to-[#1c1108] flex items-center gap-3.5 shadow-md">
            <!-- Portrait Container -->
            <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#120a05] border-2 border-[#f0d060] shrink-0 relative shadow-inner">
              <img
                :src="avatarImg"
                alt="Avatar"
                class="w-full h-full object-cover object-top"
              />
            </div>

            <!-- Identity Details -->
            <div class="text-left flex-1 min-w-0">
              <div class="font-pixel text-[10px] sm:text-[11px] text-white font-bold flex items-center gap-1.5">
                <span>{{ isUserFemale ? 'Mahasiswi (Cewek)' : 'Mahasiswa (Cowok)' }}</span>
                <PhGenderFemale v-if="isUserFemale" :size="13" weight="bold" class="text-[#f472b6]" />
                <PhGenderMale v-else :size="13" weight="bold" class="text-[#38bdf8]" />
              </div>
              <div class="text-[9px] text-[#fef08a] font-mono mt-0.5">
                {{ isUserFemale ? 'Hijab Putih & Jas Almamater UNU' : 'Peci Hitam & Jas Almamater UNU' }}
              </div>
              <div class="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#3b7829]/30 border border-[#7ec850]/50 text-[#86efac] text-[7.5px] font-pixel">
                <PhCheck :size="10" weight="bold" />
                <span>Karakter Terkunci Sesuai Gender Resmi</span>
              </div>
            </div>
          </div>

          <!-- Academic & Regu Details (Read-only Grid) -->
          <div class="space-y-2 bg-[#20140c] p-3 rounded-xl border border-[#5a3a18]">
            <!-- Nama Lengkap -->
            <div class="p-2 rounded-lg bg-[#170f07] border border-[#4a2e14]">
              <span class="block font-pixel text-[7.5px] text-[#c4956a] uppercase">Nama Lengkap</span>
              <span class="font-bold text-xs text-[#86efac] block mt-0.5">
                {{ gameStore.participant.name || '-' }}
              </span>
            </div>

            <!-- NIM & Regu -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="p-2 rounded-lg bg-[#170f07] border border-[#4a2e14]">
                <span class="block font-pixel text-[7.5px] text-[#c4956a] uppercase">NIM</span>
                <span class="font-mono text-xs text-[#fde047] font-bold block mt-0.5">
                  {{ gameStore.participant.nim || '-' }}
                </span>
              </div>

              <div class="p-2 rounded-lg bg-[#170f07] border border-[#4a2e14]">
                <span class="block font-pixel text-[7.5px] text-[#c4956a] uppercase">Regu Pendamping</span>
                <span class="font-pixel text-[9.5px] text-[#86efac] font-bold block mt-0.5 truncate">
                  {{ gameStore.participant.groupName || 'Regu Maba' }}
                </span>
              </div>
            </div>

            <!-- Fakultas & Prodi -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="p-2 rounded-lg bg-[#170f07] border border-[#4a2e14]">
                <span class="block font-pixel text-[7.5px] text-[#c4956a] uppercase">Fakultas</span>
                <span class="text-[11px] text-[#fbf6e9] font-medium block mt-0.5 truncate">
                  {{ gameStore.participant.faculty || '-' }}
                </span>
              </div>

              <div class="p-2 rounded-lg bg-[#170f07] border border-[#4a2e14]">
                <span class="block font-pixel text-[7.5px] text-[#c4956a] uppercase">Program Studi</span>
                <span class="text-[11px] text-[#86efac] font-semibold block mt-0.5 truncate">
                  {{ gameStore.participant.prodi || '-' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 pt-1 font-pixel">
            <button
              v-if="gameStore.isLoggedIn"
              type="button"
              @click="emit('requestLogout')"
              class="py-2.5 px-3 rounded-lg border-2 border-red-700/60 bg-red-950/50 hover:bg-red-900/60 text-red-300 hover:text-white text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Keluar dari akun"
            >
              <PhSignOut :size="12" weight="bold" />
              <span>KELUAR</span>
            </button>

            <button
              type="button"
              @click="emit('close')"
              class="rpg-btn-primary flex-1 py-3 px-3 text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>LANJUTKAN PENJELAJAHAN ▶</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
