<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhTrophy,
  PhUsersThree,
  PhUser,
  PhMagnifyingGlass,
  PhArrowLeft,
  PhArrowsClockwise,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhCaretDown,
  PhCaretUp,
  PhCaretLeft,
  PhCaretRight,
  PhMapTrifold,
  PhIdentificationBadge,
  PhCalendarCheck,
} from '@phosphor-icons/vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import { useGameStore } from '@/store/gameStore';
import {
  AVATAR_OPTIONS,
} from '@/data/mockData';
import { soundEngine } from '@/lib/sound';
import { LeaderboardUser, LeaderboardGroup } from '@/types/game';
import { api } from '@/lib/api';
import { animatePageEnter, staggerFadeUp, bouncePop } from '@/lib/gsap';

const gameStore = useGameStore();

const activeTab = ref<'individu' | 'kelompok'>('individu');
const searchQuery = ref<string>('');
const expandedGroupId = ref<string | null>('group-03');
const liveLeaderboard = ref<any>(null);
const isMuted = ref(gameStore.soundEnabled === false);
const isRefreshing = ref(false);

const isParticipantLoggedIn = computed(() => {
  if (!gameStore.isLoggedIn) return false;
  const rawProfile = typeof window !== 'undefined' ? localStorage.getItem('genius_user_profile') : null;
  if (rawProfile) {
    try {
      const u = JSON.parse(rawProfile);
      if (u.role && u.role.toUpperCase() !== 'PARTICIPANT') {
        return false;
      }
    } catch {
      // Ignore
    }
  }
  return Boolean(gameStore.participant?.nim || gameStore.participant?.id);
});

