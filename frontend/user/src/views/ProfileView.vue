<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { LEVEL_CONFIG, AVATAR_OPTIONS, UNU_FACULTIES } from '@/data/mockData';
import {
  PhArrowLeft,
  PhHouse,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhIdentificationBadge,
  PhSparkle,
  PhTrophy,
  PhCalendarCheck,
  PhMapTrifold,
  PhStorefront,
  PhGameController,
  PhPencilSimple,
  PhCheckCircle,
  PhGenderMale,
  PhGenderFemale,
  PhSignOut,
  PhShieldCheck,
  PhUser,
  PhBookOpen,
} from '@phosphor-icons/vue';
import MabaAuthModal from '@/components/auth/MabaAuthModal.vue';
import LogoutConfirmModal from '@/components/auth/LogoutConfirmModal.vue';

const router = useRouter();
const gameStore = useGameStore();

const isMuted = ref(gameStore.soundEnabled === false);
const isEditModalOpen = ref(false);
const isLogoutModalOpen = ref(false);

// Dynamic character full body sprite
const characterFullImage = computed(() => {
  const isFemale =
    gameStore.participant.avatar === 'character_cewek' ||
    gameStore.participant.gender === 'perempuan';
  return isFemale
    ? '/mascots/character-cewek.png'
    : '/mascots/character-cowok.png';
});

// Level & Gamification stats
const currentLevelStr = computed(() => gameStore.getCurrentLevel());
const levelInfo = computed(() => {
  return LEVEL_CONFIG.find((l) => l.level === currentLevelStr.value) || LEVEL_CONFIG[0];
});
const totalStamps = computed(() => gameStore.getTotalStampsCount());
const completedFloors = computed(() => gameStore.getCompletedFloorsCount());
const attendedSessions = computed(() => gameStore.getAttendedSessionsCount());

// Level XP progress (assuming 500 XP per tier)
const currentXp = computed(() => gameStore.participant.totalXp || 0);
const nextTierXp = computed(() => {
  if (currentXp.value < 200) return 200;
  if (currentXp.value < 500) return 500;
  if (currentXp.value < 1000) return 1000;
  return 1500;
});
const xpProgressPercent = computed(() => {
  return Math.min(100, Math.round((currentXp.value / nextTierXp.value) * 100));
});

function toggleSound() {
  gameStore.soundEnabled = !gameStore.soundEnabled;
  isMuted.value = !gameStore.soundEnabled;
  soundEngine.setMuted(isMuted.value);
  if (!isMuted.value) soundEngine.playClick();
}

function handleBack() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push('/play');
}

function handleGoHome() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push('/');
}

function openEdit() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  isEditModalOpen.value = true;
}

function selectAvatar(avatarId: string) {
  gameStore.setParticipantInfo({ avatar: avatarId });
  if (gameStore.soundEnabled) soundEngine.playSelect();
}

