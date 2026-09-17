<template>
  <nav class="fixed bottom-0 inset-x-0 z-50 bg-[#1c120a]/95 border-t-2 border-[#5a3a18] backdrop-blur-md select-none shadow-[0_-8px_25px_rgba(0,0,0,0.7)] safe-area-bottom">
    <div class="max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all min-w-[72px]',
          isActive(item.to)
            ? 'text-[#f0d060] font-bold scale-105 bg-[#2d1b0e] border-2 border-[#f0d060] shadow-[0_0_12px_rgba(240,208,96,0.25)]'
            : 'text-[#c4956a] hover:text-[#f0e0c0]'
        ]"
      >
        <component
          :is="item.icon"
          :class="[
            'h-4 w-4 transition-colors',
            isActive(item.to) ? 'text-[#f0d060]' : 'text-[#c4956a]'
          ]"
        />
        <span class="font-pixel text-[8px] sm:text-[9px] mt-0.5 uppercase tracking-wider">
          {{ item.label }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { Store, ScanLine, Users } from "lucide-vue-next";

const route = useRoute();

const navItems = [
  { label: "Stan Saya", to: "/ormawa/portal", icon: Store },
  { label: "Scanner Maba", to: "/ormawa/scan", icon: ScanLine },
  { label: "Pengunjung", to: "/ormawa/portal/visitors", icon: Users },
];

const isActive = (to: string) => {
  if (to === "/ormawa/portal") return route.path === "/ormawa/portal";
  if (to === "/ormawa/scan") return route.path === "/ormawa/scan";
  if (to === "/ormawa/portal/visitors") return route.path === "/ormawa/portal/visitors";
  return route.path.startsWith(to);
};
</script>
