<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick } from 'vue';
import { gsap } from '@/lib/gsap';

const props = withDefaults(
  defineProps<{
    active?: boolean;
  }>(),
  {
    active: false,
  }
);

const containerRef = ref<HTMLElement | null>(null);
const tweens: gsap.core.Tween[] = [];
const timelines: gsap.core.Timeline[] = [];

// 1. Distant Horizon Pixel Clouds (Ukuran lebih mungil, melayang lambat & lembut di latar belakang cakrawala)
const clouds = [
  { id: 0, variant: 0, startX: 5, y: 2, scale: 0.75, duration: 85, opacity: 0.68, label: 'Cumulus Jauh Kiri' },
  { id: 1, variant: 1, startX: 38, y: 7, scale: 0.7, duration: 105, opacity: 0.62, label: 'Majestic Jauh Tengah' },
  { id: 2, variant: 2, startX: 68, y: 3, scale: 0.8, duration: 90, opacity: 0.65, label: 'Double Puff Jauh Kanan' },
  { id: 3, variant: 3, startX: 88, y: 11, scale: 0.6, duration: 75, opacity: 0.55, label: 'Wisp Mungil Jauh' },
  { id: 4, variant: 2, startX: -10, y: 9, scale: 0.65, duration: 115, opacity: 0.52, label: 'Double Puff Background' },
  { id: 5, variant: 3, startX: 20, y: 1.5, scale: 0.58, duration: 80, opacity: 0.58, label: 'Wisp Cakrawala Atas' },
];

// 2. Retro Pixel Birds (Burung Merpati Putih Pixel Art)
const birds = [
  { id: 0, startX: 20, y: 7, scale: 0.95, flip: false, duration: 16 },
  { id: 1, startX: 65, y: 14, scale: 0.8, flip: true, duration: 18 },
  { id: 2, startX: -12, y: 10, scale: 1.0, flip: false, duration: 20 },
  { id: 3, startX: 112, y: 20, scale: 0.75, flip: true, duration: 22 },
  { id: 4, startX: 42, y: 26, scale: 0.7, flip: false, duration: 17 },
];

// 3. Falling Leaves / Petals (Efek Alam Stardew Valley)
const LEAF_COUNT = 8;
const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => ({
  id: i,
  startX: (i * 12.5) + (Math.random() * 8),
  startY: -10 - (Math.random() * 25),
  scale: 0.65 + Math.random() * 0.45,
  color: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#86efac' : '#fde047',
  duration: 9 + Math.random() * 6,
  delay: Math.random() * 3,
}));

