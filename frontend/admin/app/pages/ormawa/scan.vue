<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono text-[#f0e0c0]">
    <!-- Topbar Actions -->
    <TopbarActions>
      <NuxtLink
        :to="isOrmawaPic ? '/ormawa/portal' : '/ormawa'"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#271d15] text-[#facc15] border-[#ca8a04] flex items-center gap-1.5 hover:bg-[#3d2d1e] cursor-pointer"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        <span class="hidden sm:inline font-pixel">{{ isOrmawaPic ? 'KEMBALI KE PORTAL STAN' : 'MANAJEMEN STAN' }}</span>
      </NuxtLink>
    </TopbarActions>

    <!-- Header -->
    <div class="px-4 md:px-6 pt-4 pb-3 border-b border-[#4a3624]/60 bg-[#15100c]/85 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
          <QrCode class="h-4 w-4 text-[#c084fc]" />
          SCANNER VALIDASI KUNJUNGAN MABA — ORMAWA EXPO
        </h1>
        <p class="text-[11px] text-gray-400 mt-0.5 font-sans">
          Scan QR Code profil mahasiswa baru untuk mencatat kehadiran stan &amp; memberikan reward +75 XP secara real-time.
        </p>
      </div>

      <!-- Badge Role Active -->
      <span
        :class="[
          'px-2.5 py-1 rounded text-[9px] font-pixel border uppercase tracking-wider',
          isAdmin
            ? 'bg-[#3b1212] border-red-500 text-red-300'
            : 'bg-[#2b173d] border-[#c084fc] text-[#d8b4fe]'
        ]"
      >
        {{ isAdmin ? 'SUPER ADMIN MODE' : 'PIC STAN ORMAWA' }}
      </span>
    </div>

    <!-- Main Content -->
    <div class="p-4 md:p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- ═══════════════════════════════ -->
        <!-- PANEL KIRI: Scanner Area       -->
        <!-- ═══════════════════════════════ -->
        <div class="space-y-4">

          <!-- Stan Aktif PIC / Admin Switcher -->
          <div class="pixel-card p-4 border border-[#523e2b] bg-[#1a140f]/90 backdrop-blur-sm space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Store class="h-4 w-4 text-[#c084fc]" />
                <span class="font-pixel text-[10px] text-[#c084fc] uppercase">
                  {{ isAdmin ? 'PILIH STAN (MODE ADMIN)' : 'STAN AKTIF ANDA' }}
                </span>
              </div>
              <span v-if="activeBooth" class="text-[9px] bg-[#14532d] text-[#86efac] border border-[#22c55e] px-1.5 py-0.5 rounded font-pixel">
                Lantai {{ activeBooth.floorNumber || 6 }}
              </span>
            </div>

            <!-- Admin Booth Switcher Dropdown -->
            <div v-if="isAdmin && allBooths.length > 0" class="space-y-1">
              <label class="text-[9px] text-[#a08060] uppercase block">Ganti Stan yang Divalidasi:</label>
              <select
                :value="activeBooth?.id"
                @change="(e: any) => selectBooth(e.target.value)"
                class="w-full bg-[#120d08] border border-[#ca8a04]/60 rounded-lg px-2.5 py-1.5 text-xs text-[#fef08a] font-mono outline-none focus:border-[#facc15]"
              >
                <option v-for="b in allBooths" :key="b.id" :value="b.id">
                  {{ b.name }} ({{ b.category }} · Lt {{ b.floorNumber }})
                </option>
              </select>
            </div>

            <!-- Booth Identity Banner -->
            <div class="bg-[#120d08]/90 border border-[#ca8a04]/40 rounded-lg p-3 text-center">
              <p class="font-pixel text-[#fef08a] text-sm font-bold leading-tight">
                {{ activeBooth?.name || 'Memuat data stan...' }}
              </p>
              <p class="text-[10px] text-amber-300/70 font-mono mt-1" v-if="activeBooth">
                {{ activeBooth.category }} &bull; Reward: <strong class="text-[#86efac]">+{{ activeBooth.xpReward || 75 }} XP</strong>
              </p>
              <p class="text-[10px] text-red-400/70 font-mono mt-1" v-else>
                ⚠ Belum ada stan terhubung. Silakan pilih stan di atas atau hubungi Admin.
              </p>
            </div>
          </div>

          <!-- Scanner Viewfinder Card -->
          <div class="pixel-card p-4 border border-[#523e2b] bg-[#1a140f]/90 backdrop-blur-sm space-y-3.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <QrCode class="h-4 w-4 text-[#facc15]" />
                <span class="font-pixel text-[10px] text-[#facc15] uppercase">Kamera Scanner QR Maba</span>
              </div>
              <span
                :class="[
                  'h-2 w-2 rounded-full',
                  isScannerActive ? 'bg-[#22c55e] animate-pulse' : 'bg-gray-600'
                ]"
              />
            </div>

            <!-- Viewfinder Area -->
            <div
              class="relative w-full aspect-square max-w-[320px] mx-auto bg-black border-2 rounded-xl overflow-hidden flex items-center justify-center shadow-2xl transition-colors"
              :class="isScannerActive ? 'border-[#22c55e]' : 'border-dashed border-[#523e2b]'"
            >
              <!-- Live Video Stream -->
              <video
                ref="videoRef"
                autoplay
                muted
                playsinline
                class="w-full h-full object-cover"
                :class="{ 'opacity-0': !isScannerActive }"
              />

              <!-- Overlay HUD saat Kamera Aktif -->
              <template v-if="isScannerActive">
                <!-- Moving Laser Scanline -->
                <div class="scan-line pointer-events-none" />

                <!-- HUD Corner Reticle -->
                <div class="pointer-events-none absolute inset-6 border border-[#22c55e]/25 rounded">
                  <div class="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-2 border-l-2 border-[#22c55e]" />
                  <div class="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-2 border-r-2 border-[#22c55e]" />
                  <div class="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-2 border-l-2 border-[#22c55e]" />
                  <div class="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-2 border-r-2 border-[#22c55e]" />
                </div>

                <!-- Cooldown Indicator Pulse -->
                <div
                  v-if="isCoolingDown"
                  class="absolute inset-0 bg-[#22c55e]/20 flex items-center justify-center z-20 pointer-events-none transition-opacity"
                >
                  <div class="bg-black/80 px-3 py-1.5 rounded-lg border border-[#22c55e] text-[#86efac] font-pixel text-[10px] flex items-center gap-1.5 shadow-xl">
                    <CheckCircle2 class="h-4 w-4 text-[#22c55e]" />
                    <span>SCAN BERHASIL!</span>
                  </div>
                </div>

                <!-- Flip Camera Button Overlay -->
                <button
                  type="button"
                  @click="flipCamera"
                  class="absolute top-2.5 right-2.5 z-30 px-2 py-1 bg-black/70 hover:bg-black/90 text-[#facc15] border border-[#784d24] text-[8.5px] font-pixel rounded flex items-center gap-1 backdrop-blur cursor-pointer active:scale-95 transition-all"
                  title="Ganti Kamera Depan / Belakang"
                >
                  <RefreshCw class="h-3 w-3" />
                  <span>PUTAR</span>
                </button>
              </template>

              <!-- Inactive Placeholder View -->
              <div v-if="!isScannerActive" class="absolute inset-0 p-4 flex flex-col items-center justify-center text-center space-y-2.5 bg-[#0d0a07]">
                <div class="h-14 w-14 rounded-2xl bg-[#1f150c] border border-[#523e2b] flex items-center justify-center text-amber-400/40 shadow-inner">
                  <Camera class="h-7 w-7" />
                </div>
                <div>
                  <p class="text-xs text-amber-200/90 font-pixel">KAMERA BELUM AKTIF</p>
                  <p class="text-[10px] text-gray-400 font-sans mt-0.5 max-w-[220px]">
                    {{ cameraError || 'Klik tombol di bawah untuk menyalakan lensa kamera smartphone / webcam.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Tombol Toggle Kamera -->
            <button
              @click="toggleScanner"
              :disabled="!activeBooth"
              :class="[
                'w-full pixel-btn h-11 font-pixel text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98',
                isScannerActive
                  ? 'bg-[#7f1d1d] border-[#ef4444] text-[#fca5a5] hover:bg-[#991b1b]'
                  : 'bg-[#14532d] border-[#22c55e] text-[#86efac] hover:bg-[#166534] disabled:opacity-40 disabled:cursor-not-allowed'
              ]"
            >
              <component :is="isScannerActive ? XCircle : Camera" class="h-4 w-4" />
              <span>{{ isScannerActive ? 'HENTIKAN KAMERA SCANNER' : 'AKTIFKAN KAMERA SCANNER' }}</span>
            </button>

            <!-- Upload Screenshot / Foto QR Fallback -->
            <div class="pt-0.5">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileUpload"
              />
              <button
                type="button"
                @click="triggerFileUpload"
                :disabled="isProcessing"
                class="w-full py-1.5 px-3 bg-[#1e140c] hover:bg-[#2d1e12] border border-[#523e2b] text-[#facc15] font-pixel text-[9px] rounded flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow disabled:opacity-50"
              >
                <UploadCloud class="h-3.5 w-3.5" />
                <span>UNGGAH FOTO / SCREENSHOT QR MABA</span>
              </button>
            </div>

            <!-- Input NIM Manual -->
            <div class="space-y-1.5 pt-1 border-t border-[#3d2714]">
              <label class="text-[9.5px] font-pixel text-gray-300 uppercase flex items-center justify-between">
                <span>Atau Input NIM / Token Manual:</span>
                <span class="text-[8px] text-gray-500 font-mono">Tekan Enter</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="manualNim"
                  type="text"
                  placeholder="Ketik NIM maba (mis: 26111101)..."
                  class="flex-1 bg-[#0d0a07] border border-[#523e2b] focus:border-[#facc15] rounded px-3 py-2 text-xs text-amber-100 placeholder-amber-200/30 outline-none font-mono"
                  @keydown.enter="submitManualScan"
                />
                <button
                  @click="submitManualScan"
                  :disabled="!manualNim.trim() || isProcessing"
                  class="pixel-btn px-3.5 h-9 bg-[#ca8a04] hover:bg-[#eab308] text-[#140e08] font-pixel text-[9.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Check v-if="!isProcessing" class="h-3.5 w-3.5" />
                  <Loader2 v-else class="h-3.5 w-3.5 animate-spin" />
                  <span class="hidden sm:inline">PROSES</span>
                </button>
              </div>
            </div>

            <!-- Tombol Cepat Uji Coba Demo (Preset NIM Maba) -->
            <div class="space-y-1 pt-1">
              <div class="flex items-center gap-1 text-[8.5px] font-pixel text-[#a08060] uppercase">
                <Zap class="h-3 w-3 text-[#facc15]" />
                <span>Uji Coba Cepat (Klik NIM Maba Demo):</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="nimDemo in demoNims"
                  :key="nimDemo"
                  type="button"
                  @click="quickScan(nimDemo)"
                  :disabled="isProcessing"
                  class="px-2 py-0.5 bg-[#20150d] hover:bg-[#3d2714] border border-[#5a3a18] hover:border-[#facc15] rounded text-[9px] font-mono text-[#fef08a] cursor-pointer active:scale-95 transition-all disabled:opacity-40"
                >
                  {{ nimDemo }}
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- ═══════════════════════════════════ -->
        <!-- PANEL KANAN: Riwayat & Statistik   -->
        <!-- ═══════════════════════════════════ -->
        <div class="space-y-4">

          <!-- Statistik Kunjungan Stan Hari Ini -->
          <div class="grid grid-cols-2 gap-3">
            <div class="pixel-card p-3.5 border border-[#16a34a]/60 bg-[#0d1f10]/85 backdrop-blur-sm space-y-1 text-center shadow-lg">
              <CheckCircle2 class="h-5 w-5 text-[#4ade80] mx-auto" />
              <div class="font-pixel text-2xl text-[#4ade80] font-bold">{{ todayScans.length }}</div>
              <p class="text-[9px] font-mono text-[#4ade80]/80 uppercase font-semibold">Total Maba Hadir</p>
            </div>
            <div class="pixel-card p-3.5 border border-[#ca8a04]/60 bg-[#1e1508]/85 backdrop-blur-sm space-y-1 text-center shadow-lg">
              <Star class="h-5 w-5 text-[#facc15] mx-auto" />
              <div class="font-pixel text-2xl text-[#facc15] font-bold">{{ todayScans.reduce((acc, s) => acc + (s.xpEarned || 0), 0) }}</div>
              <p class="text-[9px] font-mono text-[#facc15]/80 uppercase font-semibold">Total XP Diberikan</p>
            </div>
          </div>

          <!-- Scan Result Toast / Alert Banner -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="-translate-y-2 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="lastScanResult"
              :class="[
                'p-3.5 rounded-xl border-2 text-xs font-mono space-y-1.5 shadow-xl',
                lastScanResult.success
                  ? 'bg-[#0d1f10] border-[#22c55e] text-[#86efac]'
                  : 'bg-[#200d0d] border-[#ef4444] text-[#fca5a5]'
              ]"
            >
              <div class="flex items-center justify-between font-bold">
                <div class="flex items-center gap-2">
                  <CheckCircle2 v-if="lastScanResult.success" class="h-4 w-4 shrink-0 text-[#4ade80]" />
                  <XCircle v-else class="h-4 w-4 shrink-0 text-[#f87171]" />
                  <span class="font-pixel text-[11px]">{{ lastScanResult.success ? 'VALIDASI KUNJUNGAN BERHASIL!' : 'GAGAL MEMVALIDASI' }}</span>
                </div>
                <button
                  type="button"
                  @click="lastScanResult = null"
                  class="text-gray-400 hover:text-white cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
              <p class="font-sans text-[11px] leading-relaxed">{{ lastScanResult.message }}</p>
              <div v-if="lastScanResult.success" class="flex items-center gap-2 pt-1 border-t border-[#22c55e]/30 text-[10.5px]">
                <span class="text-white font-bold">{{ lastScanResult.mabaName }} ({{ lastScanResult.mabaNim }})</span>
                <span class="text-[#facc15] font-pixel ml-auto">+{{ lastScanResult.xpEarned }} XP</span>
              </div>
            </div>
          </Transition>

          <!-- Riwayat Scan Hari Ini -->
          <div class="pixel-card border border-[#523e2b] bg-[#1a140f] overflow-hidden shadow-lg">
            <div class="px-3.5 py-2.5 border-b border-[#3d2613] flex items-center justify-between bg-[#140e09]">
              <span class="font-pixel text-[10px] text-amber-300 uppercase flex items-center gap-1.5">
                <Users class="h-3.5 w-3.5 text-[#facc15]" />
                <span>Riwayat Scan Sesi Ini</span>
              </span>
              <span class="text-[9px] text-[#86efac] font-pixel bg-[#162916] px-2 py-0.5 rounded border border-[#22c55e]/50">
                {{ todayScans.length }} Mahasiswa
              </span>
            </div>

            <div class="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-[#2a1d12]">
              <div v-if="todayScans.length === 0" class="p-8 text-center">
                <Users class="h-8 w-8 text-amber-400/20 mx-auto mb-2" />
                <p class="text-xs text-gray-400 font-pixel">BELUM ADA SCAN</p>
                <p class="text-[10px] text-gray-500 font-sans mt-0.5">
                  Arahkan kamera ke QR Code maba atau input NIM secara manual.
                </p>
              </div>

              <div
                v-for="scan in todayScans"
                :key="scan.id"
                class="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#1f170e] transition-colors"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="h-7 w-7 rounded-full bg-[#162916] border border-[#22c55e] flex items-center justify-center text-[#4ade80] shrink-0">
                    <CheckCircle2 class="h-3.5 w-3.5" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs text-amber-100 font-mono font-bold truncate leading-tight">{{ scan.fullName }}</p>
                    <p class="text-[9.5px] text-gray-400 font-mono mt-0.5">
                      NIM: {{ scan.nim }} &bull; {{ scan.time }}
                    </p>
                  </div>
                </div>
                <span class="text-[9.5px] font-pixel text-[#facc15] shrink-0 bg-[#251b0d] border border-[#ca8a04]/50 px-2 py-0.5 rounded">
                  +{{ scan.xpEarned }} XP
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  QrCode,
  Store,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Star,
  Users,
  Check,
  Loader2,
  Camera,
  RefreshCw,
  UploadCloud,
  Zap,
} from 'lucide-vue-next';
import TopbarActions from '~/components/TopbarActions.vue';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import jsQR from 'jsqr';

