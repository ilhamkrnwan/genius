<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308]"
        @click="openCreateModal"
        title="Buat Kelompok Genius Baru"
      >
        <Plus class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">BUAT KELOMPOK GENIUS</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e]"
        @click="fetchTeams"
        :disabled="loading"
        title="Refresh Data"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- Sticky Top Pixel Toolbar (Flush nempel Topbar) -->
    <div class="pixel-toolbar-sticky px-4 md:px-6 py-2.5 space-y-2.5 shrink-0">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f59e0b]" />
          <input
            v-model="searchQuery"
            placeholder="Cari nama kelompok, kode (GENIUS-01), atau buddy..."
            class="w-full h-7 text-xs font-mono pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Filter Rute -->
          <select
            v-model="selectedRouteFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
            @change="currentPage = 1"
          >
            <option value="">Semua Rute Pos</option>
            <option v-for="r in routesList" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </select>

          <!-- Filter Status -->
          <select
            v-model="selectedStatusFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
            @change="currentPage = 1"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </div>
      </div>

      <!-- Batch Actions Bar (Shows when selected) -->
      <div
        v-if="selectedTeamIds.length > 0"
        class="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#2a1d14] via-[#352115] to-[#2a1d14] border-t border-[#ca8a04]/50 px-4 md:px-6 py-2 text-xs font-mono text-[#facc15] shadow-inner"
      >
        <div class="flex items-center gap-2">
          <CheckSquare class="h-4 w-4 text-[#f59e0b]" />
          <span class="font-bold">{{ selectedTeamIds.length }} tim terpilih</span>
          <span class="text-muted-foreground text-[11px] hidden sm:inline">(dari {{ filteredTeams.length }})</span>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#166534] text-[#86efac] font-bold border-[#22c55e] hover:bg-[#22c55e] hover:text-[#0f172a] transition-colors"
            @click="batchUpdateStatus('ACTIVE')"
          >
            Aktifkan Tim
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#78350f] text-[#fef08a] font-bold border-[#92400e] hover:bg-[#92400e] transition-colors"
            @click="batchUpdateStatus('INACTIVE')"
          >
            Nonaktifkan Tim
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#450a0a] text-[#f87171] font-bold border-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors"
            @click="batchDeleteTeams"
          >
            Hapus Tim Terpilih
          </button>
          <button
            class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
            @click="selectedTeamIds = []"
          >
            Batal
          </button>
        </div>
      </div>
    </div>

    <!-- Main Page Content Area: Flush Table without extra gaps -->
    <div class="flex-1 min-h-0 overflow-x-auto">
      <table class="pixel-table w-full text-left text-xs border-collapse">
        <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10">
          <tr>
            <th class="pl-4 md:pl-6 pr-3 py-2.5 w-10 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                class="rounded bg-[#1a140f] border-[#523e2b] text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
                @change="toggleSelectAll"
              />
            </th>
            <th class="px-3 py-2.5">KELOMPOK GENIUS</th>
            <th class="px-3 py-2.5">KODE KELOMPOK</th>
            <th class="px-3 py-2.5">RUTE POS</th>
            <th class="px-3 py-2.5">BUDDY PENDAMPING</th>
            <th class="px-3 py-2.5 text-center">ANGGOTA MABA</th>
            <th class="px-3 py-2.5 text-center">STATUS</th>
            <th class="pr-4 md:pr-6 pl-3 py-2.5 text-center w-16">AKSI</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#3d2d1e]/60 font-mono">
          <tr v-if="loading" class="text-center">
            <td colspan="8" class="p-8 text-muted-foreground">
              <div class="flex items-center justify-center gap-2">
                <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                <span>Memuat data kelompok genius...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="paginatedTeams.length === 0" class="text-center">
            <td colspan="8" class="p-8 text-muted-foreground">
              Tidak ada data kelompok genius yang sesuai dengan filter.
            </td>
          </tr>

          <tr
            v-for="t in paginatedTeams"
            :key="t.id"
            :class="['hover:bg-[#271d15]/50 transition-colors', selectedTeamIds.includes(t.id) ? 'bg-[#3b2716]/30' : '']"
          >
            <!-- Checkbox -->
            <td class="py-2.5 pl-4 md:pl-6 pr-3 text-center">
              <input
                type="checkbox"
                :value="t.id"
                v-model="selectedTeamIds"
                class="rounded bg-[#1a140f] border-[#523e2b] text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
              />
            </td>

            <!-- Tim -->
            <td class="px-3 py-2.5">
              <NuxtLink :to="'/teams/' + t.id" class="flex items-center gap-2.5 group cursor-pointer">
                <div class="h-7 w-7 border border-[#f59e0b] bg-[#271d15] flex items-center justify-center font-pixel text-[10px] text-[#f59e0b] shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                  {{ t.name.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <div class="font-sans font-semibold text-foreground text-xs leading-tight group-hover:text-[#f59e0b] transition-colors">
                    {{ t.name }}
                  </div>
                  <div class="text-[10px] text-muted-foreground font-mono">
                    {{ t.code }}
                  </div>
                </div>
              </NuxtLink>
            </td>

            <!-- Kode Tim -->
            <td class="px-3 py-2.5">
              <span class="text-[#facc15] font-bold text-xs font-mono">
                {{ t.code }}
              </span>
            </td>

            <!-- Rute Pos -->
            <td class="px-3 py-2.5">
              <span v-if="t.routeName" class="text-[#38bdf8] font-pixel text-[10px] flex items-center gap-1">
                <Route class="h-3 w-3" />
                {{ t.routeName }}
              </span>
              <span v-else class="text-muted-foreground/60 italic text-[11px]">-</span>
            </td>

            <!-- Buddy Pendamping -->
            <td class="px-3 py-2.5">
              <div v-if="t.buddies && t.buddies.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="b in t.buddies"
                  :key="b.userId"
                  class="border border-[#0284c7]/80 bg-[#16222f] text-[#38bdf8] text-[9px] px-1.5 py-0.5 font-pixel inline-flex items-center gap-1"
                >
                  <UserCheck class="h-2.5 w-2.5" />
                  <span>{{ b.fullName }} ({{ b.buddyRole }})</span>
                </span>
              </div>
              <span v-else class="text-[#ca8a04] italic text-[10px]">Belum Ada</span>
            </td>

            <!-- Anggota -->
            <td class="px-3 py-2.5 text-center font-bold text-[#4ade80] text-xs">
              {{ t.participantCount || 0 }}
            </td>

            <!-- Status -->
            <td class="px-3 py-2.5 text-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border',
                  t.status === 'ACTIVE'
                    ? 'border-[#16a34a]/60 bg-[#162518] text-[#4ade80]'
                    : 'border-[#dc2626]/60 bg-[#2a1414] text-[#f87171]'
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="t.status === 'ACTIVE' ? 'bg-[#4ade80]' : 'bg-[#f87171]'" />
                {{ t.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>

            <!-- Actions (Dropdown) -->
            <td class="py-2.5 pr-4 md:pr-6 pl-3 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="h-7 w-7 rounded border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-[#facc15] hover:border-[#f59e0b] hover:bg-[#3d2d1e] inline-flex items-center justify-center transition-colors shadow-sm"
                    title="Menu Aksi"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44 bg-[#1e140d] border border-[#5a3a18] text-foreground text-xs font-mono shadow-2xl p-1 z-50">
                  <DropdownMenuItem as-child class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <NuxtLink :to="'/teams/' + t.id" class="flex items-center w-full">
                      <Users class="mr-2 h-3.5 w-3.5 text-[#38bdf8]" />
                      <span>Inspect Squad</span>
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openRosterModal(t)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <UserCheck class="mr-2 h-3.5 w-3.5 text-[#4ade80]" />
                    <span>Kelola Roster</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openEditModal(t)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <Edit class="mr-2 h-3.5 w-3.5 text-[#f59e0b]" />
                    <span>Edit Tim</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator class="bg-[#4a3624] my-1" />
                  <DropdownMenuItem @click="confirmDelete(t)" class="cursor-pointer hover:bg-[#2a1414] focus:bg-[#2a1414] text-[#f87171] py-1.5 px-2">
                    <Trash2 class="mr-2 h-3.5 w-3.5 text-[#f87171]" />
                    <span>Hapus Tim</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
    <div class="border-t border-[#4a3624] bg-[#1a130e] shrink-0">
      <PixelPagination
        :current-page="currentPage"
        :total-items="filteredTeams.length"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event; currentPage = 1"
      />
    </div>

    <!-- Modal: Create / Edit Team -->
    <Dialog :open="showFormModal" @update:open="showFormModal = $event">
      <DialogContent class="sm:max-w-[440px] pixel-card border-2 border-[#f59e0b] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#f59e0b] flex items-center gap-2">
            <Shield class="h-4 w-4" />
            <span>{{ isEditing ? 'EDIT DATA KELOMPOK GENIUS' : 'BUAT KELOMPOK GENIUS BARU' }}</span>
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitForm" class="space-y-3 py-1 font-mono text-xs">
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Nama Kelompok Genius:</Label>
            <input
              v-model="form.name"
              placeholder="Contoh: Genius 01"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Kode Kelompok Genius:</Label>
            <input
              v-model="form.code"
              placeholder="Contoh: GENIUS-01"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-[#facc15] font-bold uppercase focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Alokasi Rute Perjalanan Kampus:</Label>
            <select
              v-model="form.routeId"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              <option :value="null">-- Belum Ditugaskan Rute --</option>
              <option v-for="r in routesList" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Status Kelompok:</Label>
            <select
              v-model="form.status"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="ACTIVE">AKTIF</option>
              <option value="INACTIVE">NONAKTIF</option>
            </select>
          </div>

          <DialogFooter class="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
              @click="showFormModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold"
              :disabled="saving"
            >
              <RotateCw v-if="saving" class="h-3 w-3 animate-spin mr-1 inline" />
              <span>{{ isEditing ? 'SIMPAN' : 'BUAT TIM' }}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Kelola Roster Anggota & Buddy Tim -->
    <Dialog :open="showRosterModal" @update:open="showRosterModal = $event">
      <DialogContent class="sm:max-w-[560px] pixel-card border-2 border-[#38bdf8] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#38bdf8] flex items-center gap-2">
            <Users class="h-4 w-4" />
            <span>ROSTER TIM: {{ selectedTeam?.name }} ({{ selectedTeam?.code }})</span>
          </DialogTitle>
        </DialogHeader>

        <div v-if="selectedTeam" class="space-y-3 py-1 font-mono text-xs">
          <!-- Add Member Section -->
          <div class="border border-[#4a3624] bg-[#15100c] p-3 space-y-2">
            <div class="font-semibold text-foreground text-xs">Tambah Anggota / Buddy (Free Agent):</div>
            <div class="flex items-center gap-2">
              <select
                v-model="selectedUserToAdd"
                class="flex-1 h-8 bg-[#271d15] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="">-- Pilih Peserta / Buddy (Free Agent) --</option>
                <option
                  v-for="u in availableUsers"
                  :key="u.id"
                  :value="u.id"
                >
                  [{{ u.role }}] {{ u.fullName }} (@{{ u.username }})
                </option>
              </select>

              <button
                class="pixel-btn h-8 px-3 text-xs font-pixel bg-[#0284c7] text-white border-[#38bdf8] font-bold"
                :disabled="!selectedUserToAdd || saving"
                @click="addMemberToTeam"
              >
                Tambah
              </button>
            </div>
          </div>

          <!-- Current Members List -->
          <div class="space-y-1.5">
            <div class="font-semibold text-foreground text-xs">
              Daftar Anggota Saat Ini ({{ teamRoster.length }} orang):
            </div>

            <div v-if="teamRoster.length === 0" class="p-6 text-center border border-[#4a3624] bg-[#15100c] text-muted-foreground text-xs">
              Belum ada anggota atau buddy dalam tim ini.
            </div>

            <div v-else class="max-h-60 overflow-y-auto space-y-1 pr-1">
              <div
                v-for="m in teamRoster"
                :key="m.userId"
                class="flex items-center justify-between border border-[#3d2d1e] bg-[#271d15] p-2 text-xs"
              >
                <div class="flex items-center gap-2">
                  <div class="font-semibold text-foreground">{{ m.fullName }}</div>
                  <div class="text-[10px] text-muted-foreground">@{{ m.username }}</div>
                  <span
                    :class="[
                      'px-1.5 py-0.5 text-[8px] font-pixel border',
                      m.role === 'BUDDY'
                        ? 'border-[#0284c7]/80 bg-[#16222f] text-[#38bdf8]'
                        : 'border-[#16a34a]/60 bg-[#162518] text-[#4ade80]'
                    ]"
                  >
                    {{ m.role === 'BUDDY' ? `BUDDY (${m.buddyRole || 'GM'})` : 'PESERTA' }}
                  </span>
                </div>

                <button
                  class="h-6 w-6 border border-[#523e2b] bg-[#271d15] text-[#f87171] hover:border-[#dc2626] flex items-center justify-center text-xs"
                  title="Keluarkan dari Tim"
                  @click="removeMemberFromTeam(m.userId)"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <DialogFooter class="pt-2 flex justify-end">
            <button
              class="h-7 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
              @click="showRosterModal = false"
            >
              Tutup
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Shield,
  Plus,
  RotateCw,
  Search,
  Route,
  UserCheck,
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckSquare,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import PixelPagination from "@/components/PixelPagination.vue";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";

const api = useApi();
const toast = useToast();
const confirmModal = useConfirm();

const loading = ref(false);
const saving = ref(false);
const teamsList = ref<any[]>([]);
const routesList = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const searchQuery = ref("");
const selectedRouteFilter = ref("");
const selectedStatusFilter = ref("");

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);

// Modals
const showFormModal = ref(false);
const isEditing = ref(false);
const form = ref({
  id: "",
  name: "",
  code: "",
  routeId: null as string | null,
  status: "ACTIVE",
});

const showRosterModal = ref(false);
const selectedTeam = ref<any>(null);
const teamRoster = ref<any[]>([]);
const selectedUserToAdd = ref("");

const filteredTeams = computed(() => {
  let list = teamsList.value;

  if (selectedRouteFilter.value) {
    list = list.filter((t) => t.routeId === selectedRouteFilter.value);
  }

  if (selectedStatusFilter.value) {
    list = list.filter((t) => t.status === selectedStatusFilter.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.buddies?.some((b: any) => b.fullName.toLowerCase().includes(q))
    );
  }

  return list;
});

const paginatedTeams = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTeams.value.slice(start, start + pageSize.value);
});

const selectedTeamIds = ref<string[]>([]);

const isAllSelected = computed(() => {
  if (paginatedTeams.value.length === 0) return false;
  return paginatedTeams.value.every((t) => selectedTeamIds.value.includes(t.id));
});

function toggleSelectAll() {
  const pageIds = new Set(paginatedTeams.value.map((t) => t.id));
  if (isAllSelected.value) {
    selectedTeamIds.value = selectedTeamIds.value.filter((id) => !pageIds.has(id));
  } else {
    selectedTeamIds.value = Array.from(new Set([...selectedTeamIds.value, ...pageIds]));
  }
}

async function batchUpdateStatus(status: "ACTIVE" | "INACTIVE") {
  if (selectedTeamIds.value.length === 0) return;
  const count = selectedTeamIds.value.length;
  const statusLabel = status === "ACTIVE" ? "Aktif" : "Nonaktif";
  saving.value = true;
  try {
    await api.post("/api/teams/batch-status", {
      teamIds: selectedTeamIds.value,
      status,
    });
    toast.success("Status Diperbarui!", `Status ${count} tim berhasil diubah menjadi ${statusLabel}.`);
    selectedTeamIds.value = [];
    await fetchTeams();
  } catch (err: any) {
    toast.error("Gagal Memperbarui Status", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function batchDeleteTeams() {
  if (selectedTeamIds.value.length === 0) return;
  const count = selectedTeamIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Hapus ${count} Tim Petualang?`,
    description: `Tindakan ini permanen! Seluruh anggota dari ${count} tim akan kembali menjadi petualang independen (Free Agent).`,
    confirmText: "Ya, Hapus Semua",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!confirmed) return;

  saving.value = true;
  try {
    await api.post("/api/teams/batch-delete", {
      teamIds: selectedTeamIds.value,
    });
    toast.success("Tim Dihapus!", `${count} tim petualang berhasil dihapus.`);
    selectedTeamIds.value = [];
    await fetchTeams();
  } catch (err: any) {
    toast.error("Gagal Menghapus Tim Massal", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

// Free agents
const availableUsers = computed(() => {
  return allUsers.value.filter((u) => !u.teamId);
});

async function fetchRoutes() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/routes");
    if (res.success && res.data) routesList.value = res.data;
  } catch (err) {
    console.error("Failed to load routes:", err);
  }
}

async function fetchAllUsers() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/users?pageSize=500");
    if (res.success && res.data) allUsers.value = res.data;
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

async function fetchTeams() {
  loading.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/teams?pageSize=100");
    if (res.success && res.data) {
      teamsList.value = res.data;
    }
  } catch (err) {
    console.error("Failed to load teams:", err);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  form.value = {
    id: "",
    name: "",
    code: "",
    routeId: null,
    status: "ACTIVE",
  };
  showFormModal.value = true;
}

function openEditModal(t: any) {
  isEditing.value = true;
  form.value = {
    id: t.id,
    name: t.name,
    code: t.code,
    routeId: t.routeId || null,
    status: t.status || "ACTIVE",
  };
  showFormModal.value = true;
}

async function submitForm() {
  saving.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/api/teams/${form.value.id}`, {
        name: form.value.name,
        code: form.value.code,
        routeId: form.value.routeId,
        status: form.value.status,
      });
      toast.success("Tim Diperbarui!", `Data tim "${form.value.name}" berhasil disimpan.`);
    } else {
      await api.post("/api/teams", {
        name: form.value.name,
        code: form.value.code,
        routeId: form.value.routeId,
      });
      toast.success("Tim Dibuat!", `Tim "${form.value.name}" (${form.value.code}) berhasil didaftarkan.`);
    }
    showFormModal.value = false;
    await fetchTeams();
  } catch (err: any) {
    toast.error("Gagal Menyimpan Tim", err.data?.error?.message || err.message || "Gagal menyimpan tim.");
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(t: any) {
  const confirmed = await confirmModal.show({
    title: "Hapus Tim Petualang?",
    description: `Yakin ingin menghapus tim '${t.name}' (${t.code})? Semua anggota tim akan kembali berstatus petualang independen.`,
    confirmText: "Ya, Hapus Tim",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!confirmed) return;

  try {
    await api.del(`/api/teams/${t.id}`);
    toast.success("Tim Dihapus", `Tim '${t.name}' berhasil dihapus.`);
    await fetchTeams();
  } catch (err: any) {
    toast.error("Gagal Menghapus Tim", err.message || "Terjadi kesalahan sistem.");
  }
}

// Roster Management
async function openRosterModal(t: any) {
  selectedTeam.value = t;
  selectedUserToAdd.value = "";
  showRosterModal.value = true;
  await reloadTeamRoster(t.id);
  await fetchAllUsers();
}

async function reloadTeamRoster(teamId: string) {
  try {
    const res = await api.get(`/api/teams/${teamId}`);
    if (res.success && res.data?.members) {
      teamRoster.value = res.data.members;
    }
  } catch (err) {
    console.error("Failed to load team roster:", err);
  }
}

async function addMemberToTeam() {
  if (!selectedUserToAdd.value || !selectedTeam.value) return;
  saving.value = true;
  try {
    const targetUser = allUsers.value.find((u) => u.id === selectedUserToAdd.value);
    const isBuddy = targetUser?.role === "BUDDY";

    await api.post(`/api/teams/${selectedTeam.value.id}/members`, {
      userId: selectedUserToAdd.value,
      buddyRole: isBuddy ? "PRIMARY" : null,
    });
    toast.success("Anggota Ditambahkan!", `${targetUser?.fullName || "Pengguna"} dimasukkan ke dalam tim.`);
    selectedUserToAdd.value = "";
    await reloadTeamRoster(selectedTeam.value.id);
    await fetchTeams();
    await fetchAllUsers();
  } catch (err: any) {
    toast.error("Gagal Menambahkan Anggota", err.data?.error?.message || err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function removeMemberFromTeam(userId: string) {
  if (!selectedTeam.value) return;
  try {
    await api.del(`/api/teams/${selectedTeam.value.id}/members/${userId}`);
    toast.info("Anggota Dikeluarkan", "Anggota tim telah dilepaskan dari roster.");
    await reloadTeamRoster(selectedTeam.value.id);
    await fetchTeams();
    await fetchAllUsers();
  } catch (err: any) {
    toast.error("Gagal Mengeluarkan Anggota", err.message || "Terjadi kesalahan sistem.");
  }
}

const { setPageHeader, clearPageHeader } = useLayoutState();

watchEffect(() => {
  setPageHeader({
    title: "Kelompok GENIUS 2026",
    badge: `${teamsList.value.length} Kelompok`,
    icon: Users,
  });
});

onMounted(() => {
  fetchTeams();
  fetchRoutes();
  fetchAllUsers();
});

onUnmounted(() => {
  clearPageHeader();
});
</script>
