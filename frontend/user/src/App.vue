<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue';

const route = useRoute();

// Hide bottom nav on full-screen game views or intros to preserve game immersion
const hideBottomNav = computed(() => {
  return [
    'linear-spot',
    'booth-detail',
    'floor-intro',
    'floor-complete'
  ].includes(route.name as string);
});
</script>

<template>
  <div id="app" class="min-h-[100dvh] bg-[#2d1b0e] text-[#f0e0c0] font-sans antialiased selection:bg-[#7ec850] selection:text-[#1b120a]" :class="{ 'xl:pb-0 pb-[64px]': !hideBottomNav }">
    <RouterView />
    <MobileBottomNav v-if="!hideBottomNav" />
  </div>
</template>

<style>
/* App root base layout */
</style>