const { user, isAdmin, isOrmawaPic } = useAuth();
const api = useApi();

// ─── State ────────────────────────────────────────────────────────────────────
const isScannerActive = ref(false);
const manualNim = ref('');
const isProcessing = ref(false);
const isCoolingDown = ref(false);
const cameraError = ref<string | null>(null);
const currentFacingMode = ref<'environment' | 'user'>('environment');

const videoRef = ref<HTMLVideoElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const cameraStream = ref<MediaStream | null>(null);
let scanInterval: ReturnType<typeof setInterval> | null = null;
const hiddenCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

const activeBooth = ref<{ id: string; name: string; category: string; floorNumber: number; xpReward: number; code?: string } | null>(null);
const allBooths = ref<Array<{ id: string; name: string; category: string; floorNumber: number; code?: string }>>([]);

const lastScanResult = ref<{
  success: boolean;
  message: string;
  xpEarned: number;
  mabaName?: string;
  mabaNim?: string;
} | null>(null);

const lastScannedToken = ref('');

const todayScans = ref<Array<{ id: string; fullName: string; nim: string; time: string; xpEarned: number }>>([]);

// Daftar NIM demo maba untuk pengujian cepat
const demoNims = ['26111101', '26111102', '26111103', '26111104', '26111105'];

// ─── Web Audio API Synth Beep ──────────────────────────────────────────────────
function playBeep(type: 'success' | 'error' = 'success') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio permission restrictions
  }
}

