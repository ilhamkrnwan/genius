<template>
  <div class="p-4 md:p-6 space-y-5 flex-1 flex flex-col min-h-0 bg-[#0a0604]">
    <div class="flex items-center justify-between mb-2">
      <button @click="$router.push('/sessions')" class="pixel-btn h-8 px-3 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center gap-2 hover:bg-[#3d2d1e]">
        <ArrowLeft class="h-4 w-4" />
        <span>Kembali ke Monitor</span>
      </button>
      <div class="flex items-center gap-2 font-mono text-[10px]">
        <span class="text-muted-foreground">Auto-Sync (2s):</span>
        <span :class="['h-2 w-2 rounded-full', autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-muted']" />
      </div>
    </div>

    <div v-if="loading && !session" class="py-16 text-center space-y-2">
      <RotateCw class="h-8 w-8 text-[#f59e0b] animate-spin mx-auto" />
      <p class="font-mono text-xs text-muted-foreground">Memuat Data Sesi...</p>
    </div>

    <div v-else-if="session" class="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
      
      <!-- Kiri: Info Panel -->
      <div class="lg:col-span-4 space-y-4">
        <!-- Team & Location Header -->
        <div class="pixel-card p-5 space-y-4 border-[#523e2b] bg-[#16110d]">
          <div class="flex items-center gap-3 border-b border-[#3a291c] pb-3">
            <div class="h-10 w-10 bg-[#f59e0b]/20 border border-[#f59e0b] rounded flex items-center justify-center shrink-0">
              <Users class="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
              <p class="font-pixel text-sm text-[#facc15] truncate">{{ session.teamName || 'Tim #' + session.teamId?.slice(0, 6) }}</p>
              <div class="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-1">
                <MapPin class="h-3 w-3" />
                <span>{{ session.locationName || 'Pos Belum Terpeta' }} ({{ session.locationCode }})</span>
              </div>
            </div>
          </div>

          <div class="space-y-2 font-mono text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Game Type:</span>
              <span class="text-foreground font-bold">{{ session.gameType }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Status:</span>
              <span :class="[
                  'px-1.5 py-0.5 text-[10px] font-pixel',
                  session.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500' :
                  session.status === 'PAUSED' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500' :
                  'bg-muted/20 text-muted-foreground border border-muted'
                ]">
                {{ session.status }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Timer (Limit):</span>
              <span class="text-foreground">{{ session.timeLimit }}s</span>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="pixel-card p-4 space-y-3 border-red-900/50 bg-red-950/10">
          <p class="font-pixel text-[10px] text-red-400">🚨 EMERGENCY CONTROLS</p>
          <div class="flex flex-col gap-2">
            <button
              v-if="session.status === 'ACTIVE'"
              @click="pauseSession(session.id)"
              class="pixel-btn h-9 bg-yellow-600 text-yellow-950 border-yellow-400 font-bold flex items-center justify-center gap-2 hover:bg-yellow-500"
            >
              <Pause class="h-4 w-4" />
              <span>JEDA SEMENTARA</span>
            </button>
            <button
              v-if="session.status === 'PAUSED'"
              @click="startSession(session.id)"
              class="pixel-btn h-9 bg-emerald-600 text-white border-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500"
            >
              <Play class="h-4 w-4" />
              <span>LANJUTKAN</span>
            </button>
            <button
              @click="forceCompleteSession(session.id)"
              class="pixel-btn h-9 bg-red-900 text-red-200 border-red-700 font-bold flex items-center justify-center gap-2 hover:bg-red-800"
            >
              <CheckCircle2 class="h-4 w-4" />
              <span>FORCE FINISH</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Kanan: Remote Controller -->
      <div class="lg:col-span-8">
        <div class="pixel-card h-full flex flex-col p-6 sm:p-10 border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-gradient-to-b from-[#2a1d12] to-[#16110d]">
          
          <div class="text-center space-y-4 mb-8">
            <h2 class="font-pixel text-xl sm:text-2xl text-white tracking-wider">GAME MASTER CONTROL</h2>
            <div class="inline-flex items-center gap-3 border-2 border-[#523e2b] bg-[#100c09] px-6 py-3 rounded">
              <span class="font-mono text-sm text-muted-foreground uppercase">Soal Saat Ini:</span>
              <span class="font-pixel text-4xl text-emerald-400">{{ (session.metadata?.currentQuestionIndex || 0) + 1 }}</span>
            </div>
            
            <p v-if="session.status !== 'ACTIVE'" class="text-yellow-400 font-mono text-sm animate-pulse mt-4">
              ⚠️ Sesi harus dalam status ACTIVE untuk melanjutkan soal.
            </p>
          </div>

          <!-- Raksasa Next Button -->
          <div class="flex-1 flex items-center justify-center">
            <button
              @click="nextQuestion(session.id)"
              :disabled="session.status !== 'ACTIVE' || isAdvancing"
              :class="[
                'w-full max-w-sm aspect-video sm:aspect-auto sm:h-48 rounded-2xl border-[6px] flex flex-col items-center justify-center gap-4 transition-all duration-150',
                session.status === 'ACTIVE' 
                  ? 'bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_10px_0_rgb(6,95,70)] active:translate-y-[10px] active:shadow-none' 
                  : 'bg-[#271d15] border-[#523e2b] text-muted-foreground opacity-50 cursor-not-allowed shadow-[0_10px_0_rgb(20,15,10)]'
              ]"
            >
              <FastForward :class="['h-16 w-16', isAdvancing && 'animate-bounce']" />
              <span class="font-pixel text-xl sm:text-3xl tracking-wide text-shadow">NEXT SOAL</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  ArrowLeft,
  Users,
  MapPin,
  RotateCw,
  Play,
  Pause,
  CheckCircle2,
  FastForward,
} from "lucide-vue-next";
import { useApi } from "@/composables/useApi";

