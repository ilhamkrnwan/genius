<template>
  <header class="sticky top-0 z-40 bg-[#120a05]/95 border-b-4 border-[#5a3a18] backdrop-blur shadow-[0_8px_25px_rgba(0,0,0,0.8)] select-none">
    <div class="max-w-6xl mx-auto w-full flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
      <!-- Left: Buddy Identity & Team Badge -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="relative shrink-0 group">
          <div class="absolute inset-0 bg-[#f0d060] rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <img
            :src="buddyAvatar"
            alt="Avatar Buddy"
            class="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg border-2 border-[#f0d060] object-cover bg-[#120a05] shadow-lg group-hover:border-[#facc15] transition-colors"
          />
          <div class="absolute -bottom-1.5 -right-1.5 bg-[#120a05] border-2 border-[#f0d060] rounded px-1.5 py-0.5 text-[6px] sm:text-[7px] font-pixel text-[#facc15] font-bold z-10 shadow-sm drop-shadow-md">
            BUDDY
          </div>
        </div>

        <div class="flex flex-col min-w-0 leading-tight">
          <div class="flex items-center gap-1.5">
            <span class="font-pixel text-[11px] sm:text-[13px] text-[#fef08a] font-bold truncate drop-shadow-md">
              {{ cleanBuddyName }}
            </span>
          </div>
          <span class="text-[9px] sm:text-[10px] text-[#86efac] font-mono truncate font-medium flex items-center gap-1.5 mt-0.5">
            <Shield class="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#22c55e] inline shrink-0" />
            <span class="drop-shadow-[0_0_2px_rgba(134,239,172,0.4)]">{{ cleanTeamName }}</span>
          </span>
        </div>
      </div>

      <!-- Right: Quick Role Switcher & Logout -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <!-- Role Switcher Button for Instant Testing -->
        <button
          @click="switchRole('ADMIN')"
          class="pixel-btn h-7 sm:h-8 px-2 sm:px-3 bg-[#2a1d13] hover:bg-[#3d2b1e] text-[#facc15] font-pixel text-[8px] sm:text-[9px] flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Ganti ke Tampilan Super Admin"
        >
          <ArrowLeftRight class="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#f59e0b]" />
          <span class="hidden sm:inline">KE ADMIN</span>
        </button>

        <button
          @click="confirmLogout"
          class="pixel-btn h-7 w-7 sm:h-8 sm:w-8 bg-[#2a1210] hover:bg-[#451a1a] text-red-400 hover:text-[#fca5a5] border-[#7f1d1d] hover:border-[#b91c1c] flex items-center justify-center cursor-pointer transition-colors"
          title="Keluar"
        >
          <LogOut class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Crown, Shield, ArrowLeftRight, LogOut } from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";

const { user, switchRole, confirmLogout } = useAuth();

const cleanBuddyName = computed(() => {
  const raw = user.value?.fullName || "Agnes Anggraini Risdiyanto";
  return raw.replace(/^Kak(ak)?\s+/i, "").trim();
});

const cleanTeamName = computed(() => {
  const raw = user.value?.teamName || "Genius 01";
  return raw.replace(/^Team\s+/i, "").trim();
});

const buddyAvatar = computed(() => {
  if (user.value?.avatarUrl) return user.value.avatarUrl;
  if (user.value?.gender === "FEMALE") return "/character-cewek-avatar.png";
  return "/character-cowok-avatar.png";
});
</script>
