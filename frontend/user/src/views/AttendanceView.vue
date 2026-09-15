<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhCalendarCheck,
  PhClock,
  PhCheckCircle,
  PhStar,
  PhArrowLeft,
  PhSparkle,
  PhShieldCheck,
  PhArrowsClockwise,
  PhHourglass,
  PhLockKey,
  PhSpeakerHigh,
  PhSpeakerSimpleSlash,
  PhMapTrifold,
  PhIdentificationBadge,
  PhUser,
} from '@phosphor-icons/vue';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/sound';
import { AVATAR_OPTIONS } from '@/data/mockData';

const gameStore = useGameStore();

const activeDayTab = ref<1 | 2 | 3>(1);
const isRefreshing = ref(false);
const isMuted = ref(gameStore.soundEnabled === false);
const notification = ref<{ type: 'success' | 'info'; message: string } | null>(null);

// Form Refleksi Singkat
const rating = ref(5);
const essayInsight = ref('');
const isSubmitting = ref(false);

// Roster Buddy Resmi per Regu (Fallback jika offline)
const OFFICIAL_BUDDIES_MAP: Record<string, string> = {
  'Genius 01': 'Agnes Anggraini',
  'Genius 02': 'Agnesya Putri',
  'Genius 03': 'Ahmad Fadlil Munajad',
  'Genius 04': 'Ahmad Ichsan',
  'Genius 05': 'Aning Gusmi',
  'Genius 06': 'Arselia Sakina',
  'Genius 07': 'Asadurrahman M.',
  'Genius 08': 'Dafa Alif Laguna',
  'Genius 09': 'Destiya Lintang',
  'Genius 10': 'Dzulfa Sindi',
  'Genius 11': 'Fajar Nugraha',
  'Genius 12': 'Farah Diba',
  'Genius 13': 'Fathi Rizqy Ramadhan',
  'Genius 14': 'Fitria Nur Azizah',
  'Genius 15': 'Galih Prasetyo',
  'Genius 16': 'Hani Amalia',
  'Genius 17': 'Ilham Maulana',
  'Genius 18': 'Indah Permatasari',
};

const buddyName = computed(() => {
  if (gameStore.participant.buddyName) {
    return gameStore.participant.buddyName;
  }
  const group = gameStore.participant.groupName || 'Genius 01';
  return OFFICIAL_BUDDIES_MAP[group] || 'Kakak Buddy Pendamping';
});

const avatarData = computed(() => {
  return (
    AVATAR_OPTIONS.find((a) => a.id === gameStore.participant.avatar) ||
    AVATAR_OPTIONS[0]
  );
});

interface SessionDefinition {
  id: string;
  day: 1 | 2 | 3;
  type: 'checkIn' | 'checkOut';
  title: string;
  timeRange: string;
  xpReward: number;
}

const ALL_SESSIONS: SessionDefinition[] = [
  {
    id: 'd1-checkin',
    day: 1,
    type: 'checkIn',
    title: 'Sesi 1: Presensi Masuk Pagi',
    timeRange: '07:00 - 07:30 WIB',
    xpReward: 100,
  },
  {
    id: 'd1-checkout',
    day: 1,
    type: 'checkOut',
    title: 'Sesi 2: Presensi Pulang & FGD Niat',
    timeRange: '16:00 - 16:30 WIB',
    xpReward: 50,
  },
  {
    id: 'd2-checkin',
    day: 2,
    type: 'checkIn',
    title: 'Sesi 3: Presensi Masuk Campus Quest',
    timeRange: '07:00 - 07:30 WIB',
    xpReward: 100,
  },
  {
    id: 'd2-checkout',
    day: 2,
    type: 'checkOut',
    title: 'Sesi 4: Presensi Pulang Quest 9 Lantai',
    timeRange: '16:00 - 16:30 WIB',
    xpReward: 50,
  },
  {
    id: 'd3-checkin',
    day: 3,
    type: 'checkIn',
    title: 'Sesi 5: Presensi Ormawa Expo Discovery',
    timeRange: '07:00 - 07:30 WIB',
    xpReward: 100,
  },
  {
    id: 'd3-checkout',
    day: 3,
    type: 'checkOut',
    title: 'Sesi 6: Grand Finale & Penutupan',
    timeRange: '15:00 - 16:00 WIB',
    xpReward: 50,
  },
];

