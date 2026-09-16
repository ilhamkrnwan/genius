<template>
  <nav class="fixed bottom-0 inset-x-0 z-50 bg-[#2d1b0e]/95 border-t-2 border-[#5a3a18] backdrop-blur-md select-none shadow-[0_-8px_25px_rgba(0,0,0,0.8)]">
    <div class="max-w-6xl mx-auto w-full flex items-center justify-around sm:justify-center sm:gap-12 px-2 py-1.5 sm:py-2.5">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex flex-col sm:flex-row items-center justify-center py-1 sm:py-2 px-2.5 sm:px-5 rounded-lg transition-all min-w-[64px] sm:min-w-[120px] gap-1 sm:gap-2',
          isActive(item.to)
            ? 'text-[#f0d060] font-bold scale-105 bg-[#1a1008] border-2 border-[#f0d060] shadow-[0_0_15px_rgba(240,208,96,0.3)]'
            : 'text-[#c4956a] hover:text-[#f0e0c0] hover:bg-[#1a1008]/50'
        ]"
      >
        <component
          :is="item.icon"
          :class="[
            'h-4 w-4 sm:h-5 sm:w-5 transition-colors',
            isActive(item.to) ? 'text-[#f0d060]' : 'text-[#c4956a]'
          ]"
        />
        <span class="font-pixel text-[8px] sm:text-[10px] mt-0.5 sm:mt-0 uppercase tracking-wider drop-shadow-md">
          {{ item.label }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { Users, FileEdit, Gift, Trophy } from "lucide-vue-next";

const route = useRoute();

const navItems = [
  { label: "Anggota", to: "/buddy", icon: Users },
  { label: "Nilai FGD", to: "/buddy/fgd", icon: FileEdit },
  { label: "Bonus H3", to: "/buddy/bonus", icon: Gift },
  { label: "Leaderboard", to: "/buddy/leaderboard", icon: Trophy },
];

const isActive = (to: string) => {
  if (to === "/buddy") return route.path === "/buddy";
  return route.path.startsWith(to);
};
</script>
