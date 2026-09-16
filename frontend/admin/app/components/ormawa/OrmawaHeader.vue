<template>
  <header class="sticky top-0 z-40 bg-[#1c120a]/92 border-b-2 border-[#5a3a18] backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-lg select-none">
    <!-- Left: Ormawa Booth Identity -->
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="relative shrink-0">
        <div class="h-9 w-9 rounded-lg border-2 border-[#f0d060] bg-[#2d1b0e] flex items-center justify-center font-pixel text-xs text-[#facc15] font-bold shadow overflow-hidden">
          <Store class="h-5 w-5 text-[#c084fc]" />
        </div>
        <div class="absolute -bottom-1 -right-1 bg-[#1a1008] border border-[#f0d060] rounded px-1 text-[6px] font-pixel text-[#facc15] font-bold">
          PIC
        </div>
      </div>

      <div class="flex flex-col min-w-0 leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-pixel text-xs text-[#f0d060] font-bold truncate">
            {{ cleanBoothName }}
          </span>
        </div>
        <span class="text-[10px] text-[#86efac] font-sans truncate font-medium flex items-center gap-1">
          <Sparkles class="h-3 w-3 text-[#22c55e] inline shrink-0" />
          <span>{{ cleanPicName }} &bull; Lantai {{ boothFloor }}</span>
        </span>
      </div>
    </div>

    <!-- Right: Role Switcher & Logout -->
    <div class="flex items-center gap-1.5 shrink-0">
      <!-- Role Switcher Button for Instant Testing -->
      <button
        @click="switchRole('ADMIN')"
        class="h-7 px-2 bg-[#271d15] hover:bg-[#3d2d1e] border border-[#523e2b] hover:border-[#f59e0b] text-[#facc15] font-pixel text-[9px] rounded flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
        title="Ganti ke Tampilan Super Admin"
      >
        <ArrowLeftRight class="h-3 w-3 text-[#f59e0b]" />
        <span class="hidden sm:inline">KE ADMIN</span>
      </button>

      <button
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
import { Store, Sparkles, ArrowLeftRight, LogOut } from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";

const { user, switchRole, confirmLogout } = useAuth();

const cleanPicName = computed(() => {
  return user.value?.fullName || "PIC Stan Ormawa";
});

const cleanBoothName = computed(() => {
  // Can be extracted from teamName or booth info or username
  return (user.value as any)?.boothName || user.value?.teamName || "Stan Expo Ormawa";
});

const boothFloor = computed(() => {
  return user.value?.assignedFloor || 3;
});
</script>