const route = useRoute();
const router = useRouter();
const api = useApi();

const sessionId = route.params.id as string;
const session = ref<any>(null);
const loading = ref(true);
const autoRefresh = ref(true);
const isAdvancing = ref(false);

let refreshTimer: any = null;

onMounted(async () => {
  await fetchSession();
  
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      fetchSession(true);
    }
  }, 2000);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});

async function fetchSession(silent = false) {
  if (!silent) loading.value = true;
  try {
    const res = await api.get(`/game-sessions/${sessionId}`);
    if (res?.success) {
      session.value = res.data;
    }
  } catch (err) {
    if (!silent) console.error("Failed to load session:", err);
  } finally {
    if (!silent) loading.value = false;
  }
}

async function nextQuestion(id: string) {
  isAdvancing.value = true;
  try {
    const res = await api.post(`/game-sessions/${id}/next-question`);
    if (res?.success) {
      await fetchSession(true);
    }
  } catch (err: any) {
    alert("Gagal memajukan soal: " + (err?.data?.error?.message || err.message));
  } finally {
    isAdvancing.value = false;
  }
}

async function startSession(id: string) {
  try {
    const res = await api.post(`/game-sessions/${id}/start`);
    if (res?.success) await fetchSession(true);
  } catch (err: any) {
    alert("Gagal memulai sesi: " + err.message);
  }
}

async function pauseSession(id: string) {
  try {
    const res = await api.post(`/game-sessions/${id}/pause`);
    if (res?.success) await fetchSession(true);
  } catch (err: any) {
    alert("Gagal menjeda sesi: " + err.message);
  }
}

async function forceCompleteSession(id: string) {
  if (!confirm("Selesaikan sesi secara paksa dan hitung skor otomatis?")) return;
  try {
    const res = await api.post(`/game-sessions/${id}/complete`, {
      submissions: [],
    });
    if (res?.success) {
      alert("Sesi diselesaikan!");
      await fetchSession(true);
    }
  } catch (err: any) {
    alert("Gagal menyelesaikan sesi: " + err.message);
  }
}
</script>

<style scoped>
.text-shadow {
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
}
</style>
