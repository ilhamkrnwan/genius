<script setup lang="ts">
import CrtScanlines from '@/components/layout/CrtScanlines.vue';
import HeroSection from '@/components/landing/HeroSection.vue';
import StorySection from '@/components/landing/StorySection.vue';
import HowToPlaySection from '@/components/landing/HowToPlaySection.vue';
import FloorsPreviewSection from '@/components/landing/FloorsPreviewSection.vue';
import RewardsSection from '@/components/landing/RewardsSection.vue';
import FaqSection from '@/components/landing/FaqSection.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-[#2d1b0e] text-[#f0e0c0] selection:bg-[#7ec850] selection:text-[#1b120a]">
    <CrtScanlines />
    
    <main class="flex-1 flex flex-col w-full">
      <!-- 1. Hero Section & Main Menu Screen -->
      <HeroSection />

      <!-- 2. The Lore & 4 Pillars of Character -->
      <StorySection />

      <!-- 3. How to Play & Gamification Steps -->
      <HowToPlaySection />

      <!-- 4. Interactive 9 Floors Tower Preview -->
      <FloorsPreviewSection />

      <!-- 5. Rewards & Hall of Fame / Leaderboard Teaser -->
      <RewardsSection />

      <!-- 6. FAQ & Posko Helpdesk -->
      <FaqSection />
    </main>

    <!-- 7. RPG Styled Retro Footer -->
    <LandingFooter />
  </div>
</template>
