<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import MabaAuthModal from '@/components/auth/MabaAuthModal.vue';
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue';

const route = useRoute();

const needsLogin = ref(false);
const viewVersion = ref(0);
const requestLogin = () => { needsLogin.value = true; };
function resumePage() {
  needsLogin.value = false;
  viewVersion.value += 1;
}
onMounted(() => window.addEventListener('genius:auth-required', requestLogin));
onUnmounted(() => window.removeEventListener('genius:auth-required', requestLogin));

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
    <RouterView :key="viewVersion" />
    <MobileBottomNav v-if="!hideBottomNav" />
    <MabaAuthModal v-if="needsLogin" :isOpen="true" reauthenticate @close="needsLogin = false" @complete="resumePage" />
  </div>
</template>
