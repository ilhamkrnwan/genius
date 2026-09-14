<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/lib/api';

const router = useRouter();

onMounted(async () => {
  try {
    const response = await api.getMyTeamSessions();
    if (response.success && response.data) {
      // Cari sesi yang belum COMPLETED
      const activeSession = response.data.find((s: any) => s.status !== 'COMPLETED');
      
      if (activeSession && activeSession.floorNumber) {
        // Jika ada tugas aktif, arahkan ke Peta langsung di lantai yang bersangkutan
        router.replace(`/dashboard?floor=${activeSession.floorNumber}`);
      } else {
        // Jika tidak ada tugas aktif, cari lantai tertinggi yang sudah diselesaikan
        const completedSessions = response.data.filter((s: any) => s.status === 'COMPLETED');
        if (completedSessions.length > 0) {
          const highestCompleted = Math.max(...completedSessions.map((s: any) => s.floorNumber));
          router.replace(`/dashboard?floor=${highestCompleted}`);
        } else {
          router.replace('/dashboard'); // Biarkan komponen BuildingMap yang memutuskan
        }
      }
    } else {
      router.replace('/dashboard');
    }
  } catch (error) {
    router.replace('/dashboard');
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#2d1b0e] text-[#f0e0c0]">
    <div class="text-center space-y-3 font-pixel text-xs text-[#f0d060] animate-pulse">
      <span>MEMUAT ALUR PERMAINAN GENIUS...</span>
    </div>
  </div>
</template>
