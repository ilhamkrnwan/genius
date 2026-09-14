<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
} from '@phosphor-icons/vue';
import { FLOORS_DATA, BOOTHS_DATA, AVATAR_OPTIONS } from '@/data/mockData';
import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';
import Navbar from '@/components/layout/Navbar.vue';
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import PixelBadge from '@/components/ui/PixelBadge.vue';
import StampIcon from '@/components/ui/StampIcon.vue';
import { soundEngine } from '@/lib/sound';

const router = useRouter();
const gameStore = useGameStore();
const gameSessionStore = useGameSessionStore();

const floor = computed(() => FLOORS_DATA.find((f) => f.number === 1)!);

onMounted(() => {
  gameSessionStore.fetchMyTeamSessions();
});

const booths = computed(() => {
  // Hanya ambil sesi milik tim di Lantai 1
  const f1Sessions = gameSessionStore.mySessions.filter((s: any) => 
    s.floorNumber === 1 || s.locationCode?.startsWith('POS-L1')
  );
  
  return f1Sessions.map((session: any) => {
    // Gunakan template UI dari mockData berdasarkan zona
    let templateId = 'booth-1a';
    if (session.locationCode?.endsWith('A')) templateId = 'booth-1a';
    if (session.locationCode?.endsWith('B')) templateId = 'booth-1b';
    
    const template = BOOTHS_DATA[templateId] || BOOTHS_DATA['booth-1a'];

    return {
      id: session.missionId, // PENTING: Gunakan UUID Misi untuk URL
      originalBoothId: templateId,
      code: session.locationCode || template.code,
      name: session.missionName || template.name,
      story: `Misi: ${session.gameName}. Akses ini dibuka khusus untuk tim Anda.`,
      stampIcon: template.stampIcon,
      tipe_game: session.gameType?.toLowerCase() || template.tipe_game,
      status: session.status // ACTIVE, READY, PAUSED, COMPLETED
    };
  });
});

const selectedAvatar = computed(
  () => AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) || AVATAR_OPTIONS[0]
);

const handleStartGame = (missionId: string) => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  // Navigasi menggunakan UUID Misi ke LinearSpotView
  router.push(`/play/floor/1/spot/${missionId}`);
};

const getGameLabel = (type: string) => {
  const map: Record<string, string> = {
    quiz: '⚡ Kuis Cepat',
    reaction: '🏁 Kuis Balapan',
    memory: '🃏 Memory Match',
    logic: '📝 Puzzle Logika',
    tebak_gambar: '🖼️ Tebak Gambar',
  };
  return map[type] || '🎮 Mini-Game';
};

const keyLearnings = computed(() => floor.value?.storyIntro?.keyLearning || []);

const floorCompleted = computed(() => gameStore.getFloorStatus(1) === 'completed');
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-[#2d1b0e] text-[#f0e0c0] font-sans">
    <CrtScanlines />
    <Navbar />

    <main class="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 pb-10 pt-3 z-10 overflow-y-auto animate-fade-in">
      
      <!-- Breadcrumb -->
      <div class="flex items-center justify-between mb-4 shrink-0">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 font-pixel text-[10px] text-[#c4956a] hover:text-[#f0d060] transition-colors"
        >
          <PhArrowLeft :size="14" weight="bold" />
          <span>Beranda</span>
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
          <span class="font-pixel text-[9px] text-[#a08060] ml-auto">{{ booths.length }} Pos Ditugaskan</span>
        </div>

        <div v-if="gameSessionStore.status === 'loading'" class="flex justify-center p-8">
          <span class="font-pixel text-xs text-[#f0d060] animate-pulse">Memuat data Misi...</span>
        </div>

        <div v-else-if="booths.length === 0" class="p-6 border-2 border-dashed border-[#5a3a18] bg-[#1a0f07] rounded-xl text-center space-y-3">
          <PhBookOpen :size="32" class="mx-auto text-[#8b6f4e]" />
          <h3 class="font-pixel text-xs text-[#c4956a]">TIDAK ADA MISI AKTIF</h3>
          <p class="font-sans text-[11px] text-[#a08060] max-w-[250px] mx-auto">
            Game Master belum membuka akses pos apa pun untuk tim Anda. Silakan lapor ke Panitia/Buddy.
          </p>
        </div>

        <div v-else class="flex flex-col gap-4">
          <!-- ── DYNAMIC BOOTHS ── -->
          <div
            v-for="(booth, index) in booths"
            :key="booth.id"
            class="relative rounded-2xl border-4 overflow-hidden transition-all duration-150"
            :class="booth.status === 'COMPLETED'
              ? 'border-[#7ec850] shadow-[0_4px_0_#1e3d0f]'
              : 'border-[#5c4033] shadow-[0_4px_0_#1a0f08]'"
          >
            <!-- Completed shimmer -->
            <div v-if="booth.status === 'COMPLETED'" class="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/60 to-transparent pointer-events-none"></div>

            <div class="p-4 sm:p-5 bg-[#3a2818]">
              <!-- Header -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0"
                    :class="booth.status === 'COMPLETED' ? 'bg-[#1a2e1a] border-[#7ec850]' : 'bg-[#1f140a] border-[#f0d060]'"
                  >
                    <StampIcon :name="booth.stampIcon" :size="20" :class="booth.status === 'COMPLETED' ? 'text-[#7ec850]' : 'text-[#f0d060]'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-pixel text-[9px] text-[#f0d060] bg-[#170f07] px-1.5 py-0.5 rounded border border-[#5a3a18]">{{ booth.code }}</span>
                      <span v-if="booth.status === 'COMPLETED'" class="font-pixel text-[9px] text-[#7ec850]">✓ Selesai</span>
                      <span v-else class="font-pixel text-[9px] text-[#f0d060]">TERTUGAS</span>
                    </div>
                    <h3 class="font-pixel text-[10px] sm:text-[11px] font-bold text-white leading-snug">{{ booth.name }}</h3>
                  </div>
                </div>
                <PhCheckCircle v-if="booth.status === 'COMPLETED'" :size="24" weight="fill" class="text-[#7ec850] shrink-0" />
              </div>

              <!-- Game type badge -->
              <div class="flex items-center gap-2 mb-3">
                <PhGameController :size="14" class="text-[#c4956a]" />
                <span class="font-sans text-[11px] text-[#c4956a]">{{ getGameLabel(booth.tipe_game) }}</span>
              </div>

              <!-- Story snippet -->
              <p class="font-sans text-[11px] sm:text-xs text-[#a89078] leading-relaxed mb-4 line-clamp-2">{{ booth.story }}</p>

              <!-- CTA Button -->
              <button
                type="button"
                @click="booth.status !== 'COMPLETED' ? handleStartGame(booth.id) : null"
                :disabled="booth.status === 'COMPLETED'"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-4 font-pixel text-[11px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-80"
                :class="booth.status === 'COMPLETED'
                  ? 'bg-[#1a2e1a] border-[#7ec850] text-[#7ec850] shadow-none'
                  : 'bg-[#38761d] border-[#7ec850] text-white hover:bg-[#44911f] hover:-translate-y-1 hover:shadow-[0_6px_0_#1e3d0f] active:translate-y-1 active:shadow-none shadow-[0_4px_0_#1e3d0f] cursor-pointer'"
              >
                <PhPlay v-if="booth.status !== 'COMPLETED'" :size="14" weight="fill" />
                <span>{{ booth.status === 'COMPLETED' ? '✓ POS TUNTAS' : 'MULAI MISI' }}</span>
                <PhArrowRight v-if="booth.status !== 'COMPLETED'" :size="14" weight="bold" />
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
