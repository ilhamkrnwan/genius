<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  PhCalendarCheck,
  PhQrCode,
  PhClock,
  PhCheckCircle,
  PhStar,
  PhChatTeardropDots,
  PhDoorOpen,
  PhWarning,
  PhArrowLeft,
  PhSparkle,
  PhShieldCheck,
  PhHouse,
  PhArrowsClockwise,
  PhHourglass,
  PhListChecks,
} from '@phosphor-icons/vue';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/store/gameStore';
import QrScannerModal from '@/components/common/QrScannerModal.vue';
import { soundEngine } from '@/lib/sound';
import { api } from '@/lib/api';

interface AttendanceSession {
  id: string;
  title: string;
  description?: string | null;
  type: 'CHECK_IN' | 'CHECK_OUT';
  isActive: boolean;
  qrToken?: string;
  xpReward: number;
  allowLate: boolean;
  lateTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface AttendedLog {
  sessionId: string;
  sessionTitle: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  status: 'ON_TIME' | 'LATE';
  xpAwarded: number;
  qrToken: string;
}

const gameStore = useGameStore();

const activeSession = ref<AttendanceSession | null>(null);
const isLoadingSession = ref(true);
const isScannerOpen = ref(false);
const isSubmittingScan = ref(false);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// Riwayat presensi tersimpan lokal per mahasiswa
const attendedLogs = ref<AttendedLog[]>([]);

// Form Refleksi
const isReflectionCardOpen = ref(false);
const ratingFasilitas = ref(5);
const ratingMateri = ref(5);
const ratingBuddy = ref(5);
const essayInsight = ref('');
const isReflectionDone = ref(false);

const ATTENDANCE_LOGS_STORAGE_KEY = computed(() => 
  `genius_attendance_logs_${gameStore.participant.id || gameStore.participant.nim || 'guest'}`
);

const isCurrentSessionAttended = computed(() => {
  if (!activeSession.value) return false;
  return attendedLogs.value.some(
    (log) => log.sessionId === activeSession.value?.id || log.sessionTitle === activeSession.value?.title
  );
});

const currentSessionLog = computed(() => {
  if (!activeSession.value) return null;
  return attendedLogs.value.find(
    (log) => log.sessionId === activeSession.value?.id || log.sessionTitle === activeSession.value?.title
  ) || null;
});

const showNotification = (type: 'success' | 'error', message: string) => {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 5000);
};

const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#facc15'],
    });
  } catch {
    // Ignore canvas-confetti error
  }
};

