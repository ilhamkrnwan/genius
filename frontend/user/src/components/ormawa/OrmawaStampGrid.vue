<template>
  <div class="bg-[#f3ecd8] border-2 border-[#d4c3a3] rounded-xl p-4 mt-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-pixel text-[#3a2818] font-bold text-sm flex items-center gap-2">
        <PhBookOpen class="w-4 h-4 text-[#166534]" />
        KOLEKSI LENCANA
      </h3>
      <div class="text-xs font-mono text-[#5c4033] bg-[#e6dcc3] px-2 py-1 rounded">
        {{ visitedCount }} / {{ maxStamps }} Lencana
      </div>
    </div>
    
    <div class="grid grid-cols-5 gap-2 sm:gap-3">
      <div 
        v-for="i in maxStamps" 
        :key="i"
        class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300"
        :class="[
          i <= visitedCount 
            ? 'border-[#3a2818] bg-[#fbf6e9] shadow-[2px_2px_0px_#3a2818]' 
            : 'border-[#d4c3a3] bg-transparent opacity-50'
        ]"
      >
        <template v-if="i <= visitedCount">
          <!-- Get stand data for this stamp if available -->
          <component 
            :is="getIcon(i - 1)" 
            class="w-6 h-6 sm:w-8 sm:h-8 mb-1"
            :style="{ color: getColor(i - 1) }"
          />
          <div class="text-[8px] sm:text-[10px] font-mono text-[#3a2818] font-bold truncate w-full text-center px-1">
            {{ getShortName(i - 1) }}
          </div>
          <!-- Success stamp overlay -->
          <div class="absolute -inset-1 border-2 border-red-500 rounded-full opacity-20 rotate-12 scale-110"></div>
        </template>
        
        <template v-else>
          <div class="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#d4c3a3] rounded-full flex items-center justify-center">
            <span class="text-[#d4c3a3] font-mono text-xs font-bold">{{ i }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Interest Badges -->
    <div v-if="interestedStands.length > 0" class="mt-6 pt-4 border-t border-[#d4c3a3]">
      <h4 class="font-pixel text-[#3a2818] text-xs font-bold mb-3 flex items-center gap-2">
        <PhHeart weight="fill" class="w-3 h-3 text-[#e11d48]" />
        MINAT BERGABUNG ({{ interestedStands.length }}/3)
      </h4>
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="stand in interestedStands" 
          :key="stand.id"
          class="bg-white border-2 border-[#3a2818] rounded-full px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_#3a2818]"
        >
          <component :is="getIconForStand(stand)" class="w-3 h-3" :style="{ color: stand.badgeColor || '#e11d48' }" />
          <span class="font-mono text-[10px] font-bold text-[#3a2818]">{{ stand.shortName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PhBookOpen, PhHeart } from '@phosphor-icons/vue';
import { useGameStore } from '../../store/gameStore';
import { ORMAWA_STANDS } from '../../data/ormawaData';
import * as Icons from '@phosphor-icons/vue';

const props = defineProps<{
  maxStamps?: number;
}>();

const maxStamps = props.maxStamps || 10;
const store = useGameStore();

const visitedCount = computed(() => Math.min(store.visitedOrmawa.length, maxStamps));

// Resolve visited stands data
const visitedStandsData = computed(() => {
  return store.visitedOrmawa.map(id => ORMAWA_STANDS.find(s => s.id === id)).filter(Boolean);
});

// Resolve interested stands data
const interestedStands = computed(() => {
  return store.ormawaInterests.map(id => ORMAWA_STANDS.find(s => s.id === id)).filter(Boolean) as any[];
});

const getIcon = (index: number) => {
  const stand = visitedStandsData.value[index];
  if (!stand) return Icons.PhShieldCheck; // fallback
  return getIconForStand(stand);
};

const getIconForStand = (stand: any) => {
  if (!stand) return Icons.PhShieldCheck;
  const iconName = stand.badgeIcon 
    ? (stand.badgeIcon.startsWith('Ph') ? stand.badgeIcon : 'Ph' + stand.badgeIcon)
    : 'PhShieldCheck';
  return (Icons as any)[iconName] || Icons.PhShieldCheck;
}

const getColor = (index: number) => {
  const stand = visitedStandsData.value[index];
  return stand?.badgeColor || '#166534';
};

const getShortName = (index: number) => {
  const stand = visitedStandsData.value[index];
  if (!stand) return `STAN ${index + 1}`;
  
  // Format very long short names
  let name = stand.shortName;
  if (name.length > 12) {
    name = name.substring(0, 10) + '..';
  }
  return name;
};
</script>