// ─── Lifecycle & Data Loading ─────────────────────────────────────────────────
async function loadBooth(boothId?: string) {
  try {
    const url = boothId ? `/ormawa/my-booth?boothId=${encodeURIComponent(boothId)}` : '/ormawa/my-booth';
    const res = await api.get(url);
    if (res.success && res.data) {
      activeBooth.value = res.data;
      if (res.data.allBooths?.length) {
        allBooths.value = res.data.allBooths;
      }
    }
  } catch (err) {
    console.error('Failed to load active booth', err);
    // Fallback jika admin dan booth belum diset
    if ((user.value as any)?.boothName) {
      activeBooth.value = {
        id: (user.value as any).boothId || '',
        name: (user.value as any).boothName,
        category: (user.value as any).category || 'Organisasi Kampus',
        floorNumber: user.value?.assignedFloor || 6,
        xpReward: 75,
      };
    }
  }
}

function selectBooth(boothId: string) {
  const found = allBooths.value.find((b) => b.id === boothId);
  if (found) {
    activeBooth.value = {
      ...found,
      xpReward: 75,
    };
  }
}

onMounted(async () => {
  await loadBooth();
});

onBeforeUnmount(() => {
  stopCamera();
});

// ─── Camera & QR Scanning Engine ──────────────────────────────────────────────
async function startCamera() {
  cameraError.value = null;

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Browser tidak mendukung akses kamera langsung. Gunakan input NIM manual atau upload gambar.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });

    cameraStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.setAttribute('playsinline', 'true');
      await videoRef.value.play();
      isScannerActive.value = true;
      startQrFrameLoop();
    }
  } catch (err: any) {
    console.warn('[Camera] Gagal membuka kamera:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      cameraError.value = 'Izin kamera ditolak. Silakan izinkan kamera di browser atau gunakan input manual.';
    } else {
      cameraError.value = 'Kamera tidak terdeteksi atau sedang dipakai aplikasi lain.';
    }
    isScannerActive.value = false;
  }
}

