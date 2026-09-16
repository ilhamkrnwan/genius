<template>
  <div class="relative min-h-[100dvh] w-full overflow-y-auto text-[#f0e0c0] font-sans selection:bg-[#c084fc] selection:text-[#1e0e2e] flex flex-col justify-center items-center p-4">
    <!-- Game Wallpaper Background (Peserta Game Retro RPG Style) -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="
        background-image: url('/games/background.png');
        background-size: cover;
        background-position: center bottom;
        image-rendering: pixelated;
      "
    />
    <!-- Dark Vignette Overlay with soft purple/gold atmospheric tint -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/85 via-black/65 to-black/90 pointer-events-none z-0" />
    <div class="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(18,10,26,0.7)_100%)] pointer-events-none z-0" />

    <!-- Content Container -->
    <div class="relative z-10 w-full max-w-md mx-auto space-y-4">
      <!-- Branding Header -->
      <div class="text-center space-y-2">
        <!-- Top Branding Pill -->
        <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#1e140c]/90 border border-[#f0d060]/60 shadow-md backdrop-blur">
          <img
            src="/unu.png"
            alt="UNU Yogyakarta"
            class="h-6 w-auto object-contain filter drop-shadow"
          />
          <div class="w-[1px] h-4 bg-[#f0d060]/40" />
          <span class="font-pixel text-[9px] text-[#f0d060] uppercase tracking-wider font-bold">
            UNU YOGYAKARTA
          </span>
        </div>

        <!-- Main Title -->
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2a133d] border border-[#c084fc]/60 text-[#d8b4fe] text-[9px] font-pixel mb-1.5 uppercase shadow">
            <Store class="h-3 w-3 text-[#c084fc]" />
            <span>PORTAL PIC STAN ORMAWA</span>
          </div>
          <h1 class="font-pixel text-xl sm:text-2xl font-bold tracking-wider text-[#fef08a] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            GENIUS UNU 2026
          </h1>
          <p class="font-sans text-xs text-[#c4b5fd] font-medium mt-1">
            Pusat Akses Stan &amp; Scanner Validasi UKM / Himpunan
          </p>
        </div>
      </div>

      <!-- Login Card -->
      <div class="sdv-card-gold p-4 sm:p-5 space-y-4 shadow-2xl border-4 border-[#5a3a18] ring-2 ring-[#f0d060]/60 bg-[#22150c]/95 backdrop-blur-md">
        <!-- Header Card -->
        <div class="flex items-center justify-between border-b border-[#5a3a18] pb-3">
          <div class="flex items-center gap-2.5">
            <div class="h-10 w-10 rounded-lg bg-[#2b173d] border-2 border-[#c084fc] flex items-center justify-center font-pixel text-[#c084fc] shadow">
              <Store class="h-5 w-5 text-[#c084fc]" />
            </div>
            <div>
              <h2 class="font-pixel text-xs sm:text-sm font-bold text-[#fef08a] uppercase">
                MASUK SEBAGAI PIC STAN
              </h2>
              <span class="text-[10px] text-[#c4956a] font-mono">Kelola QR stan &amp; validasi pengunjung maba</span>
            </div>
          </div>

          <span class="border border-[#c084fc]/60 bg-[#251538] px-2 py-0.5 text-[8px] font-pixel text-[#c084fc] rounded">
            PIC STAN
          </span>
        </div>

        <!-- Dynamic Booth Selector from PostgreSQL -->
        <div class="space-y-1.5 pt-0.5">
          <div class="flex items-center justify-between text-[9px] font-pixel text-[#a08060] uppercase">
            <span>PILIH STAN (DARI POSTGRESQL):</span>
            <span v-if="boothsLoading" class="text-[8px] text-[#facc15] font-mono animate-pulse">Memuat...</span>
            <span v-else class="text-[8px] text-[#c084fc] font-mono">{{ availableBooths.length }} Stan Aktif</span>
          </div>

          <div v-if="availableBooths.length > 0" class="grid grid-cols-3 gap-1.5 text-center font-mono max-h-36 overflow-y-auto custom-scrollbar p-1 bg-[#150d07] rounded-lg border border-[#5a3a18]">
            <button
              type="button"
              v-for="b in availableBooths"
              :key="b.id"
              @click="selectBooth(b)"
              :class="[
                'p-1.5 rounded border text-[10px] transition-all cursor-pointer flex flex-col items-center gap-0.5',
                selectedBoothId === b.id
                  ? 'bg-[#3b1c5a] border-[#c084fc] text-[#f3e8ff] font-bold shadow-md ring-1 ring-[#c084fc]'
                  : 'bg-[#18110b] border-[#5a3a18] text-[#c4956a] hover:border-[#c084fc]/60 hover:text-[#f3e8ff]'
              ]"
              :title="b.name"
            >
              <span class="font-pixel text-[8.5px] text-[#fef08a] truncate w-full">
                {{ (b.shortName || b.code).replace('ORMAWA-', '') }}
              </span>
              <span class="text-[7.5px] text-[#a78bfa] truncate w-full">Lt. {{ b.floorNumber || 3 }}</span>
            </button>
          </div>
        </div>

        <!-- Error Message Box -->
        <div
          v-if="errorMsg"
          class="border-2 border-[#d44040] bg-[#2a1210] p-2.5 rounded-lg text-xs font-mono text-[#fca5a5] flex items-start gap-2 shadow"
        >
          <AlertTriangle class="h-4 w-4 shrink-0 text-[#f87171] mt-0.5" />
          <div>
            <div class="font-pixel text-[8.5px] font-bold uppercase text-[#fca5a5]">AKSES DITOLAK</div>
            <div class="text-[10.5px] mt-0.5">{{ errorMsg }}</div>
          </div>
        </div>

        <!-- Form Login PIC Stan -->
        <form @submit.prevent="handleLogin" class="space-y-3 font-mono text-xs">
          <div class="space-y-1">
            <label for="pic-username" class="text-[10px] font-semibold text-[#f0e0c0] flex items-center justify-between">
              <span class="font-pixel text-[8.5px]">USERNAME PIC STAN:</span>
            </label>
            <div class="relative">
              <User class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c084fc]" />
              <input
                id="pic-username"
                v-model="username"
                type="text"
                placeholder="Username PIC (contoh: pic_hmte)"
                required
                autocomplete="username"
                :disabled="loading"
                class="w-full h-9 pl-9 pr-3 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#c084fc] rounded-lg text-white text-xs font-mono outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label for="pic-password" class="text-[10px] font-semibold text-[#f0e0c0] flex items-center justify-between">
              <span class="font-pixel text-[8.5px]">KATA SANDI STAN:</span>
            </label>
            <div class="relative">
              <Key class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c084fc]" />
              <input
                id="pic-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                :disabled="loading"
                class="w-full h-9 pl-9 pr-9 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#c084fc] rounded-lg text-white text-xs font-mono outline-none"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c084fc] cursor-pointer"
                tabindex="-1"
                :title="showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Helper Guidance Box -->
          <div class="bg-[#191024]/80 border border-[#4c1d95]/50 rounded-lg p-2.5 text-[10.5px] text-[#ddd6fe] leading-relaxed flex items-start gap-2">
            <Sparkles class="h-4 w-4 text-[#c084fc] shrink-0 mt-0.5" />
            <div>
              <span class="font-bold text-[#f3e8ff]">Koneksi Langsung Database:</span>
              Kredensial diverifikasi secara real-time ke PostgreSQL backend GENIUS 2026.
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="w-full h-10 font-pixel text-xs font-bold flex items-center justify-center gap-2 mt-3 cursor-pointer rounded-lg bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#9333ea] text-white border-2 border-[#d8b4fe] shadow-lg active:scale-98 transition-all"
            :disabled="loading"
          >
            <RotateCw v-if="loading" class="h-4 w-4 animate-spin text-white" />
            <span v-if="loading">MEMVERIFIKASI KE POSTGRESQL...</span>
            <span v-else>MASUK KE STAN SAYA ▶</span>
          </button>
        </form>
      </div>

      <!-- Footer Navigation: Link back to Panitia / Admin Login -->
      <div class="text-center pt-2">
        <NuxtLink
          to="/login"
          class="inline-flex items-center gap-1.5 text-xs text-[#a08060] hover:text-[#f0d060] font-sans transition-colors"
        >
          <Shield class="h-3.5 w-3.5" />
          <span>Bukan PIC Stan? Masuk ke Portal Panitia / Super Admin &rarr;</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { User, Key, RotateCw, AlertTriangle, Store, Shield, Sparkles, Eye, EyeOff } from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: false,
});

