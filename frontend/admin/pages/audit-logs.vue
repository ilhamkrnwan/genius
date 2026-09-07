<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        @click="exportAllCsv"
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] flex items-center gap-1.5 hover:bg-[#1f3822] cursor-pointer"
        title="Export Data Audit Log CSV"
      >
        <Download class="w-3.5 h-3.5 text-[#4ade80]" />
        <span class="hidden sm:inline font-pixel">EXPORT (CSV)</span>
      </button>

      <button
        @click="handleRefresh"
        :disabled="loading"
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
        title="Segarkan Log Audit"
      >
        <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
      </button>
    </TopbarActions>

    <!-- Subtitle / Info Header -->
    <div class="px-4 md:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#4a3624]/60 text-xs text-muted-foreground bg-[#15100c] shrink-0">
      <div>
        <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
          <History class="h-4 w-4 text-[#facc15]" />
          <span>SECURITY & OPERATIONAL AUDIT TRAIL</span>
        </h1>
        <p class="text-[11px] text-gray-400 mt-0.5">
          Pencatatan real-time seluruh aktivitas otentikasi, alokasi tim, koreksi skor, dan aksi krusial platform.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="border border-[#ca8a04]/40 bg-[#2b2014] px-2.5 py-1 text-[10px] font-pixel text-[#facc15] flex items-center gap-1.5">
          <ShieldAlert class="h-3.5 w-3.5 text-[#f59e0b]" />
          SECURITY AUDIT
        </span>
      </div>
    </div>

    <!-- Stats HUD Cards (Compact Top Deck) -->
    <div class="px-4 md:px-6 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-[#3d2a1b] bg-[#120d09] shrink-0">
      <div class="p-2 border border-[#523e2b] bg-[#1a140f] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-gray-400 uppercase block">TOTAL LOG AKTIVITAS</span>
          <span class="font-pixel text-base text-foreground font-bold">{{ meta.total || 0 }}</span>
        </div>
        <span class="text-[10px] text-muted-foreground">📜 Server</span>
      </div>

      <div class="p-2 border border-rose-800 bg-[#201010] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-rose-400 uppercase block">AKSI ADMIN</span>
          <span class="font-pixel text-base text-rose-400 font-bold">{{ adminActionCount }}</span>
        </div>
        <span class="text-[10px] text-rose-300/80">👑 Koreksi</span>
      </div>

      <div class="p-2 border border-[#16a34a] bg-[#132215] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#4ade80] uppercase block">AKSI BUDDY</span>
          <span class="font-pixel text-base text-[#4ade80] font-bold">{{ buddyActionCount }}</span>
        </div>
        <span class="text-[10px] text-[#86efac]">🛡️ Evaluasi</span>
      </div>

      <div class="p-2 border border-[#0284c7] bg-[#0c1a24] rounded flex items-center justify-between">
        <div>
          <span class="text-[8px] font-pixel text-[#38bdf8] uppercase block">INTEGRITAS LOG</span>
          <div class="font-pixel text-[10px] text-[#38bdf8] font-bold flex items-center gap-1 mt-0.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>TERENKRIPSI</span>
          </div>
        </div>
        <span class="text-[9px] text-[#7dd3fc]">🔒 Standar Kampus</span>
      </div>
    </div>

    <!-- Sticky Top Pixel Toolbar (Flush nempel Topbar) -->
    <div class="pixel-toolbar-sticky px-4 md:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f59e0b]" />
        <input
          v-model="search"
          @input="debounceSearch"
          type="text"
          placeholder="Cari Aksi, Nama Aktor, atau Sasaran Target..."
          class="w-full h-7 pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
        />
      </div>

      <div class="flex items-center gap-2 text-xs">
        <!-- Filter Peran Aktor -->
        <select
          v-model="roleFilter"
          class="h-7 bg-[#1d1611] border border-[#523e2b] px-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
        >
          <option value="">Semua Peran Aktor</option>
          <option value="ADMIN">ADMIN (Super Admin)</option>
          <option value="BUDDY">BUDDY (Pendamping Regu)</option>
          <option value="PARTICIPANT">PARTICIPANT (Mahasiswa)</option>
        </select>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div
      v-if="selectedLogIds.length > 0"
      class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
    >
      <div class="flex items-center gap-2 text-[#f59e0b]">
        <CheckSquare class="h-4 w-4" />
        <span><b>{{ selectedLogIds.length }}</b> log aktivitas terpilih</span>
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
          @click="selectedLogIds = []"
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
            <th class="p-3">AKTOR / PELAKU</th>
            <th class="p-3 text-center">PERAN</th>
            <th class="p-3">JENIS AKSI</th>
            <th class="p-3">SASARAN TARGET</th>
            <th class="p-3">RINCIAN DATA</th>
            <th class="pr-4 md:pr-6 pl-3 py-3 text-right w-16">DETAIL</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#3d2d1e]/60">
          <tr v-if="loading" class="text-center text-gray-500">
            <td colspan="8" class="p-8">
              <div class="flex items-center justify-center gap-2 text-gray-400">
                <RotateCw class="w-4 h-4 animate-spin text-[#f59e0b]" />
                <span>Memuat log aktivitas server...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredLogs.length === 0" class="text-center text-gray-500">
            <td colspan="8" class="p-8 text-gray-400">
              Tidak ada catatan audit log yang sesuai dengan filter.
            </td>
          </tr>
          <tr
            v-for="log in filteredLogs"
            :key="log.id"
            :class="[
              'hover:bg-[#271d15]/50 transition-colors',
              selectedLogIds.includes(log.id) ? 'bg-[#3b2716]/30' : ''
            ]"
          >
            <!-- Checkbox -->
            <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
              <input
                type="checkbox"
                :checked="selectedLogIds.includes(log.id)"
                @change="toggleSelect(log.id)"
                class="accent-[#f59e0b] cursor-pointer"
              />
            </td>

            <!-- Waktu -->
            <td class="p-3 text-gray-400 whitespace-nowrap text-[11px]">
              {{ formatDateTime(log.createdAt) }}
            </td>

            <!-- Aktor -->
            <td class="p-3 whitespace-nowrap">
              <div class="font-sans font-bold text-foreground text-xs">
                {{ log.actorName || 'System Automated' }}
              </div>
              <span v-if="log.actorUsername" class="text-gray-400 font-mono text-[10px] block mt-0.5">
                @{{ log.actorUsername }}
              </span>
            </td>

            <!-- Peran -->
            <td class="p-3 text-center">
              <span
                class="px-2 py-0.5 text-[9px] font-pixel border inline-flex items-center gap-1"
                :class="{
                  'bg-[#220d0d] text-[#fca5a5] border-rose-800': log.actorRole === 'ADMIN',
                  'bg-[#132215] text-[#86efac] border-[#16a34a]': log.actorRole === 'BUDDY',
                  'bg-[#0c1a24] text-[#7dd3fc] border-[#0284c7]': log.actorRole === 'PARTICIPANT',
                  'bg-[#1a140f] text-gray-400 border-gray-700': !log.actorRole || log.actorRole === 'SYSTEM',
                }"
              >
                {{ log.actorRole || 'SYSTEM' }}
              </span>
            </td>

            <!-- Aksi -->
            <td class="p-3">
              <span class="font-pixel text-[10px] text-[#facc15]">
                {{ log.action }}
              </span>
            </td>

            <!-- Sasaran -->
            <td class="p-3 text-gray-300 font-sans">
              <span v-if="log.targetType" class="border border-[#4a3624] bg-[#221812] px-1.5 py-0.5 text-[10px] font-pixel text-amber-300/80">
                {{ log.targetType }}
              </span>
              <span v-else class="text-gray-500">-</span>
            </td>

            <!-- Rincian Singkat -->
            <td class="p-3 font-sans text-gray-400 max-w-xs truncate text-[11px]">
              {{ formatDetails(log.details) }}
            </td>

            <!-- Tombol Detail -->
            <td class="pr-4 md:pr-6 pl-3 py-3 text-right">
              <button
                @click="openDetailModal(log)"
                class="pixel-btn h-7 px-2.5 bg-[#271d15] text-[#f59e0b] border border-[#523e2b] hover:border-[#f59e0b] text-[10px] font-pixel rounded cursor-pointer transition-all flex items-center gap-1 ml-auto"
              >
                <Eye class="w-3 h-3" />
                <span>LIHAT</span>
              </button>
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
      @update:current-page="fetchLogs($event)"
      @update:page-size="meta.pageSize = $event; fetchLogs(1)"
    />

    <!-- Modal Detail Log JSON Viewer -->
    <div
      v-if="selectedLog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none font-mono"
    >
      <div class="w-full max-w-xl bg-[#1a140f] border-2 border-[#f59e0b] rounded p-5 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#4a3624] pb-2.5">
          <div>
            <h3 class="font-pixel text-xs sm:text-sm text-[#facc15] font-bold flex items-center gap-2">
              <ShieldAlert class="w-4 h-4 text-[#f59e0b]" />
              <span>RINCIAN LOG AUDIT SISTEM</span>
            </h3>
            <p class="text-[11px] text-gray-400 font-sans mt-0.5">
              ID Log: {{ selectedLog.id }}
            </p>
          </div>
          <button
            @click="selectedLog = null"
            class="h-7 w-7 rounded bg-[#2d1b0e] border border-[#5a3a18] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded space-y-0.5">
            <span class="text-[9px] text-gray-400 font-pixel uppercase block">Aktor:</span>
            <div class="font-bold text-white font-sans">{{ selectedLog.actorName || 'System' }}</div>
            <div class="text-[10px] text-gray-400">@{{ selectedLog.actorUsername || '-' }} ({{ selectedLog.actorRole || 'SYSTEM' }})</div>
          </div>

          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded space-y-0.5">
            <span class="text-[9px] text-gray-400 font-pixel uppercase block">Aksi & Waktu:</span>
            <div class="font-pixel text-xs text-[#facc15]">{{ selectedLog.action }}</div>
            <div class="text-[10px] text-gray-400">{{ formatDateTime(selectedLog.createdAt) }}</div>
          </div>

          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded space-y-0.5">
            <span class="text-[9px] text-gray-400 font-pixel uppercase block">Sasaran Target:</span>
            <div class="text-white font-sans">{{ selectedLog.targetType || '-' }}</div>
            <div class="text-[10px] text-gray-400 truncate">ID: {{ selectedLog.targetId || '-' }}</div>
          </div>

          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded space-y-0.5">
            <span class="text-[9px] text-gray-400 font-pixel uppercase block">Alamat IP:</span>
            <div class="text-white font-mono">{{ selectedLog.ipAddress || 'LAN-local' }}</div>
          </div>
        </div>

        <!-- JSON Payload Inspector -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-pixel text-gray-400 uppercase">Payload Data JSON (Details):</span>
            <span class="text-[10px] text-emerald-400 font-mono">Immutable Recorded State</span>
          </div>
          <pre class="p-3 bg-[#110c08] border border-[#4a301a] rounded text-xs text-[#86efac] font-mono overflow-x-auto max-h-48 custom-scrollbar leading-relaxed">{{ prettyJson(selectedLog.details) }}</pre>
        </div>

        <div class="text-right pt-2 border-t border-[#4a3624]">
          <button
            @click="selectedLog = null"
            class="pixel-btn h-8 px-4 bg-[#ca8a04] text-black font-pixel text-xs font-bold rounded cursor-pointer hover:bg-[#eab308]"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  History,
  ShieldAlert,
  Search,
  RotateCw,
  CheckCircle2,
  X,
  Eye,
  Download,
  CheckSquare,
} from 'lucide-vue-next';
import PixelPagination from '@/components/PixelPagination.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const api = useApi();
const toast = useToast();

