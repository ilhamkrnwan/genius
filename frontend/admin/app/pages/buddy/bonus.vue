<template>
  <div class="space-y-4 pb-10 select-none font-sans px-1 sm:px-2 animate-in fade-in duration-500 text-[#f0e0c0]">
    <!-- Compact Header (Stardew Gold Banner) -->
    <div class="pixel-card-gold p-4 sm:p-5 space-y-2 relative overflow-hidden group">
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-700"></div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 relative z-10">
        <div>
          <span class="border border-[#f0d060] bg-[#120a05] px-2 py-0.5 text-[9px] sm:text-[10px] font-pixel text-[#f0d060] uppercase tracking-wider rounded drop-shadow">
            PENUTUPAN HARI KE-3
          </span>
          <h1 class="font-pixel text-sm sm:text-base text-[#fef08a] font-bold mt-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            POIN BONUS &amp; APRESIASI REGU
          </h1>
          <p class="text-[10px] sm:text-[11px] text-[#c4956a] mt-0.5">
            {{ currentTeamName }}
          </p>
        </div>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#120a05] border-2 border-[#f0d060] flex items-center justify-center shrink-0 shadow-lg glow-gold group-hover:scale-110 transition-transform">
          <Gift class="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d060]" />
        </div>
      </div>
    </div>

    <!-- Status Saved Badge -->
    <div
      v-if="isSubmitted"
      class="p-3 sm:p-4 bg-[#172513] border-2 border-[#22c55e] rounded-xl text-center space-y-1 shadow-lg animate-in slide-in-from-top-4"
    >
      <div class="flex items-center justify-center gap-2 text-[#86efac] font-pixel text-[11px] sm:text-xs drop-shadow">
        <CheckCircle2 class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>BONUS HARI KE-3 TERSIMPAN</span>
      </div>
      <p class="text-[10px] sm:text-[11px] text-gray-300 font-mono mt-1">
        Total <strong class="text-[#f0d060] drop-shadow-[0_0_2px_#f0d060]">+{{ totalDistributedXp }} XP</strong> terdistribusi ke anggota regu.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <!-- Section 1: Bonus Kekompakan Regu -->
      <div class="pixel-card p-4 sm:p-5 space-y-4 flex flex-col">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#5a3a18]/50 pb-3">
          <div class="flex items-center gap-2.5">
            <Award class="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d060] drop-shadow-[0_0_5px_rgba(240,208,96,0.5)]" />
            <div>
              <h2 class="font-pixel text-[11px] sm:text-xs text-[#fef08a] font-bold drop-shadow-md">
                1. KEKOMPAKAN REGU
              </h2>
              <span class="text-[9px] sm:text-[10px] text-[#c4956a]">Rata untuk {{ activeMembers.length }} anggota</span>
            </div>
          </div>
          <span class="font-pixel text-[11px] sm:text-xs text-[#86efac] font-bold bg-[#172513] px-2.5 py-1 rounded-lg border border-[#22c55e]/50 shadow-inner shrink-0 self-start sm:self-auto text-right">
            +{{ teamSynergyBonus }} XP/Maba
          </span>
        </div>

        <!-- Presets Option Buttons -->
        <div class="grid grid-cols-3 gap-2 font-mono">
          <button
            type="button"
            v-for="preset in synergyPresets"
            :key="preset.xp"
            @click="teamSynergyBonus = preset.xp"
            :class="[
              'p-2 sm:p-2.5 rounded-xl border-2 text-center cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-1',
              teamSynergyBonus === preset.xp
                ? 'bg-[#2a1d13] border-[#f0d060] shadow-[0_0_15px_rgba(240,208,96,0.3)] scale-105'
                : 'bg-[#120a05] border-[#5a3a18] hover:border-[#8b5a2b] hover:bg-[#1a100a]'
            ]"
          >
            <span class="text-[9px] sm:text-[10px] text-[#a08060] font-bold uppercase">{{ preset.label }}</span>
            <span class="font-pixel text-[11px] sm:text-xs text-[#f0d060] drop-shadow">+{{ preset.xp }} XP</span>
          </button>
        </div>

        <!-- Checklist Kriteria Singkat -->
        <div class="grid grid-cols-1 gap-2 pt-2 flex-grow">
          <label
            v-for="(crit, idx) in synergyCriteria"
            :key="idx"
            class="flex items-center gap-2.5 p-2 sm:p-2.5 bg-[#120a05] border border-[#5a3a18] hover:border-[#8b5a2b] rounded-xl cursor-pointer transition-colors group"
          >
            <div class="relative shrink-0">
              <input
                type="checkbox"
                v-model="crit.checked"
                class="h-4 w-4 sm:h-5 sm:w-5 rounded bg-[#120a05] border-[#5a3a18] text-[#ca8a04] focus:ring-0 cursor-pointer peer transition-colors"
              />
              <div class="absolute inset-0 border-2 border-transparent peer-checked:border-[#f0d060]/50 rounded pointer-events-none transition-colors"></div>
            </div>
            <span class="text-[10px] sm:text-[11px] text-[#e5b383] group-hover:text-[#f0e0c0] transition-colors leading-tight">{{ crit.text }}</span>
          </label>
        </div>
      </div>

      <!-- Section 2: Star Maba Teraktif (Official UNU Majors) -->
      <div class="pixel-card p-4 sm:p-5 space-y-4 flex flex-col">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#5a3a18]/50 pb-3">
          <div class="flex items-center gap-2.5">
            <Star class="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d060] drop-shadow-[0_0_5px_rgba(240,208,96,0.5)]" />
            <div>
              <h2 class="font-pixel text-[11px] sm:text-xs text-[#fef08a] font-bold drop-shadow-md">
                2. STAR MABA TERAKTIF
              </h2>
              <span class="text-[9px] sm:text-[10px] text-[#c4956a]">Penghargaan maba teladan</span>
            </div>
          </div>
          <span class="font-pixel text-[11px] sm:text-xs text-[#f0d060] font-bold bg-[#1a1008] px-2.5 py-1 rounded-lg border border-[#f0d060]/50 shadow-inner shrink-0 self-start sm:self-auto text-right">
            +{{ starBonusXp }} XP
          </span>
        </div>

        <!-- Member Selector -->
        <div v-if="loading" class="p-6 sm:p-8 text-center text-[#c4956a] font-mono text-[10px] sm:text-xs bg-[#120a05] rounded-xl border border-dashed border-[#5a3a18]">
          <div class="inline-block w-5 h-5 border-2 border-[#f0d060] border-t-transparent rounded-full animate-spin mb-2"></div>
          <div>Memuat anggota regu...</div>
        </div>
        <div v-else-if="activeMembers.length === 0" class="p-6 sm:p-8 text-center text-[#c4956a] font-mono text-[10px] sm:text-xs bg-[#120a05] rounded-xl border border-dashed border-[#5a3a18]">
          <div class="text-2xl mb-1 opacity-50">👥</div>
          Belum ada anggota terdaftar.
        </div>
        <div v-else class="space-y-1 overflow-y-auto max-h-[300px] lg:max-h-none lg:flex-grow custom-scrollbar pr-1">
          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="m in activeMembers"
              :key="m.id"
              @click="selectedStarId = m.id"
              :class="[
                'p-2 sm:p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-98 group',
                selectedStarId === m.id
                  ? 'bg-[#2a1d13] border-[#f0d060] shadow-[0_0_15px_rgba(240,208,96,0.3)]'
                  : 'bg-[#120a05] border-[#5a3a18] hover:border-[#8b5a2b] hover:bg-[#1a100a]'
              ]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                  <div v-if="selectedStarId === m.id" class="absolute inset-0 bg-[#f0d060] rounded blur-sm opacity-40"></div>
                  <img
                    :src="m.avatarUrl"
                    :alt="m.fullName"
                    class="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-[#5a3a18] group-hover:border-[#f0d060] bg-black/40 shrink-0 transition-colors"
                    :class="selectedStarId === m.id ? 'border-[#f0d060]' : ''"
                  />
                </div>
                <div class="min-w-0">
                  <span class="font-bold text-[11px] sm:text-xs block truncate transition-colors" :class="selectedStarId === m.id ? 'text-white' : 'text-[#e5b383] group-hover:text-white'">
                    {{ m.fullName }}
                  </span>
                  <span class="text-[9px] sm:text-[10px] text-[#c4956a] font-mono truncate block mt-0.5">
                    NIM {{ m.username }} <span class="mx-0.5 sm:mx-1 text-[#5a3a18]">|</span> <strong class="text-[#f0d060]">{{ m.prodi }}</strong>
                  </span>
                </div>
              </div>

              <div class="shrink-0 ml-2">
                <span
                  v-if="selectedStarId === m.id"
                  class="font-pixel text-[8px] sm:text-[9px] text-[#120a05] bg-[#f0d060] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md flex items-center gap-1 font-bold"
                >
                  <Star class="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-[#120a05] text-[#120a05]" />
                  BINTANG
                </span>
                <div
                  v-else
                  class="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[#5a3a18] group-hover:border-[#8b5a2b]"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:mt-6">
      <!-- Section 3: Pesan Apresiasi Buddy -->
      <div class="pixel-card p-4 sm:p-5 space-y-2 lg:h-full flex flex-col">
        <div class="flex items-center gap-2.5 border-b-2 border-[#5a3a18]/50 pb-2">
          <MessageSquareQuote class="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d060]" />
          <h2 class="font-pixel text-[11px] sm:text-xs text-[#fef08a] font-bold drop-shadow-md">
            3. PESAN KELULUSAN DARI BUDDY
          </h2>
        </div>
        <p class="text-[9px] sm:text-[10px] text-[#c4956a] px-1 mb-2">Pesan ini akan tampil di profil seluruh anggota regu.</p>
        <textarea
          v-model="buddyNote"
          rows="3"
          placeholder="Tuliskan apresiasi singkat untuk adik-adik bimbingan..."
          class="w-full bg-[#120a05] border-2 border-[#5a3a18] focus:border-[#f0d060] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs text-white outline-none resize-none font-sans shadow-inner flex-grow focus:shadow-[0_0_10px_rgba(240,208,96,0.1)] transition-all"
        ></textarea>
      </div>

      <!-- Summary Box & Submit CTA -->
      <div class="pixel-card-gold p-4 sm:p-5 space-y-4 lg:h-full flex flex-col justify-between">
        <div>
          <h2 class="font-pixel text-[10px] sm:text-[11px] text-[#facc15] font-bold drop-shadow-md mb-2">RINGKASAN BONUS</h2>
          <div class="bg-[#120a05]/50 rounded-xl p-3 sm:p-4 space-y-2 border border-[#ca8a04]/30">
            <div class="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-[#c4956a]">
              <span>Kekompakan ({{ teamSynergyBonus }} × {{ activeMembers.length }})</span>
              <span class="text-[#e5b383]">+{{ teamSynergyBonus * activeMembers.length }} XP</span>
            </div>
            <div class="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-[#c4956a]">
              <span>Star Maba Teraktif</span>
              <span class="text-[#f0d060]">+{{ selectedStarId ? starBonusXp : 0 }} XP</span>
            </div>
            <div class="h-px bg-[#ca8a04]/30 w-full my-2"></div>
            <div class="flex items-center justify-between text-xs sm:text-sm font-mono">
              <span class="text-[#fef08a] font-bold">Total Distribusi:</span>
              <span class="font-pixel text-[#86efac] text-sm sm:text-base font-bold drop-shadow-[0_0_5px_rgba(134,239,172,0.4)]">
                +{{ totalDistributedXp }} XP
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="saveDay3Bonus"
          :disabled="submitting"
          class="pixel-btn-primary w-full h-11 sm:h-12 font-pixel text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95 bg-[#4a3624] hover:bg-[#5a3a18] text-[#f0e0c0] border-2 border-[#8b5a2b] mt-4"
          :class="submitting ? 'opacity-70 pointer-events-none' : 'hover:border-[#f0d060] hover:text-[#fef08a]'"
        >
          <Save class="h-4 w-4 sm:h-5 sm:w-5" :class="submitting ? 'animate-pulse' : 'text-[#f0d060]'" />
          <span>{{ submitting ? 'MENYIMPAN DATA...' : (isSubmitted ? 'PERBARUI POIN BONUS' : 'SIMPAN & DISTRIBUSIKAN POIN') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Gift,
  Award,
  Star,
  MessageSquareQuote,
  Save,
  CheckCircle2,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

const { user } = useAuth();
const api = useApi();

const loading = ref(true);
const submitting = ref(false);
const activeTeamId = ref<string>("");
const teamName = ref<string>("Genius 01");

interface Member {
  id: string;
  fullName: string;
  username: string; // NIM
  prodi: string; // Jurusan / Class
  avatarUrl: string;
  totalXp: number;
}

const activeMembers = ref<Member[]>([]);

const currentTeamName = computed(() => {
  const name = teamName.value || user.value?.teamName || "Kelompok Belum Terdaftar";
  return name.replace(/^Team\s+/i, "").trim();
});

const teamSynergyBonus = ref(100);
const starBonusXp = 150;
const selectedStarId = ref("");
const buddyNote = ref("Selamat telah menyelesaikan seluruh petualangan PKKMB UNU 2026!");
const isSubmitted = ref(false);

const synergyPresets = [
  { xp: 50, label: "Cukup" },
  { xp: 100, label: "Solid" },
  { xp: 150, label: "Juara" },
];

const synergyCriteria = ref([
  { text: "Kehadiran 100% lengkap seluruh rangkaian acara", checked: true },
  { text: "Yel-yel kelompok kompak & tertib", checked: true },
  { text: "Menyelesaikan seluruh pos eksplorasi kampus", checked: true },
  { text: "Saling tolong & menjaga kebersihan", checked: true },
]);

const totalDistributedXp = computed(() => {
  let total = activeMembers.value.length * teamSynergyBonus.value;
  if (selectedStarId.value) {
    total += starBonusXp;
  }
  return total;
});

async function saveDay3Bonus() {
  if (submitting.value) return;
  submitting.value = true;

  try {
    const promises: Promise<any>[] = [];

    // 1. Award synergy bonus to all active members
    for (const m of activeMembers.value) {
      promises.push(
        api.post("/api/scores", {
          participantId: m.id,
          teamId: activeTeamId.value,
          amount: teamSynergyBonus.value,
          sourceType: "BONUS",
          reason: `Bonus Kekompakan Regu Hari 3: ${buddyNote.value.slice(0, 50)}`,
        })
      );
    }

    // 2. Award star maba bonus
    if (selectedStarId.value) {
      promises.push(
        api.post("/api/scores", {
          participantId: selectedStarId.value,
          teamId: activeTeamId.value,
          amount: starBonusXp,
          sourceType: "BONUS",
          reason: "Penghargaan Star Maba Teraktif Regu Hari Ke-3",
        })
      );
    }

    await Promise.allSettled(promises);
    isSubmitted.value = true;
  } catch (err: any) {
    console.error("Gagal mendistribusikan bonus:", err);
  } finally {
    submitting.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    let targetTeamId = user.value?.teamId;
    if (!targetTeamId) {
      const teamsRes = await api.get<{ success: boolean; data: any[] }>("/api/teams");
      if (teamsRes.success && teamsRes.data?.length) {
        const userId = user.value?.id;
        const myTeam = teamsRes.data.find((t: any) =>
          t.buddies?.some((b: any) => b.userId === userId)
        );
        targetTeamId = myTeam ? myTeam.id : teamsRes.data[0].id;
      }
    }

    if (targetTeamId) {
      activeTeamId.value = targetTeamId;
      const teamRes = await api.get<{ success: boolean; data: any }>(`/api/teams/${targetTeamId}`);

      if (teamRes.success && teamRes.data) {
        teamName.value = teamRes.data.name || "Genius 01";
        const rawMembers = (teamRes.data.members || []).filter(
          (m: any) => m.role === "PARTICIPANT" || !m.role
        );

        activeMembers.value = rawMembers.map((m: any) => ({
          id: m.userId || m.id,
          fullName: m.fullName || "Mahasiswa",
          username: m.username || "-",
          prodi: m.characterClass || m.characterTitle || "Informatika",
          avatarUrl: m.avatarUrl || "/character-cowok-avatar.png",
          totalXp: Number(m.totalScore || 0),
        }));

        if (activeMembers.value.length > 0 && !selectedStarId.value) {
          const first = activeMembers.value[0];
          if (first) {
            selectedStarId.value = first.id;
          }
        }
      }
    }
  } catch (err: any) {
    console.error("Gagal memuat anggota regu untuk bonus:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
