<script setup lang="ts">
/**
 * AmbientMascots.vue
 * 5 pixel-art mascot characters dari dunia PKKMB UNU 2026 dengan animasi idle.
 * - Kucing wisuda (spritesheet CSS steps)
 * - Bebek wisuda  (spritesheet CSS steps)
 * - Bunga Matahari (sway)
 * - Lebah pixel  (hover bounce SVG inline)
 * - Burung Merpati (float SVG inline dari ambient-birds.jpg)
 */
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { gsap } from '@/lib/gsap';

const props = withDefaults(
  defineProps<{
    active?: boolean;
  }>(),
  { active: false }
);

const containerRef = ref<HTMLElement | null>(null);
const tweens: gsap.core.Tween[] = [];

// Posisi tiap maskot pada layar (% dari viewport)
const mascots = [
  { id: 'cat',       x: 20,  y: 80, scale: 1.0,  delay: 0   },
  { id: 'duck',      x: 80,  y: 80, scale: 1.0,  delay: 1.0 },
  { id: 'sunflower', x: 92,  y: 80, scale: 1.0,  delay: 2.0 },
  { id: 'bee',       x: 72,  y: 48, scale: 1.0,  delay: 1.5 },
  { id: 'dove',      x: 83,  y: 32, scale: 0.9,  delay: 2.5 },
];

function startAnimations() {
  stopAnimations();
  if (!containerRef.value) return;

  // --- Kucing & Bebek: gentle relaxed bob (durasi 5.8s, delay 5.8s) ---
  ['cat', 'duck'].forEach((id, idx) => {
    const el = containerRef.value!.querySelector<HTMLElement>(`.mascot-${id}`);
    if (!el) return;
    const t = gsap.to(el, {
      y: '+=4',
      duration: 5.8,
      repeatDelay: 5.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: mascots.find(m => m.id === id)?.delay ?? 0,
    });
    tweens.push(t);
  });

  // --- Bunga Matahari: gentle slow sway (durasi 6.5s, delay 5.5s) ---
  const sunEl = containerRef.value.querySelector<HTMLElement>('.mascot-sunflower');
  if (sunEl) {
    const t = gsap.to(sunEl, {
      rotation: 3.5,
      duration: 6.5,
      repeatDelay: 5.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      transformOrigin: '50% 100%',
      delay: 1.8,
    });
    tweens.push(t);
  }

  // --- Lebah: slow hover float (durasi 5.5s, delay 5.5s) ---
  const beeEl = containerRef.value.querySelector<HTMLElement>('.mascot-bee');
  if (beeEl) {
    const t1 = gsap.to(beeEl, {
      y: '+=6',
      x: '+=5',
      duration: 5.5,
      repeatDelay: 5.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 1.0,
    });
    const t2 = gsap.to(beeEl, {
      rotation: 5,
      duration: 5.0,
      repeatDelay: 6.0,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 1.0,
    });
    tweens.push(t1, t2);
  }

  // --- Burung merpati: slow graceful float (durasi 6.0s, delay 6.0s) ---
  const doveEl = containerRef.value.querySelector<HTMLElement>('.mascot-dove');
  if (doveEl) {
    const t = gsap.to(doveEl, {
      y: '+=8',
      x: '+=6',
      duration: 6.0,
      repeatDelay: 6.0,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 2.2,
    });
    tweens.push(t);
  }
}

function stopAnimations() {
  try {
    tweens.forEach(t => t.kill());
  } catch {
    // ignore
  }
  tweens.length = 0;
}

onMounted(() => {
  if (props.active) {
    nextTick(() => {
      startAnimations();
    });
  }
});

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      nextTick(() => {
        startAnimations();
      });
    } else {
      stopAnimations();
    }
  }
);

onBeforeUnmount(() => stopAnimations());
</script>

