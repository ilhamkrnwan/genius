<template><label class="block space-y-1.5"><span class="block font-pixel text-[9px] text-gray-400 uppercase">{{ label }}</span><slot /></label></template>
<script setup lang="ts">defineProps<{ label: string }>();</script>
