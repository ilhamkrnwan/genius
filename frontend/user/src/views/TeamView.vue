<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import {
  PhArrowLeft,
  PhHouse,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhCrown,
  PhShieldCheck,
  PhUsersThree,
  PhUser,
  PhMagnifyingGlass,
  PhMapTrifold,
  PhIdentificationBadge,
  PhTrophy,
  PhArrowsClockwise,
  PhSparkle,
  PhFlag,
} from '@phosphor-icons/vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import TeamMemberDetailModal, { TeamMemberData } from '@/components/team/TeamMemberDetailModal.vue';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/lib/api';
import { soundEngine } from '@/lib/sound';
import { animatePageEnter, staggerFadeUp } from '@/lib/gsap';

const router = useRouter();
const gameStore = useGameStore();

const isLoading = ref(true);
const isRefreshing = ref(false);
const teamData = ref<any>(null);
const errorMessage = ref('');
const searchQuery = ref('');
const isMuted = ref(gameStore.soundEnabled === false);

// Modal Detail State
const isDetailModalOpen = ref(false);
const selectedMember = ref<TeamMemberData | null>(null);

function toggleSound() {
  isMuted.value = !isMuted.value;
  gameStore.soundEnabled = !isMuted.value;
  if (!isMuted.value) {
    soundEngine.playClick();
  }
}

function handleBack() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push('/play');
}

function handleHome() {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push('/');
}