function stopCamera() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  isScannerActive.value = false;
}

async function flipCamera() {
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';
  stopCamera();
  await startCamera();
}

function toggleScanner() {
  if (isScannerActive.value) {
    stopCamera();
  } else {
    startCamera();
  }
}

function startQrFrameLoop() {
  if (typeof window === 'undefined') return;

  const BarcodeDetectorAPI = (window as any).BarcodeDetector;
  let detector: any = null;
  if (BarcodeDetectorAPI) {
    try {
      detector = new BarcodeDetectorAPI({ formats: ['qr_code'] });
    } catch {
      detector = null;
    }
  }

  scanInterval = setInterval(async () => {
    if (!videoRef.value || !isScannerActive.value || isProcessing.value || isCoolingDown.value) return;

    // 1. Coba BarcodeDetector natif peramban
    if (detector) {
      try {
        const barcodes = await detector.detect(videoRef.value);
        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          if (raw) {
            handleScannedCode(raw);
            return;
          }
        }
      } catch {
        // Fallback ke jsQR
      }
    }

    // 2. Universal jsQR canvas frame extraction
    try {
      const video = videoRef.value;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && hiddenCanvas) {
        const scale = Math.min(1, 480 / video.videoWidth);
        const w = Math.floor(video.videoWidth * scale);
        const h = Math.floor(video.videoHeight * scale);
        hiddenCanvas.width = w;
        hiddenCanvas.height = h;
        const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const qrCode = jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' });
          if (qrCode && qrCode.data) {
            handleScannedCode(qrCode.data);
          }
        }
      }
    } catch {
      // Abaikan error render frame
    }
  }, 200);
}

