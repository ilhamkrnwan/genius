<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import {
  PhPlay,
  PhArrowRight,
  PhCheckCircle,
  PhStar,
  PhBookOpen,
  PhGameController,
  PhTrophy,
  PhArrowLeft,
  PhSparkle,
  PhX,
} from '@phosphor-icons/vue';
import { FLOORS_DATA, BOOTHS_DATA, AVATAR_OPTIONS } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import Navbar from '@/components/layout/Navbar.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import { soundEngine } from '@/lib/sound';

const router = useRouter();
const gameStore = useGameStore();

const floor = computed(() => FLOORS_DATA.find((f) => f.number === 2)!);
const booth2A = computed(() => BOOTHS_DATA['booth-2a']);
const booth2B = computed(() => BOOTHS_DATA['booth-2b']);

const selectedAvatar = computed(
  () => AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) || AVATAR_OPTIONS[0]
);

const handleStartGame = (boothId: string) => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  router.push(`/play/floor/2/spot/${boothId}`);
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
          <PixelBadge variant="gold" size="sm">Lantai 2 dari 9</PixelBadge>
          <PixelBadge v-if="floorCompleted" variant="emerald" size="sm">
            <PhCheckCircle :size="10" weight="fill" class="inline" /> Tuntas
          </PixelBadge>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- HERO BANNER LANTAI 2                                          -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section class="relative overflow-hidden rounded-2xl border-4 border-[#06B6D4] shadow-[0_8px_0_#048b9f] mb-5">
        <!-- BG Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#183a3a] via-[#0a1f1f] to-[#060c0c]"></div>
        <!-- Pixel grid overlay -->
        <div class="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(transparent,transparent_3px,#fff_3px,#fff_4px),repeating-linear-gradient(90deg,transparent,transparent_3px,#fff_3px,#fff_4px)]"></div>

        <div class="relative p-5 sm:p-6">
          <!-- Floor badge -->
          <div class="inline-flex items-center gap-2 bg-[#071717] border-2 border-[#06B6D4] rounded-lg px-3 py-1 mb-3">
            <PhSparkle :size="14" weight="fill" class="text-[#06B6D4]" />
            <span class="font-pixel text-[9px] text-[#06B6D4] uppercase tracking-widest">Zona Eksplorasi Kampus</span>
          </div>

          <h1 class="font-pixel text-sm sm:text-xl font-bold text-white leading-snug text-shadow mb-1">
            Lantai 2 — Kesehatan &amp; Ketahanan Mahasiswa
          </h1>
          <p class="font-pixel text-[10px] text-[#7ec850] mb-4">Kampus Bersinar &amp; Well-being</p>

          <!-- Narrative dialogue -->
          <div class="flex items-start gap-3 bg-[#071717]/80 border-2 border-[#048b9f] rounded-xl p-3 mb-4">
            <div class="w-9 h-9 rounded-lg overflow-hidden border-2 border-[#06B6D4] shrink-0">
              <img :src="selectedAvatar.avatarImage" :alt="selectedAvatar.name" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <span class="font-pixel text-[9px] text-[#06B6D4] block mb-1">{{ gameStore.participant.name || 'Mahasiswa Baru' }}</span>
              <p class="font-sans text-[11px] sm:text-xs text-[#a0d0d0] leading-relaxed">
                "{{ floor.storyIntro?.narrative }}"
              </p>
            </div>
          </div>

          <!-- Key Learnings -->
          <div class="space-y-1.5 mb-4">
            <p class="font-pixel text-[9px] text-[#048b9f] uppercase mb-2">Yang akan kamu pelajari:</p>
            <div
              v-for="(learning, i) in keyLearnings"
              :key="i"
              class="flex items-start gap-2 bg-[#071717]/60 border border-[#048b9f] rounded-lg px-3 py-2"
            >
              <PhStar :size="12" weight="fill" class="text-[#06B6D4] mt-0.5 shrink-0" />
              <span class="font-sans text-[11px] sm:text-xs text-[#e0f0f0] leading-snug">{{ learning }}</span>
            </div>
          </div>

          <!-- Reward row -->
          <div class="flex items-center justify-center gap-3 bg-[#071717]/60 border border-[#048b9f] rounded-xl p-2.5 mt-2">
            <PhTrophy :size="20" weight="fill" class="text-[#06B6D4] shrink-0" />
            <p class="font-pixel text-[9px] text-[#06B6D4]">Total Reward Lantai 2:</p>
            <p class="font-sans text-[11px] text-[#7ec850] font-bold">+500 XP &amp; 2 Stempel Emas</p>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- GAME CARDS SECTION                                            -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <span class="w-2 h-6 bg-[#06B6D4] border-2 border-[#048b9f] shrink-0"></span>
          <h2 class="font-pixel text-sm text-white text-shadow">Misi Lantai 2</h2>
          <span class="font-pixel text-[9px] text-[#048b9f] ml-auto">2 Pos Tersedia</span>
        </div>

        <div class="flex flex-col gap-4">
          <!-- ── BOOTH 2A ── -->
          <div
            class="relative rounded-2xl border-4 overflow-hidden transition-all duration-150"
            :class="isCompleted2A
              ? 'border-[#7ec850] shadow-[0_4px_0_#1e3d0f]'
              : 'border-[#06B6D4] shadow-[0_4px_0_#048b9f]'"
          >
            <!-- Completed shimmer -->
            <div v-if="isCompleted2A" class="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/60 to-transparent pointer-events-none"></div>

            <div class="p-4 sm:p-5 bg-[#0a1f1f]">
              <!-- Header -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0"
                    :class="isCompleted2A ? 'bg-[#1a2e1a] border-[#7ec850]' : 'bg-[#071717] border-[#06B6D4]'"
                  >
                    <StampIcon name="Heartbeat" :size="20" :class="isCompleted2A ? 'text-[#7ec850]' : 'text-[#06B6D4]'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-pixel text-[9px] text-[#7ec850] bg-[#071717] px-1.5 py-0.5 rounded border border-[#048b9f]">B2-A</span>
                      <span v-if="isCompleted2A" class="font-pixel text-[9px] text-[#7ec850]">✓ Selesai</span>
                      <span v-else class="font-pixel text-[9px] text-[#06B6D4]">+250 XP</span>
                    </div>
                    <h3 class="font-pixel text-[10px] sm:text-[11px] font-bold text-white leading-snug">{{ booth2A.name }}</h3>
                  </div>
                </div>
                <PhCheckCircle v-if="isCompleted2A" :size="24" weight="fill" class="text-[#7ec850] shrink-0" />
              </div>

              <!-- Game type badge -->
              <div class="flex items-center gap-2 mb-3">
                <PhGameController :size="14" class="text-[#06B6D4]" />
                <span class="font-sans text-[11px] text-[#06B6D4]">{{ getGameLabel(booth2A.tipe_game) }}</span>
              </div>

              <!-- Story snippet -->
              <p class="font-sans text-[11px] sm:text-xs text-[#a0d0d0] leading-relaxed mb-4 line-clamp-2">{{ booth2A.story }}</p>

              <!-- CTA Button -->
              <button
                type="button"
                @click="!isCompleted2A ? handleStartGame('booth-2a') : null"
                :disabled="isCompleted2A"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-4 font-pixel text-[11px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-80"
                :class="isCompleted2A
                  ? 'bg-[#1a2e1a] border-[#7ec850] text-[#7ec850] shadow-none'
                  : 'bg-[#38761d] border-[#7ec850] text-white hover:bg-[#44911f] hover:-translate-y-1 hover:shadow-[0_6px_0_#1e3d0f] active:translate-y-1 active:shadow-none shadow-[0_4px_0_#1e3d0f] cursor-pointer'"
              >
                <PhPlay v-if="!isCompleted2A" :size="14" weight="fill" />
                <span>{{ isCompleted2A ? '✓ POS TUNTAS' : 'MULAI MISI' }}</span>
                <PhArrowRight v-if="!isCompleted2A" :size="14" weight="bold" />
              </button>
            </div>
          </div>

          <!-- ── BOOTH 2B ── -->
          <div
            class="relative rounded-2xl border-4 overflow-hidden transition-all duration-150"
            :class="isCompleted2B
              ? 'border-[#7ec850] shadow-[0_4px_0_#1e3d0f]'
              : 'border-[#06B6D4] shadow-[0_4px_0_#048b9f]'"
          >
            <div v-if="isCompleted2A && isCompleted2B" class="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/60 to-transparent pointer-events-none"></div>

            <div class="p-4 sm:p-5 bg-[#0a1f1f]">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0"
                    :class="isCompleted2B ? 'bg-[#1a2e1a] border-[#7ec850]' : 'bg-[#071717] border-[#06B6D4]'"
                  >
                    <StampIcon name="DropSlash" :size="20" :class="isCompleted2B ? 'text-[#7ec850]' : 'text-[#06B6D4]'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-pixel text-[9px] text-[#06B6D4] bg-[#071717] px-1.5 py-0.5 rounded border border-[#048b9f]">B2-B</span>
                      <span v-if="isCompleted2B" class="font-pixel text-[9px] text-[#7ec850]">✓ Selesai</span>
                      <span v-else class="font-pixel text-[9px] text-[#06B6D4]">+250 XP</span>
                    </div>
                    <h3 class="font-pixel text-[10px] sm:text-[11px] font-bold text-white leading-snug">{{ booth2B.name }}</h3>
                  </div>
                </div>
                <PhCheckCircle v-if="isCompleted2B" :size="24" weight="fill" class="text-[#7ec850] shrink-0" />
              </div>

              <div class="flex items-center gap-2 mb-3">
                <PhGameController :size="14" class="text-[#06B6D4]" />
                <span class="font-sans text-[11px] text-[#06B6D4]">{{ getGameLabel(booth2B.tipe_game) }}</span>
              </div>

              <p class="font-sans text-[11px] sm:text-xs text-[#a0d0d0] leading-relaxed mb-4 line-clamp-2">{{ booth2B.story }}</p>

              <button
                type="button"
                @click="!isCompleted2B ? handleStartGame('booth-2b') : null"
                :disabled="isCompleted2B"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-4 font-pixel text-[11px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-80"
                :class="isCompleted2B
                  ? 'bg-[#1a2e1a] border-[#7ec850] text-[#7ec850] shadow-none'
                  : 'bg-[#38761d] border-[#7ec850] text-white hover:bg-[#44911f] hover:-translate-y-1 hover:shadow-[0_6px_0_#1e3d0f] active:translate-y-1 active:shadow-none shadow-[0_4px_0_#1e3d0f] cursor-pointer'"
              >
                <PhPlay v-if="!isCompleted2B" :size="14" weight="fill" />
                <span>{{ isCompleted2B ? '✓ POS TUNTAS' : 'MULAI MISI' }}</span>
                <PhArrowRight v-if="!isCompleted2B" :size="14" weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Tombol akses ke floor intro resmi ── -->
      <div class="mt-5">
        <RouterLink
          to="/play/floor/2/intro"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#06B6D4]/30 bg-[#071717] font-pixel text-[10px] text-[#06B6D4] hover:border-[#06B6D4] transition-all"
        >
          <PhBookOpen :size="14" />
          <span>Lihat Peta Lengkap Lantai 2</span>
        </RouterLink>
      </div>
    </main>
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