function safeSound(fn: () => void) {
  try {
    if (!isMuted.value && gameStore.soundEnabled) {
      fn();
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

function toggleSound() {
  isMuted.value = !isMuted.value;
  gameStore.soundEnabled = !isMuted.value;
  if (!isMuted.value) {
    soundEngine.playClick();
  }
}

async function refreshLeaderboard() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  safeSound(() => soundEngine.playClick?.());
  try {
    gameStore.syncWithServer();
    const res = await api.getLeaderboard(500);
    if (res.success && res.data) {
      liveLeaderboard.value = res.data;
      if (isParticipantLoggedIn.value) {
        const myEntry = res.data.participantLeaderboard?.find(
          (p: any) => p.username === gameStore.participant?.nim || p.participantId === gameStore.participant?.id
        );
        if (myEntry && typeof myEntry.totalScore === 'number' && myEntry.totalScore > (gameStore.participant?.totalXp || 0)) {
          if (gameStore.participant) {
            gameStore.participant.totalXp = myEntry.totalScore;
            gameStore.saveToStorage();
          }
        }
      }
      nextTick(() => {
        staggerFadeUp('.lb-item-card', 0.03);
      });
    }
  } catch (err) {
    console.warn('[LeaderboardView] refresh error:', err);
  } finally {
    setTimeout(() => {
      isRefreshing.value = false;
    }, 600);
  }
}

onMounted(async () => {
  animatePageEnter('.lb-header', { y: 20, duration: 0.4 });
  bouncePop('.lb-user-banner', { delay: 0.1 });
  staggerFadeUp('.lb-item-card', 0.03, { delay: 0.2 });

  // Sync latest score from server
  gameStore.syncWithServer();

  try {
    const res = await api.getLeaderboard(500);
    if (res.success && res.data) {
      liveLeaderboard.value = res.data;
      if (isParticipantLoggedIn.value) {
        const myEntry = res.data.participantLeaderboard?.find(
          (p: any) => p.username === gameStore.participant?.nim || p.participantId === gameStore.participant?.id
        );
        if (myEntry && typeof myEntry.totalScore === 'number' && myEntry.totalScore > (gameStore.participant?.totalXp || 0)) {
          if (gameStore.participant) {
            gameStore.participant.totalXp = myEntry.totalScore;
            gameStore.saveToStorage();
          }
        }
      }
      nextTick(() => {
        staggerFadeUp('.lb-item-card', 0.03);
      });
    }
  } catch (err) {
    console.warn('[LeaderboardView] live backend fetch fallback:', err);
  }
});

watch(activeTab, () => {
  nextTick(() => {
    staggerFadeUp('.lb-item-card', 0.03);
  });
});

const getAvatarImage = (avatarId: string) => {
  if (avatarId && (avatarId.startsWith('/') || avatarId.startsWith('http'))) {
    return avatarId;
  }
  const opt = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  return opt ? opt.avatarImage : '/character-cowok-avatar.png';
};

// Compute live individual leaderboard including current user from real database
const individualList = computed<LeaderboardUser[]>(() => {
  if (liveLeaderboard.value?.participantLeaderboard?.length > 0) {
    const list: LeaderboardUser[] = liveLeaderboard.value.participantLeaderboard.map((item: any, index: number) => {
      const isCurrentUser = isParticipantLoggedIn.value && (
        item.username === gameStore.participant?.nim || item.participantId === gameStore.participant?.id
      );
      return {
        id: item.participantId,
        rank: item.rank || index + 1,
        name: item.participantName || item.username,
        nim: item.username,
        faculty: item.faculty || '-',
        prodi: item.prodi || item.characterClass || '-',
        avatar: item.avatarUrl ? item.avatarUrl : (item.gender === 'FEMALE' ? 'character_cewek' : 'character_cowok'),
        totalXp: item.totalScore || 0,
        stampsCount: isCurrentUser
          ? (gameStore.getTotalStampsCount?.() || 0)
          : Math.min(item.stampsCount != null ? Number(item.stampsCount) : (item.transactionCount || 0), 9),
        completedFloors: isCurrentUser
          ? (gameStore.getCompletedFloorsCount?.() || 0)
          : Math.min(Math.floor((item.stampsCount != null ? Number(item.stampsCount) : (item.transactionCount || 0)) / 1.5), 6),
        isCurrentUser,
        groupId: item.teamId || '',
        groupName: item.teamName || 'Regu Maba',
      };
    });

    const hasCurrentUser = list.some((u) => u.isCurrentUser);
    if (!hasCurrentUser && isParticipantLoggedIn.value && gameStore.participant?.nim) {
      list.push({
        id: gameStore.participant.id || 'current-user',
        rank: list.length + 1,
        name: `${gameStore.participant.name || 'Mahasiswa Baru'} (Kamu)`,
        nim: gameStore.participant.nim,
        faculty: gameStore.participant.faculty || '-',
        prodi: gameStore.participant.prodi || '-',
        avatar: gameStore.participant.avatar || 'character_cowok',
        totalXp: gameStore.participant.totalXp || 0,
        stampsCount: gameStore.getTotalStampsCount?.() || 0,
        completedFloors: gameStore.getCompletedFloorsCount?.() || 0,
        isCurrentUser: true,
        groupId: gameStore.participant.groupId || '',
        groupName: gameStore.participant.groupName || 'Regu Maba',
      });
    }

    return list;
  }

  // If no backend list loaded yet, only show current user entry if logged in as participant
  if (isParticipantLoggedIn.value && gameStore.participant?.nim) {
    return [
      {
        id: 'current-user',
        rank: 1,
        name: `${gameStore.participant?.name || 'Mahasiswa Baru'} (Kamu)`,
        nim: gameStore.participant?.nim || '',
        faculty: gameStore.participant?.faculty || '-',
        prodi: gameStore.participant?.prodi || '-',
        avatar: gameStore.participant?.avatar || 'character_cowok',
        totalXp: gameStore.participant?.totalXp || 0,
        stampsCount: gameStore.getTotalStampsCount?.() || 0,
        completedFloors: gameStore.getCompletedFloorsCount?.() || 0,
        isCurrentUser: true,
        groupId: gameStore.participant?.groupId || '',
        groupName: gameStore.participant?.groupName || 'Regu Maba',
      },
    ];
  }

  return [];
});

const filteredIndividuals = computed(() => {
  if (!searchQuery.value.trim()) return individualList.value;
  const q = searchQuery.value.toLowerCase().trim();
  return individualList.value.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.nim.toLowerCase().includes(q) ||
      u.prodi.toLowerCase().includes(q)
  );
});

const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredIndividuals.value.length / pageSize.value)));
const paginatedIndividuals = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredIndividuals.value.slice(start, start + pageSize.value);
});

watch([searchQuery, activeTab], () => {
  currentPage.value = 1;
});

function changePage(delta: number) {
  const next = currentPage.value + delta;
  if (next >= 1 && next <= totalPages.value) {
    currentPage.value = next;
    safeSound(() => soundEngine.playClick?.());
    nextTick(() => {
      staggerFadeUp('.lb-item-card', 0.02);
    });
  }
}

