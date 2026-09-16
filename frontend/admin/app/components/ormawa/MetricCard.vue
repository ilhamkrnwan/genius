<template><div class="pixel-card p-3 border text-center" :class="colorClass"><div class="font-pixel text-lg font-bold">{{ value }}</div><p class="text-[8px] uppercase mt-1 opacity-70">{{ label }}</p></div></template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ label: string; value: number; color: 'green' | 'amber' | 'purple' }>();
const colorClass = computed(() => ({ green: 'border-green-700 bg-green-950/40 text-green-300', amber: 'border-amber-700 bg-amber-950/40 text-amber-300', purple: 'border-purple-700 bg-purple-950/40 text-purple-300' }[props.color]));
</script>
