<template>
  <div class="p-4 md:p-6 space-y-5 flex-1 flex flex-col min-h-0 select-none font-mono">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-4 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer"
        @click="triggerPrint"
        title="Cetak Lembar QR"
      >
        <Printer class="h-4 w-4" />
        <span class="hidden sm:inline">CETAK QR (A4)</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
        @click="fetchLocations"
        :disabled="loading"
        title="Refresh Data"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- Subtitle / Info Bar -->
    <div class="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground border-b border-[#4a3624]/60 pb-2">
      <p>
        Pusat pencetakan & proyektor QR Code resmi PKKMB GENIUS UNU Yogyakarta 2026 dengan fitur randomisasi berkala anti-titip absen.
      </p>
      <div class="flex items-center gap-2 shrink-0">
        <span class="border border-[#ca8a04]/40 bg-[#2b2014] px-2 py-0.5 text-[9px] font-pixel text-[#facc15] flex items-center gap-1">
          <QrCode class="h-3 w-3 text-[#f59e0b]" />
          {{ currentCardCount }} KARTU QR
        </span>
      </div>
    </div>

    <!-- Category Tabs (Screen Only) -->
    <div class="print:hidden flex items-center gap-2 border-b border-[#4a3624]/40 pb-2 text-xs overflow-x-auto">
      <button
        @click="activeCategory = 'gate'"
        :class="[
          'h-8 px-3 rounded font-pixel text-[10px] sm:text-xs flex items-center gap-1.5 border transition-all cursor-pointer shrink-0',
          activeCategory === 'gate'
            ? 'bg-[#ca8a04] text-black border-[#facc15] font-bold shadow'
            : 'bg-[#271d15] text-gray-300 border-[#523e2b] hover:border-[#f59e0b]'
        ]"
      >
        <CalendarCheck class="h-3.5 w-3.5" />
        <span>GERBANG PRESENSI (H1 - H3)</span>
      </button>

      <button
        @click="activeCategory = 'pos'"
        :class="[
          'h-8 px-3 rounded font-pixel text-[10px] sm:text-xs flex items-center gap-1.5 border transition-all cursor-pointer shrink-0',
          activeCategory === 'pos'
            ? 'bg-[#ca8a04] text-black border-[#facc15] font-bold shadow'
            : 'bg-[#271d15] text-gray-300 border-[#523e2b] hover:border-[#f59e0b]'
        ]"
      >
        <Building2 class="h-3.5 w-3.5" />
        <span>18 POS KAMPUS (9 LANTAI)</span>
      </button>

      <button
        @click="activeCategory = 'ormawa'"
        :class="[
          'h-8 px-3 rounded font-pixel text-[10px] sm:text-xs flex items-center gap-1.5 border transition-all cursor-pointer shrink-0',
          activeCategory === 'ormawa'
            ? 'bg-[#ca8a04] text-black border-[#facc15] font-bold shadow'
            : 'bg-[#271d15] text-gray-300 border-[#523e2b] hover:border-[#f59e0b]'
        ]"
      >
        <Store class="h-3.5 w-3.5" />
        <span>STAND ORMAWA EXPO (HARI 3)</span>
      </button>
    </div>

    <!-- ================= DYNAMIC QR 5-MINUTE AUTO-REFRESH CONTROL DECK ================= -->
    <div class="print:hidden p-3.5 bg-[#17100a] border-2 border-[#ca8a04] rounded-lg shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
      <!-- Status & Switch -->
      <div class="flex items-center gap-2.5 w-full md:w-auto">
        <button
          type="button"
          @click="toggleAutoRefresh()"
          :class="[
            'h-9 px-3.5 rounded font-pixel text-[11px] border flex items-center gap-2 transition-all cursor-pointer shadow-sm',
            autoRefreshEnabled
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/90'
              : 'bg-[#241910] border-[#523e2b] text-gray-400 hover:text-white'
          ]"
        >
          <ToggleRight v-if="autoRefreshEnabled" class="h-4 w-4 text-emerald-400" />
          <ToggleLeft v-else class="h-4 w-4 text-gray-400" />
          <span>{{ autoRefreshEnabled ? 'PEMBARUAN OTOMATIS: AKTIF (5 MENIT)' : 'PEMBARUAN OTOMATIS: NONAKTIF' }}</span>
        </button>

        <span
          :class="[
            'hidden sm:inline-block text-[10px] font-mono px-2 py-1 rounded border',
            autoRefreshEnabled
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
              : 'border-[#523e2b] text-gray-400 bg-[#1f160e]'
          ]"
        >
          {{ autoRefreshEnabled ? 'Mode Dinamis (Anti-Titip Absen)' : 'Mode Statis (Standar Cetak A4)' }}
        </span>
      </div>

      <!-- Live Countdown & Progress Indicator -->
      <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-center">
        <div class="flex items-center gap-2 font-mono text-xs">
          <Clock class="h-3.5 w-3.5 text-[#f59e0b]" />
          <span class="text-gray-300 text-[11px]">Berganti otomatis:</span>
          <span
            :class="[
              'font-pixel text-sm font-bold px-2 py-0.5 rounded border',
              autoRefreshEnabled
                ? remainingSeconds <= 30
                  ? 'bg-red-950 border-red-500 text-red-400 animate-pulse'
                  : 'bg-[#2b2014] border-[#ca8a04] text-[#facc15]'
                : 'bg-gray-800 border-gray-600 text-gray-400'
            ]"
          >
            {{ autoRefreshEnabled ? formattedCountdown : 'DIJEDA' }}
          </span>
        </div>

        <div class="w-24 sm:w-32 h-2.5 bg-[#120d09] border border-[#4a3624] rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-1000 ease-linear rounded-full"
            :style="{ width: `${autoRefreshEnabled ? progressPercentage : 100}%` }"
            :class="[
              remainingSeconds <= 30
                ? 'bg-red-500'
                : remainingSeconds <= 60
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            ]"
          ></div>
        </div>
      </div>

      <!-- Actions: Acak Sekarang & Buka Proyektor -->
      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          type="button"
          @click="manualRandomizeHandler"
          class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#2b2014] text-[#facc15] border-[#523e2b] flex items-center gap-1.5 hover:bg-[#3d2d1e] cursor-pointer"
          title="Acak ulang kode token seketika"
        >
          <RotateCw class="h-3.5 w-3.5" :class="isRotating && 'animate-spin'" />
          <span>ACAK SEKARANG</span>
        </button>

        <button
          type="button"
          @click="openProjectorLive(null)"
          class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#ca8a04] text-black border-[#facc15] flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer font-bold shadow"
          title="Buka Layar Penuh Proyektor Gerbang"
        >
          <Tv class="h-3.5 w-3.5" />
          <span>LAYAR PROYEKTOR</span>
        </button>
      </div>
    </div>

    <!-- Filter & Toolbar for POS (Screen Only) -->
    <div
      v-if="activeCategory === 'pos'"
      class="print:hidden pixel-toolbar-sticky p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div class="flex items-center gap-2 font-mono text-xs">
        <span class="text-muted-foreground">Filter Lantai:</span>
        <select
          v-model.number="selectedFloor"
          class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
        >
          <option :value="0">Semua Lantai (1 - 9)</option>
          <option v-for="f in 9" :key="f" :value="f">Lantai {{ f }}</option>
        </select>
      </div>

      <div class="font-mono text-xs text-muted-foreground flex items-center gap-2">
        <span>Menampilkan <strong>{{ filteredLocations.length }}</strong> Kartu Pos Lantai</span>
      </div>
    </div>

    <!-- ================= 1. GERBANG PRESENSI CARDS GRID ================= -->
    <div
      v-if="activeCategory === 'gate'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:m-0"
    >
      <div
        v-for="gate in gateList"
        :key="gate.code"
        :class="[
          'border-4 p-4 rounded shadow-xl text-center space-y-3 print:space-y-2 flex flex-col justify-between print:break-inside-avoid transition-all',
          gate.type === 'MASUK'
            ? 'border-[#16a34a] bg-[#142215] print:bg-white print:border-black'
            : 'border-[#0284c7] bg-[#0f1d28] print:bg-white print:border-black'
        ]"
      >
        <!-- Card Header -->
        <div class="border-b-2 border-current pb-2">
          <div class="flex items-center justify-between">
            <span class="font-pixel text-[10px] font-bold text-[#f59e0b] print:text-black">
              GENIUS UNU 2026
            </span>
            <span
              :class="[
                'border px-2 py-0.5 font-mono text-[9px] font-bold uppercase rounded',
                gate.type === 'MASUK'
                  ? 'border-[#4ade80] bg-[#1a381c] text-[#86efac] print:text-black print:border-black'
                  : 'border-[#38bdf8] bg-[#133044] text-[#7dd3fc] print:text-black print:border-black'
              ]"
            >
              {{ gate.timeLabel }}
            </span>
          </div>

          <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] print:text-black mt-1 uppercase tracking-wider">
            {{ gate.title }}
          </h2>
          <p class="font-mono text-[10px] text-gray-300 print:text-gray-700">
            {{ gate.subtitle }}
          </p>
        </div>

        <!-- QR Code Box -->
        <div class="flex flex-col items-center justify-center p-3 bg-white border-2 border-black rounded shadow-inner">
          <img
            :src="getQrImageUrl(getDynamicToken(gate.code))"
            :alt="getDynamicToken(gate.code)"
            class="h-44 w-44 object-contain print:h-40 print:w-40"
            loading="lazy"
          />
          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
            <span class="font-mono text-[9px] text-black font-bold tracking-wider">
              {{ getDynamicToken(gate.code) }}
            </span>
            <span
              v-if="autoRefreshEnabled"
              class="print:hidden text-[8px] font-pixel bg-emerald-600 text-white px-1.5 py-0.2 rounded"
            >
              LIVE 5M
            </span>
          </div>
        </div>

        <!-- Action: Proyeksikan Layar Penuh -->
        <div class="print:hidden pt-1">
          <button
            type="button"
            @click="openProjectorLive(gate)"
            class="w-full pixel-btn h-7 text-[9px] font-pixel bg-[#241a12] text-[#facc15] border-[#523e2b] flex items-center justify-center gap-1.5 hover:bg-[#382618] cursor-pointer"
          >
            <Maximize2 class="h-3 w-3" />
            <span>TAMPILKAN PROYEKTOR LAYAR PENUH</span>
          </button>
        </div>

        <!-- Instructions for Participants & Panitia -->
        <div class="border-t border-[#523e2b] print:border-black pt-2 text-[10px] font-mono text-muted-foreground print:text-gray-800 space-y-0.5 text-left">
          <p class="font-bold text-[#f59e0b] print:text-black">📱 PETUNJUK PESERTA:</p>
          <p>1. Buka menu <strong>PRESENSI</strong> pada aplikasi smartphone Anda.</p>
          <p>2. Tekan <strong>SCAN QR GERBANG</strong> dan arahkan kamera.</p>
          <p class="text-emerald-400 print:text-black font-bold">Bonus: {{ gate.rewardXp }}</p>
        </div>
      </div>
    </div>

    <!-- ================= 2. 18 POS MINI-GAME CARDS GRID ================= -->
    <div
      v-else-if="activeCategory === 'pos'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:m-0"
    >
      <div
        v-for="pos in filteredLocations"
        :key="pos.code"
        class="border-4 border-[#ca8a04] bg-[#1a140f] print:bg-white print:border-black p-4 rounded shadow-lg text-center space-y-3 print:space-y-2 flex flex-col justify-between print:break-inside-avoid"
      >
        <!-- Card Header -->
        <div class="border-b-2 border-[#ca8a04] print:border-black pb-2">
          <div class="flex items-center justify-between">
            <span class="font-pixel text-[10px] font-bold text-[#f59e0b] print:text-black">
              GENIUS 2026
            </span>
            <span class="border border-[#f59e0b] print:border-black px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#facc15] print:text-black">
              LANTAI {{ pos.floorNumber }}
            </span>
          </div>
          <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] print:text-black mt-1 uppercase tracking-wider">
            {{ pos.name }}
          </h2>
          <p class="font-mono text-[10px] text-muted-foreground print:text-gray-700">
            KODE POS: <strong class="text-foreground print:text-black">{{ pos.code }}</strong>
          </p>
        </div>

        <!-- QR Code Image Box -->
        <div class="flex flex-col items-center justify-center p-3 bg-white border-2 border-[#523e2b] print:border-black rounded">
          <img
            :src="getQrImageUrl(getDynamicToken(pos.code))"
            :alt="getDynamicToken(pos.code)"
            class="h-44 w-44 object-contain print:h-40 print:w-40"
            loading="lazy"
          />
          <div class="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
            <span class="font-mono text-[9px] text-black font-bold">
              {{ getDynamicToken(pos.code) }}
            </span>
            <span
              v-if="autoRefreshEnabled"
              class="print:hidden text-[8px] font-pixel bg-emerald-600 text-white px-1.5 py-0.2 rounded"
            >
              LIVE 5M
            </span>
          </div>
        </div>

        <!-- Action: Proyeksikan Layar Penuh -->
        <div class="print:hidden pt-1">
          <button
            type="button"
            @click="openProjectorLive(pos)"
            class="w-full pixel-btn h-7 text-[9px] font-pixel bg-[#241a12] text-[#facc15] border-[#523e2b] flex items-center justify-center gap-1.5 hover:bg-[#382618] cursor-pointer"
          >
            <Maximize2 class="h-3 w-3" />
            <span>TAMPILKAN PROYEKTOR LAYAR PENUH</span>
          </button>
        </div>

        <!-- Instructions for Participants -->
        <div class="border-t border-[#4a3624] print:border-black pt-2 text-[10px] font-mono text-muted-foreground print:text-gray-800 space-y-0.5 text-left">
          <p class="font-bold text-[#f59e0b] print:text-black">📱 PETUNJUK PESERTA:</p>
          <p>1. Buka Player App di smartphone tim Anda.</p>
          <p>2. Tekan menu <strong>SCAN QR POS</strong> dan arahkan kamera.</p>
          <p>3. Mulai mainkan tantangan mini-game bersama Buddy!</p>
        </div>
      </div>
    </div>

    <!-- ================= 3. STAND ORMAWA EXPO CARDS GRID ================= -->
    <div v-else-if="activeCategory === 'ormawa'" class="space-y-4">
      <!-- Info & Management Shortcut Banner -->
      <div class="print:hidden pixel-toolbar-sticky p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#1e1329] border-2 border-[#9333ea]/80 shadow-md">
        <div class="flex items-center gap-2.5">
          <Store class="h-4 w-4 text-[#c084fc] shrink-0" />
          <div class="text-xs text-[#e9d5ff]">
            Data stan terhubung langsung dengan backend database.
            <span class="font-bold text-[#facc15] ml-1">{{ ormawaList.length }} Stan Aktif</span>
          </div>
        </div>

        <NuxtLink
          to="/ormawa"
          class="pixel-btn h-8 px-3 text-[11px] font-pixel bg-[#9333ea] text-white border-[#c084fc] flex items-center gap-1.5 hover:bg-[#a855f7] cursor-pointer shadow"
        >
          <span>MANAJEMEN STAN & ABSENSI</span>
          <ExternalLink class="h-3 w-3" />
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
        <RotateCw class="h-6 w-6 animate-spin text-[#c084fc]" />
        <span class="text-xs font-mono">Memuat kartu QR stan Ormawa dari server...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="ormawaList.length === 0"
        class="pixel-card p-8 border-2 border-dashed border-[#523e2b] bg-[#1a140f] text-center space-y-3"
      >
        <Store class="h-8 w-8 text-gray-500 mx-auto" />
        <div class="font-pixel text-xs text-gray-300">BELUM ADA STAN ORMAWA TERDAFTAR</div>
        <p class="text-xs text-muted-foreground max-w-md mx-auto">
          Silakan buat dan daftarkan stan ormawa baru melalui menu Manajemen Stan Ormawa.
        </p>
        <NuxtLink
          to="/ormawa"
          class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#ca8a04] text-black border-[#facc15] inline-flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer mt-2"
        >
          <span>BUKA MANAJEMEN ORMAWA</span>
        </NuxtLink>
      </div>

      <!-- Cards Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:m-0"
      >
        <div
          v-for="booth in ormawaList"
          :key="booth.code"
          class="border-4 border-[#9333ea] bg-[#1e1429] print:bg-white print:border-black p-4 rounded shadow-xl text-center space-y-3 print:space-y-2 flex flex-col justify-between print:break-inside-avoid"
        >
          <!-- Card Header -->
          <div class="border-b-2 border-[#9333ea] print:border-black pb-2">
            <div class="flex items-center justify-between">
              <span class="font-pixel text-[10px] font-bold text-[#c084fc] print:text-black">
                ORMAWA EXPO 2026
              </span>
              <span class="border border-[#c084fc] print:border-black px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#facc15] print:text-black">
                {{ booth.boothNumber }}
              </span>
            </div>
            <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] print:text-black mt-1 uppercase tracking-wider">
              {{ booth.name }}
            </h2>
            <p class="font-mono text-[10px] text-[#d8b4fe] print:text-gray-700">
              Kategori: {{ booth.category }} • {{ booth.location }}
            </p>
          </div>

          <!-- QR Code Image Box -->
          <div class="flex flex-col items-center justify-center p-3 bg-white border-2 border-black rounded">
            <img
              :src="getQrImageUrl(getDynamicToken(booth.code))"
              :alt="getDynamicToken(booth.code)"
              class="h-44 w-44 object-contain print:h-40 print:w-40"
              loading="lazy"
            />
            <div class="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
              <span class="font-mono text-[9px] text-black font-bold">
                {{ getDynamicToken(booth.code) }}
              </span>
              <span
                v-if="autoRefreshEnabled"
                class="print:hidden text-[8px] font-pixel bg-emerald-600 text-white px-1.5 py-0.2 rounded"
              >
                LIVE 5M
              </span>
            </div>
          </div>

          <!-- Action: Proyeksikan Layar Penuh -->
          <div class="print:hidden pt-1">
            <button
              type="button"
              @click="openProjectorLive(booth)"
              class="w-full pixel-btn h-7 text-[9px] font-pixel bg-[#241a12] text-[#facc15] border-[#523e2b] flex items-center justify-center gap-1.5 hover:bg-[#382618] cursor-pointer"
            >
              <Maximize2 class="h-3 w-3" />
              <span>TAMPILKAN PROYEKTOR LAYAR PENUH</span>
            </button>
          </div>

          <!-- Instructions for Participants -->
          <div class="border-t border-[#6b21a8] print:border-black pt-2 text-[10px] font-mono text-muted-foreground print:text-gray-800 space-y-0.5 text-left">
            <p class="font-bold text-[#c084fc] print:text-black">📱 PETUNJUK MAHASISWA:</p>
            <p>1. Kunjungi stand UKM dan kenali program kegiatannya.</p>
            <p>2. Scan QR stand ini untuk membuka <strong>Lencana Paspor UKM</strong>.</p>
            <p class="text-emerald-400 print:text-black font-bold">Reward: +{{ booth.xpReward || 75 }} XP (Capping maks 10 stan)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Gate Projector Modal -->
    <GateProjectorModal
      v-model="showProjectorModal"
      :custom-card="projectorTargetCard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Printer,
  RotateCw,
  QrCode,
  CalendarCheck,
  Building2,
  Store,
  ExternalLink,
  Clock,
  ToggleRight,
  ToggleLeft,
  Tv,
  Maximize2,
} from "lucide-vue-next";
import { useApi } from "@/composables/useApi";
import { useDynamicQr } from "@/composables/useDynamicQr";
import GateProjectorModal from "@/components/qr/GateProjectorModal.vue";