const logs = ref<any[]>([]);
const loading = ref(false);
const search = ref('');
const roleFilter = ref('');
const selectedLog = ref<any | null>(null);
const selectedLogIds = ref<string[]>([]);
let searchTimeout: any = null;

const meta = ref({
  page: 1,
  pageSize: 25,
  total: 0,
});

const adminActionCount = computed(() => {
  return logs.value.filter((l) => l.actorRole === 'ADMIN').length;
});

const buddyActionCount = computed(() => {
  return logs.value.filter((l) => l.actorRole === 'BUDDY').length;
});

const filteredLogs = computed(() => {
  let list = logs.value;
  if (roleFilter.value) {
    list = list.filter((l) => l.actorRole === roleFilter.value);
  }
  return list;
});

const isAllSelected = computed(() => {
  if (filteredLogs.value.length === 0) return false;
  return filteredLogs.value.every((log) => selectedLogIds.value.includes(log.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedLogIds.value = selectedLogIds.value.filter(
      (id) => !filteredLogs.value.some((log) => log.id === id)
    );
  } else {
    const toAdd = filteredLogs.value
      .map((log) => log.id)
      .filter((id) => !selectedLogIds.value.includes(id));
    selectedLogIds.value.push(...toAdd);
  }
}

function toggleSelect(id: string) {
  const idx = selectedLogIds.value.indexOf(id);
  if (idx > -1) {
    selectedLogIds.value.splice(idx, 1);
  } else {
    selectedLogIds.value.push(id);
  }
}

const fetchLogs = async (page = meta.value.page) => {
  loading.value = true;
  meta.value.page = page;
  try {
    const params: Record<string, any> = {
      page: meta.value.page,
      pageSize: meta.value.pageSize,
    };
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res: any = await api.get('/api/audit-logs', params);
    if (res?.success && Array.isArray(res.data)) {
      logs.value = res.data;
      if (res.meta) {
        meta.value.total = res.meta.total;
      }
    }
  } catch (err: any) {
    console.error('Gagal memuat data audit log:', err);
    toast.error('Gagal memuat data log: ' + (err.data?.error?.message || err.message));
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  fetchLogs(1);
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchLogs(1);
  }, 300);
};

function exportSelectedCsv() {
  const toExport = logs.value.filter((l) => selectedLogIds.value.includes(l.id));
  if (toExport.length === 0) return;
  generateCsvDownload(toExport, `audit-logs-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${toExport.length} data audit log terpilih.`);
}

function exportAllCsv() {
  if (filteredLogs.value.length === 0) {
    toast.warning('Tidak ada data audit log untuk diexport.');
    return;
  }
  generateCsvDownload(filteredLogs.value, `audit-logs-export-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh data audit log (${filteredLogs.value.length} baris).`);
}

function generateCsvDownload(rows: any[], filename: string) {
  const headers = ['Waktu', 'Nama Aktor', 'Username', 'Peran', 'Jenis Aksi', 'Sasaran Target', 'Target ID', 'Alamat IP', 'Rincian'];
  const csvContent = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${formatDateTime(r.createdAt)}"`,
        `"${(r.actorName || 'System').replace(/"/g, '""')}"`,
        `"${r.actorUsername || ''}"`,
        `"${r.actorRole || 'SYSTEM'}"`,
        `"${(r.action || '').replace(/"/g, '""')}"`,
        `"${(r.targetType || '').replace(/"/g, '""')}"`,
        `"${r.targetId || ''}"`,
        `"${r.ipAddress || ''}"`,
        `"${formatDetails(r.details).replace(/"/g, '""')}"`,
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

const openDetailModal = (log: any) => {
  selectedLog.value = log;
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

const formatDetails = (details: any) => {
  if (!details) return '-';
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details);
  } catch {
    return '-';
  }
};

const prettyJson = (details: any) => {
  if (!details) return '{}';
  try {
    if (typeof details === 'string') {
      return JSON.stringify(JSON.parse(details), null, 2);
    }
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
};

onMounted(() => {
  fetchLogs();
});
</script>