const DAYS = [
  { day: 1 as const, label: 'HARI 1', date: '22 Sep', subtitle: 'Ke-UNU-an' },
  { day: 2 as const, label: 'HARI 2', date: '23 Sep', subtitle: 'Campus Quest' },
  { day: 3 as const, label: 'HARI 3', date: '24 Sep', subtitle: 'Ormawa Expo' },
];

const attendedCount = computed(() => gameStore.getAttendedSessionsCount());
const totalXp = computed(() => gameStore.getTotalAttendanceXp());

const currentDayRecord = computed(() => {
  return gameStore.getAttendanceForDay(activeDayTab.value);
});

const isReflectionDone = computed(() => {
  return Boolean(currentDayRecord.value?.reflection);
});

function safeSound(fn: () => void) {
  try {
    if (gameStore.soundEnabled) fn();
  } catch (_) {}
}

function toggleSound() {
  gameStore.soundEnabled = !gameStore.soundEnabled;
  isMuted.value = !gameStore.soundEnabled;
  try {
    soundEngine.setMuted(isMuted.value);
    if (!isMuted.value) soundEngine.playClick?.();
  } catch (_) {}
}

function showNotification(type: 'success' | 'info', message: string) {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 3500);
}

function getSessionStatus(session: SessionDefinition) {
  const dayRecord = gameStore.getAttendanceForDay(session.day);
  if (!dayRecord) return { state: 'locked', label: 'Belum Dibuka' };

  if (session.type === 'checkIn') {
    if (dayRecord.checkInAt) {
      return {
        state: 'verified',
        label: 'Terverifikasi Hadir',
        time: dayRecord.checkInAt,
      };
    }
  } else {
    if (dayRecord.checkOutAt) {
      return {
        state: 'verified',
        label: 'Terverifikasi Pulang',
        time: dayRecord.checkOutAt,
      };
    }
  }

  if (session.day === gameStore.activeDay) {
    return { state: 'in_progress', label: 'Menunggu Buddy' };
  }

  if (session.day < gameStore.activeDay) {
    return { state: 'missed', label: 'Selesai' };
  }

  return { state: 'locked', label: 'Belum Dimulai' };
}

function formatTime(isoString?: string | null) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  } catch {
    return isoString;
  }
}

async function refreshAttendance() {
  safeSound(() => soundEngine.playClick?.());
  isRefreshing.value = true;
  try {
    await gameStore.syncAttendanceFromServer();
    showNotification('info', 'Status presensi dan total skor diperbarui dari server.');
  } catch (_) {
    showNotification('info', 'Status presensi diperbarui.');
  } finally {
    isRefreshing.value = false;
  }
}