const api = useApi();
const {
  autoRefreshEnabled,
  remainingSeconds,
  formattedCountdown,
  progressPercentage,
  getDynamicToken,
  randomizeAll,
  toggleAutoRefresh,
} = useDynamicQr();

const activeCategory = ref<"gate" | "pos" | "ormawa">("gate");
const selectedFloor = ref(0);
const loading = ref(false);
const isRotating = ref(false);
const showProjectorModal = ref(false);
const projectorTargetCard = ref<any | null>(null);

const locations = ref<any[]>([]);
const ormawaList = ref<any[]>([]);

// Daftar Kartu Gerbang Presensi Resmi 3 Hari
const gateList = [
  {
    code: "UNU-PRESENSI-H1-GATE-2026",
    title: "PRESENSI MASUK HARI 1",
    subtitle: "Pintu Utama Hall Lantai 1 (Selasa, 22 Sep 2026)",
    type: "MASUK",
    timeLabel: "PAGI: 07:00 - 07:30",
    rewardXp: "+100 XP Presensi Masuk",
  },
  {
    code: "UNU-PRESENSI-H1-CHECKOUT-2026",
    title: "PRESENSI PULANG HARI 1",
    subtitle: "Gerbang Keluar Hall Utama (Selasa, 22 Sep 2026)",
    type: "PULANG",
    timeLabel: "SORE: 16:00 WIB",
    rewardXp: "+50 XP Presensi Pulang",
  },
  {
    code: "UNU-PRESENSI-H2-GATE-2026",
    title: "PRESENSI MASUK HARI 2",
    subtitle: "Pintu Utama Hall Lantai 1 (Rabu, 23 Sep 2026)",
    type: "MASUK",
    timeLabel: "PAGI: 07:00 - 07:30",
    rewardXp: "+100 XP Presensi Masuk",
  },
  {
    code: "UNU-PRESENSI-H2-CHECKOUT-2026",
    title: "PRESENSI PULANG HARI 2",
    subtitle: "Gerbang Keluar Hall Utama (Rabu, 23 Sep 2026)",
    type: "PULANG",
    timeLabel: "SORE: 16:00 WIB",
    rewardXp: "+50 XP Presensi Pulang",
  },
  {
    code: "UNU-PRESENSI-H3-GATE-2026",
    title: "PRESENSI MASUK HARI 3",
    subtitle: "Pintu Utama Hall Lantai 1 (Kamis, 24 Sep 2026)",
    type: "MASUK",
    timeLabel: "PAGI: 07:00 - 07:30",
    rewardXp: "+100 XP Presensi Masuk",
  },
  {
    code: "UNU-PRESENSI-H3-CHECKOUT-2026",
    title: "PRESENSI PULANG HARI 3",
    subtitle: "Gerbang Keluar Hall Utama (Kamis, 24 Sep 2026)",
    type: "PULANG",
    timeLabel: "SORE: 16:00 WIB",
    rewardXp: "+50 XP Presensi Pulang",
  },
];