async function loadTeamData() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    let token = localStorage.getItem('genius_user_token');
    const nim = gameStore.participant?.nim;

    // Auto-authenticate if token is missing but participant is identified
    if (!token && nim) {
      const authRes = await api.registerMaba({
        nim,
        name: gameStore.participant?.name || 'Mahasiswa Baru',
        faculty: gameStore.participant?.faculty,
        prodi: gameStore.participant?.prodi,
      });
      if (authRes.success && authRes.data?.token) {
        token = authRes.data.token;
      }
    }

    let res = await api.getMyTeam();

    // Retry once with auto-relogin if session expired
    if (!res.success && res.error?.code === 'UNAUTHORIZED' && nim) {
      const authRes = await api.registerMaba({
        nim,
        name: gameStore.participant?.name || 'Mahasiswa Baru',
      });
      if (authRes.success) {
        res = await api.getMyTeam();
      }
    }

    if (res.success && res.data) {
      teamData.value = res.data;
    } else {
      errorMessage.value = res.error?.message || 'Gagal memuat data regu.';
    }
  } catch (err: any) {
    errorMessage.value = 'Terjadi kendala saat menyambung ke server.';
    console.warn('[TeamView] load error:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleRefresh() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  if (gameStore.soundEnabled) soundEngine.playClick();
  try {
    const res = await api.getMyTeam();
    if (res.success && res.data) {
      teamData.value = res.data;
    }
  } catch (err) {
    console.warn('[TeamView] refresh error:', err);
  } finally {
    setTimeout(() => {
      isRefreshing.value = false;
    }, 500);
  }
}

function openMemberDetail(member: TeamMemberData) {
  if (gameStore.soundEnabled) soundEngine.playSelect();
  selectedMember.value = member;
  isDetailModalOpen.value = true;
}

function closeMemberDetail() {
  isDetailModalOpen.value = false;
  selectedMember.value = null;
}

// Separate Buddies and Participants
const buddies = computed<TeamMemberData[]>(() => {
  if (!teamData.value?.members) return [];
  return teamData.value.members
    .filter((m: any) => m.role === 'BUDDY')
    .sort((a: any, b: any) => {
      if (a.buddyRole === 'PRIMARY') return -1;
      if (b.buddyRole === 'PRIMARY') return 1;
      return 0;
    });
});

const participants = computed<TeamMemberData[]>(() => {
  if (!teamData.value?.members) return [];
  return teamData.value.members
    .filter((m: any) => m.role === 'PARTICIPANT')
    .sort((a: any, b: any) => {
      // Captain first, then current user, then alphabetical
      if (a.isCaptain) return -1;
      if (b.isCaptain) return 1;
      const isAUser = a.username === gameStore.participant?.nim || a.userId === gameStore.participant?.id;
      const isBUser = b.username === gameStore.participant?.nim || b.userId === gameStore.participant?.id;
      if (isAUser) return -1;
      if (isBUser) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
});

const filteredParticipants = computed(() => {
  if (!searchQuery.value.trim()) return participants.value;
  const q = searchQuery.value.toLowerCase().trim();
  return participants.value.filter(
    (m) =>
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.prodi || '').toLowerCase().includes(q) ||
      (m.faculty || '').toLowerCase().includes(q)
  );
});

const captainMember = computed(() => {
  return participants.value.find((p) => p.isCaptain);
});

function isCurrentUser(member: TeamMemberData): boolean {
  return Boolean(
    (member.username && member.username === gameStore.participant?.nim) ||
    (member.userId && member.userId === gameStore.participant?.id)
  );
}

function getAvatarImage(member: TeamMemberData) {
  if (member.avatarUrl) return member.avatarUrl;
  const g = (member.gender || '').toUpperCase();
  return g === 'FEMALE' || g === 'P' || g === 'PEREMPUAN'
    ? '/character-cewek-avatar.png'
    : '/character-cowok-avatar.png';
}

onMounted(() => {
  animatePageEnter('.team-header', { y: 20, duration: 0.4 });
  loadTeamData();
});
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-5 px-3 sm:px-6 pb-20 sm:pb-24"
  >
    <!-- Fixed Background Wallpaper (Fixed in Viewport) -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="
        background-image: url('/games/background.avif');
        background-size: cover;
        background-position: center bottom;
        image-rendering: pixelated;
      "
    />
    <!-- Dark Vignette Overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85 pointer-events-none z-0" />
    <CrtScanlines />

    <!-- MAIN CONTAINER -->
    <main class="w-full max-w-xl mx-auto space-y-4 flex-1 flex flex-col relative z-10">
      <!-- 1. TOP BAR NAVIGATION: Format standar RPG Paspor, Leaderboard & Presensi -->
      <header class="team-header relative z-20 w-full max-w-xl mx-auto flex items-center justify-between gap-2 pb-2 shrink-0">
        <!-- Left: Back to Menu -->
        <RouterLink
          to="/play"
          @click="() => soundEngine.playClick?.()"
          class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all text-[9.5px] sm:text-[10px] flex items-center gap-1.5 cursor-pointer active:scale-95 shadow shrink-0"
          title="Kembali ke Menu Utama"
        >
          <PhArrowLeft :size="13" weight="bold" />
          <span class="font-pixel">MENU</span>
        </RouterLink>

        <!-- Center: Title Badge -->
        <div class="px-3 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e] rounded-full shadow flex items-center gap-1.5 shrink-0">
          <PhUsersThree :size="14" weight="fill" class="text-[#facc15]" />
          <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
            REGU PETUALANG
          </span>
        </div>

        <!-- Right: Refresh & Sound -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            @click="handleRefresh"
            :disabled="isRefreshing"
            title="Perbarui Data Regu"
            class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow disabled:opacity-50"
          >
            <PhArrowsClockwise :size="13" weight="bold" :class="{ 'animate-spin': isRefreshing }" />
          </button>

          <button
            type="button"
            @click="toggleSound"
            class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
            :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
          >
            <PhSpeakerHigh v-if="!isMuted" :size="13" weight="bold" />
            <PhSpeakerSimpleSlash v-else :size="13" weight="bold" />
          </button>
        </div>
      </header>

      <!-- 2. LOADING STATE -->
      <div v-if="isLoading" class="p-8 text-center bg-[#19110a]/90 border border-[#5a3a18] rounded-2xl space-y-3">
        <div class="inline-block animate-spin text-[#f0d060]">
          <PhArrowsClockwise :size="32" weight="bold" />
        </div>
        <p class="font-pixel text-xs text-[#c4956a]">
          Menghubungkan ke Pusat Data Regu...
        </p>
      </div>

      <!-- 3. ERROR STATE -->
      <div
        v-else-if="errorMessage || !teamData"
        class="p-6 text-center bg-[#19110a]/90 border border-red-700/60 rounded-2xl space-y-3"
      >
        <div class="text-red-400 font-pixel text-sm">
          {{ errorMessage || 'Data regu belum tersedia.' }}
        </div>
        <p class="font-sans text-xs text-[#a08060]">
          Pastikan akun Anda telah terdaftar resmi ke dalam kelompok PKKMB UNU 2026.
        </p>
        <button
          type="button"
          @click="loadTeamData"
          class="py-2 px-4 rounded-xl bg-[#3d7828] text-white font-pixel text-xs border border-[#7ec850] hover:brightness-105 cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>

      <!-- 4. CONTENT STATE -->
      <div v-else class="space-y-4">
        <!-- TEAM HERO BANNER -->
        <div
          class="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#3a2818] to-[#1e130a] border-2 border-[#f0d060] shadow-[inset_0_0_0_1px_#6b4f2e,0_8px_24px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
          <div class="flex items-start justify-between gap-3 relative z-10">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <PixelBadge variant="gold" size="sm">
                  {{ teamData.code }}
                </PixelBadge>
                <PixelBadge v-if="teamData.routeName" variant="green" size="sm">
                  <template #icon>
                    <PhFlag :size="10" weight="fill" />
                  </template>
                  {{ teamData.routeName }}
                </PixelBadge>
              </div>

              <h2 class="font-pixel text-lg sm:text-xl text-[#fef08a] font-black tracking-wide leading-tight break-words">
                {{ teamData.name }}
              </h2>
              <p class="font-sans text-xs text-[#c4956a] mt-0.5">
                Total Anggota: <strong class="text-white">{{ teamData.members?.length || 0 }} Orang</strong> (2 Buddy + {{ participants.length }} MABA)
              </p>
            </div>

            <!-- Team Total XP Badge -->
            <div class="text-right shrink-0 bg-[#120a05]/90 border border-[#f0d060]/80 p-2.5 rounded-xl shadow-inner">
              <span class="font-pixel text-[8px] text-[#a08060] uppercase block">
                Skor Kelompok
              </span>
              <span class="font-pixel text-sm sm:text-base text-[#f0d060] font-black flex items-center justify-end gap-1">
                <PhTrophy :size="15" weight="fill" />
                {{ teamData.totalScore || 0 }} XP
              </span>
            </div>
          </div>

          <!-- Captain Highlight Strip -->
          <div
            v-if="captainMember"
            @click="openMemberDetail(captainMember)"
            class="mt-3.5 p-2 rounded-xl bg-[#120a05]/80 border border-[#f0d060]/60 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#1f1208] transition-colors"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-lg overflow-hidden border border-[#f0d060] bg-[#22160d] shrink-0">
                <img :src="getAvatarImage(captainMember)" :alt="captainMember.fullName" class="w-full h-full object-cover" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-pixel text-[8.5px] text-[#f0d060] flex items-center gap-0.5">
                    <PhCrown :size="10" weight="fill" />
                    KAPTEN REGU:
                  </span>
                  <span class="font-pixel text-[10px] text-white font-bold truncate">
                    {{ captainMember.fullName }}
                  </span>
                </div>
                <span class="font-sans text-[9px] text-[#a08060] block truncate">
                  {{ captainMember.prodi || 'UNU Yogyakarta' }}
                </span>
              </div>
            </div>

            <span class="font-pixel text-[9px] text-[#7ec850] shrink-0">
              Lihat Detail &rarr;
            </span>
          </div>
        </div>

        <!-- SECTION 1: BUDDIES (PEMANDU REGU) -->
        <section class="space-y-2">
          <div class="flex items-center justify-between border-b border-[#5a3a18] pb-1">
            <h3 class="font-pixel text-xs text-[#a855f7] font-bold flex items-center gap-1.5 uppercase">
              <PhShieldCheck :size="14" weight="fill" />
              Pemandu Regu (Buddies)
            </h3>
            <span class="font-sans text-[10px] text-[#a08060]">
              {{ buddies.length }} Pendamping
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              v-for="buddy in buddies"
              :key="buddy.id || buddy.userId"
              @click="openMemberDetail(buddy)"
              class="p-2.5 rounded-xl bg-[#19110a]/95 border border-[#a855f7]/60 hover:border-[#c084fc] hover:bg-[#231526] transition-all cursor-pointer shadow flex items-center justify-between gap-2.5 group"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#a855f7] bg-[#120a05] shrink-0 relative group-hover:scale-105 transition-transform">
                  <img :src="getAvatarImage(buddy)" :alt="buddy.fullName" class="w-full h-full object-cover" />
                  <div class="absolute -top-1 -right-1 bg-[#a855f7] text-white p-0.5 rounded-full border border-[#1b120a]">
                    <PhShieldCheck :size="9" weight="fill" />
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-1 flex-wrap">
                    <PixelBadge variant="purple" size="sm">
                      {{ buddy.buddyRole === 'PRIMARY' ? 'Utama' : 'Pendamping' }}
                    </PixelBadge>
                  </div>
                  <h4 class="font-pixel text-[11px] text-white font-bold truncate group-hover:text-[#e9d5ff] transition-colors mt-0.5">
                    {{ buddy.fullName }}
                  </h4>
                  <p class="font-sans text-[9.5px] text-[#c4956a] truncate">
                    {{ buddy.prodi || 'Fakultas UNU' }}
                  </p>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="text-[9px] font-pixel text-[#c084fc] block">
                  Detail &rarr;
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 2: PARTICIPANTS (MAHASISWA BARU) -->
        <section class="space-y-2">
          <div class="flex items-center justify-between border-b border-[#5a3a18] pb-1.5 flex-wrap gap-2">
            <h3 class="font-pixel text-xs text-[#7ec850] font-bold flex items-center gap-1.5 uppercase">
              <PhUsersThree :size="15" weight="fill" />
              Anggota Mahasiswa Baru ({{ participants.length }})
            </h3>

            <!-- Search Input -->
            <div class="relative w-full sm:w-56">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Cari nama / NIM..."
                class="w-full bg-[#19110a]/95 border border-[#5a3a18] focus:border-[#f0d060] rounded-xl px-2.5 py-1.5 pl-7 text-[11px] text-white font-sans outline-none placeholder-[#785435]"
              />
              <PhMagnifyingGlass :size="13" class="absolute left-2 top-2.5 text-[#8b6f4e]" weight="bold" />
            </div>
          </div>

          <!-- Participants Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[48vh] overflow-y-auto pr-0.5 custom-scrollbar">
            <div
              v-for="maba in filteredParticipants"
              :key="maba.id || maba.userId"
              @click="openMemberDetail(maba)"
              :class="[
                'p-2.5 rounded-xl border transition-all cursor-pointer shadow flex items-center justify-between gap-2 group',
                isCurrentUser(maba)
                  ? 'bg-[#1f3a2b]/95 border-[#f0d060] shadow-[#f0d060]/20'
                  : 'bg-[#19110a]/90 border-[#5a3a18] hover:border-[#8b6f4e] hover:bg-[#24170d]'
              ]"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  :class="[
                    'w-10 h-10 rounded-xl overflow-hidden border bg-[#120a05] shrink-0 relative group-hover:scale-105 transition-transform',
                    isCurrentUser(maba)
                      ? 'border-[#f0d060]'
                      : maba.isCaptain
                      ? 'border-[#f59e0b]'
                      : 'border-[#5a3a18]'
                  ]"
                >
                  <img :src="getAvatarImage(maba)" :alt="maba.fullName" class="w-full h-full object-cover" />
                  <div
                    v-if="maba.isCaptain"
                    class="absolute -top-1 -right-1 bg-[#f0d060] text-[#1b120a] p-0.5 rounded-full border border-[#1b120a]"
                    title="Kapten Regu"
                  >
                    <PhCrown :size="8" weight="fill" />
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-1 flex-wrap">
                    <PixelBadge v-if="isCurrentUser(maba)" variant="gold" size="sm">
                      KAMU
                    </PixelBadge>
                    <PixelBadge v-else-if="maba.isCaptain" variant="gold" size="sm">
                      KAPTEN
                    </PixelBadge>
                    <span class="font-mono text-[9px] text-[#8b6f4e]">
                      {{ maba.username }}
                    </span>
                  </div>

                  <h4 class="font-pixel text-[10.5px] sm:text-[11px] text-white font-bold truncate group-hover:text-[#fef08a] transition-colors mt-0.5">
                    {{ maba.fullName }}
                  </h4>
                  <p class="font-sans text-[9px] text-[#a08060] truncate">
                    {{ maba.prodi || 'Mahasiswa Baru' }}
                  </p>
                </div>
              </div>

              <!-- Right: XP contribution -->
              <div class="text-right shrink-0">
                <div class="font-pixel text-[10px] text-[#f0d060] font-bold">
                  {{ maba.totalScore || 0 }} XP
                </div>
                <span class="text-[8.5px] font-sans text-[#7ec850] block">
                  Detail &rarr;
                </span>
              </div>
            </div>

            <!-- Empty Search Result -->
            <div
              v-if="filteredParticipants.length === 0"
              class="col-span-full p-6 text-center bg-[#19110a]/90 border border-[#5a3a18] rounded-xl font-sans text-xs text-[#a08060]"
            >
              Tidak ditemukan anggota tim dengan pencarian "{{ searchQuery }}".
            </div>
          </div>
        </section>
      </div>

      <!-- 5. FOOTER SHORTCUTS -->
      <footer class="flex items-center justify-center pt-2 pb-1">
        <div class="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#120a05]/90 backdrop-blur-md border border-[#5a3a18] text-[8.5px] text-[#a08060] font-pixel shadow">
          <button
            type="button"
            @click="() => { if (gameStore.soundEnabled) soundEngine.playClick(); router.push('/peta'); }"
            class="hover:text-[#60a5fa] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <PhMapTrifold :size="12" />
            <span>PETA</span>
          </button>
          <span>•</span>
          <button
            type="button"
            @click="() => { if (gameStore.soundEnabled) soundEngine.playClick(); router.push('/profile'); }"
            class="hover:text-[#facc15] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <PhIdentificationBadge :size="12" />
            <span>PROFIL</span>
          </button>
          <span>•</span>
          <button
            type="button"
            @click="() => { if (gameStore.soundEnabled) soundEngine.playClick(); router.push('/leaderboard'); }"
            class="hover:text-[#f0d060] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <PhTrophy :size="12" />
            <span>KLASEMEN</span>
          </button>
        </div>
      </footer>
    </main>

    <!-- 6. DETAIL MEMBER MODAL -->
    <TeamMemberDetailModal
      :isOpen="isDetailModalOpen"
      :member="selectedMember"
      :isCurrentUser="selectedMember ? isCurrentUser(selectedMember) : false"
      @close="closeMemberDetail"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
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
