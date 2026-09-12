<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted, onUnmounted, ref } from 'vue';
import MabaAuthModal from '@/components/auth/MabaAuthModal.vue';

const needsLogin = ref(false);
const viewVersion = ref(0);
const requestLogin = () => { needsLogin.value = true; };
function resumePage() {
  needsLogin.value = false;
  viewVersion.value += 1;
}
onMounted(() => window.addEventListener('genius:auth-required', requestLogin));
onUnmounted(() => window.removeEventListener('genius:auth-required', requestLogin));
</script>

<template>
  <div id="app" class="min-h-screen bg-[#2d1b0e] text-[#f0e0c0] font-sans antialiased selection:bg-[#7ec850] selection:text-[#1b120a]">
    <RouterView :key="viewVersion" />
    <MabaAuthModal v-if="needsLogin" :isOpen="true" reauthenticate @close="needsLogin = false" @complete="resumePage" />
  </div>
</template>

<style>
/* App root base layout */
</style>
