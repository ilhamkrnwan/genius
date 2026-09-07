<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        @click="exportAllCsv"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] flex items-center gap-1.5 hover:bg-[#1f3822] cursor-pointer"
        title="Export Data Ledger CSV"
      >
        <Download class="w-3.5 h-3.5 text-[#4ade80]" />
        <span class="hidden sm:inline font-pixel">EXPORT (CSV)</span>
      </button>

      <button
        @click="openCorrectionModal"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer"
        title="Input Koreksi Skor Baru"
      >
        <Plus class="w-3.5 h-3.5" />
        <span class="hidden sm:inline font-pixel">KOREKSI SKOR</span>
      </button>

      <button
        @click="handleRefresh"
        :disabled="loading"
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
        title="Segarkan Ledger"
      >
        <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
      </button>
    </TopbarActions>

    <!-- Subtitle / Info Header -->
    <div class="px-4 md:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#4a3624]/60 text-xs text-muted-foreground bg-[#15100c] shrink-0">
      <div>
        <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
          <ScrollText class="h-4 w-4 text-[#facc15]" />
          <span>POINT LEDGER — BUKU BESAR MUTASI SKOR & XP</span>
        </h1>
        <p class="text-[11px] text-gray-400 mt-0.5">
          Audit trail buku besar perolehan skor petualang dan penyesuaian manual Admin (Append-Only Ledger).
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="border border-[#ca8a04]/40 bg-[#2b2014] px-2.5 py-1 text-[10px] font-pixel text-[#facc15] flex items-center gap-1.5">
          <Coins class="h-3.5 w-3.5 text-[#f59e0b]" />
          IMMUTABLE LEDGER
        </span>
      </div>
    </div>

    <!-- Stats HUD Cards (Compact Top Deck) -->
    <div class="px-4 md:px-6 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-[#3d2a1b] bg-[#120d09] shrink-0">
      <div class="p-2 border border-[#523e2b] bg-[#1a140f] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-gray-400 uppercase block">TOTAL TRANSAKSI</span>
          <span class="font-pixel text-base text-foreground font-bold">{{ meta.total || 0 }}</span>
        </div>
        <span class="text-[10px] text-muted-foreground">📜 Terverifikasi</span>
      </div>

      <div class="p-2 border border-[#ca8a04] bg-[#221a0f] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#facc15] uppercase block">KOREKSI ADMIN</span>
          <span class="font-pixel text-base text-[#facc15] font-bold">{{ correctionCount }}</span>
        </div>
        <span class="text-[10px] text-[#fde047]">⚖️ Manual</span>
      </div>

      <div class="p-2 border border-[#16a34a] bg-[#132215] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#4ade80] uppercase block">TOTAL MUTASI POIN</span>
          <span class="font-pixel text-base text-[#4ade80] font-bold">{{ totalPointsDistributed.toLocaleString('id-ID') }} XP</span>
        </div>
        <span class="text-[10px] text-[#86efac]">✨ Hal. Ini</span>
      </div>

      <div class="p-2 border border-[#0284c7] bg-[#0c1a24] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#38bdf8] uppercase block">STATUS LEDGER</span>
          <div class="font-pixel text-[10px] text-[#38bdf8] font-bold flex items-center gap-1 mt-0.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>IMMUTABLE</span>
          </div>
        </div>
        <span class="text-[9px] text-[#7dd3fc]">🔒 Append-Only</span>
      </div>
    </div>

    <!-- Sticky Top Pixel Toolbar (Flush nempel Topbar) -->
    <div class="pixel-toolbar-sticky px-4 md:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f59e0b]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari Nama Petualang, Tim, atau Alasan..."
          class="w-full h-7 pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
        />
      </div>

      <div class="flex items-center gap-2 text-xs">
        <!-- Filter Sumber Transaksi -->
        <select
          v-model="filters.sourceType"
          @change="handleFilterChange"
          class="h-7 bg-[#1d1611] border border-[#523e2b] px-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
        >
          <option value="">Semua Tipe Sumber</option>
          <option value="GAME">GAME (Permainan Pos)</option>
          <option value="BONUS">BONUS (Buddy / Ormawa)</option>
          <option value="CORRECTION">CORRECTION (Koreksi Admin)</option>
        </select>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div
      v-if="selectedTxIds.length > 0"
      class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
    >
      <div class="flex items-center gap-2 text-[#f59e0b]">
        <CheckSquare class="h-4 w-4" />
        <span><b>{{ selectedTxIds.length }}</b> transaksi terpilih</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="exportSelectedCsv"
          class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] hover:bg-[#1f3822] flex items-center gap-1.5 cursor-pointer"
        >
          <Download class="h-3.5 w-3.5" />
          <span>Export Terpilih (CSV)</span>
        </button>
        <button
          @click="selectedTxIds = []"
          class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Batal
        </button>
      </div>
    </div>

    <!-- Flush Edge-to-Edge Table -->
    <div class="flex-1 overflow-x-auto min-h-0">
      <table class="pixel-table w-full text-left text-xs font-mono">
        <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10">
          <tr>
            <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="accent-[#f59e0b] cursor-pointer"
                title="Pilih Semua Halaman Ini"
              />
            </th>
            <th class="p-3">WAKTU (WIB)</th>
            <th class="p-3">PETUALANG</th>
            <th class="p-3">TIM / REGU</th>
            <th class="p-3 text-center">SUMBER</th>
            <th class="p-3">ALASAN / URAIAN</th>
            <th class="pr-4 md:pr-6 pl-3 py-3 text-right">MUTASI POIN</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#3d2d1e]/60">
          <tr v-if="loading" class="text-center text-gray-500">
            <td colspan="7" class="p-8">
              <div class="flex items-center justify-center gap-2 text-gray-400">
                <RotateCw class="w-4 h-4 animate-spin text-[#f59e0b]" />
                <span>Memuat riwayat buku besar...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredTransactions.length === 0" class="text-center text-gray-500">
            <td colspan="7" class="p-8 text-gray-400">
              Tidak ada transaksi poin yang sesuai kriteria pencarian.
            </td>
          </tr>
          <tr
            v-for="tx in filteredTransactions"
            :key="tx.id"
            :class="[
              'hover:bg-[#271d15]/50 transition-colors',
              selectedTxIds.includes(tx.id) ? 'bg-[#3b2716]/30' : ''
            ]"
          >
            <!-- Checkbox -->
            <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
              <input
                type="checkbox"
                :checked="selectedTxIds.includes(tx.id)"
                @change="toggleSelect(tx.id)"
                class="accent-[#f59e0b] cursor-pointer"
              />
            </td>

            <!-- Waktu -->
            <td class="p-3 text-gray-400 whitespace-nowrap text-[11px]">
              {{ formatDateTime(tx.createdAt) }}
            </td>

            <!-- Petualang -->
            <td class="p-3">
              <div class="font-sans font-bold text-foreground text-xs">
                {{ tx.participantName || 'Tanpa Nama' }}
              </div>
              <span class="text-gray-400 font-mono text-[10px] block mt-0.5">
                @{{ tx.participantUsername || '-' }}
              </span>
            </td>

            <!-- Tim -->
            <td class="p-3 text-amber-300/90 font-sans">
              {{ tx.teamName || 'Individu' }}
            </td>

            <!-- Tipe Sumber -->
            <td class="p-3 text-center">
              <span
                class="px-2 py-0.5 text-[9px] font-pixel border inline-flex items-center gap-1"
                :class="{
                  'bg-[#132215] text-[#4ade80] border-[#16a34a]': tx.sourceType === 'GAME',
                  'bg-[#221a0f] text-[#facc15] border-[#ca8a04]': tx.sourceType === 'BONUS',
                  'bg-[#2a1735] text-[#d8b4fe] border-[#9333ea]': tx.sourceType === 'CORRECTION',
                }"
              >
                <span v-if="tx.sourceType === 'GAME'">🎮 GAME</span>
                <span v-else-if="tx.sourceType === 'BONUS'">⭐ BONUS</span>
                <span v-else-if="tx.sourceType === 'CORRECTION'">⚖️ KOREKSI</span>
                <span v-else>{{ tx.sourceType }}</span>
              </span>
            </td>

            <!-- Alasan -->
            <td class="p-3 font-sans text-gray-300 max-w-sm">
              <div class="truncate" :title="tx.reason || '-'">
                {{ tx.reason || '-' }}
              </div>
              <div v-if="tx.stageName" class="text-[10px] text-gray-500 font-mono mt-0.5">
                Stage: {{ tx.stageName }}
              </div>
            </td>

            <!-- Mutasi Poin -->
            <td class="pr-4 md:pr-6 pl-3 py-3 text-right font-bold text-sm whitespace-nowrap">
              <span
                :class="[
                  'font-pixel text-xs flex items-center justify-end gap-1',
                  tx.amount >= 0 ? 'text-[#4ade80]' : 'text-rose-400'
                ]"
              >
                <ArrowUpRight v-if="tx.amount >= 0" class="w-3.5 h-3.5 text-[#4ade80]" />
                <ArrowDownRight v-else class="w-3.5 h-3.5 text-rose-400" />
                {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }} XP
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
    <PixelPagination
      :current-page="meta.page"
      :total-items="meta.total"
      :page-size="meta.pageSize"
      @update:current-page="fetchTransactions($event)"
      @update:page-size="meta.pageSize = $event; fetchTransactions(1)"
    />

    <!-- Modal Form Koreksi Skor Admin -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none font-mono"
    >
      <div class="w-full max-w-lg bg-[#1a140f] border-2 border-[#eab308] rounded p-5 shadow-2xl space-y-4">
        <div class="flex justify-between items-center border-b border-[#4a3624] pb-2.5">
          <h3 class="font-pixel text-xs sm:text-sm text-[#facc15] font-bold flex items-center gap-2">
            <span>⚖️</span>
            <span>FORM KOREKSI SKOR RESMI ADMIN</span>
          </h3>
          <button
            @click="isModalOpen = false"
            class="h-7 w-7 rounded bg-[#2d1b0e] border border-[#5a3a18] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-[11px] text-gray-300 font-sans leading-relaxed">
          Koreksi skor akan ditambahkan sebagai mutasi <code>CORRECTION</code> ke buku besar tanpa mengubah catatan historis sebelumnya. Poin leaderboard mahasiswa & regu akan langsung terbarui secara real-time.
        </p>

        <div class="space-y-3 font-mono text-xs">
          <!-- 1. Cari & Pilih Mahasiswa -->
          <div>
            <label class="block text-gray-300 text-[11px] mb-1 font-sans">
              Pilih Mahasiswa Target *
            </label>
            <div class="relative">
              <input
                v-model="participantSearch"
                type="text"
                placeholder="Ketik Nama atau NIM mahasiswa..."
                class="w-full h-9 pl-3 pr-3 bg-[#130d08] border border-[#523e2b] rounded text-white focus:outline-none focus:border-[#eab308] text-xs font-sans"
              />
            </div>

            <!-- Dropdown Hasil Pencarian Mahasiswa -->
            <div
              v-if="filteredParticipants.length > 0 && !selectedParticipant"
              class="mt-1 max-h-36 overflow-y-auto custom-scrollbar bg-[#130d08] border border-[#523e2b] rounded divide-y divide-[#3a2818]"
            >
              <button
                v-for="p in filteredParticipants.slice(0, 10)"
                :key="p.id"
                @click="selectParticipant(p)"
                type="button"
                class="w-full text-left p-2 hover:bg-[#2b1f15] transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div class="font-bold text-white font-sans">{{ p.fullName }}</div>
                  <div class="text-[10px] text-gray-400">NIM: {{ p.username }} • {{ p.teamName || 'Tanpa Tim' }}</div>
                </div>
                <span class="text-[10px] font-pixel text-[#facc15] border border-[#ca8a04]/40 px-1.5 py-0.5 rounded">
                  PILIH
                </span>
              </button>
            </div>

            <!-- Kartu Mahasiswa Terpilih -->
            <div
              v-if="selectedParticipant"
              class="mt-2 p-2.5 bg-[#251a10] border border-[#eab308] rounded flex items-center justify-between"
            >
              <div>
                <div class="font-bold text-[#facc15] font-sans">{{ selectedParticipant.fullName }}</div>
                <div class="text-[11px] text-gray-300">
                  NIM: {{ selectedParticipant.username }} • Regu: {{ selectedParticipant.teamName || '-' }}
                </div>
              </div>
              <button
                @click="clearSelectedParticipant"
                class="text-[10px] text-red-400 hover:underline font-sans cursor-pointer"
              >
                Ganti
              </button>
            </div>
          </div>

          <!-- 2. Tim (Auto-terisi dari mahasiswa) -->
          <div>
            <label class="block text-gray-300 text-[11px] mb-1 font-sans">
              Tim Terkait:
            </label>
            <input
              :value="selectedParticipant?.teamName || 'Otomatis mengikuti tim mahasiswa'"
              disabled
              class="w-full h-8 px-3 bg-black/40 border border-[#4a3624] text-gray-400 rounded text-xs font-sans"
            />
          </div>

          <!-- 3. Nominal Poin -->
          <div>
            <label class="block text-gray-300 text-[11px] mb-1 font-sans">
              Jumlah Penyesuaian Poin (+ atau -) *
            </label>
            <div class="flex items-center gap-2">
              <input
                type="number"
                v-model.number="correctionForm.amount"
                placeholder="Contoh: 100 atau -50"
                class="w-full h-9 px-3 bg-[#130d08] border border-[#523e2b] rounded text-white focus:outline-none focus:border-[#eab308] font-mono text-sm"
              />
              <span class="text-xs font-pixel text-[#f59e0b] shrink-0">XP POIN</span>
            </div>
            <p class="text-[10px] text-gray-500 mt-1 font-sans">
              Gunakan angka positif (misal: <code>100</code>) untuk menambah, angka negatif (misal: <code>-50</code>) untuk sanksi.
            </p>
          </div>

          <!-- 4. Alasan Koreksi (Wajib) -->
          <div>
            <label class="block text-gray-300 text-[11px] mb-1 font-sans">
              Alasan Resmi Koreksi (Wajib Diisi) *
            </label>
            <textarea
              v-model="correctionForm.reason"
              rows="3"
              placeholder="Jelaskan alasan penyesuaian skor..."
              class="w-full p-2.5 bg-[#130d08] border border-[#523e2b] rounded text-white focus:outline-none focus:border-[#eab308] font-sans text-xs"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[#4a3624]">
          <button
            @click="isModalOpen = false"
            class="pixel-btn h-8 px-3.5 bg-transparent border border-[#523e2b] text-gray-400 font-pixel text-xs cursor-pointer hover:bg-white/5"
          >
            BATAL
          </button>
          <button
            @click="submitCorrection"
            :disabled="submitting || !correctionForm.participantId || !correctionForm.amount || !correctionForm.reason.trim()"
            class="pixel-btn h-8 px-4 bg-[#ca8a04] hover:bg-[#eab308] text-black font-pixel text-xs font-bold rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'MENYIMPAN...' : 'SIMPAN KOREKSI SKOR' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ScrollText,
  Plus,
  Search,
  RotateCw,
  CheckCircle2,
  X,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CheckSquare,
} from 'lucide-vue-next';
import PixelPagination from '@/components/PixelPagination.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const api = useApi();
const toast = useToast();