// Compute live group leaderboard from real database
const groupList = computed<LeaderboardGroup[]>(() => {
  if (liveLeaderboard.value?.teamLeaderboard?.length > 0) {
    return liveLeaderboard.value.teamLeaderboard.map((team: any, index: number) => {
      const myTeamName = isParticipantLoggedIn.value ? (gameStore.participant?.groupName || '') : '';
      const isMyTeam = Boolean(myTeamName) && (team.teamName === myTeamName || (team.teamCode && myTeamName.includes(team.teamCode)));

      return {
        id: team.teamId,
        rank: team.rank || index + 1,
        name: team.teamName,
        totalXp: team.totalScore || 0,
        avgXp: team.avgScore || Math.round(team.totalScore / Math.max(team.memberCount || 1, 1)),
        stampsCount: Math.min(team.stampsCollected || 0, 9),
        members: isMyTeam
          ? [
              {
                id: 'my-user',
                name: `${gameStore.participant?.name || 'Mahasiswa Baru'} (Kamu)`,
                avatar: gameStore.participant?.avatar || 'character_cowok',
                totalXp: gameStore.participant?.totalXp || 0,
                stampsCount: gameStore.getTotalStampsCount?.() || 0,
                isCurrentUser: true,
                prodi: gameStore.participant?.prodi || '-',
              },
            ]
          : [
              {
                id: `member-${team.teamId}-1`,
                name: 'Peserta Regu',
                avatar: 'character_cowok',
                totalXp: team.avgScore || 0,
                stampsCount: 0,
                isCurrentUser: false,
                prodi: 'UNU Yogyakarta',
              },
            ],
      };
    });
  }

  return [];
});