function startAnimations() {
  stopAnimations();
  if (!containerRef.value) return;

  // --- A. ANIMASI AWAN PIXEL (Melayang halus & looping alami) ---
  const cloudEls = containerRef.value.querySelectorAll<HTMLElement>('.ambient-cloud');
  cloudEls.forEach((el, i) => {
    const cloud = clouds[i];
    if (!cloud) return;

    const currentPercent = cloud.startX;
    const remainingDistance = 120 - currentPercent;
    const initialDuration = cloud.duration * (remainingDistance / 145);

    const tl = gsap.timeline({ repeat: -1 });

    // Step 1: Melayang dari posisi awal layar ke sisi kanan
    tl.to(el, {
      x: `${remainingDistance}vw`,
      duration: Math.max(initialDuration, 3),
      ease: 'none',
    });

    // Step 2: Teleport ke sisi kiri luar (-30vw) lalu meluncur penuh ke kanan
    tl.set(el, { x: `${-currentPercent - 30}vw` });
    tl.to(el, {
      x: `${remainingDistance}vw`,
      duration: cloud.duration,
      ease: 'none',
    });

    timelines.push(tl);
  });

  // --- B. ANIMASI BURUNG PIXEL ---
  const birdEls = containerRef.value.querySelectorAll<HTMLElement>('.ambient-bird');
  birdEls.forEach((el, i) => {
    const bird = birds[i];
    if (!bird) return;

    // Animasi kepakan sayap
    const wingEl = el.querySelector('.bird-wing');
    if (wingEl) {
      const flapTween = gsap.to(wingEl, {
        scaleY: -0.85,
        duration: 0.15 + (i % 3) * 0.03,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
        transformOrigin: '10px 8px',
      });
      tweens.push(flapTween);
    }

    // Ayunan gelombang vertikal halus
    const bobTween = gsap.to(el, {
      y: `+=${6 + (i % 3) * 4}`,
      duration: 1.3 + (i % 2) * 0.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    tweens.push(bobTween);

    // Jalur terbang melintasi layar
    const tl = gsap.timeline({ repeat: -1 });
    const targetX = bird.flip ? -130 : 130;

    tl.to(el, {
      x: `${targetX}vw`,
      duration: bird.duration,
      ease: 'none',
    });

    const resetX = bird.flip ? 130 : -130;
    tl.set(el, { x: `${resetX}vw` });
    tl.to(el, {
      x: `${targetX}vw`,
      duration: bird.duration + 2,
      ease: 'none',
    });

    timelines.push(tl);
  });

  // --- C. ANIMASI DAUN GUGUR ALAM ---
  const leafEls = containerRef.value.querySelectorAll<HTMLElement>('.ambient-leaf');
  leafEls.forEach((el, i) => {
    const leaf = leaves[i];
    if (!leaf) return;

    const swayTween = gsap.to(el, {
      x: `+=${22 + (i % 4) * 8}`,
      rotation: 360,
      duration: 2.3 + (i % 3) * 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    tweens.push(swayTween);

    const fallTl = gsap.timeline({ repeat: -1, delay: leaf.delay });
    fallTl.fromTo(
      el,
      { y: '-10vh', opacity: 0 },
      {
        y: '110vh',
        opacity: 0.85,
        duration: leaf.duration,
        ease: 'none',
        onRepeat: () => {
          gsap.set(el, { opacity: 0.85 });
        },
      }
    );
    timelines.push(fallTl);
  });
}

function stopAnimations() {
  tweens.forEach((t) => t.kill());
  timelines.forEach((t) => t.kill());
  tweens.length = 0;
  timelines.length = 0;
}

watch(
  () => props.active,
  async (isActive) => {
    await nextTick();
    if (isActive) {
      startAnimations();
    } else {
      stopAnimations();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  stopAnimations();
});
</script>

<template>
  <div
    v-show="active"
    ref="containerRef"
    class="absolute inset-0 z-[5] pointer-events-none overflow-hidden"
    aria-hidden="true"
  >
    <!-- ========================================================================= -->
    <!-- 1. RETRO PIXEL CLOUDS (Voluminous, Stepped Pixel Edges, High Contrast)   -->
    <!-- ========================================================================= -->
    <div
      v-for="cloud in clouds"
      :key="'cloud-' + cloud.id"
      class="ambient-cloud absolute pointer-events-none"
      :style="{
        top: `${cloud.y}%`,
        left: `${cloud.startX}%`,
        transform: `scale(${cloud.scale})`,
        opacity: cloud.opacity,
      }"
    >
      <!-- ========================================== -->
      <!-- VARIANT 0: AWAN GUMPAL MEGAR (Puffy Cumulus) -->
      <!-- ========================================== -->
      <svg
        v-if="cloud.variant === 0"
        width="128"
        height="72"
        viewBox="0 0 64 36"
        shape-rendering="crispEdges"
        fill="none"
        class="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.22)]"
      >
        <!-- Crisp Pixel Dark Outline / Bottom Depth Base -->
        <path d="M 12 33 H 52 V 35 H 12 Z M 6 29 H 58 V 33 H 6 Z M 4 25 H 60 V 29 H 4 Z" fill="#1e293b" fill-opacity="0.35" />

        <!-- Shading Layer (Pixel Shadow bawah awan) -->
        <path d="M 14 29 H 50 V 33 H 14 Z M 8 25 H 56 V 29 H 8 Z M 6 21 H 58 V 25 H 6 Z" fill="#cbd5e1" fill-opacity="0.9" />

        <!-- Main Cloud Body (Gumpalan Megar Putih Tebal) -->
        <path d="
          M 6 19 H 58 V 23 H 6 Z
          M 8 15 H 56 V 19 H 8 Z
          M 12 11 H 52 V 15 H 12 Z
          M 16 9 H 48 V 11 H 16 Z
          M 22 5 H 42 V 9 H 22 Z
          M 26 3 H 38 V 5 H 26 Z
        " fill="#ffffff" />

        <!-- Gumpalan Samping Kiri & Kanan (Puffy Cheeks) -->
        <path d="M 10 13 H 22 V 21 H 10 Z M 12 11 H 18 V 13 H 12 Z" fill="#ffffff" />
        <path d="M 42 11 H 54 V 21 H 42 Z M 46 9 H 52 V 11 H 46 Z" fill="#ffffff" />

        <!-- Highlight Puncak Awan (Kuning Gading / Warm Ivory Pixel) -->
        <path d="
          M 26 3 H 38 V 5 H 26 Z
          M 24 5 H 26 V 7 H 24 Z
          M 38 5 H 40 V 7 H 38 Z
          M 12 11 H 18 V 13 H 12 Z
          M 46 9 H 52 V 11 H 46 Z
        " fill="#fffbeb" />
      </svg>

      <!-- ============================================== -->
      <!-- VARIANT 1: AWAN MEGAH BERLAPIS (Majestic Cloud) -->
      <!-- ============================================== -->
      <svg
        v-else-if="cloud.variant === 1"
        width="155"
        height="70"
        viewBox="0 0 84 38"
        shape-rendering="crispEdges"
        fill="none"
        class="filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.25)]"
      >
        <!-- Crisp Bottom Silhouette -->
        <path d="M 10 34 H 74 V 36 H 10 Z M 6 30 H 78 V 34 H 6 Z M 4 26 H 80 V 30 H 4 Z" fill="#1e293b" fill-opacity="0.32" />

        <!-- Bottom Shading Tier -->
        <path d="M 12 30 H 72 V 34 H 12 Z M 8 26 H 76 V 30 H 8 Z M 6 22 H 78 V 26 H 6 Z" fill="#cbd5e1" fill-opacity="0.88" />

        <!-- Main Body: Tiga Puncak Megah (Kiri, Tengah Menjulang, Kanan) -->
        <path d="
          M 6 18 H 78 V 22 H 6 Z
          M 8 14 H 76 V 18 H 8 Z
          M 12 10 H 72 V 14 H 12 Z
          M 16 8 H 68 V 10 H 16 Z
        " fill="#ffffff" />

        <!-- Puncak Menara Tengah (Towering Center Dome) -->
        <path d="
          M 32 4 H 52 V 8 H 32 Z
          M 36 2 H 48 V 4 H 36 Z
        " fill="#ffffff" />

        <!-- Kubah Kiri -->
        <path d="M 14 8 H 28 V 14 H 14 Z M 16 6 H 26 V 8 H 16 Z" fill="#ffffff" />

        <!-- Kubah Kanan -->
        <path d="M 54 8 H 70 V 14 H 54 Z M 58 6 H 66 V 8 H 58 Z" fill="#ffffff" />

        <!-- Highlights Atas -->
        <path d="
          M 36 2 H 48 V 4 H 36 Z
          M 16 6 H 26 V 8 H 16 Z
          M 58 6 H 66 V 8 H 58 Z
        " fill="#fffbeb" />
      </svg>

      <!-- ============================================== -->
      <!-- VARIANT 2: AWAN GUMPAL KEMBAR (Cute Double Puff)-->
      <!-- ============================================== -->
      <svg
        v-else-if="cloud.variant === 2"
        width="108"
        height="64"
        viewBox="0 0 54 32"
        shape-rendering="crispEdges"
        fill="none"
        class="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
      >
        <!-- Bottom Base Shadow -->
        <path d="M 8 28 H 46 V 31 H 8 Z M 4 24 H 50 V 28 H 4 Z" fill="#1e293b" fill-opacity="0.3" />
        <path d="M 10 24 H 44 V 28 H 10 Z M 6 20 H 48 V 24 H 6 Z" fill="#cbd5e1" fill-opacity="0.9" />

        <!-- Main Body -->
        <path d="
          M 6 16 H 48 V 20 H 6 Z
          M 8 12 H 46 V 16 H 8 Z
        " fill="#ffffff" />

        <!-- Kubah Kiri Bulat Puffy -->
        <path d="
          M 10 8 H 26 V 12 H 10 Z
          M 14 5 H 22 V 8 H 14 Z
        " fill="#ffffff" />

        <!-- Kubah Kanan Lebih Tinggi -->
        <path d="
          M 24 6 H 42 V 12 H 24 Z
          M 28 3 H 38 V 6 H 28 Z
        " fill="#ffffff" />

        <!-- Highlight -->
        <path d="
          M 14 5 H 22 V 7 H 14 Z
          M 28 3 H 38 V 5 H 28 Z
        " fill="#fffbeb" />
      </svg>

      <!-- ============================================== -->
      <!-- VARIANT 3: AWAN MUNGIL MELAYANG (Small Fluff Wisp) -->
      <!-- ============================================== -->
      <svg
        v-else
        width="80"
        height="48"
        viewBox="0 0 40 24"
        shape-rendering="crispEdges"
        fill="none"
        class="filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
      >
        <!-- Base Shadow -->
        <path d="M 6 20 H 34 V 22 H 6 Z M 4 17 H 36 V 20 H 4 Z" fill="#cbd5e1" fill-opacity="0.9" />

        <!-- Main Body -->
        <path d="
          M 4 13 H 36 V 17 H 4 Z
          M 8 9 H 32 V 13 H 8 Z
          M 14 5 H 26 V 9 H 14 Z
          M 18 3 H 22 V 5 H 18 Z
        " fill="#ffffff" />

        <!-- Highlight -->
        <path d="M 18 3 H 22 V 5 H 18 Z M 10 9 H 14 V 11 H 10 Z M 26 9 H 30 V 11 H 26 Z" fill="#fffbeb" />
      </svg>
    </div>

    <!-- ========================================================================= -->
    <!-- 2. RETRO PIXEL BIRDS (Merpati Putih Pixel dengan Kepakan Sayap)           -->
    <!-- ========================================================================= -->
    <svg
      v-for="bird in birds"
      :key="'bird-' + bird.id"
      class="ambient-bird absolute pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
      :style="{
        top: `${bird.y}vh`,
        left: `${bird.startX}vw`,
        transform: `scale(${bird.scale}) ${bird.flip ? 'scaleX(-1)' : ''}`,
      }"
      width="34"
      height="22"
      viewBox="0 0 24 16"
      shape-rendering="crispEdges"
      fill="none"
    >
      <!-- Ekor Pixel -->
      <path d="M 2 8 H 6 V 11 H 2 Z M 0 6 H 3 V 9 H 0 Z" fill="#e2e8f0" />

      <!-- Badan Pixel (Putih Bersih) -->
      <path d="M 6 7 H 17 V 12 H 6 Z M 8 12 H 15 V 13 H 8 Z" fill="#ffffff" />

      <!-- Kepala Pixel -->
      <path d="M 15 5 H 20 V 9 H 15 Z" fill="#ffffff" />

      <!-- Paruh Emas Pixel -->
      <path d="M 20 6 H 23 V 8 H 20 Z" fill="#f59e0b" />

      <!-- Mata Pixel Gelap -->
      <path d="M 18 6 H 19 V 7 H 18 Z" fill="#0f172a" />

      <!-- Sayap Pixel Bergerak (Animated Wing) -->
      <g class="bird-wing" style="transform-origin: 10px 8px">
        <path d="M 8 4 H 14 V 8 H 8 Z M 9 2 H 13 V 4 H 9 Z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.5" />
      </g>
    </svg>

    <!-- ========================================================================= -->
    <!-- 3. FALLING NATURE LEAVES (Kelopak Daun Gugur Stardew Valley)              -->
    <!-- ========================================================================= -->
    <div
      v-for="leaf in leaves"
      :key="'leaf-' + leaf.id"
      class="ambient-leaf absolute pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      :style="{
        top: `${leaf.startY}vh`,
        left: `${leaf.startX}vw`,
        transform: `scale(${leaf.scale})`,
      }"
    >
      <!-- Pixel Leaf Block -->
      <svg width="16" height="16" viewBox="0 0 8 8" shape-rendering="crispEdges" fill="none">
        <path
          d="
            M 3 1 H 5 V 2 H 3 Z
            M 2 2 H 6 V 3 H 2 Z
            M 1 3 H 7 V 5 H 1 Z
            M 2 5 H 6 V 6 H 2 Z
            M 3 6 H 5 V 7 H 3 Z
          "
          :fill="leaf.color"
        />
        <!-- Center rib highlight -->
        <path d="M 2 4 H 6 V 5 H 2 Z" fill="#ffffff" fill-opacity="0.5" />
      </svg>
    </div>
  </div>
</template>
