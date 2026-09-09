<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { gsap } from '@/lib/gsap';

const props = defineProps<{
  active: boolean;
}>();

const containerRef = ref<HTMLElement | null>(null);
const tweens: gsap.core.Tween[] = [];
const timelines: gsap.core.Timeline[] = [];

// Bird config
const BIRD_COUNT = 6;
const birds = ref(
  Array.from({ length: BIRD_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 5 + Math.random() * 30,
    scale: 0.5 + Math.random() * 0.5,
    delay: Math.random() * 8,
    duration: 12 + Math.random() * 10,
    flip: Math.random() > 0.5,
  }))
);

// Cloud config
const CLOUD_COUNT = 4;
const clouds = ref(
  Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    id: i,
    y: 3 + i * 8 + Math.random() * 5,
    scale: 0.6 + Math.random() * 0.6,
    opacity: 0.12 + Math.random() * 0.15,
    delay: Math.random() * 15,
    duration: 35 + Math.random() * 25,
    variant: (i % 3) as 0 | 1 | 2,
  }))
);

function startAnimations() {
  if (!containerRef.value) return;

  // Animate birds
  const birdEls = containerRef.value.querySelectorAll('.ambient-bird');
  birdEls.forEach((el, i) => {
    const bird = birds.value[i];
    if (!bird) return;

    const tl = gsap.timeline({
      repeat: -1,
      delay: bird.delay,
    });

    // Fly across screen
    tl.fromTo(
      el,
      {
        x: bird.flip ? '110vw' : '-15vw',
        y: `${bird.y}vh`,
        scaleX: bird.flip ? -bird.scale : bird.scale,
        scaleY: bird.scale,
        opacity: 0,
      },
      {
        x: bird.flip ? '-15vw' : '110vw',
        y: `${bird.y + (Math.random() - 0.5) * 12}vh`,
        duration: bird.duration,
        ease: 'none',
        opacity: 1,
        onStart: () => {
          // Wing flap animation
          const wingTween = gsap.to(el.querySelector('.bird-wing'), {
            scaleY: -1,
            duration: 0.18 + Math.random() * 0.1,
            yoyo: true,
            repeat: -1,
            ease: 'power1.inOut',
            transformOrigin: 'center center',
          });
          tweens.push(wingTween);
        },
      }
    );

    // gentle y bob
    const bobTween = gsap.to(el, {
      y: `+=${6 + Math.random() * 8}`,
      duration: 1.5 + Math.random(),
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });

    tweens.push(bobTween);
    timelines.push(tl);
  });

  // Animate clouds
  const cloudEls = containerRef.value.querySelectorAll('.ambient-cloud');
  cloudEls.forEach((el, i) => {
    const cloud = clouds.value[i];
    if (!cloud) return;

    const tl = gsap.timeline({
      repeat: -1,
      delay: cloud.delay,
    });

    tl.fromTo(
      el,
      {
        x: '-20vw',
        opacity: 0,
      },
      {
        x: '120vw',
        opacity: cloud.opacity,
        duration: cloud.duration,
        ease: 'none',
      }
    );

    timelines.push(tl);
  });
}

function stopAnimations() {
  tweens.forEach((t) => t.kill());
  timelines.forEach((t) => t.kill());
  tweens.length = 0;
  timelines.length = 0;
}

onMounted(() => {
  if (props.active) {
    startAnimations();
  }
});

onBeforeUnmount(() => {
  stopAnimations();
});

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }
);
</script>

<template>
  <div
    v-if="active"
    ref="containerRef"
    class="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
    aria-hidden="true"
  >
    <!-- Birds -->
    <svg
      v-for="bird in birds"
      :key="'bird-' + bird.id"
      class="ambient-bird absolute"
      :style="{
        top: bird.y + 'vh',
        left: '-15vw',
      }"
      width="28"
      height="20"
      viewBox="0 0 28 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Body -->
      <ellipse cx="14" cy="12" rx="6" ry="3.5" fill="#3a2818" opacity="0.9" />
      <!-- Head -->
      <circle cx="21" cy="10" r="2.5" fill="#3a2818" opacity="0.9" />
      <!-- Beak -->
      <polygon points="24,10 27,9.5 24,9" fill="#d4a060" />
      <!-- Eye -->
      <circle cx="22" cy="9.5" r="0.6" fill="#f0d060" />
      <!-- Tail -->
      <polygon points="8,11 3,8 4,13" fill="#2d1b0e" opacity="0.85" />
      <!-- Wing (animated) -->
      <g class="bird-wing" style="transform-origin: 14px 10px">
        <path d="M10,10 Q14,2 18,10" stroke="#4a3520" stroke-width="1.5" fill="#5a4030" opacity="0.8" />
      </g>
    </svg>

    <!-- Clouds -->
    <div
      v-for="cloud in clouds"
      :key="'cloud-' + cloud.id"
      class="ambient-cloud absolute"
      :style="{
        top: cloud.y + '%',
        left: '-20vw',
        transform: `scale(${cloud.scale})`,
        opacity: 0,
      }"
    >
      <!-- Cloud variant 0: wide flat -->
      <svg
        v-if="cloud.variant === 0"
        width="220"
        height="80"
        viewBox="0 0 220 80"
        fill="none"
      >
        <ellipse cx="110" cy="55" rx="100" ry="22" fill="#fbf0d0" opacity="0.5" />
        <ellipse cx="80" cy="42" rx="50" ry="28" fill="#fff5e0" opacity="0.45" />
        <ellipse cx="140" cy="38" rx="55" ry="30" fill="#fef6e2" opacity="0.4" />
        <ellipse cx="110" cy="35" rx="40" ry="25" fill="#fffaf0" opacity="0.5" />
      </svg>

      <!-- Cloud variant 1: puffy -->
      <svg
        v-else-if="cloud.variant === 1"
        width="180"
        height="90"
        viewBox="0 0 180 90"
        fill="none"
      >
        <ellipse cx="90" cy="60" rx="80" ry="25" fill="#fbf0d0" opacity="0.45" />
        <ellipse cx="60" cy="45" rx="45" ry="30" fill="#fff5e0" opacity="0.4" />
        <ellipse cx="120" cy="40" rx="50" ry="32" fill="#fef6e2" opacity="0.38" />
        <ellipse cx="90" cy="32" rx="35" ry="22" fill="#fffaf0" opacity="0.5" />
        <ellipse cx="70" cy="30" rx="25" ry="18" fill="#fffcf5" opacity="0.3" />
      </svg>

      <!-- Cloud variant 2: wispy -->
      <svg
        v-else
        width="260"
        height="60"
        viewBox="0 0 260 60"
        fill="none"
      >
        <ellipse cx="130" cy="40" rx="120" ry="16" fill="#fbf0d0" opacity="0.35" />
        <ellipse cx="100" cy="30" rx="60" ry="18" fill="#fff5e0" opacity="0.3" />
        <ellipse cx="170" cy="28" rx="50" ry="15" fill="#fef6e2" opacity="0.32" />
        <ellipse cx="130" cy="25" rx="45" ry="12" fill="#fffaf0" opacity="0.35" />
      </svg>
    </div>
  </div>
</template>