const currentUserRankInfo = computed(() => {
  if (!isParticipantLoggedIn.value) return null;
  return individualList.value.find((u) => u.isCurrentUser);
});
</script>

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto font-pixel text-[#fbf6e9] select-none flex flex-col justify-between py-3 sm:py-5 px-3 sm:px-6"
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

    <!-- TOP HEADER: Format standar RPG Presensi & Ormawa Expo -->
    <header class="relative z-20 w-full max-w-xl mx-auto flex items-center justify-between gap-2 pb-2 shrink-0">
      <!-- Left: Back to Menu or Home -->
      <RouterLink
        :to="isParticipantLoggedIn ? '/play' : '/'"
        @click="() => safeSound(() => soundEngine.playClick?.())"
        class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all text-[9.5px] sm:text-[10px] flex items-center gap-1.5 cursor-pointer active:scale-95 shadow shrink-0"
        :title="isParticipantLoggedIn ? 'Kembali ke Menu Utama' : 'Kembali ke Beranda'"
      >
        <PhArrowLeft :size="13" weight="bold" />
        <span class="font-pixel">{{ isParticipantLoggedIn ? 'MENU' : 'BERANDA' }}</span>
      </RouterLink>

      <!-- Center: Title Badge -->
      <div class="px-3 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e] rounded-full shadow flex items-center gap-1.5 shrink-0">
        <PhTrophy :size="14" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
          PAPAN PERINGKAT
        </span>
      </div>

      <!-- Right: Refresh & Sound -->
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          @click="refreshLeaderboard"
          title="Segarkan Papan Peringkat"
          class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
        >
          <PhArrowsClockwise :size="13" :class="{ 'animate-spin': isRefreshing }" />
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

    <!-- MAIN CONTENT: Clean, Centered & Unified Layout -->
    <main class="relative z-20 w-full max-w-xl mx-auto space-y-2.5 my-auto">
      <!-- Guest Notice Banner (If not logged in as participant) -->
      <div
        v-if="!isParticipantLoggedIn"
        class="bg-[#19110a]/90 backdrop-blur-md border border-[#8b6f4e]/80 rounded-xl p-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left"
      >
        <div class="flex items-center gap-2">
          <PhIdentificationBadge :size="20" weight="fill" class="text-[#f0d060] shrink-0" />
          <div class="text-[10px] sm:text-[11px] text-[#e8d5b5] font-sans">
            Anda melihat <span class="text-[#f0d060] font-bold">Papan Peringkat Publik</span>. Masuk dengan akun Mahasiswa Baru untuk melihat posisi dan skor Anda.
          </div>
        </div>
        <RouterLink
          to="/?auth=required&redirect=/leaderboard"
          class="shrink-0 px-3 py-1.5 rounded-lg bg-[#3d7828] hover:bg-[#4d9432] text-[#f0d060] border border-[#f0d060] font-pixel text-[9px] uppercase tracking-wider transition-all shadow active:scale-95"
        >
          Masuk Maba
        </RouterLink>
      </div>

      <!-- Current User Highlight Banner -->
      <div
        v-if="currentUserRankInfo"
        class="lb-user-banner bg-[#19110a]/95 backdrop-blur-md border-2 border-[#f0d060] rounded-xl p-3 sm:p-3.5 shadow-lg flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-11 h-11 rounded-lg overflow-hidden bg-[#170f07] border border-[#f0d060] shrink-0 relative shadow">
            <img
              :src="getAvatarImage(gameStore.participant?.avatar || 'character_cowok')"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="font-pixel text-[8.5px] text-[#7ec850] uppercase">
                Posisi Kamu:
              </span>
              <PixelBadge variant="gold" size="sm">
                #{{ currentUserRankInfo.rank }}
              </PixelBadge>
            </div>
            <h3 class="font-pixel text-[11px] sm:text-xs font-bold text-white leading-tight break-words">
              {{ gameStore.participant?.name || 'Mahasiswa Baru' }}
            </h3>
            <p class="font-sans text-[10px] text-[#c4956a] leading-tight break-words">
              {{ gameStore.participant?.nim || '-' }} • {{ gameStore.participant?.prodi || 'UNU Yogyakarta' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 border-l border-[#5a3a18] pl-3 shrink-0 text-right">
          <div>
            <div class="font-pixel text-xs text-[#f0d060] font-bold">
              {{ gameStore.participant?.totalXp || 0 }} XP
            </div>
            <div class="text-[9px] font-sans text-[#7ec850]">
              {{ gameStore.getTotalStampsCount?.() || 0 }}/9 Stempel
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="grid grid-cols-2 gap-1.5 w-full">
        <button
          type="button"
          @click="() => {
            activeTab = 'individu';
            safeSound(() => soundEngine.playSelect?.());
          }"
          :class="[
            'w-full py-2 px-3 rounded-xl font-pixel text-[10px] sm:text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow',
            activeTab === 'individu'
              ? 'bg-[#3d7828] text-[#f0d060] border-[#f0d060]'
              : 'bg-[#19110a]/90 text-[#a08060] border-[#5a3a18] hover:border-[#8b6f4e]'
          ]"
        >
          <PhUser :size="14" weight="bold" />
          <span>Individu</span>
        </button>

        <button
          type="button"
          @click="() => {
            activeTab = 'kelompok';
            safeSound(() => soundEngine.playSelect?.());
          }"
          :class="[
            'w-full py-2 px-3 rounded-xl font-pixel text-[10px] sm:text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow',
            activeTab === 'kelompok'
              ? 'bg-[#3d7828] text-[#f0d060] border-[#f0d060]'
              : 'bg-[#19110a]/90 text-[#a08060] border-[#5a3a18] hover:border-[#8b6f4e]'
          ]"
        >
          <PhUsersThree :size="14" weight="bold" />
          <span>Kelompok</span>
        </button>
      </div>

      <!-- TAB 1: INDIVIDU -->
      <div v-if="activeTab === 'individu'" class="space-y-2 w-full">
        <!-- Search Bar -->
        <div class="relative w-full">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari nama, NIM, prodi..."
            class="w-full bg-[#19110a]/95 backdrop-blur-md border border-[#5a3a18] focus:border-[#f0d060] rounded-xl px-3 py-2 pl-8 text-xs text-white font-sans outline-none placeholder-[#785435] shadow"
          />
          <PhMagnifyingGlass
            :size="14"
            weight="bold"
            class="absolute left-2.5 top-2.5 text-[#8b6f4e]"
          />
        </div>

        <!-- List Cards -->
        <div class="space-y-1.5 w-full max-h-[48vh] sm:max-h-[52vh] overflow-y-auto pr-0.5">
          <div
            v-for="user in paginatedIndividuals"
            :key="user.id"
            :class="[
              'lb-item-card p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all w-full shadow',
              user.isCurrentUser
                ? 'bg-[#1f3a2b]/95 border-[#f0d060]'
                : 'bg-[#19110a]/90 border-[#5a3a18] hover:border-[#8b6f4e]'
            ]"
          >
            <!-- Left: Rank & Avatar & Info -->
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                v-if="user.rank === 1"
                class="w-7 h-7 rounded-lg bg-[#f0d060] text-[#1b120a] flex items-center justify-center font-pixel text-xs font-black shrink-0 shadow"
              >
                1
              </span>
              <span
                v-else-if="user.rank === 2"
                class="w-7 h-7 rounded-lg bg-[#d4d4d8] text-[#18181b] flex items-center justify-center font-pixel text-xs font-black shrink-0 shadow"
              >
                2
              </span>
              <span
                v-else-if="user.rank === 3"
                class="w-7 h-7 rounded-lg bg-[#d97706] text-white flex items-center justify-center font-pixel text-xs font-black shrink-0 shadow"
              >
                3
              </span>
              <span
                v-else
                class="w-7 h-7 rounded-lg bg-[#23160c] text-[#a08060] border border-[#5a3a18] flex items-center justify-center font-pixel text-[11px] font-bold shrink-0"
              >
                {{ user.rank }}
              </span>

              <div class="w-8 h-8 rounded-lg overflow-hidden bg-[#281c12] border border-[#8b6f4e] shrink-0 relative shadow">
                <img
                  :src="getAvatarImage(user.avatar)"
                  :alt="user.name"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4
                    :class="[
                      'font-pixel text-[10px] sm:text-xs font-bold leading-tight break-words',
                      user.isCurrentUser ? 'text-white' : 'text-[#f0e0c0]'
                    ]"
                  >
                    {{ user.name }}
                  </h4>
                  <PixelBadge v-if="user.isCurrentUser" variant="gold" size="sm">
                    KAMU
                  </PixelBadge>
                </div>
                <p class="font-sans text-[10px] text-[#a08060] leading-tight break-words mt-0.5">
                  {{ user.prodi }}
                </p>
              </div>
            </div>

            <!-- Right: Points & Stamp count -->
            <div class="text-right shrink-0">
              <div class="font-pixel text-[11px] sm:text-xs text-[#f0d060] font-bold">
                {{ user.totalXp }} XP
              </div>
              <div class="font-sans text-[9.5px] text-[#7ec850]">
                {{ user.stampsCount }}/9 Stempel
              </div>
            </div>
          </div>

          <div
            v-if="filteredIndividuals.length === 0"
            class="p-6 text-center bg-[#19110a]/90 border border-[#5a3a18] rounded-xl font-sans text-xs text-[#a08060]"
          >
            Tidak ada peserta yang cocok.
          </div>
        </div>

        <!-- Pagination Controls -->
        <div
          v-if="filteredIndividuals.length > pageSize"
          class="flex items-center justify-between gap-2 px-1 pt-1 font-pixel text-[9px] sm:text-[10px] text-[#c4956a]"
        >
          <span>
            {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredIndividuals.length) }} dari {{ filteredIndividuals.length }} Maba
          </span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="currentPage <= 1"
              @click="changePage(-1)"
              class="px-2 py-1 rounded-lg bg-[#19110a]/95 border border-[#5a3a18] text-[#f0d060] hover:border-[#f0d060] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <PhCaretLeft :size="12" weight="bold" />
              <span>Prev</span>
            </button>
            <span class="px-2 py-0.5 bg-[#120a05] border border-[#f0d060]/50 rounded text-[#fef08a]">
              {{ currentPage }}/{{ totalPages }}
            </span>
            <button
              type="button"
              :disabled="currentPage >= totalPages"
              @click="changePage(1)"
              class="px-2 py-1 rounded-lg bg-[#19110a]/95 border border-[#5a3a18] text-[#f0d060] hover:border-[#f0d060] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <PhCaretRight :size="12" weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: KELOMPOK -->
      <div v-if="activeTab === 'kelompok'" class="space-y-2 w-full max-h-[52vh] overflow-y-auto pr-0.5">
        <div
          v-for="group in groupList"
          :key="group.id"
          :class="[
            'lb-item-card bg-[#19110a]/95 backdrop-blur-md border rounded-xl transition-all overflow-hidden w-full shadow',
            group.members.some((m) => m.isCurrentUser) ? 'border-[#f0d060]' : 'border-[#5a3a18]'
          ]"
        >
          <!-- Accordion Header -->
          <button
            type="button"
            @click="() => {
              expandedGroupId = expandedGroupId === group.id ? null : group.id;
              safeSound(() => soundEngine.playSelect?.());
            }"
            class="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2.5 text-left cursor-pointer"
          >
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <span
                v-if="group.rank === 1"
                class="w-7 h-7 rounded-lg bg-[#f0d060] text-[#1b120a] flex items-center justify-center font-pixel text-xs font-black shrink-0 shadow"
              >
                1
              </span>
              <span
                v-else-if="group.rank === 2"
                class="w-7 h-7 rounded-lg bg-[#d4d4d8] text-[#18181b] flex items-center justify-center font-pixel text-xs font-black shrink-0 shadow"
              >
                2
              </span>
              <span
                v-else-if="group.rank === 3"
                class="w-7 h-7 rounded-lg bg-[#d97706] text-white flex items-center justify-center font-pixel text-xs font-black shrink-0 shadow"
              >
                3
              </span>
              <span
                v-else
                class="w-7 h-7 rounded-lg bg-[#23160c] text-[#a08060] border border-[#5a3a18] flex items-center justify-center font-pixel text-[11px] font-bold shrink-0"
              >
                {{ group.rank }}
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h3 class="font-pixel text-[10px] sm:text-xs font-bold text-white leading-normal break-words">
                    {{ group.name }}
                  </h3>
                  <PixelBadge v-if="group.members.some((m) => m.isCurrentUser)" variant="gold" size="sm">
                    KAMU
                  </PixelBadge>
                </div>
                <p class="font-sans text-[10px] text-[#a08060] mt-0.5">
                  {{ group.members.length }} Anggota
                </p>
              </div>
            </div>

            <!-- Right Stats & Expand Icon -->
            <div class="flex items-center gap-2.5 shrink-0">
              <div class="text-right">
                <div class="font-pixel text-[11px] sm:text-xs font-bold text-[#f0d060]">
                  {{ group.avgXp }} XP
                </div>
                <div class="font-sans text-[9px] text-[#7ec850]">
                  Rata-rata
                </div>
              </div>

              <div class="p-1 bg-[#23160c] border border-[#5a3a18] rounded text-[#f0d060]">
                <PhCaretUp v-if="expandedGroupId === group.id" :size="13" weight="bold" />
                <PhCaretDown v-else :size="13" weight="bold" />
              </div>
            </div>
          </button>

          <!-- Accordion Content -->
          <div
            v-if="expandedGroupId === group.id"
            class="bg-[#120a05]/95 border-t border-[#5a3a18] p-2.5 space-y-1.5 animate-in fade-in"
          >
            <div class="text-[8.5px] font-pixel text-[#a08060] uppercase border-b border-[#3d2b1e] pb-1">
              Anggota Kelompok:
            </div>

            <div class="space-y-1">
              <div
                v-for="member in group.members"
                :key="member.id"
                :class="[
                  'p-1.5 rounded-lg border flex items-center justify-between gap-2',
                  member.isCurrentUser
                    ? 'bg-[#1f3a2b] border-[#7ec850] text-[#f0ffd0]'
                    : 'bg-[#19110a] border-[#3d2b1e] text-[#e0d0b0]'
                ]"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div class="w-6 h-6 rounded-md overflow-hidden bg-[#170f07] border border-[#8b6f4e] shrink-0 relative">
                    <img
                      :src="getAvatarImage(member.avatar)"
                      :alt="member.name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-pixel text-[9px] sm:text-[10px] font-bold leading-tight break-words">
                      {{ member.name }}
                    </div>
                    <div class="font-sans text-[8.5px] text-[#a08060] leading-tight break-words">
                      {{ member.prodi }}
                    </div>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-pixel text-[9.5px] text-[#f0d060] font-bold">
                    {{ member.totalXp }} XP
                  </div>
                  <div class="font-sans text-[8.5px] text-[#7ec850]">
                    {{ member.stampsCount }}/9 Stempel
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="groupList.length === 0"
          class="p-6 text-center bg-[#19110a]/90 border border-[#5a3a18] rounded-xl font-sans text-xs text-[#a08060]"
        >
          Belum ada data kelompok tersedia di database.
        </div>
      </div>

      <!-- FOOTER NAV -->
      <footer class="flex items-center justify-center pt-2 pb-1">
        <div class="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#120a05]/90 backdrop-blur-md border border-[#5a3a18] text-[8.5px] text-[#a08060] font-pixel shadow">
          <RouterLink
            to="/peta"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#60a5fa] flex items-center gap-1 transition-colors"
          >
            <PhMapTrifold :size="12" />
            <span>PETA KAMPUS</span>
          </RouterLink>
          <span>•</span>
          <RouterLink
            to="/profile"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#facc15] flex items-center gap-1 transition-colors"
          >
            <PhIdentificationBadge :size="12" />
            <span>PROFIL & STEMPEL</span>
          </RouterLink>
          <span>•</span>
          <RouterLink
            to="/team"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#38bdf8] flex items-center gap-1 transition-colors"
          >
            <PhUser :size="12" />
            <span>REGU</span>
          </RouterLink>
        </div>
      </footer>
    </main>
  </div>
</template>
