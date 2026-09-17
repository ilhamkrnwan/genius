<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import MabaAuthModal from '@/components/auth/MabaAuthModal.vue';
import XpCelebrationModal from '@/components/ui/XpCelebrationModal.vue';
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue';
import { useGameStore } from '@/store/gameStore';
import { initUserRealtime } from '@/lib/realtime';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const needsLogin = ref(false);
const viewVersion = ref(0);
const requestLogin = () => { needsLogin.value = true; };
let syncInterval: ReturnType<typeof setInterval> | null = null;

function resumePage() {
  needsLogin.value = false;
  viewVersion.value += 1;
  initUserRealtime();
  gameStore.syncWithServer();
  gameStore.syncAttendanceFromServer();
}
function handleDismissLogin() {
  needsLogin.value = false;
  if (route.query.auth || route.query.redirect || route.query.login) {
    router.replace({ path: route.path, query: {} });
  }
}
onMounted(() => {
  window.addEventListener('genius:auth-required', requestLogin);
  initUserRealtime();
  gameStore.syncWithServer();
  gameStore.syncAttendanceFromServer();
  syncInterval = setInterval(() => {
    gameStore.syncWithServer();
    gameStore.syncAttendanceFromServer();
  }, 12000);
});
onUnmounted(() => {
  window.removeEventListener('genius:auth-required', requestLogin);
  if (syncInterval) clearInterval(syncInterval);
});

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
    <MabaAuthModal v-if="needsLogin" :isOpen="true" reauthenticate @close="handleDismissLogin" @complete="resumePage" />
    <XpCelebrationModal />
  </div>
</template>
