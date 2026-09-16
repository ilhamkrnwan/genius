<template>
  <div class="w-full max-w-md mx-auto space-y-4 text-[#f0e0c0]">
    <!-- Branding Header -->
    <div class="text-center space-y-2">
      <!-- Top Branding Pill -->
      <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#1e140c]/90 border border-[#f0d060]/50 shadow-md backdrop-blur">
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
        <h1 class="font-pixel text-xl sm:text-2xl font-bold tracking-wider text-[#fef08a] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          GENIUS UNU 2026
        </h1>
        <p class="font-sans text-xs text-[#86efac] font-medium mt-1">
          Pusat Kendali Panitia &amp; Game Master Buddy
        </p>
      </div>
    </div>

    <!-- Role Tab Selector (Panitia & Buddy) -->
    <div class="grid grid-cols-2 gap-2 p-1 bg-[#170f07]/90 border-2 border-[#5a3a18] rounded-xl font-mono text-xs shadow-md">
      <button
        type="button"
        @click="selectRoleTab('admin')"
        :class="[
          'py-2 px-2 rounded-lg font-pixel text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeRoleTab === 'admin'
            ? 'bg-[#f59e0b] text-[#1a1008] font-bold shadow'
            : 'text-[#c4956a] hover:text-[#fef08a] hover:bg-[#20140c]'
        ]"
      >
        <Crown class="h-3.5 w-3.5" />
        <span>SUPER ADMIN</span>
      </button>

      <button
        type="button"
        @click="selectRoleTab('buddy')"
        :class="[
          'py-2 px-2 rounded-lg font-pixel text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeRoleTab === 'buddy'
            ? 'bg-[#22c55e] text-[#0d2110] font-bold shadow'
            : 'text-[#c4956a] hover:text-[#fef08a] hover:bg-[#20140c]'
        ]"
      >
        <Shield class="h-3.5 w-3.5" />
        <span>BUDDY REGU</span>
      </button>
    </div>

    <!-- Login Card -->
    <div class="sdv-card-gold p-4 sm:p-5 space-y-4 shadow-2xl">
      <!-- Header Card -->
      <div class="flex items-center justify-between border-b border-[#5a3a18] pb-2.5">
        <div class="flex items-center gap-2.5">
          <div class="h-9 w-9 rounded-lg bg-[#271d15] border-2 border-[#f0d060] flex items-center justify-center font-pixel text-[#facc15] shadow">
            <Crown v-if="activeRoleTab === 'admin'" class="h-5 w-5 text-[#f59e0b]" />
            <Shield v-else class="h-5 w-5 text-[#22c55e]" />
          </div>
          <div>
            <h2 class="font-pixel text-xs sm:text-sm font-bold text-[#fef08a] uppercase">
              {{ cardTitle }}
            </h2>
            <span class="text-[10px] text-[#c4956a] font-mono">{{ cardSubtitle }}</span>
          </div>
        </div>

        <span
          class="border px-2 py-0.5 text-[8px] font-pixel rounded"
          :class="[
            activeRoleTab === 'admin'
              ? 'border-[#f59e0b]/60 bg-[#2b2014] text-[#facc15]'
              : 'border-[#22c55e]/60 bg-[#132215] text-[#86efac]'
          ]"
        >
          {{ activeRoleTab.toUpperCase() }}
        </span>
      </div>

      <!-- Official Database Hint -->
      <div class="p-2 bg-[#170f07] border border-[#5a3a18] rounded-lg text-[10px] font-mono flex items-center justify-between">
        <span class="text-[#a08060]">Akun Terdaftar di PostgreSQL:</span>
        <span class="text-[#facc15] font-pixel text-[8px]">
          {{ activeRoleTab === 'admin' ? 'admin / admin2026' : 'NIM: 25111101..10 / genius2026' }}
        </span>
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

      <!-- Manual Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-3 font-mono text-xs">
        <div class="space-y-1">
          <label for="username" class="text-[10px] font-semibold text-[#f0e0c0] flex items-center justify-between">
            <span class="font-pixel text-[8.5px]">USERNAME:</span>
          </label>
          <div class="relative">
            <User class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f0d060]" />
            <input
              id="username"
              v-model="username"
              type="text"
              :placeholder="usernamePlaceholder"
              required
              autocomplete="username"
              :disabled="auth.loading.value"
              class="w-full h-9 pl-9 pr-3 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg text-white text-xs font-mono outline-none"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label for="password" class="text-[10px] font-semibold text-[#f0e0c0] flex items-center justify-between">
            <span class="font-pixel text-[8.5px]">KATA SANDI:</span>
          </label>
          <div class="relative">
            <Key class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f0d060]" />
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              :disabled="auth.loading.value"
              class="w-full h-9 pl-9 pr-9 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg text-white text-xs font-mono outline-none"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f0d060] cursor-pointer"
              tabindex="-1"
              :title="showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Arcade Stardew RPG Button -->
        <button
          type="submit"
          class="rpg-btn-primary w-full h-10 font-pixel text-xs font-bold flex items-center justify-center gap-2 mt-3 cursor-pointer"
          :disabled="auth.loading.value"
        >
          <RotateCw v-if="auth.loading.value" class="h-4 w-4 animate-spin text-white" />
          <span v-if="auth.loading.value">MEMVERIFIKASI...</span>
          <span v-else>{{ submitButtonText }} ▶</span>
        </button>
      </form>
    </div>

    <!-- Dedicated Ormawa PIC Portal Banner -->
    <div class="p-3 rounded-xl bg-[#211233]/90 border-2 border-[#7c3aed]/60 shadow-lg flex items-center justify-between gap-3 text-xs backdrop-blur-md">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="h-9 w-9 rounded-lg bg-[#2e1547] border-2 border-[#c084fc] flex items-center justify-center shrink-0 shadow">
          <Store class="h-5 w-5 text-[#c084fc]" />
        </div>
        <div class="leading-tight min-w-0">
          <div class="font-pixel text-[9px] text-[#fef08a] uppercase truncate">PIC STAN ORMAWA / UKM?</div>
          <div class="text-[10px] text-[#ddd6fe] truncate">Ormawa memiliki halaman login &amp; stan tersendiri.</div>
        </div>
      </div>
      <NuxtLink
        to="/ormawa/login"
        class="shrink-0 px-3 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white font-pixel text-[8.5px] rounded-lg border border-[#d8b4fe] transition-all shadow flex items-center gap-1 active:scale-95 cursor-pointer"
      >
        <span>LOGIN STAN</span>
        <span>&rarr;</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { User, Key, RotateCw, AlertTriangle, Crown, Shield, Store, Eye, EyeOff } from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  layout: "auth",
});

