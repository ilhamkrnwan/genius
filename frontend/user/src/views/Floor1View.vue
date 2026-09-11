<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import {
  PhPlay,
  PhArrowRight,
  PhCheckCircle,
  PhLockKey,
  PhStar,
  PhBookOpen,
  PhGameController,
  PhTrophy,
  PhArrowLeft,
  PhSparkle,
  PhX,
  PhInfo,
  PhArrowCircleRight,
  PhImages,
  PhFlag,
  PhCursor,
  PhListChecks,
  PhSealCheck,
} from '@phosphor-icons/vue';
import { FLOORS_DATA, BOOTHS_DATA, AVATAR_OPTIONS } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import Navbar from '@/components/layout/Navbar.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import MiniGameContainer from '@/components/minigames/MiniGameContainer.vue';
import CelebrationModal from '@/components/ui/CelebrationModal.vue';
import { soundEngine } from '@/lib/sound';
import { PlayerLevel, StampRecord } from '@/types/game';

const router = useRouter();
const gameStore = useGameStore();

const floor = computed(() => FLOORS_DATA.find((f) => f.number === 1)!);
const booth1A = computed(() => BOOTHS_DATA['booth-1a']);
const booth1B = computed(() => BOOTHS_DATA['booth-1b']);
const booth1C = computed(() => BOOTHS_DATA['booth-1c']);

const selectedAvatar = computed(
  () => AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) || AVATAR_OPTIONS[0]
);

// Tutorial state removed
// ─── Game state ───────────────────────────────────────────────────────────────
type ActiveGame = 'booth-1a' | 'booth-1b' | 'booth-1c' | null;
const activeGame = ref<ActiveGame>(null);

const currentBooth = computed(() => {
  if (activeGame.value === 'booth-1a') return booth1A.value;
  if (activeGame.value === 'booth-1b') return booth1B.value;
  if (activeGame.value === 'booth-1c') return booth1C.value;
  return null;
});

const isCompleted1A = computed(() => gameStore.isBoothCompleted('booth-1a'));
const isCompleted1B = computed(() => gameStore.isBoothCompleted('booth-1b'));
const isCompleted1C = computed(() => gameStore.isBoothCompleted('booth-1c'));
const floorCompleted = computed(() => isCompleted1A.value && isCompleted1B.value && isCompleted1C.value);

// ─── Celebration state ────────────────────────────────────────────────────────
const showCelebration = ref(false);
const celebrationDetails = ref<{
  stampRecord: StampRecord | null;
  isFloorCompleted: boolean;
  floorNumber: number;
  isLevelUp: boolean;
  newLevel: PlayerLevel;
}>({
  stampRecord: null,
  isFloorCompleted: false,
  floorNumber: 1,
  isLevelUp: false,
  newLevel: 'New You',
});

const handleStartGame = (boothId: ActiveGame) => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  activeGame.value = boothId;
};

const handleCloseGame = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  activeGame.value = null;
};

const handleGameComplete = (score: number, totalQuestions: number) => {
  if (!currentBooth.value) return;
  if (gameStore.soundEnabled) soundEngine.playCorrect();

  const result = gameStore.completeBooth(currentBooth.value.id, score, totalQuestions);
  const stamp: StampRecord = {
    boothId: currentBooth.value.id,
    boothName: currentBooth.value.name,
    floorNumber: 1,
    stampTitle: currentBooth.value.stampTitle,
    stampIcon: currentBooth.value.stampIcon,
    stampColor: currentBooth.value.stampColor,
    earnedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    score,
    totalQuestions,
  };

  celebrationDetails.value = {
    stampRecord: stamp,
    isFloorCompleted: result.isFloorCompleted,
    floorNumber: 1,
    isLevelUp: result.isLevelUp,
    newLevel: result.newLevel,
  };

  activeGame.value = null;
  showCelebration.value = true;
};

const getGameLabel = (type: string) => {
  const map: Record<string, string> = {
    tebak_gambar: '🖼️ Tebak Gambar',
    kuis_balapan: '🏁 Kuis Balapan',
    tts: '📝 Teka-Teki Silang',
    tebak_kata: '🔤 Tebak Kata',
    memory_match: '🃏 Memory Match',
    kuis_cepat: '⚡ Kuis Cepat',
    benar_salah: '✅ Benar / Salah',
    tebak_posisi: '📍 Tebak Lokasi',
  };
  return map[type] || '🎮 Mini-Game';
};