const transactions = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const isModalOpen = ref(false);

const selectedTxIds = ref<string[]>([]);

const meta = ref({
  page: 1,
  pageSize: 25,
  total: 0,
});

const filters = ref({
  sourceType: '',
});

const searchQuery = ref('');

// Form Koreksi
const correctionForm = ref({
  participantId: '',
  teamId: '',
  amount: 0,
  reason: '',
});

// Autocomplete Mahasiswa
const participantsList = ref<any[]>([]);
const participantSearch = ref('');
const selectedParticipant = ref<any | null>(null);

const correctionCount = computed(() => {
  return transactions.value.filter((t) => t.sourceType === 'CORRECTION').length;
});

const totalPointsDistributed = computed(() => {
  return transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
});

const filteredTransactions = computed(() => {
  if (!searchQuery.value.trim()) return transactions.value;
  const q = searchQuery.value.toLowerCase().trim();
  return transactions.value.filter((t) => {
    return (
      (t.participantName && t.participantName.toLowerCase().includes(q)) ||
      (t.participantUsername && t.participantUsername.toLowerCase().includes(q)) ||
      (t.teamName && t.teamName.toLowerCase().includes(q)) ||
      (t.reason && t.reason.toLowerCase().includes(q))
    );
  });
});

const isAllSelected = computed(() => {
  if (filteredTransactions.value.length === 0) return false;
  return filteredTransactions.value.every((tx) => selectedTxIds.value.includes(tx.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedTxIds.value = selectedTxIds.value.filter(
      (id) => !filteredTransactions.value.some((tx) => tx.id === id)
    );
  } else {
    const toAdd = filteredTransactions.value
      .map((tx) => tx.id)
      .filter((id) => !selectedTxIds.value.includes(id));
    selectedTxIds.value.push(...toAdd);
  }
}

function toggleSelect(id: string) {
  const idx = selectedTxIds.value.indexOf(id);
  if (idx > -1) {
    selectedTxIds.value.splice(idx, 1);
  } else {
    selectedTxIds.value.push(id);
  }
}

const filteredParticipants = computed(() => {
  if (!participantSearch.value.trim()) return [];
  const q = participantSearch.value.toLowerCase().trim();
  return participantsList.value.filter((p) => {
    return (
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.username && p.username.toLowerCase().includes(q))
    );
  });
});

const fetchTransactions = async (page = meta.value.page) => {
  loading.value = true;
  meta.value.page = page;
  try {
    const params: Record<string, any> = {
      page: meta.value.page,
      pageSize: meta.value.pageSize,
    };
    if (filters.value.sourceType) {
      params.sourceType = filters.value.sourceType;
    }

    const res: any = await api.get('/api/scores/transactions', params);
    if (res?.success && Array.isArray(res.data)) {
      transactions.value = res.data;
      if (res.meta) {
        meta.value.total = res.meta.total;
      }
    }
  } catch (err: any) {
    console.error('Gagal mengambil data transaksi skor:', err);
    toast.error('Gagal memuat transaksi: ' + (err.data?.error?.message || err.message));
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  fetchTransactions(1);
};

const handleFilterChange = () => {
  fetchTransactions(1);
};

function exportSelectedCsv() {
  const toExport = transactions.value.filter((tx) => selectedTxIds.value.includes(tx.id));
  if (toExport.length === 0) return;
  generateCsvDownload(toExport, `ledger-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${toExport.length} data ledger terpilih.`);
}

function exportAllCsv() {
  if (filteredTransactions.value.length === 0) {
    toast.warning('Tidak ada data ledger untuk diexport.');
    return;
  }
  generateCsvDownload(filteredTransactions.value, `point-ledger-export-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh data ledger (${filteredTransactions.value.length} baris).`);
}

function generateCsvDownload(rows: any[], filename: string) {
  const headers = ['Waktu', 'Nama Mahasiswa', 'NIM', 'Tim', 'Tipe Sumber', 'Alasan', 'Stage', 'Mutasi Poin'];
  const csvContent = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${formatDateTime(r.createdAt)}"`,
        `"${(r.participantName || '').replace(/"/g, '""')}"`,
        `"${r.participantUsername || ''}"`,
        `"${(r.teamName || 'Individu').replace(/"/g, '""')}"`,
        `"${r.sourceType || ''}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${(r.stageName || '').replace(/"/g, '""')}"`,
        `"${r.amount || 0}"`,
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const fetchParticipantsForModal = async () => {
  try {
    const res: any = await api.get('/api/users', { role: 'PARTICIPANT', pageSize: 150 });
    if (res?.success && Array.isArray(res.data)) {
      participantsList.value = res.data;
    }
  } catch (err) {
    console.error('Gagal memuat peserta untuk modal koreksi:', err);
  }
};

const openCorrectionModal = async () => {
  correctionForm.value = {
    participantId: '',
    teamId: '',
    amount: 0,
    reason: '',
  };
  selectedParticipant.value = null;
  participantSearch.value = '';
  isModalOpen.value = true;
  if (participantsList.value.length === 0) {
    await fetchParticipantsForModal();
  }
};

const selectParticipant = (p: any) => {
  selectedParticipant.value = p;
  correctionForm.value.participantId = p.id;
  correctionForm.value.teamId = p.teamId || '';
  participantSearch.value = '';
};

const clearSelectedParticipant = () => {
  selectedParticipant.value = null;
  correctionForm.value.participantId = '';
  correctionForm.value.teamId = '';
};

const submitCorrection = async () => {
  if (!correctionForm.value.participantId) {
    toast.warning('Pilih mahasiswa target terlebih dahulu.');
    return;
  }
  if (!correctionForm.value.amount) {
    toast.warning('Nominal poin penyesuaian wajib diisi.');
    return;
  }
  if (!correctionForm.value.reason.trim()) {
    toast.warning('Alasan koreksi skor wajib diisi.');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      participantId: correctionForm.value.participantId,
      teamId: correctionForm.value.teamId || '00000000-0000-0000-0000-000000000000',
      amount: Number(correctionForm.value.amount),
      reason: correctionForm.value.reason.trim(),
    };

    const res: any = await api.post('/api/scores/correction', payload);
    if (!res?.success) {
      toast.error(res?.error?.message || 'Gagal menyimpan koreksi skor.');
      return;
    }

    toast.success('Koreksi skor berhasil dicatat ke buku besar.');
    isModalOpen.value = false;
    await fetchTransactions(1);
  } catch (err: any) {
    toast.error(err?.data?.error?.message || err?.message || 'Gagal menyimpan koreksi skor.');
  } finally {
    submitting.value = false;
  }
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

onMounted(() => {
  fetchTransactions();
});
</script>