<template>
  <div
    v-show="active"
    ref="containerRef"
    class="absolute inset-0 z-[6] pointer-events-none overflow-hidden"
    aria-hidden="true"
  >
    <!-- ============================================================ -->
    <!-- 1. KUCING WISUDA — Spritesheet 5 frames, CSS steps animation -->
    <!-- ============================================================ -->
    <div
      class="mascot-cat absolute flex flex-col items-center"
      :style="{
        bottom: '5%',
        left: '20%',
        transform: 'scale(1.0)',
        imageRendering: 'pixelated',
      }"
    >
      <div class="mascot-cat-sprite" />
      <!-- Subtle Ground Shadow -->
      <div class="w-16 h-3 bg-black/45 rounded-[100%] blur-[1px] -mt-1 pointer-events-none" />
    </div>

    <!-- ============================================================ -->
    <!-- 2. BEBEK WISUDA — Spritesheet 5 frames, CSS steps animation  -->
    <!-- ============================================================ -->
    <div
      class="mascot-duck absolute flex flex-col items-center"
      :style="{
        bottom: '5%',
        left: '80%',
        transform: 'scale(1.0)',
        imageRendering: 'pixelated',
      }"
    >
      <div class="mascot-duck-sprite" />
      <!-- Subtle Ground Shadow -->
      <div class="w-16 h-3 bg-black/45 rounded-[100%] blur-[1px] -mt-1 pointer-events-none" />
    </div>

    <!-- ============================================================ -->
    <!-- 3. BUNGA MATAHARI — Single image, GSAP sway                  -->
    <!-- ============================================================ -->
    <div
      class="mascot-sunflower absolute flex flex-col items-center"
      :style="{
        bottom: '5%',
        left: '92%',
        transform: 'translateX(-50%)',
        imageRendering: 'pixelated',
        transformOrigin: '50% 100%',
      }"
    >
      <div class="mascot-sunflower-sprite" />
      <!-- Subtle Ground Shadow -->
      <div class="w-14 h-3 bg-black/40 rounded-[100%] blur-[1px] -mt-1 pointer-events-none" />
    </div>

    <!-- ============================================================ -->
    <!-- 4. LEBAH — Pixel art SVG inline, GSAP hover float            -->
    <!-- ============================================================ -->
    <div
      class="mascot-bee absolute"
      :style="{
        bottom: '52%',
        left: '72%',
      }"
    >
      <svg
        width="52"
        height="40"
        viewBox="0 0 26 20"
        shape-rendering="crispEdges"
        fill="none"
        class="drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] mascot-bee-svg"
      >
        <!-- Antena kiri & kanan -->
        <path d="M 8 2 H 9 V 4 H 8 Z M 17 2 H 18 V 4 H 17 Z" fill="#1a1a1a" />
        <path d="M 7 0 H 10 V 2 H 7 Z M 16 0 H 19 V 2 H 16 Z" fill="#1a1a1a" />

        <!-- Kepala (hitam) -->
        <path d="M 9 4 H 17 V 8 H 9 Z" fill="#1a1a1a" />
        <!-- Mata kiri & kanan -->
        <path d="M 10 5 H 12 V 7 H 10 Z M 14 5 H 16 V 7 H 14 Z" fill="#ffffff" />
        <path d="M 11 5 H 12 V 6 H 11 Z M 15 5 H 16 V 6 H 15 Z" fill="#111111" />

        <!-- Badan kuning -->
        <path d="M 7 8 H 19 V 16 H 7 Z" fill="#f9c832" />
        <!-- Garis hitam badan (stripe) -->
        <path d="M 7 10 H 19 V 12 H 7 Z" fill="#1a1a1a" />
        <path d="M 7 14 H 19 V 16 H 7 Z" fill="#1a1a1a" />

        <!-- Sengat bawah -->
        <path d="M 12 16 H 14 V 18 H 12 Z M 13 18 H 14 V 20 H 13 Z" fill="#f59e0b" />

        <!-- Sayap kiri -->
        <path d="M 2 6 H 8 V 10 H 2 Z M 1 7 H 3 V 9 H 1 Z" fill="#e0f2fe" fill-opacity="0.85" stroke="#93c5fd" stroke-width="0.4" />
        <!-- Sayap kanan -->
        <path d="M 18 6 H 24 V 10 H 18 Z M 23 7 H 25 V 9 H 23 Z" fill="#e0f2fe" fill-opacity="0.85" stroke="#93c5fd" stroke-width="0.4" />
      </svg>
    </div>

    <!-- ============================================================ -->
    <!-- 5. BURUNG MERPATI — Pixel art SVG inline, GSAP float         -->
    <!-- ============================================================ -->
    <div
      class="mascot-dove absolute"
      :style="{
        bottom: '68%',
        left: '83%',
      }"
    >
      <svg
        width="64"
        height="44"
        viewBox="0 0 32 22"
        shape-rendering="crispEdges"
        fill="none"
        class="drop-shadow-[0_3px_8px_rgba(0,0,0,0.75)] mascot-dove-svg"
      >
        <!-- Ekor -->
        <path d="M 0 10 H 5 V 13 H 0 Z M 2 8 H 4 V 10 H 2 Z" fill="#d1d5db" />

        <!-- Badan putih -->
        <path d="M 5 9 H 20 V 15 H 5 Z M 7 15 H 17 V 16 H 7 Z" fill="#f3f4f6" />

        <!-- Kepala -->
        <path d="M 18 7 H 24 V 12 H 18 Z M 20 6 H 23 V 7 H 20 Z" fill="#f3f4f6" />

        <!-- Paruh emas -->
        <path d="M 24 8 H 28 V 10 H 24 Z M 26 10 H 28 V 11 H 26 Z" fill="#f59e0b" />

        <!-- Mata -->
        <path d="M 21 8 H 23 V 10 H 21 Z" fill="#0f172a" />
        <path d="M 22 8 H 23 V 9 H 22 Z" fill="#60a5fa" />

        <!-- Sayap atas (animated via CSS) -->
        <g class="dove-wing">
          <path d="M 7 5 H 17 V 9 H 7 Z M 9 3 H 15 V 5 H 9 Z M 11 1 H 13 V 3 H 11 Z" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.3" />
        </g>

        <!-- Highlight putih sayap -->
        <path d="M 10 6 H 15 V 7 H 10 Z" fill="#ffffff" fill-opacity="0.6" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* ================================================================ */