const loadSavedLogs = () => {
  try {
    const raw = localStorage.getItem(ATTENDANCE_LOGS_STORAGE_KEY.value);
    if (raw) {
      attendedLogs.value = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Gagal memuat log presensi lokal:', err);
  }
};

const saveLogs = () => {
  try {
    localStorage.setItem(ATTENDANCE_LOGS_STORAGE_KEY.value, JSON.stringify(attendedLogs.value));
  } catch (err) {
    console.warn('Gagal menyimpan log presensi lokal:', err);
  }
};

const fetchActiveSession = async () => {
  isLoadingSession.value = true;
  try {
    const res = await api.getActiveAttendanceSession();
    if (res.success && res.data) {
      activeSession.value = res.data;
    } else {
      activeSession.value = null;
    }
  } catch (err) {
    console.warn('Catatan: Tidak dapat menghubungi server untuk sesi aktif:', err);
    // Fallback default sesi jika offline
    activeSession.value = {
      id: 'default-active-session',
      title: 'Presensi Masuk Pagi',
      description: 'Pindai QR Standing Banner di Gerbang Utama Lantai 1',
      type: 'CHECK_IN',
      isActive: true,
      xpReward: 100,
      allowLate: true,
      lateTime: '07:30',
      startTime: '07:00',
      endTime: '08:30',
    };
  } finally {
    isLoadingSession.value = false;
  }
};

const openScanner = () => {
  if (gameStore.soundEnabled) soundEngine.playClick();
  isScannerOpen.value = true;
};

const handleTokenScanned = async (token: string) => {
  if (!token) return;
  isSubmittingScan.value = true;

  const targetParticipantId = gameStore.participant.id || gameStore.participant.nim;

  try {
    const res = await api.scanAttendance(token, targetParticipantId);

    if (res.success) {
      const awarded = res.data?.xpAwarded || activeSession.value?.xpReward || (activeSession.value?.type === 'CHECK_OUT' ? 50 : 100);
      const checkInStatus = res.data?.checkInStatus || 'ON_TIME';

      // Update skor peserta
      gameStore.participant.totalXp += awarded;
      gameStore.saveToStorage();

      // Catat ke log presensi lokal
      const newLog: AttendedLog = {
        sessionId: activeSession.value?.id || 'session-scan',
        sessionTitle: activeSession.value?.title || (activeSession.value?.type === 'CHECK_OUT' ? 'Presensi Kepulangan' : 'Presensi Kedatangan'),
        type: activeSession.value?.type || 'CHECK_IN',
        timestamp: new Date().toISOString(),
        status: checkInStatus,
        xpAwarded: awarded,
        qrToken: token,
      };

      attendedLogs.value.unshift(newLog);
      saveLogs();

      if (gameStore.soundEnabled) soundEngine.playCorrect();
      triggerConfetti();
      showNotification('success', res.message || `Presensi berhasil dicatat! (+${awarded} XP)`);
    } else {
      const errMsg = res.error?.message || 'Token QR tidak cocok atau sesi telah berakhir.';
      showNotification('error', errMsg);
      if (gameStore.soundEnabled) soundEngine.playWrong();
    }
  } catch (err: any) {
    const message = err?.message || 'Gagal menghubungi server presensi. Pastikan perangkat terhubung ke internet.';
    showNotification('error', message);
    if (gameStore.soundEnabled) soundEngine.playWrong();
  } finally {
    isSubmittingScan.value = false;
  }
};

const handleSubmitReflection = () => {
  if (!essayInsight.value.trim()) {
    showNotification('error', 'Mohon tuliskan pesan atau insight singkat Anda.');
    return;
  }

  const xpEarned = 25;
  gameStore.participant.totalXp += xpEarned;
  gameStore.saveToStorage();
  isReflectionDone.value = true;

  if (gameStore.soundEnabled) soundEngine.playCorrect();
  triggerConfetti();
  showNotification('success', `Kuesioner refleksi berhasil terkirim! (+${xpEarned} XP)`);

  // Sync to API
  api.submitReflection({
    day: 1,
    ratingFasilitas: ratingFasilitas.value,
    ratingMateri: ratingMateri.value,
    ratingBuddy: ratingBuddy.value,
    essayInsight: essayInsight.value.trim(),
    participantId: gameStore.participant.id || undefined,
  }).catch((err) => {
    console.warn('Catatan refleksi sync:', err);
  });
};

const formatTime = (isoString?: string | null) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  } catch {
    return isoString;
  }
};

const formatDate = (isoString?: string | null) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return isoString;
  }
};