// 18 Pos Fisik 9 Lantai Fallback
const defaultCampusLocations = [
  { floorNumber: 1, name: "Lobby Utama & Welcome Center", code: "POS-L1-A" },
  { floorNumber: 1, name: "Student Center & Layanan Kampus", code: "POS-L1-B" },
  { floorNumber: 2, name: "Klinik & Posko Kesehatan Mahasiswa", code: "POS-L2-A" },
  { floorNumber: 2, name: "Kampus Bersinar & Konseling Sebaya", code: "POS-L2-B" },
  { floorNumber: 3, name: "Lab Komputer AI & Software Studio", code: "POS-L3-A" },
  { floorNumber: 3, name: "Smart FTI Hall & Ruang Kolaborasi", code: "POS-L3-B" },
  { floorNumber: 4, name: "Posko Layanan PPKS & Konseling Ramah", code: "POS-L4-A" },
  { floorNumber: 4, name: "Lab Riset Halal & Bioteknologi Terapan", code: "POS-L4-B" },
  { floorNumber: 5, name: "Perpustakaan Pusat & Pustaka Digital", code: "POS-L5-A" },
  { floorNumber: 5, name: "Klinik Anti-Plagiarisme & Penulisan Ilmiah", code: "POS-L5-B" },
  { floorNumber: 6, name: "Pusat Studi Islam Nusantara & Budaya", code: "POS-L6-A" },
  { floorNumber: 6, name: "Laboratorium Sains Terpadu & Energi Hijau", code: "POS-L6-B" },
  { floorNumber: 7, name: "Creative Co-Working Space & Multimedia", code: "POS-L7-A" },
  { floorNumber: 7, name: "Microteaching Lab & Karakter Pendidik", code: "POS-L7-B" },
  { floorNumber: 8, name: "Klinik Integritas & Anti-Korupsi", code: "POS-L8-A" },
  { floorNumber: 8, name: "Ruang Tata Kelola & Kepemimpinan Kampus", code: "POS-L8-B" },
  { floorNumber: 9, name: "Auditorium & Convention Hall Utama", code: "POS-L9-A" },
  { floorNumber: 9, name: "Rooftop Sky Garden Panoramic Deck", code: "POS-L9-B" },
];