/* KUCING WISUDA — Spritesheet santai: 6s animasi + 6s delay (12s) */
/* ================================================================ */
@keyframes cat-idle {
  0%, 50%, 100% { background-position: 0 0; }
  10%, 19.99%   { background-position: -275px 0; }
  20%, 29.99%   { background-position: -550px 0; }
  30%, 39.99%   { background-position: -825px 0; }
  40%, 49.99%   { background-position: -1101px 0; }
}
.mascot-cat-sprite {
  width: 275px;
  height: 270px;
  background-image: url('/mascots/mascot-cat-idle-clean.png');
  background-size: 1376px 270px;
  background-repeat: no-repeat;
  background-position: 0 0;
  image-rendering: pixelated;
  animation: cat-idle 12s infinite;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.7));
  transform: scale(0.42);
  transform-origin: bottom center;
}

/* ================================================================ */
/* BEBEK WISUDA — Spritesheet santai: 6s animasi + 6s delay (12s)  */
/* ================================================================ */
@keyframes duck-idle {
  0%, 50%, 100% { background-position: 0 0; }
  10%, 19.99%   { background-position: -275px 0; }
  20%, 29.99%   { background-position: -550px 0; }
  30%, 39.99%   { background-position: -825px 0; }
  40%, 49.99%   { background-position: -1101px 0; }
}
.mascot-duck-sprite {
  width: 275px;
  height: 270px;
  background-image: url('/mascots/mascot-duck-idle-clean.png');
  background-size: 1376px 270px;
  background-repeat: no-repeat;
  background-position: 0 0;
  image-rendering: pixelated;
  animation: duck-idle 12s infinite;
  animation-delay: 1.5s;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.7));
  transform: scale(0.42);
  transform-origin: bottom center;
}

/* ================================================================ */
/* BUNGA MATAHARI — Spritesheet vertikal: 6s animasi + 6.5s delay  */
/* ================================================================ */
@keyframes sunflower-idle {
  0%, 50%, 100% { background-position: 0 0; }
  10%, 19.99%   { background-position: 0 -275px; }
  20%, 29.99%   { background-position: 0 -550px; }
  30%, 39.99%   { background-position: 0 -825px; }
  40%, 49.99%   { background-position: 0 -1101px; }
}
.mascot-sunflower-sprite {
  width: 280px;
  height: 275px;
  background-image: url('/mascots/mascot-sunflower-idle-clean.png');
  background-size: 280px 1376px;
  background-repeat: no-repeat;
  background-position: 0 0;
  image-rendering: pixelated;
  animation: sunflower-idle 12.5s infinite;
  animation-delay: 2.5s;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));
  transform: scale(0.42);
  transform-origin: bottom center;
}

/* ================================================================ */
/* LEBAH — Sayap santai: flutter 5.5s, hover glide 5.5s (11s)       */
/* ================================================================ */
@keyframes bee-wings {
  0%, 50%, 100% { transform: scaleY(1); }
  6%, 18%, 30%, 42% { transform: scaleY(0.85); }
  12%, 24%, 36%, 48% { transform: scaleY(1); }
}
.mascot-bee-svg {
  animation: bee-wings 11s ease-in-out infinite;
}

/* ================================================================ */
/* BURUNG MERPATI — Kepak sayap santai: 5.5s gerak, 5.5s melayang   */
/* ================================================================ */
@keyframes dove-flap {
  0%, 50%, 100% { transform: scaleY(1) translateY(0); }
  8%, 24%, 40%  { transform: scaleY(-0.7) translateY(2px); }
  16%, 32%, 48% { transform: scaleY(1) translateY(0); }
}
.dove-wing {
  transform-origin: 12px 9px;
  animation: dove-flap 11s ease-in-out infinite;
  animation-delay: 1.5s;
}

/* ================================================================ */
/* Global: entrance fade-in saat active                             */
/* ================================================================ */
.mascot-bee,
.mascot-dove,
.mascot-cat,
.mascot-duck,
.mascot-sunflower {
  animation-fill-mode: both;
}
</style>