const keyLearnings = computed(() => floor.value?.storyIntro?.keyLearning || []);
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-[#2d1b0e] text-[#f0e0c0] font-sans">
    <CrtScanlines />
    <Navbar />

    <main class="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 pb-10 pt-3 z-10 overflow-y-auto animate-fade-in">
      
      <!-- Breadcrumb -->
      <div class="flex items-center justify-between mb-4 shrink-0">
        <RouterLink
          to="/dashboard"
          class="inline-flex items-center gap-1.5 font-pixel text-[10px] text-[#c4956a] hover:text-[#f0d060] transition-colors"
        >
          <PhArrowLeft :size="14" weight="bold" />
          <span>Dashboard</span>
        </RouterLink>
        <div class="flex items-center gap-2">
          <PixelBadge variant="gold" size="sm">Lantai 1 dari 9</PixelBadge>
          <PixelBadge v-if="floorCompleted" variant="emerald" size="sm">
            <PhCheckCircle :size="10" weight="fill" class="inline" /> Tuntas
          </PixelBadge>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- HERO BANNER LANTAI 1                                          -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section class="relative overflow-hidden rounded-2xl border-4 border-[#f0d060] shadow-[0_8px_0_#7a6800] mb-5">
        <!-- BG Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#3a2818] via-[#1f140a] to-[#0c0806]"></div>
        <!-- Pixel grid overlay -->
        <div class="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(transparent,transparent_3px,#fff_3px,#fff_4px),repeating-linear-gradient(90deg,transparent,transparent_3px,#fff_3px,#fff_4px)]"></div>

        <div class="relative p-5 sm:p-6">
          <!-- Floor badge -->
          <div class="inline-flex items-center gap-2 bg-[#170f07] border-2 border-[#f0d060] rounded-lg px-3 py-1 mb-3">
            <PhSparkle :size="14" weight="fill" class="text-[#f0d060]" />
            <span class="font-pixel text-[9px] text-[#f0d060] uppercase tracking-widest">Zona Eksplorasi Kampus</span>
          </div>

          <h1 class="font-pixel text-sm sm:text-xl font-bold text-white leading-snug text-shadow mb-1">
            Lantai 1 — Welcome Hall
          </h1>
          <p class="font-pixel text-[10px] text-[#7ec850] mb-4">Fondasi Karakter &amp; Nilai Aswaja UNU</p>

          <!-- Narrative dialogue -->
          <div class="flex items-start gap-3 bg-[#170f07]/80 border-2 border-[#5a3a18] rounded-xl p-3 mb-4">
            <div class="w-9 h-9 rounded-lg overflow-hidden border-2 border-[#f0d060] shrink-0">
              <img :src="selectedAvatar.avatarImage" :alt="selectedAvatar.name" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <span class="font-pixel text-[9px] text-[#f0d060] block mb-1">{{ gameStore.participant.name || 'Mahasiswa Baru' }}</span>
              <p class="font-sans text-[11px] sm:text-xs text-[#d0c0a0] leading-relaxed">
                "{{ floor.storyIntro?.narrative }}"
              </p>
            </div>
          </div>

          <!-- Key Learnings -->
          <div class="space-y-1.5 mb-4">
            <p class="font-pixel text-[9px] text-[#a08060] uppercase mb-2">Yang akan kamu pelajari:</p>
            <div
              v-for="(learning, i) in keyLearnings"
              :key="i"
              class="flex items-start gap-2 bg-[#170f07]/60 border border-[#5a3a18] rounded-lg px-3 py-2"
            >
              <PhStar :size="12" weight="fill" class="text-[#f0d060] mt-0.5 shrink-0" />
              <span class="font-sans text-[11px] sm:text-xs text-[#f0e0c0] leading-snug">{{ learning }}</span>
            </div>
          </div>

          <!-- Reward row -->
          <div class="flex items-center justify-center gap-3 bg-[#1a0f07]/60 border border-[#5a3a18] rounded-xl p-2.5 mt-2">
            <PhTrophy :size="20" weight="fill" class="text-[#f0d060] shrink-0" />
            <p class="font-pixel text-[9px] text-[#f0d060]">Total Reward Lantai 1:</p>
            <p class="font-sans text-[11px] text-[#7ec850] font-bold">+750 XP &amp; 3 Stempel Emas</p>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- GAME CARDS SECTION                                            -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <span class="w-2 h-6 bg-[#7ec850] border-2 border-[#1e3d0f] shrink-0"></span>
          <h2 class="font-pixel text-sm text-white text-shadow">Misi Lantai 1</h2>
          <span class="font-pixel text-[9px] text-[#a08060] ml-auto">3 Pos Tersedia</span>
        </div>

        <div class="flex flex-col gap-4">
          <!-- ── BOOTH 1A ── -->
          <div
            class="relative rounded-2xl border-4 overflow-hidden transition-all duration-150"
            :class="isCompleted1A
              ? 'border-[#7ec850] shadow-[0_4px_0_#1e3d0f]'
              : 'border-[#5c4033] shadow-[0_4px_0_#1a0f08]'"
          >
            <!-- Completed shimmer -->
            <div v-if="isCompleted1A" class="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/60 to-transparent pointer-events-none"></div>

            <div class="p-4 sm:p-5 bg-[#3a2818]">
              <!-- Header -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0"
                    :class="isCompleted1A ? 'bg-[#1a2e1a] border-[#7ec850]' : 'bg-[#1f140a] border-[#f0d060]'"
                  >
                    <StampIcon name="Images" :size="20" :class="isCompleted1A ? 'text-[#7ec850]' : 'text-[#f0d060]'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-pixel text-[9px] text-[#7ec850] bg-[#170f07] px-1.5 py-0.5 rounded border border-[#3a4a3a]">B1-A</span>
                      <span v-if="isCompleted1A" class="font-pixel text-[9px] text-[#7ec850]">✓ Selesai</span>
                      <span v-else class="font-pixel text-[9px] text-[#f0d060]">+250 XP</span>
                    </div>
                    <h3 class="font-pixel text-[10px] sm:text-[11px] font-bold text-white leading-snug">{{ booth1A.name }}</h3>
                  </div>
                </div>
                <PhCheckCircle v-if="isCompleted1A" :size="24" weight="fill" class="text-[#7ec850] shrink-0" />
              </div>

              <!-- Game type badge -->
              <div class="flex items-center gap-2 mb-3">
                <PhGameController :size="14" class="text-[#c4956a]" />
                <span class="font-sans text-[11px] text-[#c4956a]">{{ getGameLabel(booth1A.tipe_game) }}</span>
              </div>

              <!-- Story snippet -->
              <p class="font-sans text-[11px] sm:text-xs text-[#a89078] leading-relaxed mb-4 line-clamp-2">{{ booth1A.story }}</p>

              <!-- CTA Button -->
              <button
                type="button"
                @click="!isCompleted1A ? handleStartGame('booth-1a') : null"
                :disabled="isCompleted1A"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-4 font-pixel text-[11px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-80"
                :class="isCompleted1A
                  ? 'bg-[#1a2e1a] border-[#7ec850] text-[#7ec850] shadow-none'
                  : 'bg-[#38761d] border-[#7ec850] text-white hover:bg-[#44911f] hover:-translate-y-1 hover:shadow-[0_6px_0_#1e3d0f] active:translate-y-1 active:shadow-none shadow-[0_4px_0_#1e3d0f] cursor-pointer'"
              >
                <PhPlay v-if="!isCompleted1A" :size="14" weight="fill" />
                <span>{{ isCompleted1A ? '✓ POS TUNTAS' : 'MULAI MISI' }}</span>
                <PhArrowRight v-if="!isCompleted1A" :size="14" weight="bold" />
              </button>
            </div>
          </div>

          <!-- ── BOOTH 1B ── -->
          <div
            class="relative rounded-2xl border-4 overflow-hidden transition-all duration-150"
            :class="isCompleted1B
              ? 'border-[#7ec850] shadow-[0_4px_0_#1e3d0f]'
              : 'border-[#5c4033] shadow-[0_4px_0_#1a0f08]'"
          >
            <div v-if="isCompleted1A && isCompleted1B" class="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/60 to-transparent pointer-events-none"></div>

            <div class="p-4 sm:p-5 bg-[#3a2818]">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0"
                    :class="isCompleted1B ? 'bg-[#1a2e1a] border-[#7ec850]' : 'bg-[#1f140a] border-[#f0d060]'"
                  >
                    <StampIcon name="FlagCheckered" :size="20" :class="isCompleted1B ? 'text-[#7ec850]' : 'text-[#f0d060]'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-pixel text-[9px] text-[#f0d060] bg-[#170f07] px-1.5 py-0.5 rounded border border-[#5a3a18]">B1-B</span>
                      <span v-if="isCompleted1B" class="font-pixel text-[9px] text-[#7ec850]">✓ Selesai</span>
                      <span v-else class="font-pixel text-[9px] text-[#f0d060]">+250 XP</span>
                    </div>
                    <h3 class="font-pixel text-[10px] sm:text-[11px] font-bold text-white leading-snug">{{ booth1B.name }}</h3>
                  </div>
                </div>
                <PhCheckCircle v-if="isCompleted1B" :size="24" weight="fill" class="text-[#7ec850] shrink-0" />
              </div>

              <div class="flex items-center gap-2 mb-3">
                <PhGameController :size="14" class="text-[#c4956a]" />
                <span class="font-sans text-[11px] text-[#c4956a]">{{ getGameLabel(booth1B.tipe_game) }}</span>
              </div>

              <p class="font-sans text-[11px] sm:text-xs text-[#a89078] leading-relaxed mb-4 line-clamp-2">{{ booth1B.story }}</p>

              <button
                type="button"
                @click="!isCompleted1B ? handleStartGame('booth-1b') : null"
                :disabled="isCompleted1B"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-4 font-pixel text-[11px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-80"
                :class="isCompleted1B
                  ? 'bg-[#1a2e1a] border-[#7ec850] text-[#7ec850] shadow-none'
                  : 'bg-[#38761d] border-[#7ec850] text-white hover:bg-[#44911f] hover:-translate-y-1 hover:shadow-[0_6px_0_#1e3d0f] active:translate-y-1 active:shadow-none shadow-[0_4px_0_#1e3d0f] cursor-pointer'"
              >
                <PhPlay v-if="!isCompleted1B" :size="14" weight="fill" />
                <span>{{ isCompleted1B ? '✓ POS TUNTAS' : 'MULAI MISI' }}</span>
                <PhArrowRight v-if="!isCompleted1B" :size="14" weight="bold" />
              </button>
            </div>
          </div>

          <!-- ── BOOTH 1C ── -->
          <div
            class="relative rounded-2xl border-4 overflow-hidden transition-all duration-150"
            :class="isCompleted1C
              ? 'border-[#7ec850] shadow-[0_4px_0_#1e3d0f]'
              : 'border-[#5c4033] shadow-[0_4px_0_#1a0f08]'"
          >
            <div v-if="isCompleted1B && isCompleted1C" class="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/60 to-transparent pointer-events-none"></div>

            <div class="p-4 sm:p-5 bg-[#3a2818]">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0"
                    :class="isCompleted1C ? 'bg-[#1a2e1a] border-[#7ec850]' : 'bg-[#1f140a] border-[#f0d060]'"
                  >
                    <StampIcon name="ChatCenteredText" :size="20" :class="isCompleted1C ? 'text-[#7ec850]' : 'text-[#f0d060]'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-pixel text-[9px] text-[#f0d060] bg-[#170f07] px-1.5 py-0.5 rounded border border-[#5a3a18]">B1-C</span>
                      <span v-if="isCompleted1C" class="font-pixel text-[9px] text-[#7ec850]">✓ Selesai</span>
                      <span v-else class="font-pixel text-[9px] text-[#f0d060]">+250 XP</span>
                    </div>
                    <h3 class="font-pixel text-[10px] sm:text-[11px] font-bold text-white leading-snug">{{ booth1C.name }}</h3>
                  </div>
                </div>
                <PhCheckCircle v-if="isCompleted1C" :size="24" weight="fill" class="text-[#7ec850] shrink-0" />
              </div>

              <div class="flex items-center gap-2 mb-3">
                <PhGameController :size="14" class="text-[#c4956a]" />
                <span class="font-sans text-[11px] text-[#c4956a]">{{ getGameLabel(booth1C.tipe_game) }}</span>
              </div>

              <p class="font-sans text-[11px] sm:text-xs text-[#a89078] leading-relaxed mb-4 line-clamp-2">{{ booth1C.story }}</p>

              <button
                type="button"
                @click="!isCompleted1C ? handleStartGame('booth-1c') : null"
                :disabled="isCompleted1C"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-4 font-pixel text-[11px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-80"
                :class="isCompleted1C
                  ? 'bg-[#1a2e1a] border-[#7ec850] text-[#7ec850] shadow-none'
                  : 'bg-[#38761d] border-[#7ec850] text-white hover:bg-[#44911f] hover:-translate-y-1 hover:shadow-[0_6px_0_#1e3d0f] active:translate-y-1 active:shadow-none shadow-[0_4px_0_#1e3d0f] cursor-pointer'"
              >
                <PhPlay v-if="!isCompleted1C" :size="14" weight="fill" />
                <span>{{ isCompleted1C ? '✓ POS TUNTAS' : 'MULAI MISI' }}</span>
                <PhArrowRight v-if="!isCompleted1C" :size="14" weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Tombol akses ke floor intro resmi ── -->
      <div class="mt-5">
        <RouterLink
          to="/play/floor/1/intro"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#5c4033] bg-[#1f140a] font-pixel text-[10px] text-[#a08060] hover:border-[#f0d060] hover:text-[#f0d060] transition-all"
        >
          <PhBookOpen :size="14" />
          <span>Lihat Peta Lengkap Lantai 1</span>
        </RouterLink>
      </div>
    </main>



    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: MINI GAME ARENA                                                -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="activeGame && currentBooth"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0a0604]/90 backdrop-blur-md"
      >
        <div class="w-full max-w-lg bg-[#2d1b0e] border-t-4 sm:border-4 border-[#f0d060] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh]">
          <!-- Game modal header -->
          <div class="flex items-center justify-between px-4 py-3 border-b-2 border-[#5a3a18] shrink-0">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 bg-[#170f07] border border-[#f0d060] rounded-md flex items-center justify-center shrink-0">
                <StampIcon :name="currentBooth.stampIcon" :size="16" class="text-[#f0d060]" />
              </div>
              <div class="min-w-0">
                <p class="font-pixel text-[8px] text-[#7ec850]">{{ currentBooth.code }} • Lantai 1</p>
                <p class="font-pixel text-[9px] sm:text-[10px] font-bold text-white truncate">{{ currentBooth.name }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="handleCloseGame"
              class="w-8 h-8 rounded-lg bg-[#3a2818] border-2 border-[#5a3a18] flex items-center justify-center hover:border-[#f0d060] cursor-pointer transition-colors shrink-0"
            >
              <PhX :size="16" class="text-[#f0e0c0]" />
            </button>
          </div>

          <!-- Game arena -->
          <div class="flex-1 overflow-hidden p-3 sm:p-4">
            <MiniGameContainer
              :booth="currentBooth"
              :isCompleted="activeGame === 'booth-1a' ? isCompleted1A : activeGame === 'booth-1b' ? isCompleted1B : isCompleted1C"
              @complete="handleGameComplete"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Celebration modal -->
    <CelebrationModal
      :isOpen="showCelebration"
      :stampRecord="celebrationDetails.stampRecord"
      :isFloorCompleted="celebrationDetails.isFloorCompleted"
      :floorNumber="celebrationDetails.floorNumber"
      :isLevelUp="celebrationDetails.isLevelUp"
      :newLevel="celebrationDetails.newLevel"
      nextActionLabel="Kembali ke Lantai 1"
      @close="showCelebration = false"
      @nextAction="showCelebration = false"
    />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
.text-shadow      { text-shadow: 2px 2px 0px #1b120a; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
