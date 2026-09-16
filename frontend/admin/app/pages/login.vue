<template>
  <div class="w-full max-w-sm mx-auto space-y-4 text-[#f0e0c0]">
    <!-- Branding Header -->
    <div class="text-center space-y-2">
      <!-- Top Branding Pill -->
      <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1e140c]/90 border border-[#f0d060]/60 shadow-md backdrop-blur">
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
      </div>
    </div>

    <!-- Clean Login Card -->
    <div class="sdv-card-gold p-5 space-y-4 shadow-2xl">
      <!-- Card Header -->
      <div class="flex items-center gap-3 border-b border-[#5a3a18] pb-3">
        <div class="h-9 w-9 rounded-lg bg-[#271d15] border-2 border-[#f0d060] flex items-center justify-center font-pixel text-[#facc15] shadow shrink-0">
          <KeyRound class="h-4.5 w-4.5 text-[#f59e0b]" />
        </div>
        <div>
          <h2 class="font-pixel text-xs sm:text-sm font-bold text-[#fef08a] uppercase">
            MASUK
          </h2>
          <span class="text-[10px] text-[#c4956a] font-mono">
            Masukkan akun untuk melanjutkan
          </span>
        </div>
      </div>

      <!-- Error Message Box -->
      <div
        v-if="errorMsg"
        class="border-2 border-[#d44040] bg-[#2a1210] p-2.5 rounded-lg text-xs font-mono text-[#fca5a5] flex items-start gap-2.5 shadow"
      >
        <AlertTriangle class="h-4 w-4 shrink-0 text-[#f87171] mt-0.5" />
        <div class="text-[11px] leading-relaxed">{{ errorMsg }}</div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-3.5 font-mono text-xs">
        <div class="space-y-1">
          <label for="login-username" class="text-[10px] font-semibold text-[#f0e0c0]">
            <span class="font-pixel text-[8.5px]">USERNAME / NIM:</span>
          </label>
          <div class="relative">
            <User class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f0d060]" />
            <input
              id="login-username"
              v-model="username"
              type="text"
              placeholder="Username atau NIM"
              required
              autocomplete="username"
              :disabled="auth.loading.value"
              class="w-full h-9 pl-9 pr-3 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg text-white text-xs font-mono outline-none transition-colors"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label for="login-password" class="text-[10px] font-semibold text-[#f0e0c0]">
            <span class="font-pixel text-[8.5px]">KATA SANDI:</span>
          </label>
          <div class="relative">
            <Key class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f0d060]" />
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              :disabled="auth.loading.value"
              class="w-full h-9 pl-9 pr-9 bg-[#170f07] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-lg text-white text-xs font-mono outline-none transition-colors"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f0d060] cursor-pointer transition-colors"
              tabindex="-1"
              :title="showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full h-10 font-pixel text-xs font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer rounded-lg border-2 shadow-lg transition-all active:scale-98 bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] hover:from-[#fbbf24] hover:to-[#d97706] border-[#fde68a] text-[#1a1008]"
          :disabled="auth.loading.value"
        >
          <RotateCw v-if="auth.loading.value" class="h-4 w-4 animate-spin text-[#1a1008]" />
          <span v-if="auth.loading.value">MEMVERIFIKASI...</span>
          <span v-else>MASUK ▶</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  User,
  Key,
  KeyRound,
  RotateCw,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  layout: "auth",
});

useHead({
  title: "GENIUS 2026 — Login",
});

const auth = useAuth();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMsg = ref("");

async function handleLogin() {
  errorMsg.value = "";
  if (!username.value.trim() || !password.value) {
    errorMsg.value = "Mohon masukkan username atau NIM dan kata sandi.";
    return;
  }

  const res = await auth.login(username.value.trim(), password.value);
  if (!res.success) {
    errorMsg.value = res.error || "Gagal masuk. Periksa kembali username dan kata sandi Anda.";
  }
}
</script>
