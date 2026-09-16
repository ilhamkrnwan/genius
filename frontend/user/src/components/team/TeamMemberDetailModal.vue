<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import {
  PhX,
  PhCrown,
  PhShieldCheck,
  PhUser,
  PhGraduationCap,
  PhBuildings,
  PhStar,
  PhSparkle,
  PhIdentificationCard,
  PhTrophy,
} from '@phosphor-icons/vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import { soundEngine } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';

export interface TeamMemberData {
  id?: string;
  userId?: string;
  username?: string;
  fullName?: string;
  role?: 'BUDDY' | 'PARTICIPANT' | 'ADMIN';
  gender?: string;
  faculty?: string;
  prodi?: string;
  characterClass?: string;
  characterTitle?: string;
  characterTier?: number;
  unlockedTitles?: string[];
  avatarUrl?: string;
  isCaptain?: boolean;
  buddyRole?: 'PRIMARY' | 'ASSISTANT' | null;
  totalScore?: number;
}

const props = defineProps<{
  isOpen: boolean;
  member: TeamMemberData | null;
  isCurrentUser?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();

function handleClose() {
  try {
    if (gameStore.soundEnabled) soundEngine.playClick();
  } catch {
    // audio failure should never prevent modal from closing
  }
  emit('close');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

const displayAvatar = computed(() => {
  if (!props.member) return '/character-cowok-avatar.png';
  if (props.member.avatarUrl) return props.member.avatarUrl;
  return props.member.gender === 'FEMALE' || props.member.gender === 'perempuan'
    ? '/character-cewek-avatar.png'
    : '/character-cowok-avatar.png';
});

const isBuddy = computed(() => props.member?.role === 'BUDDY');
const isCaptain = computed(() => Boolean(props.member?.isCaptain));

const roleLabel = computed(() => {
  if (!props.member) return 'Anggota Regu';
  if (props.member.role === 'BUDDY') {
    return props.member.buddyRole === 'PRIMARY' ? 'Pemandu Utama' : 'Pemandu Pendamping';
  }
  if (props.member.isCaptain) {
    return 'Kapten Regu';
  }
  return 'Mahasiswa Baru';
});

const formattedClass = computed(() => {
  const c = props.member?.characterClass;
  if (!c) return 'Adventurer';
  return c.replace(/_/g, ' ');
});
</script>

<template>
  <div
    v-if="isOpen && member"
    class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0a0604]/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans"
    @click.self="handleClose"
  >
    <div
      class="w-full max-w-md max-h-[92dvh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#2d1b0e] to-[#1a1008] border-[3.5px] border-[#f0d060] rounded-2xl p-4 sm:p-6 shadow-[inset_0_0_0_2px_#6b4f2e,0_16px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(240,208,96,0.3)] relative text-[#f0e0c0]"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="handleClose"
        class="absolute top-3.5 right-3.5 text-[#f0d060] hover:text-white bg-[#3d2b1e] border border-[#8b6f4e] hover:border-[#f0d060] rounded-lg w-7 h-7 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer font-pixel text-xs z-10"
        title="Tutup"
      >
        <PhX :size="14" weight="bold" />
      </button>

      <!-- Member Header & Character Avatar Card -->
      <div class="text-center space-y-3 mb-4">
        <!-- Avatar Frame with Golden Rim -->
        <div class="relative inline-block mx-auto">
          <div
            :class="[
              'w-24 h-24 rounded-2xl overflow-hidden border-3 p-1 shadow-lg relative bg-[#170f07]',
              isBuddy
                ? 'border-[#a855f7] shadow-[#a855f7]/30'
                : isCaptain
                ? 'border-[#f0d060] shadow-[#f0d060]/30'
                : 'border-[#7ec850] shadow-[#7ec850]/20'
            ]"
          >
            <img
              :src="displayAvatar"
              :alt="member.fullName || 'Member Avatar'"
              class="w-full h-full object-cover rounded-xl"
            />
          </div>

          <!-- Top Role Badge Icon -->
          <div
            v-if="isCaptain"
            class="absolute -top-2.5 -right-2.5 bg-[#f0d060] text-[#1b120a] p-1.5 rounded-full border-2 border-[#5a3a18] shadow-md animate-bounce"
            title="Kapten Kelompok"
          >
            <PhCrown :size="14" weight="fill" />
          </div>
          <div
            v-else-if="isBuddy"
            class="absolute -top-2.5 -right-2.5 bg-[#a855f7] text-white p-1.5 rounded-full border-2 border-[#5a3a18] shadow-md"
            title="Pemandu / Buddy"
          >
            <PhShieldCheck :size="14" weight="fill" />
          </div>
        </div>

        <!-- Name & Badges -->
        <div>
          <div class="flex items-center justify-center gap-1.5 flex-wrap mb-1">
            <PixelBadge
              v-if="isBuddy"
              variant="purple"
              size="sm"
            >
              <template #icon>
                <PhShieldCheck :size="11" weight="bold" />
              </template>
              {{ roleLabel }}
            </PixelBadge>
            <PixelBadge
              v-else-if="isCaptain"
              variant="gold"
              size="sm"
            >
              <template #icon>
                <PhCrown :size="11" weight="fill" />
              </template>
              KAPTEN REGU
            </PixelBadge>
            <PixelBadge
              v-else
              variant="green"
              size="sm"
            >
              ANGGOTA REGU
            </PixelBadge>

            <PixelBadge
              v-if="isCurrentUser"
              variant="gold"
              size="sm"
            >
              KAMU
            </PixelBadge>
          </div>

          <h2 class="font-pixel text-sm sm:text-base text-white font-bold tracking-wide">
            {{ member.fullName || 'Peserta GENIUS' }}
          </h2>
          <p class="font-mono text-xs text-[#c4956a] mt-0.5">
            NIM: {{ member.username || '-' }}
          </p>
        </div>
      </div>

      <!-- Detail Grid & RPG Stat Cards -->
      <div class="space-y-2.5 font-sans text-xs">
        <!-- 1. RPG Character Class Card -->
        <div class="p-3 rounded-xl bg-[#1e130a]/90 border border-[#5a3a18] space-y-2">
          <div class="flex items-center justify-between border-b border-[#3d2b1e] pb-1.5">
            <span class="font-pixel text-[9px] text-[#f0d060] uppercase tracking-wider flex items-center gap-1">
              <PhSparkle :size="12" weight="fill" />
              Karakter RPG
            </span>
            <div class="flex items-center gap-1 text-[#facc15] font-pixel text-[9px]">
              <PhStar
                v-for="star in (member.characterTier || 1)"
                :key="star"
                :size="11"
                weight="fill"
              />
              <span>Tier {{ member.characterTier || 1 }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <span class="text-[9.5px] text-[#8b6f4e] block">Kelas Karakter:</span>
              <span class="font-pixel text-[11px] text-[#86efac] font-bold">
                {{ formattedClass }}
              </span>
            </div>
            <div>
              <span class="text-[9.5px] text-[#8b6f4e] block">Gelar Petualang:</span>
              <span class="font-sans text-[11px] text-[#fbf6e9] font-medium leading-tight block truncate">
                {{ member.characterTitle || 'Novice Adventurer' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 2. Academic / Campus Info -->
        <div class="p-3 rounded-xl bg-[#1e130a]/90 border border-[#5a3a18] space-y-2">
          <div class="border-b border-[#3d2b1e] pb-1.5 flex items-center gap-1">
            <PhGraduationCap :size="13" class="text-[#60a5fa]" weight="bold" />
            <span class="font-pixel text-[9px] text-[#60a5fa] uppercase tracking-wider">
              Data Akademik UNU
            </span>
          </div>

          <div class="space-y-1.5 text-xs">
            <div>
              <span class="text-[9.5px] text-[#8b6f4e] block">Fakultas:</span>
              <span class="text-[#e2d5c3] font-medium">
                {{ member.faculty || 'UNU Yogyakarta' }}
              </span>
            </div>
            <div>
              <span class="text-[9.5px] text-[#8b6f4e] block">Program Studi:</span>
              <span class="text-[#e2d5c3] font-medium">
                {{ member.prodi || 'Mahasiswa Baru' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 3. Contribution / XP -->
        <div class="p-3 rounded-xl bg-[#1e130a]/90 border border-[#5a3a18] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-[#3d2b1e] border border-[#8b6f4e] flex items-center justify-center text-[#f0d060]">
              <PhTrophy :size="16" weight="fill" />
            </div>
            <div>
              <span class="text-[9px] font-pixel text-[#a08060] uppercase block">
                Total Kontribusi
              </span>
              <span class="font-pixel text-xs text-[#f0d060] font-bold">
                {{ member.totalScore || 0 }} XP
              </span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-[9px] font-sans text-[#7ec850] block font-medium">
              Status Aktif
            </span>
            <span class="font-mono text-[10px] text-[#a08060]">
              PKKMB 2026
            </span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="mt-4 text-center">
        <button
          type="button"
          @click="handleClose"
          class="w-full py-2.5 px-4 rounded-xl bg-[#3d7828] hover:bg-[#4d9432] border-2 border-[#7ec850] text-[#fbf6e9] font-pixel text-xs font-bold shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
        >
          KEMBALI KE REGU
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #19110a;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #5a3a18;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #8b6f4e;
}
</style>