function handleLogout() {
  isLogoutModalOpen.value = true;
}
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-6 px-3 sm:px-6"
  >
    <!-- Fixed Background Wallpaper (Fixed in Viewport) -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="
        background-image: url('/games/background.png');
        background-size: cover;
        background-position: center bottom;
        image-rendering: pixelated;
      "
    />
    <!-- Dark Vignette Overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75 pointer-events-none z-0" />

    <!-- ================================================================= -->
    <!-- TOP NAVBAR: Back, Title, Home, Audio                             -->
    <!-- ================================================================= -->
    <header class="relative z-20 w-full max-w-4xl mx-auto flex items-center justify-between gap-2 pb-3">
      <!-- Back to Menu Button -->
      <button
        type="button"
        @click="handleBack"
        class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all shadow flex items-center gap-1.5 text-[9px] sm:text-[10px] cursor-pointer active:scale-95"
      >
        <PhArrowLeft :size="14" weight="bold" />
        <span>MENU LOBBY</span>
      </button>

      <!-- Center Title Badge -->
      <div class="px-3 sm:px-5 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e]/80 rounded-full shadow-lg flex items-center gap-2">
        <PhIdentificationBadge :size="16" weight="fill" class="text-[#facc15]" />
        <span class="text-[9px] sm:text-[11px] text-[#facc15] font-bold tracking-wider uppercase">
          KTM & PROFIL PETUALANG
        </span>
      </div>

      <!-- Right Controls: Sound & Home -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="toggleSound"
          class="p-1.5 sm:p-2 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all shadow cursor-pointer active:scale-95"
          :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
        >
          <PhSpeakerHigh v-if="!isMuted" :size="15" weight="bold" />
          <PhSpeakerSimpleSlash v-else :size="15" weight="bold" />
        </button>

        <button
          type="button"
          @click="handleGoHome"
          class="p-1.5 sm:p-2 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all shadow cursor-pointer active:scale-95 flex items-center gap-1 text-[9px]"
          title="Ke Beranda Utama"
        >
          <PhHouse :size="15" weight="bold" />
          <span class="hidden sm:inline">BERANDA</span>
        </button>
      </div>
    </header>

    <!-- ================================================================= -->
    <!-- MAIN CONTENT: Digital Student Card & RPG Stats                   -->
    <!-- ================================================================= -->
    <main class="relative z-20 w-full max-w-4xl mx-auto flex-1 flex flex-col gap-4 my-auto">
      <!-- ------------------------------------------------------------- -->
      <!-- SECTION 1: KARTU TANDA MAHASISWA (KTM) DIGITAL RPG            -->
      <!-- ------------------------------------------------------------- -->
      <div class="w-full backdrop-blur-md bg-[#23150b]/95 border-2 border-[#8b6f4e] rounded-2xl shadow-2xl overflow-hidden">
        <!-- KTM Header Ribbon -->
        <div class="bg-gradient-to-r from-[#170e07] via-[#2f1c0f] to-[#170e07] border-b border-[#8b6f4e] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <img
              src="/logo/unu.png"
              alt="Logo UNU"
              class="h-7 sm:h-8 w-auto object-contain brightness-110 drop-shadow"
            />
            <div>
              <div class="text-[9px] sm:text-[10.5px] text-[#facc15] font-bold tracking-wider leading-tight">
                UNIVERSITAS NAHDLATUL ULAMA YOGYAKARTA
              </div>
              <div class="text-[7.5px] sm:text-[8.5px] text-[#a89279] font-sans">
                KTM Sementara Orientasi GENIUS New You 2026
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full bg-[#162713] border border-[#22c55e]/70 text-[#86efac] text-[7.5px] sm:text-[8px] font-pixel flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              TERDAFTAR RESMI
            </span>
          </div>
        </div>

        <!-- KTM Body Grid (Left: Character Sprite, Right: Academic Credentials) -->
        <div class="p-3.5 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
          <!-- Left: Character Avatar & Selector (5 cols) -->
          <div class="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-[#170e08]/90 border border-[#5a3a18] text-center">
            <!-- Level Ribbon Badge -->
            <div
              class="mb-2 px-3 py-0.5 rounded-full text-[8px] sm:text-[8.5px] font-pixel font-bold uppercase tracking-wider border shadow"
              :style="{ color: levelInfo.color, borderColor: levelInfo.color, backgroundColor: 'rgba(0,0,0,0.5)' }"
            >
              ✦ {{ levelInfo.title }} ({{ currentLevelStr }}) ✦
            </div>

            <!-- Full Body Character Sprite Display -->
            <div class="relative w-full h-44 sm:h-52 flex items-center justify-center my-1">
              <img
                :src="characterFullImage"
                :alt="gameStore.participant.name"
                class="h-full w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] filter"
                style="image-rendering: pixelated;"
              />
              <!-- Ground Shadow -->
              <div class="absolute bottom-0 w-24 h-4 bg-black/60 rounded-[100%] blur-[2px] pointer-events-none" />
            </div>

            <!-- Quick Avatar Switcher -->
            <div class="w-full mt-2 pt-2 border-t border-[#3a2210] flex items-center justify-center gap-2">
              <span class="text-[7.5px] text-[#a89279] uppercase">Ganti Karakter:</span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="selectAvatar('character_cowok')"
                  :class="[
                    'px-2 py-0.5 rounded text-[8px] font-pixel transition-all cursor-pointer flex items-center gap-1 border',
                    gameStore.participant.avatar === 'character_cowok'
                      ? 'bg-[#3b7829] text-white border-[#f0d060]'
                      : 'bg-[#23150b] text-[#94a3b8] border-[#4a2e14] hover:border-[#8b6f4e]'
                  ]"
                >
                  <PhGenderMale :size="10" weight="bold" />
                  <span>Cowok</span>
                </button>

                <button
                  type="button"
                  @click="selectAvatar('character_cewek')"
                  :class="[
                    'px-2 py-0.5 rounded text-[8px] font-pixel transition-all cursor-pointer flex items-center gap-1 border',
                    gameStore.participant.avatar === 'character_cewek'
                      ? 'bg-[#3b7829] text-white border-[#f0d060]'
                      : 'bg-[#23150b] text-[#94a3b8] border-[#4a2e14] hover:border-[#8b6f4e]'
                  ]"
                >
                  <PhGenderFemale :size="10" weight="bold" />
                  <span>Cewek</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Identity Details & Academic Data (7 cols) -->
          <div class="md:col-span-7 flex flex-col justify-between gap-3 text-left">
            <div>
              <div class="text-[7.5px] sm:text-[8px] text-[#a89279] uppercase tracking-wider">
                Nama Lengkap Petualang:
              </div>
              <div class="text-base sm:text-xl font-bold text-[#86efac] flex items-center gap-2 flex-wrap">
                <span>{{ gameStore.participant.name || 'Mahasiswa Baru' }}</span>
                <span class="text-[8px] px-2 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] border border-[#0284c7]/50 font-pixel">
                  MABA UNU 2026
                </span>
              </div>
            </div>

            <!-- Detail Grid -->
            <div class="grid grid-cols-2 gap-2 sm:gap-3 text-[8.5px] sm:text-[9.5px]">
              <!-- NIM -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Nomor Induk Mahasiswa:</div>
                <div class="font-mono text-[#fde047] font-bold text-xs sm:text-sm mt-0.5">
                  {{ gameStore.participant.nim || '2611100' }}
                </div>
              </div>

              <!-- Kelompok Buddy -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Kelompok Pendamping:</div>
                <div class="text-[#fbf6e9] font-bold mt-0.5 truncate">
                  {{ gameStore.participant.groupName || 'Genius 03' }}
                </div>
              </div>

              <!-- Fakultas -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Fakultas:</div>
                <div class="text-[#fbf6e9] font-sans font-medium mt-0.5 truncate">
                  {{ gameStore.participant.faculty || 'Fakultas Teknologi Informasi' }}
                </div>
              </div>

              <!-- Program Studi -->
              <div class="p-2 rounded-lg bg-[#191009] border border-[#4a2e14]">
                <div class="text-[7.5px] text-[#a89279]">Program Studi:</div>
                <div class="text-[#86efac] font-sans font-semibold mt-0.5 truncate">
                  {{ gameStore.participant.prodi || 'Informatika' }}
                </div>
              </div>
            </div>

            <!-- XP Progress Bar -->
            <div class="p-2.5 rounded-lg bg-[#191009] border border-[#4a2e14]">
              <div class="flex items-center justify-between text-[8px] mb-1">
                <span class="text-[#facc15] font-bold flex items-center gap-1">
                  <PhSparkle :size="11" weight="fill" />
                  TOTAL PENGALAMAN: {{ currentXp }} XP
                </span>
                <span class="text-[#a89279] font-sans">
                  Target Tier: {{ nextTierXp }} XP ({{ xpProgressPercent }}%)
                </span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-black/60 border border-[#5a3a18] overflow-hidden p-0.5">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#22c55e] transition-all duration-500 shadow-sm"
                  :style="{ width: `${xpProgressPercent}%` }"
                />
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="flex items-center gap-2 pt-1">
              <button
                type="button"
                @click="openEdit"
                class="flex-1 py-2 px-3 rounded-xl bg-[#2e1d11] hover:bg-[#3d2616] border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] text-[8.5px] sm:text-[9.5px] font-bold flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              >
                <PhPencilSimple :size="13" weight="bold" />
                <span>UBAH BIODATA PROFIL</span>
              </button>

              <button
                type="button"
                @click="handleLogout"
                class="py-2 px-3 rounded-xl bg-[#2e1111]/80 hover:bg-[#451616] border border-[#7f1d1d] hover:border-[#ef4444] text-[#fca5a5] text-[8.5px] sm:text-[9.5px] flex items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
                title="Keluar / Ganti Akun Mahasiswa"
              >
                <PhSignOut :size="13" weight="bold" />
                <span class="hidden sm:inline">GANTI AKUN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ------------------------------------------------------------- -->
      <!-- SECTION 2: PORTAL PROGRES & STATISTIK ORIENTASI               -->
      <!-- ------------------------------------------------------------- -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Card 1: Paspor Stempel Pos -->
        <RouterLink
          to="/paspor"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="p-3 rounded-xl bg-[#23150b]/90 hover:bg-[#321e10] border border-[#8b6f4e] hover:border-[#facc15] transition-all flex flex-col justify-between group shadow cursor-pointer"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[8px] text-[#facc15] font-bold uppercase">PASPOR DIGITAL</span>
            <PhIdentificationBadge :size="18" weight="bold" class="text-[#facc15] group-hover:scale-110 transition-transform" />
          </div>
          <div class="text-xl font-bold text-white font-mono">
            {{ totalStamps }} <span class="text-xs text-[#a89279]">/ 9 Stempel</span>
          </div>
          <div class="text-[8px] text-[#86efac] mt-1 font-sans flex items-center justify-between">
            <span>6 Lantai Kampus</span>
            <span class="group-hover:translate-x-1 transition-transform">Buka Paspor →</span>
          </div>
        </RouterLink>

        <!-- Card 2: Presensi Buddy -->
        <RouterLink
          to="/presensi"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="p-3 rounded-xl bg-[#23150b]/90 hover:bg-[#321e10] border border-[#8b6f4e] hover:border-[#86efac] transition-all flex flex-col justify-between group shadow cursor-pointer"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[8px] text-[#86efac] font-bold uppercase">PRESENSI BUDDY</span>
            <PhCalendarCheck :size="18" weight="fill" class="text-[#86efac] group-hover:scale-110 transition-transform" />
          </div>
          <div class="text-xl font-bold text-white font-mono">
            {{ attendedSessions }} <span class="text-xs text-[#a89279]">/ 6 Sesi</span>
          </div>
          <div class="text-[8px] text-[#a0d870] mt-1 font-sans flex items-center justify-between">
            <span>Validasi Kakak Buddy</span>
            <span class="group-hover:translate-x-1 transition-transform">Cek Presensi →</span>
          </div>
        </RouterLink>

        <!-- Card 3: Ormawa Expo -->
        <RouterLink
          to="/ormawa"
          @click="() => gameStore.soundEnabled && soundEngine.playClick()"
          class="p-3 rounded-xl bg-[#23150b]/90 hover:bg-[#321e10] border border-[#8b6f4e] hover:border-[#c084fc] transition-all flex flex-col justify-between group shadow cursor-pointer"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[8px] text-[#c084fc] font-bold uppercase">ORMAWA EXPO</span>
            <PhStorefront :size="18" weight="fill" class="text-[#c084fc] group-hover:scale-110 transition-transform" />
          </div>
          <div class="text-xl font-bold text-white font-mono">
            {{ gameStore.participant.scannedOrmawaStands?.length || 0 }} <span class="text-xs text-[#a89279]">/ 18 UKM</span>
          </div>
          <div class="text-[8px] text-[#d8b4fe] mt-1 font-sans flex items-center justify-between">
            <span>Eksplorasi Ormawa</span>
            <span class="group-hover:translate-x-1 transition-transform">Buka Stand →</span>
          </div>
        </RouterLink>
      </div>

      <!-- ------------------------------------------------------------- -->
      <!-- SECTION 3: CTA LANJUTKAN PETUALANGAN KE LOBBY                 -->
      <!-- ------------------------------------------------------------- -->
      <div class="w-full flex items-center justify-center">
        <button
          type="button"
          @click="handleBack"
          class="w-full max-w-md py-3 px-4 text-xs sm:text-sm font-pixel font-bold uppercase tracking-wider rpg-btn-primary flex items-center justify-center gap-2 shadow-xl cursor-pointer"
        >
          <PhGameController :size="20" weight="bold" />
          <span>MASUK KE MENU LOBBY (PLAY)</span>
        </button>
      </div>
    </main>

    <!-- Modal Edit Profil -->
    <MabaAuthModal
      :isOpen="isEditModalOpen"
      initialStep="profile"
      @close="isEditModalOpen = false"
      @complete="isEditModalOpen = false"
    />

    <!-- Modal Logout / Ganti Akun -->
    <LogoutConfirmModal
      :isOpen="isLogoutModalOpen"
      @close="isLogoutModalOpen = false"
      @confirm="() => { isLogoutModalOpen = false; router.push('/'); }"
    />
  </div>
</template>