const auth = useAuth();

const activeRoleTab = ref<"admin" | "buddy">("admin");
const username = ref("admin");
const password = ref("admin2026");
const showPassword = ref(false);
const errorMsg = ref("");

function selectRoleTab(role: "admin" | "buddy") {
  activeRoleTab.value = role;
  errorMsg.value = "";
  if (role === "admin") {
    username.value = "admin";
    password.value = "admin2026";
  } else {
    username.value = "25111101";
    password.value = "genius2026";
  }
}

const cardTitle = computed(() => {
  if (activeRoleTab.value === "buddy") return "PORTAL GAME MASTER BUDDY";
  return "PORTAL SUPER ADMIN";
});

const cardSubtitle = computed(() => {
  if (activeRoleTab.value === "buddy") return "Presensi regu bimbingan & input nilai FGD";
  return "Pusat kendali master sistem GENIUS 2026";
});

const usernamePlaceholder = computed(() => {
  if (activeRoleTab.value === "buddy") return "NIM Buddy (contoh: 25111101)";
  return "Username admin";
});

const submitButtonText = computed(() => {
  if (activeRoleTab.value === "buddy") return "MASUK KE PORTAL BUDDY";
  return "MASUK KE CONTROL CENTER";
});

async function handleLogin() {
  errorMsg.value = "";
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = "Mohon isi username dan password.";
    return;
  }

  const res = await auth.login(username.value.trim(), password.value);
  if (!res.success) {
    errorMsg.value = res.error || "Gagal masuk. Periksa kembali kredensial Anda.";
  }
}
</script>
