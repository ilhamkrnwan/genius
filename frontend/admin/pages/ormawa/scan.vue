<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono">
    <TopbarActions>
      <button type="button" :disabled="loading" class="pixel-btn h-8 px-3 text-xs font-bold bg-[#271d15] text-[#facc15] border-[#ca8a04] flex items-center gap-1.5 disabled:opacity-50" @click="loadDashboard">
        <RefreshCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
        <span class="hidden sm:inline font-pixel">REFRESH</span>
      </button>
    </TopbarActions>

    <div class="px-4 md:px-6 pt-4 pb-3 border-b border-[#4a3624]/60 space-y-3">
      <div>
        <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
          <Store class="h-4 w-4 text-[#c084fc]" /> PORTAL PIC ORMAWA
        </h1>
        <p class="text-[11px] text-gray-400 mt-1">Kelola stamp kunjungan, informasi stan, dan calon anggota dari satu halaman.</p>
      </div>
      <div v-if="activeBooth" class="flex flex-wrap gap-2 text-[10px]">
        <span class="border border-[#ca8a04]/50 bg-[#2b2014] px-2 py-1 text-[#facc15] font-pixel">{{ activeBooth.shortName || activeBooth.name }}</span>
        <span class="border border-[#16a34a]/50 bg-[#132718] px-2 py-1 text-[#86efac]">{{ activeBooth.category }}</span>
        <span class="border border-[#523e2b] bg-[#18110c] px-2 py-1 text-gray-300">Hall Lantai 6 · {{ activeBooth.boothNumber || 'Nomor stan belum diisi' }}</span>
      </div>
      <div class="grid grid-cols-3 gap-2 max-w-2xl">
        <button v-for="item in tabs" :key="item.id" type="button" class="h-9 border font-pixel text-[9px] sm:text-[10px] flex items-center justify-center gap-1.5 transition-colors" :class="activeTab === item.id ? 'bg-[#713f12] border-[#facc15] text-[#fef08a]' : 'bg-[#18110c] border-[#523e2b] text-gray-400 hover:text-white'" @click="activeTab = item.id">
          <component :is="item.icon" class="h-3.5 w-3.5" /> {{ item.label }}
        </button>
      </div>
    </div>

    <div class="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="pageError" class="mb-4 p-3 border border-red-500 bg-red-950/40 text-red-200 text-xs rounded">{{ pageError }}</div>

      <section v-if="activeTab === 'scanner'" class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="space-y-4">
          <div v-if="cameraMessage" class="p-4 border rounded-lg text-xs space-y-2" :class="cameraPermissionDenied ? 'border-amber-500 bg-amber-950/40 text-amber-100' : 'border-red-500 bg-red-950/40 text-red-100'">
            <div class="flex items-start gap-2">
              <AlertTriangle class="h-4 w-4 mt-0.5 shrink-0" />
              <div class="space-y-1">
                <p class="font-bold">{{ cameraMessage }}</p>
                <p v-if="cameraPermissionDenied" class="text-[10px] opacity-80">Chrome Android: tekan ikon di kiri alamat → Izin → Kamera → Izinkan. Safari iPhone: tekan aA → Pengaturan Situs Web → Kamera → Izinkan. Setelah itu tekan tombol kamera lagi.</p>
                <p v-else-if="cameraIssue === 'insecure-context'" class="text-[10px] opacity-80">Buka tautan scanner yang diawali <strong>https://</strong>. Browser akan menampilkan permintaan izin kamera saat tombol di bawah ditekan.</p>
              </div>
            </div>
          </div>
          <div class="pixel-card p-4 border border-[#523e2b] bg-[#1a140f] space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2"><QrCode class="h-4 w-4 text-[#facc15]" /><span class="font-pixel text-[10px] text-[#facc15]">SCAN QR MABA</span></div>
              <span v-if="isScannerActive" class="text-[9px] text-green-300 flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> KAMERA AKTIF</span>
            </div>
            <div class="relative w-full aspect-square max-w-[360px] mx-auto bg-black border-2 rounded-xl overflow-hidden flex items-center justify-center" :class="isScannerActive ? 'border-[#22c55e]' : 'border-dashed border-[#523e2b]'">
              <video ref="videoElement" class="absolute inset-0 h-full w-full object-cover" muted playsinline />
              <div v-if="!isScannerActive" class="relative z-10 text-center space-y-3 p-5 bg-black/80 rounded-xl">
                <Camera class="h-14 w-14 text-amber-400/30 mx-auto" />
                <p class="text-[10px] text-amber-200/70">Tekan tombol di bawah untuk membuka kamera</p>
              </div>
              <div v-else class="absolute inset-4 border-2 border-green-400/80 rounded-lg pointer-events-none"><span class="scan-line" /></div>
            </div>
            <button type="button" :disabled="!activeBooth || isProcessing || !!cameraIssue" class="w-full pixel-btn min-h-11 px-3 py-2 font-pixel text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-2 disabled:opacity-40" :class="isScannerActive ? 'bg-[#7f1d1d] border-[#ef4444] text-[#fecaca]' : 'bg-[#14532d] border-[#22c55e] text-[#bbf7d0]'" @click="toggleScanner">
              <XCircle v-if="isScannerActive" class="h-4 w-4" /><ScanLine v-else class="h-4 w-4" />{{ scannerButtonLabel }}
            </button>
            <div class="space-y-1.5 pt-2 border-t border-[#3d2a1b]">
              <label class="text-[9px] font-pixel text-gray-400">INPUT NIM MANUAL</label>
              <div class="flex gap-2">
                <input v-model="manualNim" type="text" inputmode="numeric" placeholder="Contoh: 26111101" class="flex-1 min-w-0 bg-[#0d0a07] border border-[#523e2b] focus:border-[#facc15] rounded px-3 py-2 text-xs text-amber-100 outline-none" @keydown.enter="submitManualScan" />
                <button type="button" :disabled="!manualNim.trim() || isProcessing" class="pixel-btn px-4 bg-[#ca8a04] border-[#facc15] text-black disabled:opacity-40" @click="submitManualScan"><Loader2 v-if="isProcessing" class="h-4 w-4 animate-spin" /><Check v-else class="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div v-if="lastScanResult" class="p-4 rounded-lg border-2 text-xs space-y-1.5" :class="lastScanResult.success ? 'bg-[#0d1f10] border-[#22c55e] text-[#bbf7d0]' : 'bg-[#200d0d] border-[#ef4444] text-[#fecaca]'">
            <div class="font-pixel text-[10px] flex items-center gap-2"><CheckCircle2 v-if="lastScanResult.success" class="h-4 w-4" /><AlertTriangle v-else class="h-4 w-4" />{{ lastScanResult.success ? 'STAMP BERHASIL' : 'STAMP GAGAL' }}</div>
            <p>{{ lastScanResult.message }}</p><p v-if="lastScanResult.success" class="text-[#facc15] font-bold">+{{ lastScanResult.xpEarned }} XP</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <MetricCard label="Kunjungan" :value="visitors.length" color="green" />
            <MetricCard label="Hari Ini" :value="todayScans.length" color="amber" />
            <MetricCard label="Peminat" :value="interests.length" color="purple" />
          </div>
          <div class="pixel-card border border-[#523e2b] bg-[#1a140f] overflow-hidden">
            <div class="px-3 py-2 border-b border-[#3d2613] flex items-center justify-between"><span class="font-pixel text-[10px] text-amber-300">RIWAYAT STAMP</span><span class="text-[9px] text-gray-500">{{ visitors.length }} mahasiswa</span></div>
            <div class="max-h-[520px] overflow-y-auto custom-scrollbar">
              <div v-if="visitors.length === 0" class="p-8 text-center text-[10px] text-gray-500">Belum ada mahasiswa yang mendapat stamp.</div>
              <div v-for="scan in visitors" :key="scan.scanId" class="px-3 py-3 border-b border-[#2a1d12] last:border-0 flex items-center justify-between gap-3">
                <div class="min-w-0"><p class="text-xs text-amber-100 font-bold truncate">{{ scan.fullName }}</p><p class="text-[10px] text-gray-500">{{ scan.username }} · {{ formatDateTime(scan.scannedAt) }}</p></div>
                <span class="text-[9px] font-pixel text-[#facc15] shrink-0">+{{ scan.xpEarned }} XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'profile'" class="max-w-4xl">
        <form class="pixel-card p-4 md:p-5 border border-[#523e2b] bg-[#1a140f] space-y-4" @submit.prevent="saveProfile">
          <div class="flex items-start justify-between gap-4 border-b border-[#3d2a1b] pb-3">
            <div><h2 class="font-pixel text-[11px] text-[#facc15]">EDIT INFORMASI KARTU ORMAWA</h2><p class="text-[10px] text-gray-400 mt-1">Perubahan langsung digunakan pada halaman maba.</p></div>
            <button type="submit" :disabled="savingProfile" class="pixel-btn h-9 px-4 bg-[#14532d] border-[#22c55e] text-[#bbf7d0] font-pixel text-[9px] disabled:opacity-50 flex items-center gap-2"><Loader2 v-if="savingProfile" class="h-3.5 w-3.5 animate-spin" /><Save v-else class="h-3.5 w-3.5" /> SIMPAN</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nama lengkap" class="md:col-span-2"><input v-model="profileForm.name" required class="form-input" /></FormField>
            <FormField label="Nama singkat"><input v-model="profileForm.shortName" class="form-input" /></FormField>
            <FormField label="Kategori"><input v-model="profileForm.category" required class="form-input" /></FormField>
            <FormField label="Nomor stan"><input v-model="profileForm.boothNumber" class="form-input" placeholder="E6-13" /></FormField>
            <FormField label="Tagline" class="md:col-span-2"><input v-model="profileForm.tagline" class="form-input" placeholder="Kalimat singkat di bawah nama organisasi" /></FormField>
            <FormField label="Deskripsi" class="md:col-span-2"><textarea v-model="profileForm.description" rows="4" class="form-input resize-y" /></FormField>
            <FormField label="Cara dapat stamp (satu langkah per baris)" class="md:col-span-2"><textarea v-model="profileForm.stampInstructionsText" rows="5" class="form-input resize-y" placeholder="Datangi stan kami&#10;Selesaikan misi dari PIC&#10;Tunjukkan QR profil untuk dipindai" /><p class="mt-1.5 text-[9px] text-gray-500">Urutan baris otomatis tampil sebagai langkah 1, 2, 3, dan seterusnya di aplikasi maba.</p></FormField>
            <FormField label="Kegiatan utama (satu per baris)"><textarea v-model="profileForm.activitiesText" rows="5" class="form-input resize-y" /></FormField>
            <FormField label="Syarat bergabung (satu per baris)"><textarea v-model="profileForm.requirementsText" rows="5" class="form-input resize-y" /></FormField>
            <FormField label="Nama narahubung"><input v-model="profileForm.contactPerson" class="form-input" placeholder="Nama PIC" /></FormField>
            <FormField label="Nomor WhatsApp"><input v-model="profileForm.contactPhone" type="tel" class="form-input" placeholder="085157484489" /></FormField>
            <FormField label="Instagram"><input v-model="profileForm.instagram" class="form-input" placeholder="@nama_akun atau URL" /></FormField>
            <LogoUploadField v-model="profileForm.logoUrl" />
          </div>
        </form>
      </section>

      <section v-else class="space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-3"><div><h2 class="font-pixel text-[11px] text-[#facc15]">MAHASISWA BERMINAT GABUNG</h2><p class="text-[10px] text-gray-400 mt-1">Data formulir yang dikirim maba untuk stan Anda.</p></div><div class="flex flex-col sm:flex-row gap-2"><input v-model="interestSearch" class="form-input sm:w-64" placeholder="Cari nama atau NIM..." /><button type="button" :disabled="interests.length === 0" class="pixel-btn min-h-10 px-4 bg-[#14532d] border-[#22c55e] text-[#bbf7d0] font-pixel text-[9px] flex items-center justify-center gap-2 disabled:opacity-40" @click="exportInterests"><Download class="h-4 w-4" /> EXPORT SPREADSHEET</button></div></div>
        <div v-if="filteredInterests.length === 0" class="pixel-card p-8 border border-[#523e2b] bg-[#1a140f] text-center text-xs text-gray-500">Belum ada formulir minat yang masuk.</div>
        <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article v-for="interest in filteredInterests" :key="interest.id" class="pixel-card p-4 border border-[#523e2b] bg-[#1a140f] space-y-3">
            <div class="flex items-start justify-between gap-3"><div class="min-w-0"><h3 class="text-sm font-bold text-amber-100 truncate">{{ interest.fullName }}</h3><p class="text-[10px] text-gray-500">NIM {{ interest.username }} · {{ formatDateTime(interest.createdAt) }}</p></div><span class="text-[9px] text-[#facc15] font-pixel">+{{ interest.xpBonusEarned || 0 }} XP</span></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]"><div class="bg-[#120d08] border border-[#3d2a1b] rounded p-2.5"><p class="text-[9px] text-gray-500 mb-1">MOTIVASI</p><p class="text-gray-200 whitespace-pre-wrap">{{ interest.motivation || 'Tidak diisi' }}</p></div><div class="bg-[#120d08] border border-[#3d2a1b] rounded p-2.5"><p class="text-[9px] text-gray-500 mb-1">PENGALAMAN</p><p class="text-gray-200 whitespace-pre-wrap">{{ interest.experience || 'Tidak diisi' }}</p></div></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a v-if="interest.whatsappUrl" :href="interest.whatsappUrl" target="_blank" rel="noopener noreferrer" class="min-h-10 bg-[#14532d] hover:bg-[#166534] border border-[#22c55e] text-[#bbf7d0] rounded px-3 flex items-center justify-center gap-2 font-pixel text-[8px]"><MessageCircle class="h-4 w-4 shrink-0" /> WHATSAPP · {{ interest.whatsappNumber }}</a>
              <a v-if="interest.instagramUrl" :href="interest.instagramUrl" target="_blank" rel="noopener noreferrer" class="min-h-10 bg-[#4c1d5f] hover:bg-[#581c87] border border-[#d946ef] text-[#fae8ff] rounded px-3 flex items-center justify-center gap-2 font-pixel text-[8px]"><Instagram class="h-4 w-4 shrink-0" /> INSTAGRAM · @{{ interest.instagramUsername }}</a>
            </div>
          </article>
        </div>
      </section>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { BrowserQRCodeReader } from '@zxing/browser';
import { AlertTriangle, Camera, Check, CheckCircle2, Download, Instagram, Loader2, MessageCircle, QrCode, RefreshCw, Save, ScanLine, Store, UserRoundPen, Users, XCircle } from 'lucide-vue-next';
import TopbarActions from '~/components/TopbarActions.vue';
import MetricCard from '~/components/ormawa/MetricCard.vue';
import FormField from '~/components/ormawa/FormField.vue';
import LogoUploadField from '~/components/ormawa/LogoUploadField.vue';
import { useApi } from '~/composables/useApi';
import { useToast } from '~/composables/useToast';
import { detectBrowserCameraIssue, type CameraIssue } from '~/utils/camera-support';

type TabId = 'scanner' | 'profile' | 'interests';
const api = useApi();
const toast = useToast();
const activeTab = ref<TabId>('scanner');
const tabs = [{ id: 'scanner' as const, label: 'SCANNER', icon: ScanLine }, { id: 'profile' as const, label: 'EDIT INFO', icon: UserRoundPen }, { id: 'interests' as const, label: 'PEMINAT', icon: Users }];
const loading = ref(false);
const pageError = ref('');
const activeBooth = ref<any>(null);
const visitors = ref<any[]>([]);
const interests = ref<any[]>([]);
const interestSearch = ref('');
const videoElement = ref<HTMLVideoElement | null>(null);
const isScannerActive = ref(false);
const isProcessing = ref(false);
const cameraIssue = ref<CameraIssue>(null);
const cameraPermissionDenied = ref(false);
const manualNim = ref('');
const lastScanResult = ref<{ success: boolean; message: string; xpEarned: number } | null>(null);
let scannerControls: { stop: () => void } | null = null;
let codeReader: BrowserQRCodeReader | null = null;
const savingProfile = ref(false);
const profileForm = reactive({ name: '', shortName: '', category: '', boothNumber: '', tagline: '', description: '', stampInstructionsText: '', activitiesText: '', requirementsText: '', contactPerson: '', contactPhone: '', instagram: '', logoUrl: '' });

const todayScans = computed(() => { const today = new Date().toDateString(); return visitors.value.filter((scan) => new Date(scan.scannedAt).toDateString() === today); });
const filteredInterests = computed(() => { const query = interestSearch.value.trim().toLowerCase(); return query ? interests.value.filter((item) => item.fullName?.toLowerCase().includes(query) || item.username?.toLowerCase().includes(query)) : interests.value; });
const cameraMessage = computed(() => {
  if (cameraPermissionDenied.value) return 'Izin kamera belum diberikan untuk situs ini.';
  if (cameraIssue.value === 'insecure-context') return 'Kamera hanya dapat digunakan melalui koneksi HTTPS yang aman.';
  if (cameraIssue.value === 'unsupported-browser') return 'Browser ini tidak menyediakan akses kamera. Gunakan Chrome atau Safari versi terbaru.';
  return '';
});
const scannerButtonLabel = computed(() => {
  if (isScannerActive.value) return 'HENTIKAN KAMERA';
  if (cameraIssue.value === 'insecure-context') return 'BUKA SCANNER MELALUI HTTPS';
  if (cameraIssue.value === 'unsupported-browser') return 'KAMERA TIDAK TERSEDIA';
  if (cameraPermissionDenied.value) return 'COBA MINTA IZIN KAMERA LAGI';
  return 'IZINKAN & AKTIFKAN KAMERA';
});

function extractPhone(value: string | null | undefined) { return value?.match(/(?:\+?62|0)8[\d\s-]{7,15}/)?.[0]?.replace(/[\s-]/g, '') || ''; }
function hydrateProfile(booth: any) {
  profileForm.name = booth.name || ''; profileForm.shortName = booth.shortName || ''; profileForm.category = booth.category || ''; profileForm.boothNumber = booth.boothNumber || '';
  profileForm.tagline = booth.tagline || ''; profileForm.description = booth.description || ''; profileForm.activitiesText = Array.isArray(booth.activities) ? booth.activities.join('\n') : '';
  profileForm.stampInstructionsText = Array.isArray(booth.stampInstructions) ? booth.stampInstructions.join('\n') : '';
  profileForm.requirementsText = Array.isArray(booth.requirements) ? booth.requirements.join('\n') : ''; profileForm.contactPerson = booth.contactPerson || '';
  profileForm.contactPhone = booth.contactPhone || extractPhone(booth.contactPerson); profileForm.instagram = booth.instagram || ''; profileForm.logoUrl = booth.logoUrl || '';
}
async function loadVisitors() { if (!activeBooth.value?.id) return; const response = await api.get<any>(`/ormawa/booths/${activeBooth.value.id}/visitors`); visitors.value = response?.data?.attendees || []; }
async function loadInterests() { if (!activeBooth.value?.id) return; const response = await api.get<any>(`/ormawa/booths/${activeBooth.value.id}/interests`); interests.value = response?.data?.interests || []; }
async function loadDashboard() {
  loading.value = true; pageError.value = '';
  try { const response = await api.get<any>('/ormawa/my-booth'); if (!response?.success || !response.data) throw new Error('Stan untuk akun PIC ini belum terhubung.'); activeBooth.value = response.data; hydrateProfile(response.data); await Promise.all([loadVisitors(), loadInterests()]); }
  catch (error: any) { pageError.value = error?.data?.error?.message || error?.message || 'Gagal memuat dashboard PIC.'; }
  finally { loading.value = false; }
}
async function startScanner() {
  if (!activeBooth.value || isProcessing.value) return;
  pageError.value = '';
  cameraIssue.value = detectBrowserCameraIssue();
  if (cameraIssue.value) return;
  cameraPermissionDenied.value = false;
  isScannerActive.value = true;
  await nextTick();
  try {
    codeReader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });
    scannerControls = await codeReader.decodeFromConstraints(
      { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      videoElement.value!,
      (result) => { if (result && !isProcessing.value) { const value = result.getText(); stopScanner(); void submitStamp({ mabaQrToken: value }); } },
    );
  } catch (error: any) {
    stopScanner();
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') cameraPermissionDenied.value = true;
    else if (error?.name === 'NotFoundError') pageError.value = 'Kamera tidak ditemukan pada perangkat ini.';
    else if (error?.name === 'NotReadableError') pageError.value = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi kamera, lalu coba lagi.';
    else pageError.value = 'Kamera belum dapat dibuka. Muat ulang halaman atau gunakan input NIM manual.';
  }
}
function stopScanner() { scannerControls?.stop(); scannerControls = null; codeReader = null; isScannerActive.value = false; if (videoElement.value?.srcObject) { for (const track of (videoElement.value.srcObject as MediaStream).getTracks()) track.stop(); videoElement.value.srcObject = null; } }
async function toggleScanner() { if (isScannerActive.value) stopScanner(); else await startScanner(); }
async function submitStamp(payload: { mabaNim?: string; mabaQrToken?: string }) {
  if (isProcessing.value) return; isProcessing.value = true; lastScanResult.value = null;
  try { const response = await api.post<any>('/ormawa/scan-maba', payload); lastScanResult.value = { success: true, message: response.message || 'Kunjungan berhasil dicatat.', xpEarned: response.data?.xpEarned || 0 }; manualNim.value = ''; toast.success(`Stamp ${response.data?.maba?.fullName || 'mahasiswa'} berhasil dicatat.`); await loadVisitors(); }
  catch (error: any) { const message = error?.data?.error?.message || error?.data?.message || error?.message || 'Gagal mencatat stamp.'; lastScanResult.value = { success: false, message, xpEarned: 0 }; toast.error(message); }
  finally { isProcessing.value = false; }
}
async function submitManualScan() { const nim = manualNim.value.trim(); if (nim) await submitStamp({ mabaNim: nim }); }
async function saveProfile() {
  savingProfile.value = true;
  try {
    const response = await api.put<any>('/ormawa/my-booth', { name: profileForm.name, shortName: profileForm.shortName || null, category: profileForm.category, boothNumber: profileForm.boothNumber || null, tagline: profileForm.tagline || null, description: profileForm.description || null, stampInstructions: profileForm.stampInstructionsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), activities: profileForm.activitiesText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), requirements: profileForm.requirementsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), contactPerson: profileForm.contactPerson || null, contactPhone: profileForm.contactPhone || null, instagram: profileForm.instagram || null, logoUrl: profileForm.logoUrl || null });
    activeBooth.value = { ...activeBooth.value, ...response.data }; hydrateProfile(activeBooth.value); toast.success('Informasi stan berhasil disimpan dan tampil di aplikasi maba.');
  } catch (error: any) { toast.error(error?.data?.error?.message || error?.message || 'Gagal menyimpan informasi stan.'); }
  finally { savingProfile.value = false; }
}
function formatDateTime(value: string) { return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function spreadsheetCell(value: unknown) { const text = String(value ?? '').replace(/"/g, '""'); const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${safe}"`; }
function exportInterests() {
  const rows = interests.value.map((item, index) => [index + 1, item.username, item.fullName, item.whatsappNumber || item.phoneNumber, item.instagramUsername || '', item.motivation || '', item.experience || '', item.xpBonusEarned || 0, formatDateTime(item.createdAt)]);
  const csv = ['No,NIM,Nama,WhatsApp,Instagram,Motivasi,Pengalaman,XP Bonus,Tanggal', ...rows.map((row) => row.map(spreadsheetCell).join(','))].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `peminat-${activeBooth.value?.code || 'ormawa'}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
}
onMounted(() => { cameraIssue.value = detectBrowserCameraIssue(); void loadDashboard(); });
onBeforeUnmount(stopScanner);
</script>

<style scoped>
.scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #4ade80, transparent); box-shadow: 0 0 10px #22c55e; animation: scan 2s linear infinite; }
.form-input { width: 100%; border: 1px solid #523e2b; border-radius: .375rem; background: #0d0a07; padding: .6rem .75rem; color: #fef3c7; font-size: .75rem; outline: none; }
.form-input:focus { border-color: #facc15; }
@keyframes scan { 0% { top: 0; } 50% { top: calc(100% - 2px); } 100% { top: 0; } }
</style>
