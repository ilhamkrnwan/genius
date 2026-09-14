import { gsap } from 'gsap';

export { gsap };

/**
 * Animasi transisi masuk halaman (RPG Scene Entrance)
 */
export function animatePageEnter(target: HTMLElement | string, options: gsap.TweenVars = {}) {
  return gsap.from(target, {
    opacity: 0,
    y: 18,
    scale: 0.99,
    duration: 0.45,
    ease: 'power2.out',
    ...options,
  });
}

/**
 * Stagger animasi kartu / list item bertingkat
 */
export function staggerFadeUp(targets: HTMLElement[] | string, stagger = 0.07, options: gsap.TweenVars = {}) {
  return gsap.from(targets, {
    opacity: 0,
    y: 24,
    scale: 0.96,
    duration: 0.4,
    stagger,
    ease: 'back.out(1.5)',
    clearProps: 'all',
    ...options,
  });
}

/**
 * Efek stempel RPG jatuh & membal kuat (Passport Stamp Slam Effect)
 */
export function stampSlamEffect(target: HTMLElement | string, options: gsap.TweenVars = {}) {
  return gsap.fromTo(
    target,
    {
      scale: 2.2,
      opacity: 0,
      rotation: -18,
    },
    {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.5,
      ease: 'back.out(2.2)',
      ...options,
    }
  );
}

/**
 * Efek pop badge, koin XP, atau tombol level-up
 */
export function bouncePop(target: HTMLElement | string, options: gsap.TweenVars = {}) {
  return gsap.fromTo(
    target,
    { scale: 0.75, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: 'back.out(2.8)',
      ...options,
    }
  );
}

/**
 * Animasi penghitung angka XP / Skor bertambah lancar
 */
export function countNumber(
  onUpdate: (val: number) => void,
  startVal: number,
  endVal: number,
  duration = 1.0
) {
  const obj = { val: startVal };
  return gsap.to(obj, {
    val: endVal,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      onUpdate(Math.round(obj.val));
    },
  });
}

/**
 * Efek melayang lembut ambient untuk emblem / maskot
 */
export function floatElement(target: HTMLElement | string, distance = 6, duration = 2.4) {
  return gsap.to(target, {
    y: -distance,
    duration,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}