function submitReflection() {
  if (!essayInsight.value.trim()) {
    showNotification('info', 'Tuliskan sedikit pesan atau kesan Anda.');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = gameStore.submitReflection(activeDayTab.value, {
      ratingFasilitas: rating.value,
      ratingMateri: rating.value,
      ratingBuddy: rating.value,
      essayInsight: essayInsight.value.trim(),
    });

    if (res.success) {
      safeSound(() => soundEngine.playCorrect?.());
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch (_) {}
      showNotification('success', res.message);
    }
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  activeDayTab.value = (gameStore.activeDay as 1 | 2 | 3) || 1;
  await gameStore.syncAttendanceFromServer();
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
        background-image: url('/games/background.png');
        background-size: cover;
        background-position: center bottom;
        image-rendering: pixelated;
      "
    />
    <!-- Dark Vignette Overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/80 pointer-events-none z-0" />

    <!-- ================================================================= -->
    <!-- TOP HEADER: Responsive & Clean (No Squishing on Mobile)           -->
    <!-- ================================================================= -->
    <header class="relative z-20 w-full max-w-xl mx-auto flex items-center justify-between gap-2 pb-2 shrink-0">
      <!-- Left: Back to Lobby Button -->
      <RouterLink
        to="/play"
        @click="() => safeSound(() => soundEngine.playClick?.())"
        class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] hover:text-white transition-all text-[9.5px] sm:text-[10px] flex items-center gap-1.5 cursor-pointer active:scale-95 shadow shrink-0"
        title="Kembali ke Menu Utama"
      >
        <PhArrowLeft :size="13" weight="bold" />
        <span class="font-pixel">MENU</span>
      </RouterLink>

      <!-- Center: Title Badge -->
      <div class="px-3 py-1 bg-[#1a110a]/90 backdrop-blur-md border border-[#8b6f4e] rounded-full shadow flex items-center gap-1.5 shrink-0">
        <PhCalendarCheck :size="15" weight="fill" class="text-[#facc15]" />
        <span class="text-[10px] sm:text-xs text-[#facc15] font-bold tracking-wide uppercase">
          PRESENSI
        </span>
      </div>

      <!-- Right: Sound, Refresh, XP Badge -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- XP Badge -->
        <div class="bg-[#24170d] border border-[#d97706] px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9.5px] sm:text-[10px] text-[#facc15] font-bold">
          <PhSparkle :size="11" weight="fill" />
          <span>+{{ totalXp }} XP</span>
        </div>

        <!-- Refresh Button -->
        <button
          type="button"
          @click="refreshAttendance"
          title="Segarkan Status"
          class="p-1.5 rounded-lg bg-[#2a1a0e]/95 border border-[#8b6f4e] hover:border-[#f0d060] text-[#f0d060] transition-all cursor-pointer active:scale-95 shadow"
        >
          <PhArrowsClockwise :size="13" :class="{ 'animate-spin': isRefreshing }" />
        </button>

        <!-- Sound Toggle -->
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

    <!-- Global Notification -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="notification"
        class="fixed top-14 inset-x-3 sm:inset-x-auto sm:right-6 z-50 p-2.5 rounded-xl border shadow-xl font-mono text-xs flex items-center gap-2 max-w-sm bg-[#142612] border-[#22c55e] text-[#86efac]"
      >
        <PhCheckCircle :size="16" weight="bold" class="shrink-0 text-[#22c55e]" />
        <span>{{ notification.message }}</span>
      </div>
    </Transition>

    <!-- ================================================================= -->
    <!-- MAIN CONTENT: Simple, Clean & Responsive Layout                   -->
    <!-- ================================================================= -->
    <main class="relative z-20 w-full max-w-xl mx-auto space-y-2.5 my-auto">

      <!-- 1. COMPACT STATUS CARD: Mahasiswa & Buddy (Stacked Rows for Zero Truncation) -->
      <section class="bg-[#19110a]/95 backdrop-blur-md border border-[#8b6f4e] rounded-xl p-3 shadow-lg space-y-2 text-left">
        <!-- Row A: Mahasiswa Baru Info -->
        <div class="flex items-center justify-between gap-2.5 pb-2 border-b border-[#4a2e14]/70">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-lg bg-[#120a05] border border-[#f0d060] overflow-hidden shrink-0 shadow">
              <img
                :src="avatarData.avatarImage"
                :alt="gameStore.participant.name || 'Avatar'"
                class="w-full h-full object-cover object-top"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs sm:text-sm font-bold text-[#86efac] leading-tight truncate">
                {{ gameStore.participant.name || 'Mahasiswa Baru' }}
              </div>
              <div class="text-[9px] sm:text-[10px] text-[#c4956a] font-sans truncate mt-0.5">
                {{ gameStore.participant.prodi || 'Informatika' }} • Regu {{ gameStore.participant.groupName || 'Genius 03' }}
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="text-[8px] text-[#a08060] font-sans block">Kehadiran:</span>
            <span class="font-pixel text-[10.5px] sm:text-xs text-[#facc15] font-bold">
              {{ attendedCount }} / 6 Sesi
            </span>
          </div>
        </div>

        <!-- Row B: Kakak Buddy Pendamping Info -->
        <div class="flex items-center justify-between gap-2 bg-[#120a05]/70 rounded-lg px-2.5 py-1.5 border border-[#5a3a18]/60">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="w-5 h-5 rounded-md bg-[#0284c7]/20 border border-[#38bdf8] flex items-center justify-center text-[#38bdf8] shrink-0">
              <PhShieldCheck :size="13" weight="fill" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[7.5px] text-[#a08060] font-sans block leading-none">Kakak Buddy Pendamping:</span>
              <span class="text-[10px] sm:text-[11px] font-bold text-white block leading-tight truncate mt-0.5">
                {{ buddyName }}
              </span>
            </div>
          </div>

          <span class="text-[7.5px] font-mono text-[#86efac] px-2 py-0.5 rounded bg-[#22c55e]/15 border border-[#22c55e]/40 shrink-0">
            Dampingi Regu
          </span>
        </div>
      </section>

      <!-- 2. TAB HARI 1 - 3 (Simple Segmented Control) -->
      <section class="grid grid-cols-3 gap-1.5 bg-[#140c06]/90 p-1 rounded-xl border border-[#5a3a18]">
        <button
          v-for="item in DAYS"
          :key="item.day"
          type="button"
          @click="() => {
            safeSound(() => soundEngine.playSelect?.());
            activeDayTab = item.day;
          }"
          :class="[
            'py-1.5 px-1.5 rounded-lg transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95',
            activeDayTab === item.day
              ? 'bg-[#38761d] text-white border border-[#f0d060] font-bold shadow'
              : 'text-[#c4956a] hover:text-[#f0d060]'
          ]"
        >
          <div class="flex items-center gap-1 text-[10px]">
            <span>{{ item.label }}</span>
            <span v-if="gameStore.isDayCheckedIn(item.day)" class="w-1.5 h-1.5 rounded-full bg-[#86efac]" />
          </div>
          <span class="text-[7.5px] opacity-80 font-sans">{{ item.date }} • {{ item.subtitle }}</span>
        </button>
      </section>

      <!-- 3. LIST SESI PRESENSI (Full Title Visibility, No Truncation) -->
      <section class="space-y-2">
        <div
          v-for="session in ALL_SESSIONS.filter((s) => s.day === activeDayTab)"
          :key="session.id"
          :class="[
            'border rounded-xl p-2.5 sm:p-3 transition-all flex items-start gap-2.5 text-left backdrop-blur-md',
            getSessionStatus(session).state === 'verified'
              ? 'bg-[#142312]/95 border-[#22c55e]'
              : getSessionStatus(session).state === 'in_progress'
              ? 'bg-[#26190e]/95 border-[#f59e0b]'
              : 'bg-[#18100a]/85 border-[#4a301a] opacity-80'
          ]"
        >
          <!-- Status Icon -->
          <div
            :class="[
              'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
              getSessionStatus(session).state === 'verified'
                ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#4ade80]'
                : getSessionStatus(session).state === 'in_progress'
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#facc15]'
                : 'bg-[#1a110a] border-[#5a3a18] text-[#8a6b52]'
            ]"
          >
            <PhCheckCircle v-if="getSessionStatus(session).state === 'verified'" :size="18" weight="fill" />
            <PhHourglass v-else-if="getSessionStatus(session).state === 'in_progress'" :size="17" weight="bold" class="animate-pulse" />
            <PhLockKey v-else :size="16" weight="bold" />
          </div>

          <!-- Session Details (2-Row Design for Zero Truncation) -->
          <div class="min-w-0 flex-1">
            <!-- Row 1: Title & Reward XP -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] sm:text-xs font-bold text-white leading-tight">
                {{ session.title }}
              </span>
              <span class="text-[10px] sm:text-[11px] font-pixel text-[#facc15] font-bold shrink-0">
                +{{ session.xpReward }} XP
              </span>
            </div>

            <!-- Row 2: Time Schedule & Status Badge -->
            <div class="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
              <span class="text-[9px] text-[#a08060] font-sans flex items-center gap-1">
                <PhClock :size="11" class="text-[#facc15]" />
                <span>{{ session.timeRange }}</span>
                <span v-if="getSessionStatus(session).time" class="text-[#86efac] font-mono">
                  • Hadir: {{ formatTime(getSessionStatus(session).time) }}
                </span>
              </span>

              <span
                :class="[
                  'text-[7.5px] sm:text-[8px] font-mono px-2 py-0.5 rounded border uppercase font-bold shrink-0',
                  getSessionStatus(session).state === 'verified'
                    ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#86efac]'
                    : getSessionStatus(session).state === 'in_progress'
                    ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#facc15]'
                    : 'bg-black/40 border-[#5a3a18] text-[#8a6b52]'
                ]"
              >
                {{ getSessionStatus(session).label }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. REFLEKSI HARIAN (Simple & Minimalis) -->
      <section class="border border-[#8b6f4e] bg-[#19110a]/95 backdrop-blur-md rounded-xl p-3 shadow-lg space-y-2 text-left">
        <div class="flex items-center justify-between border-b border-[#4d3319] pb-1.5">
          <span class="text-[11px] sm:text-xs text-[#facc15] font-bold flex items-center gap-1.5">
            <PhStar :size="13" weight="fill" />
            <span>Refleksi Hari ke-{{ activeDayTab }}</span>
          </span>
          <span class="text-[8px] text-[#a08060] font-sans">Klaim bonus +25 XP</span>
        </div>

        <!-- Jika Refleksi Sudah Dikirim -->
        <div v-if="isReflectionDone" class="bg-[#142312] border border-[#22c55e]/50 rounded-lg p-2 font-mono text-[10px] text-[#86efac]">
          <div class="flex items-center justify-between font-bold">
            <span class="flex items-center gap-1">
              <PhCheckCircle :size="13" weight="fill" />
              <span>Tersimpan (+25 XP)</span>
            </span>
            <span class="text-[8px] text-[#a0d870] font-sans">Terima kasih!</span>
          </div>
          <p class="text-[9.5px] text-[#d4b08c] italic font-sans mt-1">
            "{{ currentDayRecord?.reflection?.essayInsight || 'Refleksi telah tersimpan.' }}"
          </p>
        </div>

        <!-- Form Refleksi Ringkas -->
        <form v-else @submit.prevent="submitReflection" class="space-y-2 text-xs">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[9.5px] text-[#c4956a] font-sans">Rating bimbingan &amp; kegiatan:</span>
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="rating = star"
                class="cursor-pointer hover:scale-110 transition-transform"
                :title="`${star} Bintang`"
              >
                <PhStar
                  :size="15"
                  :weight="star <= rating ? 'fill' : 'regular'"
                  :class="star <= rating ? 'text-[#facc15]' : 'text-gray-600'"
                />
              </button>
            </div>
          </div>

          <textarea
            v-model="essayInsight"
            rows="2"
            required
            placeholder="Tuliskan kesan atau pesan singkat Anda hari ini..."
            class="w-full p-2 bg-[#120a05] border border-[#523e2b] focus:border-[#facc15] rounded-lg text-xs text-[#f0e0c0] placeholder-[#785435] focus:outline-none font-sans"
          />

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-1.5 px-3 bg-[#b45309] hover:bg-[#d97706] border border-[#fef08a] rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow"
          >
            <PhSparkle :size="13" weight="fill" class="text-[#facc15]" />
            <span>Kirim Refleksi (+25 XP)</span>
          </button>
        </form>
      </section>

      <!-- 5. FOOTER NAVIGASI SEDERHANA (With Pill Backdrop to prevent signpost overlap) -->
      <footer class="flex items-center justify-center pt-1 pb-2">
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
            to="/paspor"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#facc15] flex items-center gap-1 transition-colors"
          >
            <PhIdentificationBadge :size="12" />
            <span>PROFIL & STEMPEL</span>
          </RouterLink>
          <span>•</span>
          <RouterLink
            to="/profile"
            @click="() => safeSound(() => soundEngine.playClick?.())"
            class="hover:text-[#86efac] flex items-center gap-1 transition-colors"
          >
            <PhUser :size="12" />
            <span>KTM & AKUN</span>
          </RouterLink>
        </div>
      </footer>

    </main>
  </div>
</template>