async function fetchLocations() {
  loading.value = true;
  try {
    // 1. Fetch Campus Pos Locations from API
    const locRes = await api.get<{ success: boolean; data: any[] }>("/api/floors/locations");
    if (locRes?.success && Array.isArray(locRes.data) && locRes.data.length > 0) {
      locations.value = locRes.data.map((l) => ({
        floorNumber: l.floorNumber || 1,
        name: l.name,
        code: l.qrCode || l.code,
      }));
    } else {
      locations.value = defaultCampusLocations;
    }

    // 2. Fetch Ormawa Booths dynamically
    const ormawaRes = await api.get<{ success: boolean; data: any[] }>("/api/ormawa/booths?includeInactive=false");
    if (ormawaRes?.success && Array.isArray(ormawaRes.data)) {
      ormawaList.value = ormawaRes.data.map((b) => ({
        code: b.qrCode || b.code,
        name: b.name,
        boothNumber: b.boothNumber || `STAN L${b.floorNumber || 3}`,
        category: b.category,
        location: b.floorName ? `${b.floorName} (Lantai ${b.floorNumber})` : (b.boothNumber || "Selasar Expo"),
        xpReward: b.xpReward || 75,
      }));
    }
  } catch (err) {
    console.error("Gagal memuat data QR:", err);
    if (locations.value.length === 0) locations.value = defaultCampusLocations;
  } finally {
    loading.value = false;
  }
}

function manualRandomizeHandler() {
  isRotating.value = true;
  randomizeAll();
  setTimeout(() => {
    isRotating.value = false;
  }, 500);
}

function openProjectorLive(card: any | null) {
  projectorTargetCard.value = card;
  showProjectorModal.value = true;
}

onMounted(() => {
  fetchLocations();
});

const filteredLocations = computed(() => {
  if (selectedFloor.value === 0) return locations.value;
  return locations.value.filter((loc) => loc.floorNumber === selectedFloor.value);
});

const currentCardCount = computed(() => {
  if (activeCategory.value === "gate") return gateList.length;
  if (activeCategory.value === "pos") return filteredLocations.value.length;
  return ormawaList.value.length;
});

function getQrImageUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(code)}`;
}

function triggerPrint() {
  window.print();
}
</script>

<style scoped>
@media print {
  body {
    background-color: white !important;
    color: black !important;
  }
}
</style>
