<template>
  <div class="min-h-[100dvh] w-full flex items-center justify-center bg-[#180e07] text-[#f0e0c0] font-pixel text-xs p-4">
    <div class="text-center space-y-2">
      <div class="animate-spin text-[#f0d060] inline-block mb-1">⏳</div>
      <div>MENGALIHKAN KE PORTAL LOGIN TERPADU...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { navigateTo, useRoute } from "#app";

definePageMeta({
  layout: false,
});

useHead({
  title: "GENIUS 2026 — Pengalihan Login PIC Stan",
});

const route = useRoute();

onMounted(() => {
  navigateTo({
    path: "/login",
    query: route.query,
  }, { replace: true });
});
</script>