onMounted(() => {
  loadSavedLogs();
  fetchActiveSession();
});
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-[#1f140c] text-[#f0e0c0] selection:bg-[#7ec850] selection:text-[#1b120a] pb-14 select-none">
    <!-- Top Navigation Bar Header -->
    <header class="sticky top-0 z-30 w-full bg-[#170e08]/95 border-b-2 border-[#5a3a18] backdrop-blur px-3 sm:px-6 py-2 flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <RouterLink
          to="/"
          class="h-8 px-2.5 bg-[#2d1b0e] border border-[#784d24] rounded text-xs font-pixel text-[#f0d060] hover:border-[#f0d060] flex items-center gap-1.5 transition-all active:scale-95"
        >
          <PhArrowLeft :size="14" weight="bold" />
          <span class="hidden sm:inline">BERANDA</span>
        </RouterLink>

        <div class="flex flex-col">
          <h1 class="font-pixel text-xs sm:text-sm text-[#f0d060] leading-none flex items-center gap-1.5">
            <PhCalendarCheck :size="16" weight="fill" class="text-[#facc15]" />
            <span>PRESENSI KEGIATAN</span>
          </h1>
          <span class="font-mono text-[9px] text-[#a08060] mt-0.5">SISTEM PRESENSI SESI PKKMB UNU 2026</span>
        </div>
      </div>

      <!-- Quick Total XP Badge & Refresh -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="fetchActiveSession"
          title="Segarkan Sesi Presensi"
          class="p-1.5 bg-[#2d1b0e] hover:bg-[#3d2413] border border-[#784d24] rounded text-[#d4b08c] hover:text-[#facc15] transition-all cursor-pointer"
        >
          <PhArrowsClockwise :size="15" :class="{ 'animate-spin': isLoadingSession }" />
        </button>

        <div class="bg-[#2d1b0e] border border-[#d97706] px-2.5 py-1 rounded flex items-center gap-1.5 shadow-sm">
          <PhSparkle :size="14" weight="fill" class="text-[#facc15]" />
          <span class="font-pixel text-[10px] sm:text-xs text-[#facc15]">+{{ gameStore.participant.totalXp }} XP</span>
        </div>
      </div>
    </header>

    <!-- Global Floating Notification Alert -->
    <div
      v-if="notification"
      :class="[
        'fixed top-14 inset-x-3 sm:inset-x-auto sm:right-6 z-50 p-3 rounded-lg border-2 shadow-2xl font-mono text-xs flex items-center gap-2 max-w-md animate-in slide-in-from-top-2 duration-200',
        notification.type === 'success'
          ? 'bg-[#142612] border-[#22c55e] text-[#86efac]'
          : 'bg-[#2a1010] border-[#ef4444] text-[#fca5a5]'
      ]"
    >
      <PhCheckCircle v-if="notification.type === 'success'" :size="18" weight="bold" class="shrink-0" />
      <PhWarning v-else :size="18" weight="bold" class="shrink-0" />
      <span class="leading-tight">{{ notification.message }}</span>
    </div>

    <!-- Main Content Container -->
    <main class="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4 flex-1">

      <!-- ================= 1. ACTIVE SESSION HERO CARD ================= -->
      <section class="space-y-2">
        <div class="flex items-center justify-between">
          <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
            <span>STATUS GERBANG SAAT INI</span>
          </h2>

          <span
            v-if="activeSession"
            :class="[
              'font-pixel text-[9px] px-2 py-0.5 rounded border uppercase',
              activeSession.type === 'CHECK_IN'
                ? 'bg-[#142612] border-[#22c55e] text-[#4ade80]'
                : 'bg-[#082f49] border-[#0284c7] text-[#38bdf8]'
            ]"
          >
            {{ activeSession.type === 'CHECK_IN' ? 'SESI KEDATANGAN' : 'SESI KEPULANGAN' }}
          </span>
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoadingSession"
          class="p-6 bg-[#24160c] border-2 border-[#523e2b] rounded-xl flex items-center justify-center gap-3 text-[#d4b08c] font-mono text-xs"
        >
          <PhArrowsClockwise :size="20" class="animate-spin text-[#facc15]" />
          <span>Menghubungkan ke Gerbang Presensi Kampus...</span>
        </div>

        <!-- Sesi Aktif Ditemukan -->
        <div
          v-else-if="activeSession"
          :class="[
            'border-2 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all',
            activeSession.type === 'CHECK_IN'
              ? 'bg-gradient-to-b from-[#24180e] to-[#1c1208] border-[#f59e0b]'
              : 'bg-gradient-to-b from-[#141e26] to-[#0c141a] border-[#0284c7]'
          ]"
        >
          <!-- Top glowing strip -->
          <div
            :class="[
              'absolute top-0 left-0 right-0 h-1',
              activeSession.type === 'CHECK_IN' ? 'bg-[#f59e0b]' : 'bg-[#38bdf8]'
            ]"
          />

          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 shadow-md',
                  activeSession.type === 'CHECK_IN'
                    ? 'bg-[#ca8a04]/20 border-[#f59e0b] text-[#facc15]'
                    : 'bg-[#0284c7]/20 border-[#38bdf8] text-[#38bdf8]'
                ]"
              >
                <PhDoorOpen v-if="activeSession.type === 'CHECK_IN'" :size="24" weight="bold" />
                <PhHouse v-else :size="24" weight="bold" />
              </div>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-pixel text-sm sm:text-base text-[#f0e0c0] font-bold">
                    {{ activeSession.title }}
                  </h3>
                  <span
                    :class="[
                      'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                      isCurrentSessionAttended
                        ? 'bg-[#142612] border-[#22c55e] text-[#86efac]'
                        : 'bg-[#ca8a04]/20 border-[#ca8a04] text-[#facc15]'
                    ]"
                  >
                    {{ isCurrentSessionAttended ? 'SUDAH TERVERIFIKASI' : 'GERBANG TERBUKA' }}
                  </span>
                </div>

                <p class="font-sans text-xs text-[#c4956a] mt-1">
                  {{ activeSession.description || 'Pindai kode QR dinamis yang ditampilkan panitia di layar proyektor gerbang.' }}
                </p>

                <!-- Session Meta HUD -->
                <div class="flex items-center gap-3 font-mono text-[10px] sm:text-xs text-[#a08060] mt-2 flex-wrap">
                  <div class="flex items-center gap-1">
                    <PhClock :size="13" class="text-[#facc15]" />
                    <span>Waktu: {{ activeSession.startTime || '-' }} s/d {{ activeSession.endTime || 'Selesai' }}</span>
                  </div>

                  <span v-if="activeSession.allowLate && activeSession.lateTime" class="text-[#fca5a5]">
                    • Batas Tepat Waktu: s/d {{ activeSession.lateTime }} WIB
                  </span>
                </div>
              </div>
            </div>

            <!-- Reward XP Badge -->
            <div
              :class="[
                'px-3 py-1.5 rounded-lg border text-center shrink-0 self-start sm:self-auto shadow',
                activeSession.type === 'CHECK_IN'
                  ? 'bg-[#ca8a04]/15 border-[#f59e0b] text-[#facc15]'
                  : 'bg-[#0284c7]/15 border-[#38bdf8] text-[#38bdf8]'
              ]"
            >
              <span class="font-mono text-[9px] block text-white/70">REWARD SESI</span>
              <span class="font-pixel text-xs sm:text-sm font-bold">+{{ activeSession.xpReward }} XP</span>
            </div>
          </div>

          <!-- Bottom Action or Completed Verification Card -->
          <div class="mt-4 pt-4 border-t border-[#3d2413]">
            <!-- Jika Sudah Presensi di Sesi Ini -->
            <div
              v-if="isCurrentSessionAttended"
              class="bg-[#142612]/80 border border-[#22c55e] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-1 font-mono text-xs">
                <div class="flex items-center gap-1.5 text-[#86efac] font-bold">
                  <PhShieldCheck :size="18" weight="fill" />
                  <span>PRESENSI ANDA TELAH TERCATAT!</span>
                </div>
                <p class="text-[#bbf7d0] text-[11px]">
                  Waktu Pemindaian: <strong>{{ formatTime(currentSessionLog?.timestamp) }}</strong>
                  <span v-if="currentSessionLog?.status === 'ON_TIME'" class="ml-2 text-[#4ade80] font-bold">(Tepat Waktu)</span>
                  <span v-else-if="currentSessionLog?.status === 'LATE'" class="ml-2 text-[#f87171] font-bold">(Terlambat)</span>
                </p>
                <p class="text-[10px] text-[#86efac]/70">
                  Poin XP telah otomatis ditambahkan ke akun dan peringkat leaderboard kelompok Anda.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="openScanner"
                  class="px-2.5 py-1.5 bg-[#2d1b0e] hover:bg-[#3d2413] border border-[#784d24] rounded font-pixel text-[10px] text-[#f0d060] cursor-pointer"
                  title="Pindai ulang jika diperlukan"
                >
                  SCAN ULANG
                </button>
              </div>
            </div>

            <!-- Jika Belum Presensi -->
            <div v-else class="space-y-2">
              <button
                type="button"
                @click="openScanner"
                :disabled="isSubmittingScan"
                :class="[
                  'w-full py-3.5 px-4 rounded-lg font-pixel text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-xl cursor-pointer active:scale-98 transition-all',
                  activeSession.type === 'CHECK_IN'
                    ? 'bg-gradient-to-r from-[#2e7d32] to-[#1b5e20] hover:from-[#388e3c] hover:to-[#2e7d32] border-2 border-[#4ade80] text-white shadow-[#166534]/40'
                    : 'bg-gradient-to-r from-[#0284c7] to-[#075985] hover:from-[#0369a1] hover:to-[#0284c7] border-2 border-[#38bdf8] text-white shadow-[#0284c7]/40'
                ]"
              >
                <PhQrCode :size="22" weight="bold" />
                <span>
                  {{ activeSession.type === 'CHECK_IN' ? 'PINDAI QR GERBANG KEDATANGAN' : 'PINDAI QR GERBANG KEPULANGAN' }}
                  (+{{ activeSession.xpReward }} XP)
                </span>
              </button>

              <p class="font-mono text-[10px] text-center text-[#a08060]">
                Arahkan kamera ke layar proyektor panitia di gerbang utama untuk memverifikasi kehadiran.
              </p>
            </div>
          </div>
        </div>

        <!-- Tidak Ada Sesi Aktif -->
        <div
          v-else
          class="p-6 bg-[#1a1008] border-2 border-[#4a301a] rounded-xl text-center space-y-3 shadow-md"
        >
          <div class="w-12 h-12 rounded-full bg-[#ca8a04]/10 border border-[#ca8a04]/40 mx-auto flex items-center justify-center text-[#facc15]">
            <PhHourglass :size="24" weight="bold" />
          </div>
          <div>
            <h3 class="font-pixel text-xs sm:text-sm text-[#facc15]">
              BELUM ADA SESI PRESENSI AKTIF
            </h3>
            <p class="font-sans text-xs text-[#c4956a] max-w-md mx-auto mt-1">
              Panitia belum membuka gerbang presensi QR saat ini. Tunggu arahan panitia di gerbang atau proyektor utama.
            </p>
          </div>

          <button
            type="button"
            @click="fetchActiveSession"
            class="py-2 px-4 bg-[#2d1b0e] hover:bg-[#3d2413] border border-[#784d24] rounded font-pixel text-xs text-[#f0d060] inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <PhArrowsClockwise :size="14" />
            <span>CEK ULANG STATUS GERBANG</span>
          </button>
        </div>
      </section>

      <!-- ================= 2. KUESIONER REFLEKSI HARIAN ================= -->
      <section class="border-2 border-[#523e2b] bg-[#24160c] rounded-xl p-4 sm:p-5 shadow space-y-3">
        <div class="flex items-center justify-between border-b border-[#4a301a] pb-3">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-lg bg-[#ca8a04]/20 border border-[#f59e0b] flex items-center justify-center text-[#facc15]">
              <PhChatTeardropDots :size="20" weight="bold" />
            </div>
            <div>
              <h3 class="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
                KUESIONER REFLEKSI & MASUKAN
              </h3>
              <p class="font-sans text-[11px] text-[#c4956a]">
                Beri masukan fasilitas dan bagikan insight pembelajaran Anda (+25 XP)
              </p>
            </div>
          </div>

          <span
            :class="[
              'font-pixel text-[9px] px-2 py-0.5 rounded border uppercase shrink-0',
              isReflectionDone
                ? 'bg-[#142612] border-[#22c55e] text-[#86efac]'
                : 'bg-[#2a1b10] border-[#8b6f4e] text-[#d4b08c]'
            ]"
          >
            {{ isReflectionDone ? 'TERKIRIM' : 'BELUM MENGISI' }}
          </span>
        </div>

        <!-- Already Submitted -->
        <div v-if="isReflectionDone" class="bg-[#1e140b] border border-[#ca8a04]/50 rounded-lg p-3 font-mono text-xs space-y-1.5">
          <div class="flex items-center justify-between text-[#facc15]">
            <div class="flex items-center gap-1.5 font-bold">
              <PhCheckCircle :size="16" weight="bold" />
              <span>REFLEKSI ANDA TELAH TERSIMPAN</span>
            </div>
            <span class="font-pixel text-[10px] text-[#86efac]">+25 XP DITERIMA</span>
          </div>
          <p class="text-[11px] text-[#d4b08c] italic">
            "{{ essayInsight || 'Terima kasih atas kontribusi refleksi Anda!' }}"
          </p>
        </div>

        <!-- Reflection Form -->
        <form v-else @submit.prevent="handleSubmitReflection" class="space-y-3 font-mono text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <!-- Rating Fasilitas -->
            <div class="bg-[#1c1109] border border-[#523e2b] p-2 rounded space-y-1">
              <label class="font-pixel text-[9px] text-[#facc15] block">Fasilitas Kampus (1-5)</label>
              <div class="flex items-center gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="ratingFasilitas = star"
                  class="cursor-pointer text-base hover:scale-110 transition-transform"
                >
                  <PhStar :size="16" :weight="star <= ratingFasilitas ? 'fill' : 'regular'" :class="star <= ratingFasilitas ? 'text-[#facc15]' : 'text-gray-500'" />
                </button>
              </div>
            </div>

            <!-- Rating Materi -->
            <div class="bg-[#1c1109] border border-[#523e2b] p-2 rounded space-y-1">
              <label class="font-pixel text-[9px] text-[#facc15] block">Materi & Nilai (1-5)</label>
              <div class="flex items-center gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="ratingMateri = star"
                  class="cursor-pointer text-base hover:scale-110 transition-transform"
                >
                  <PhStar :size="16" :weight="star <= ratingMateri ? 'fill' : 'regular'" :class="star <= ratingMateri ? 'text-[#facc15]' : 'text-gray-500'" />
                </button>
              </div>
            </div>

            <!-- Rating Buddy -->
            <div class="bg-[#1c1109] border border-[#523e2b] p-2 rounded space-y-1">
              <label class="font-pixel text-[9px] text-[#facc15] block">Peran Buddy (1-5)</label>
              <div class="flex items-center gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="ratingBuddy = star"
                  class="cursor-pointer text-base hover:scale-110 transition-transform"
                >
                  <PhStar :size="16" :weight="star <= ratingBuddy ? 'fill' : 'regular'" :class="star <= ratingBuddy ? 'text-[#facc15]' : 'text-gray-500'" />
                </button>
              </div>
            </div>
          </div>

          <!-- Kolom Esai Singkat -->
          <div class="space-y-1">
            <label class="text-[11px] text-[#d4b08c] block">
              Apa inspirasi atau pelajaran terbaik yang Anda peroleh hari ini? *
            </label>
            <textarea
              v-model="essayInsight"
              rows="2"
              required
              placeholder="Tuliskan pengalaman berkesan, pemahaman baru, atau komitmen Anda di kampus..."
              class="w-full p-2 bg-[#170e07] border border-[#523e2b] rounded text-xs text-[#f0e0c0] placeholder-[#785435] focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <button
            type="submit"
            class="w-full py-2 px-4 bg-[#b45309] hover:bg-[#d97706] border border-[#f59e0b] rounded font-pixel text-xs text-white font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all active:scale-98"
          >
            <PhSparkle :size="16" weight="fill" class="text-[#facc15]" />
            <span>KIRIM REFLEKSI & DAPATKAN (+25 XP)</span>
          </button>
        </form>
      </section>

      <!-- ================= 3. RIWAYAT PRESENSI MAHASISWA ================= -->
      <section class="border-2 border-[#523e2b] bg-[#24160c] rounded-xl p-4 sm:p-5 shadow space-y-3">
        <div class="flex items-center justify-between border-b border-[#4a301a] pb-2.5">
          <h3 class="font-pixel text-xs sm:text-sm text-[#facc15] flex items-center gap-2">
            <PhListChecks :size="18" weight="bold" />
            <span>RIWAYAT PRESENSI ANDA</span>
          </h3>

          <span class="font-mono text-[10px] text-[#a08060]">
            {{ attendedLogs.length }} Sesi Tercatat
          </span>
        </div>

        <div v-if="attendedLogs.length > 0" class="space-y-2">
          <div
            v-for="(log, idx) in attendedLogs"
            :key="idx"
            class="bg-[#1a1008] border border-[#4a301a] p-3 rounded-lg flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2.5">
              <div
                :class="[
                  'w-8 h-8 rounded border flex items-center justify-center shrink-0',
                  log.type === 'CHECK_IN'
                    ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#4ade80]'
                    : 'bg-[#0284c7]/15 border-[#38bdf8] text-[#38bdf8]'
                ]"
              >
                <PhDoorOpen v-if="log.type === 'CHECK_IN'" :size="16" weight="bold" />
                <PhHouse v-else :size="16" weight="bold" />
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-pixel text-xs text-[#f0e0c0] font-bold">
                    {{ log.sessionTitle }}
                  </span>
                  <span
                    :class="[
                      'font-mono text-[8px] px-1 py-0.2 rounded border',
                      log.status === 'ON_TIME'
                        ? 'bg-[#142612] border-[#22c55e] text-[#86efac]'
                        : 'bg-[#2a1010] border-[#ef4444] text-[#fca5a5]'
                    ]"
                  >
                    {{ log.status === 'ON_TIME' ? 'TEPAT WAKTU' : 'TERLAMBAT' }}
                  </span>
                </div>
                <p class="font-mono text-[10px] text-[#a08060]">
                  {{ formatDate(log.timestamp) }} • {{ formatTime(log.timestamp) }}
                </p>
              </div>
            </div>

            <div class="px-2 py-1 bg-[#ca8a04]/15 border border-[#ca8a04] rounded font-pixel text-[10px] text-[#facc15] shrink-0">
              +{{ log.xpAwarded }} XP
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6 text-xs text-[#a08060] font-mono">
          Belum ada riwayat presensi yang tercatat. Silakan lakukan scan pada gerbang aktif.
        </div>
      </section>

    </main>

    <!-- Universal Reusable QR Scanner Modal -->
    <QrScannerModal
      v-model="isScannerOpen"
      :title="activeSession?.type === 'CHECK_OUT' ? 'SCAN GERBANG KEPULANGAN' : 'SCAN GERBANG MASUK'"
      :subtitle="activeSession?.title || 'Arahkan kamera ke QR Gerbang Resmi Panitia'"
      :preset-tokens="[]"
      @scan="handleTokenScanned"
    />
  </div>
</template>