useHead({
  title: "GENIUS 2026 — Login PIC Stan Ormawa",
});

const auth = useAuth();
const api = useApi();

const username = ref("pic_hmte");
const password = ref("ormawa2026");
const showPassword = ref(false);
const errorMsg = ref("");
const loading = ref(false);
const boothsLoading = ref(false);
const availableBooths = ref<any[]>([]);
const selectedBoothId = ref<string>("");

function selectBooth(booth: any) {
  selectedBoothId.value = booth.id;
  username.value = `pic_${booth.code.toLowerCase().replace('ormawa-', '').replace(/[^a-z0-9]/g, '_')}`;
  password.value = "ormawa2026";
  errorMsg.value = "";
}

onMounted(async () => {
  boothsLoading.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/ormawa/booths");
    if (res.success && Array.isArray(res.data)) {
      availableBooths.value = res.data;
      if (res.data.length > 0) {
        selectBooth(res.data[0]);
      }
    }
  } catch (err) {
    console.error("Gagal mengambil daftar stan dari PostgreSQL:", err);
  } finally {
    boothsLoading.value = false;
  }
});

async function handleLogin() {
  errorMsg.value = "";
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = "Mohon masukkan username PIC stan dan kata sandi.";
    return;
  }

  loading.value = true;

  try {
    const res = await auth.login(username.value.trim(), password.value);
    if (!res.success) {
      errorMsg.value = res.error || "Gagal masuk ke stan. Periksa kembali kredensial stan Anda di database.";
    }
  } catch (err: any) {
    errorMsg.value = err?.message || "Terjadi kesalahan koneksi saat verifikasi akun.";
  } finally {
    loading.value = false;
  }
}
</script>
