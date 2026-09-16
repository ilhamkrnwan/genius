<template>
  <header class="sticky top-0 z-40 bg-[#2d1b0e]/90 border-b-2 border-[#5a3a18] backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between shadow-lg select-none">
    <!-- Left: Buddy Identity & Team -->
    <div class="flex items-center gap-2.5 min-w-0">
      <img
        :src="buddyAvatar"
        alt="Avatar Buddy"
        class="h-9 w-9 rounded-lg border-2 border-[#f0d060] object-cover bg-black/40 shadow shrink-0"
      />

      <div class="flex flex-col min-w-0 leading-tight">
        <span class="font-pixel text-xs text-[#f0d060] font-bold truncate">
          {{ cleanBuddyName }}
        </span>
        <span class="text-[10.5px] text-[#86efac] font-sans truncate font-medium flex items-center gap-1 mt-0.5">
          <Shield class="h-3 w-3 text-[#22c55e] inline shrink-0" />
          <span>{{ cleanTeamName }}</span>
        </span>
      </div>
    </div>

    <!-- Right: Logout Button -->
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        @click="confirmLogout"
        class="h-7 w-7 rounded bg-[#2a1313] border border-red-800/80 text-red-400 hover:text-white hover:bg-red-900 flex items-center justify-center cursor-pointer transition-all active:scale-95"
        title="Keluar"
      >
        <LogOut class="h-3.5 w-3.5" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Shield, LogOut } from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";

const { user, confirmLogout } = useAuth();

const cleanBuddyName = computed(() => {
  const raw = user.value?.fullName || "Game Master Buddy";
  return raw.replace(/^Kak(ak)?\s+/i, "").trim();
});

const cleanTeamName = computed(() => {
  const raw = user.value?.teamName || "Regu Saya";
  return raw.replace(/^Team\s+/i, "").trim();
});

const buddyAvatar = computed(() => {
  if (user.value?.avatarUrl) return user.value.avatarUrl;
  if (user.value?.gender === "FEMALE") return "/character-cewek-avatar.png";
  return "/character-cowok-avatar.png";
});
</script>
