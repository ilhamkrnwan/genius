<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono">
    <!-- Topbar Actions -->
    <TopbarActions>
      <NuxtLink
        to="/ormawa"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#271d15] text-[#facc15] border-[#ca8a04] flex items-center gap-1.5 hover:bg-[#3d2d1e] cursor-pointer"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        <span class="hidden sm:inline font-pixel">MANAJEMEN STAN</span>
      </NuxtLink>
    </TopbarActions>

    <!-- Header -->
    <div class="px-4 md:px-6 pt-4 pb-3 border-b border-[#4a3624]/60 bg-[#15100c]/85 backdrop-blur-md">
      <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
        <QrCode class="h-4 w-4 text-[#c084fc]" />
        SCANNER PIC ORMAWA — VALIDASI KUNJUNGAN MABA
      </h1>
      <p class="text-[11px] text-gray-400 mt-0.5">
        Scan QR Code mahasiswa untuk mencatat kunjungan & memberikan lencana UKM secara otomatis.
      </p>
    </div>

    <!-- Main Content -->
    <div class="p-4 md:p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- ═══════════════════════════════ -->
        <!-- PANEL KIRI: Scanner Area       -->
        <!-- ═══════════════════════════════ -->
        <div class="space-y-4">

          <!-- Stan Aktif PIC -->
          <div class="pixel-card p-4 border border-[#523e2b] bg-[#1a140f]/90 backdrop-blur-sm space-y-2">
            <div class="flex items-center gap-2 mb-2">
              <Store class="h-4 w-4 text-[#c084fc]" />
              <span class="font-pixel text-[10px] text-[#c084fc] uppercase">Stan Anda</span>
            </div>
            <div class="bg-[#120d08]/90 border border-[#ca8a04]/40 rounded-lg p-3 text-center">
              <p class="font-pixel text-[#fef08a] text-sm font-bold">
                {{ activeBooth?.name || 'Belum terhubung ke stan' }}
              </p>
              <p class="text-[10px] text-amber-300/70 font-mono mt-1" v-if="activeBooth">
                {{ activeBooth.category }} · Lantai {{ activeBooth.floorNumber }}
              </p>
              <p class="text-[10px] text-red-400/70 font-mono mt-1" v-else>
                ⚠ Hubungi Admin untuk menghubungkan akun ke stan
              </p>
            </div>
          </div>

          <!-- Scanner Input Area -->
          <div class="pixel-card p-4 border border-[#523e2b] bg-[#1a140f]/90 backdrop-blur-sm space-y-4">
            <div class="flex items-center gap-2">
              <QrCode class="h-4 w-4 text-[#facc15]" />
              <span class="font-pixel text-[10px] text-[#facc15] uppercase">Scan QR Mahasiswa</span>
            </div>

            <!-- Kamera Viewfinder Placeholder -->
            <div
              class="relative w-full aspect-square max-w-[300px] mx-auto bg-[#0d0a07] border-2 border-dashed border-[#523e2b] rounded-xl overflow-hidden flex items-center justify-center"
              :class="{ 'border-[#22c55e]': isScannerActive }"
            >
              <div v-if="!isScannerActive" class="text-center space-y-3 p-4">
                <QrCode class="h-16 w-16 text-amber-400/20 mx-auto" />
                <p class="text-[10px] text-amber-300/50 font-mono">Kamera belum aktif</p>
                <p class="text-[9px] text-gray-500 font-mono">
                  (Kamera akan aktif setelah backend endpoint tersedia)
                </p>
              </div>

              <!-- Scan line animation saat aktif -->
              <div v-if="isScannerActive" class="absolute inset-0 bg-black/20">
                <div class="scan-line"></div>
              </div>
            </div>

            <!-- Aktif/Nonaktif Scanner -->
            <button
              @click="toggleScanner"
              :disabled="!activeBooth"
              :class="[
                'w-full pixel-btn h-10 font-pixel text-[11px] font-bold flex items-center justify-center gap-2 transition-all',
                isScannerActive
                  ? 'bg-[#7f1d1d] border-[#ef4444] text-[#fca5a5] hover:bg-[#991b1b]'
                  : 'bg-[#14532d] border-[#22c55e] text-[#86efac] hover:bg-[#166534] disabled:opacity-40 disabled:cursor-not-allowed'
              ]"
            >
              <component :is="isScannerActive ? XCircle : ScanLine" class="h-4 w-4" />
              {{ isScannerActive ? 'HENTIKAN SCANNER' : 'AKTIFKAN KAMERA SCANNER' }}
            </button>

            <!-- Input NIM Manual (alternatif scanner) -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-pixel text-gray-400 uppercase">Atau Input NIM Manual</label>
              <div class="flex gap-2">
                <input
                  v-model="manualNim"
                  type="text"
                  placeholder="Ketik NIM mahasiswa..."
                  class="flex-1 bg-[#0d0a07] border border-[#523e2b] focus:border-[#facc15] rounded px-3 py-2 text-xs text-amber-100 placeholder-amber-200/30 outline-none font-mono"
                  @keydown.enter="submitManualScan"
                />
                <button
                  @click="submitManualScan"
                  :disabled="!manualNim.trim() || isProcessing"
                  class="pixel-btn px-3 h-9 bg-[#ca8a04] hover:bg-[#eab308] text-[#140e08] font-pixel text-[9px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check v-if="!isProcessing" class="h-3.5 w-3.5" />
                  <Loader2 v-else class="h-3.5 w-3.5 animate-spin" />
                </button>
              </div>
              <p class="text-[9px] text-gray-500 font-mono">Input NIM maba lalu tekan Enter atau tombol centang.</p>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════ -->
        <!-- PANEL KANAN: Riwayat & Statistik   -->
        <!-- ═══════════════════════════════════ -->
        <div class="space-y-4">

          <!-- Statistik Kunjungan Hari Ini -->
          <div class="grid grid-cols-2 gap-3">
            <div class="pixel-card p-3 border border-[#16a34a]/60 bg-[#0d1f10]/85 backdrop-blur-sm space-y-1 text-center">
              <CheckCircle2 class="h-5 w-5 text-[#4ade80] mx-auto" />
              <div class="font-pixel text-xl text-[#4ade80] font-bold">{{ todayScans.length }}</div>
              <p class="text-[9px] font-mono text-[#4ade80]/70 uppercase">Scan Sukses Hari Ini</p>
            </div>
            <div class="pixel-card p-3 border border-[#ca8a04]/60 bg-[#1e1508]/85 backdrop-blur-sm space-y-1 text-center">
              <Star class="h-5 w-5 text-[#facc15] mx-auto" />
              <div class="font-pixel text-xl text-[#facc15] font-bold">{{ todayScans.length * 75 }}</div>
              <p class="text-[9px] font-mono text-[#facc15]/70 uppercase">Total XP Diberikan</p>
            </div>
          </div>

          <!-- Scan Result Toast -->
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
                'p-3 rounded-lg border-2 text-xs font-mono space-y-1.5',
                lastScanResult.success
                  ? 'bg-[#0d1f10] border-[#22c55e] text-[#86efac]'
                  : 'bg-[#200d0d] border-[#ef4444] text-[#fca5a5]'
              ]"
            >
              <div class="flex items-center gap-2 font-bold">
                <CheckCircle2 v-if="lastScanResult.success" class="h-4 w-4 shrink-0 text-[#4ade80]" />
                <XCircle v-else class="h-4 w-4 shrink-0 text-[#f87171]" />
                {{ lastScanResult.success ? 'SCAN BERHASIL' : 'SCAN GAGAL' }}
              </div>
              <p>{{ lastScanResult.message }}</p>
              <p v-if="lastScanResult.success && lastScanResult.xpEarned > 0" class="text-[#facc15]">
                +{{ lastScanResult.xpEarned }} XP diberikan ke mahasiswa.
              </p>
            </div>
          </Transition>

          <!-- Riwayat Scan Hari Ini -->
          <div class="pixel-card border border-[#523e2b] bg-[#1a140f] overflow-hidden">
            <div class="px-3 py-2 border-b border-[#3d2613] flex items-center justify-between">
              <span class="font-pixel text-[10px] text-amber-300 uppercase">Riwayat Scan Hari Ini</span>
              <span class="text-[9px] text-gray-500 font-mono">{{ todayScans.length }} entri</span>
            </div>

            <div class="max-h-[300px] overflow-y-auto custom-scrollbar">
              <div v-if="todayScans.length === 0" class="p-6 text-center">
                <Users class="h-8 w-8 text-amber-400/20 mx-auto mb-2" />
                <p class="text-[10px] text-gray-500 font-mono">Belum ada scan hari ini.</p>
              </div>

              <div
                v-for="scan in todayScans"
                :key="scan.id"
                class="px-3 py-2 border-b border-[#2a1d12] last:border-0 flex items-center justify-between gap-2 hover:bg-[#1f170e] transition-colors"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <CheckCircle2 class="h-3.5 w-3.5 text-[#4ade80] shrink-0" />
                  <div class="min-w-0">
                    <p class="text-[11px] text-amber-100 font-mono truncate">{{ scan.fullName }}</p>
                    <p class="text-[9px] text-gray-500 font-mono">{{ scan.nim }} · {{ scan.time }}</p>
                  </div>
                </div>
                <span class="text-[9px] font-pixel text-[#facc15] shrink-0">+{{ scan.xpEarned }} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  QrCode, Store, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, Star, Users, ScanLine, Check, Loader2,
} from 'lucide-vue-next';
import TopbarActions from '~/components/TopbarActions.vue';
import { useApi } from '~/composables/useApi';