function handleScannedCode(token: string) {
  const clean = token.trim();
  if (!clean || isProcessing.value || isCoolingDown.value) return;

  // Anti-duplicate spam throttle
  if (clean === lastScannedToken.value && isCoolingDown.value) return;

  lastScannedToken.value = clean;
  isCoolingDown.value = true;
  setTimeout(() => {
    isCoolingDown.value = false;
  }, 2500);

  processScan(clean);
}

// ─── File Upload QR Fallback ──────────────────────────────────────────────────
function triggerFileUpload() {
  fileInputRef.value?.click();
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imgData.data, img.width, img.height);
          if (code && code.data) {
            processScan(code.data);
          } else {
            lastScanResult.value = {
              success: false,
              message: 'QR Code tidak terdeteksi pada foto/screenshot yang diunggah.',
              xpEarned: 0,
            };
          }
        }
      } catch (err: any) {
        lastScanResult.value = {
          success: false,
          message: 'Gagal membaca gambar: ' + (err?.message || 'Error'),
          xpEarned: 0,
        };
      } finally {
        target.value = '';
      }
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

// ─── Scan Submission & API Call ───────────────────────────────────────────────
async function processScan(rawCode: string) {
  const clean = rawCode.trim();
  if (!clean || isProcessing.value) return;

  isProcessing.value = true;
  lastScanResult.value = null;

  try {
    const payload: Record<string, any> = {
      mabaNim: clean,
    };
    if (activeBooth.value?.id) {
      payload.boothId = activeBooth.value.id;
    }

    const res = await api.post('/ormawa/scan-maba', payload);

    if (res.success) {
      playBeep('success');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      const mabaName = res.data?.maba?.fullName || `Mahasiswa (${clean})`;
      const mabaNim = res.data?.maba?.username || clean;
      const xpEarned = res.data?.xpEarned || 0;

      lastScanResult.value = {
        success: true,
        message: res.message || `Kunjungan mahasiswa berhasil dicatat!`,
        xpEarned,
        mabaName,
        mabaNim,
      };

      todayScans.value.unshift({
        id: Date.now().toString(),
        fullName: mabaName,
        nim: mabaNim,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        xpEarned,
      });

      manualNim.value = '';
    } else {
      playBeep('error');
      lastScanResult.value = {
        success: false,
        message: res.message || res.error?.message || `Gagal mencatat kunjungan mahasiswa.`,
        xpEarned: 0,
      };
    }
  } catch (err: any) {
    playBeep('error');
    lastScanResult.value = {
      success: false,
      message: `Gagal menghubungi server: ${err?.message || 'Network error'}`,
      xpEarned: 0,
    };
  } finally {
    isProcessing.value = false;
    setTimeout(() => {
      if (lastScanResult.value && !lastScanResult.value.success) {
        lastScanResult.value = null;
      }
    }, 6000);
  }
}

function submitManualScan() {
  if (!manualNim.value.trim()) return;
  processScan(manualNim.value.trim());
}

function quickScan(nim: string) {
  manualNim.value = nim;
  processScan(nim);
}
</script>

<style scoped>
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #22c55e, transparent);
  animation: scan 2s linear infinite;
  box-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e;
}

@keyframes scan {
  0% { top: 0%; }
  50% { top: 95%; }
  100% { top: 0%; }
}
</style>