const api = useApi();

// ─── State ────────────────────────────────────────────────────────────────────
const isScannerActive = ref(false);
const manualNim = ref('');
const isProcessing = ref(false);
const lastScanResult = ref<{ success: boolean; message: string; xpEarned: number } | null>(null);

const activeBooth = ref<{ name: string; category: string; floorNumber: number } | null>(null);

const todayScans = ref<Array<{ id: string; fullName: string; nim: string; time: string; xpEarned: number }>>([]);

onMounted(async () => {
  try {
    const res = await api.get('/ormawa/my-booth');
    if (res.success && res.data) {
      activeBooth.value = res.data;
    }
  } catch (err) {
    console.error('Failed to load active booth', err);
  }
});

// ─── Actions ──────────────────────────────────────────────────────────────────
const toggleScanner = () => {
  isScannerActive.value = !isScannerActive.value;
};

const submitManualScan = async () => {
  const nim = manualNim.value.trim();
  if (!nim || isProcessing.value) return;

  isProcessing.value = true;
  lastScanResult.value = null;

  try {
    const res = await api.post('/ormawa/scan-maba', { mabaNim: nim });
    
    if (res.success) {
      lastScanResult.value = {
        success: true,
        message: res.message || `Kunjungan mahasiswa berhasil dicatat!`,
        xpEarned: res.data?.xpEarned || 0,
      };
      
      const mabaName = res.data?.maba?.fullName || `Mahasiswa (${nim})`;
      
      todayScans.value.unshift({
        id: Date.now().toString(),
        fullName: mabaName,
        nim,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        xpEarned: res.data?.xpEarned || 0,
      });
      manualNim.value = '';
    } else {
      lastScanResult.value = {
        success: false,
        message: res.error?.message || `Gagal mencatat kunjungan.`,
        xpEarned: 0,
      };
    }
  } catch (err: any) {
    lastScanResult.value = {
      success: false,
      message: `Gagal menghubungi server: ${err?.message || 'Network error'}`,
      xpEarned: 0,
    };
  } finally {
    isProcessing.value = false;
    // Auto-dismiss result setelah 5 detik
    setTimeout(() => { lastScanResult.value = null; }, 5000);
  }
};
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
  box-shadow: 0 0 8px #22c55e;
}

@keyframes scan {
  0% { top: 0%; }
  50% { top: 95%; }
  100% { top: 0%; }
}
</style>
