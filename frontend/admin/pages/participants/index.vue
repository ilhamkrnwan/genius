<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] flex items-center gap-1.5 hover:bg-[#1f3822]"
        @click="showImportModal = true"
        title="Import CSV"
      >
        <Upload class="h-3.5 w-3.5 text-[#4ade80]" />
        <span class="hidden sm:inline">IMPORT CSV</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#271d15] text-[#38bdf8] border-[#0284c7] flex items-center gap-1.5 hover:bg-[#3d2d1e]"
        @click="exportCsv"
        title="Export CSV"
      >
        <Download class="h-3.5 w-3.5 text-[#38bdf8]" />
        <span class="hidden sm:inline">EXPORT</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308]"
        @click="openCreateModal"
        title="Tambah Peserta Baru"
      >
        <UserPlus class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">TAMBAH PESERTA</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e]"
        @click="fetchParticipants"
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
            placeholder="Cari mahasiswa, username, atau gelar..."
            class="w-full h-7 text-xs font-mono pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            @input="debounceFetch"
          />
        </div>

        <!-- Filter Dropdowns (Fakultas, Status, Tim) -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Filter Fakultas -->
          <select
            v-model="selectedFacultyFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
            @change="currentPage = 1; fetchParticipants()"
          >
            <option value="">Semua Fakultas</option>
            <option v-for="f in UNU_FACULTIES" :key="f.name" :value="f.name">
              {{ f.name }}
            </option>
          </select>

          <!-- Filter Status -->
          <select
            v-model="selectedStatusFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
            @change="currentPage = 1; fetchParticipants()"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>

          <!-- Filter Team -->
          <select
            v-model="selectedTeamFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
            @change="currentPage = 1; fetchParticipants()"
          >
            <option value="">Semua Tim</option>
            <option value="assigned">Sudah Ber-tim</option>
            <option value="unassigned">Free Agent (Tanpa Tim)</option>
            <option v-for="team in teamsList" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.code }})
            </option>
          </select>
        </div>
      </div>

      <!-- Batch Actions Bar (Shows when selected) -->
      <div
        v-if="selectedUserIds.length > 0"
        class="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#2a1d14] via-[#352115] to-[#2a1d14] border-t border-[#ca8a04]/50 px-4 md:px-6 py-2 text-xs font-mono text-[#facc15] shadow-inner"
      >
        <div class="flex items-center gap-2">
          <CheckSquare class="h-4 w-4 text-[#f59e0b]" />
          <span class="font-bold">{{ selectedUserIds.length }} peserta terpilih</span>
          <span class="text-muted-foreground text-[11px] hidden sm:inline">(dari {{ filteredParticipants.length }})</span>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#ca8a04] text-[#16110d] font-bold border-[#eab308] hover:bg-[#eab308] transition-colors"
            @click="showBatchAssignModal = true"
          >
            Plotting Tim
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#78350f] text-[#fef08a] font-bold border-[#92400e] hover:bg-[#92400e] transition-colors"
            @click="batchUnassignTeam"
          >
            Lepas Tim
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#1e293b] text-[#38bdf8] font-bold border-[#0284c7] hover:bg-[#0284c7] hover:text-white transition-colors"
            @click="batchResetPassword"
          >
            Reset Password
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#450a0a] text-[#f87171] font-bold border-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors"
            @click="batchDeleteParticipants"
          >
            Hapus Terpilih
          </button>
          <button
            class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
            @click="selectedUserIds = []"
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
            <th class="px-3 py-2.5">MAHASISWA PESERTA</th>
            <th class="px-3 py-2.5">FAKULTAS</th>
            <th class="px-3 py-2.5">PROGRAM STUDI</th>
            <th class="px-3 py-2.5">KELOMPOK GENIUS</th>
            <th class="px-3 py-2.5 text-center">TOTAL SKOR</th>
            <th class="px-3 py-2.5 text-center">STATUS</th>
            <th class="pr-4 md:pr-6 pl-3 py-2.5 text-center w-16">AKSI</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#3d2d1e]/60 font-mono">
          <tr v-if="loading" class="text-center">
            <td colspan="8" class="p-8 text-muted-foreground">
              <div class="flex items-center justify-center gap-2">
                <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                <span>Memuat data mahasiswa peserta...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="paginatedParticipants.length === 0" class="text-center">
            <td colspan="8" class="p-8 text-muted-foreground">
              Tidak ada data peserta yang cocok dengan filter.
            </td>
          </tr>

          <tr
            v-for="p in paginatedParticipants"
            :key="p.id"
            class="hover:bg-[#271d15]/50 transition-colors"
          >
            <!-- Checkbox -->
            <td class="py-2.5 pl-4 md:pl-6 pr-3 text-center">
              <input
                type="checkbox"
                :value="p.id"
                v-model="selectedUserIds"
                class="rounded bg-[#1a140f] border-[#523e2b] text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
              />
            </td>

            <!-- Name & Avatar -->
            <td class="py-2.5 px-3">
              <div
                class="flex items-center gap-2.5 cursor-pointer group"
                @click="openTacticalDetail(p)"
                title="Lihat Detail Mahasiswa"
              >
                <div
                  class="h-8 w-8 rounded border border-[#523e2b] bg-[#1a140f] overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                >
                  <img
                    :src="p.avatarUrl || (p.gender === 'FEMALE' ? '/character-cewek-avatar.png' : '/character-cowok-avatar.png')"
                    :alt="p.fullName"
                    class="h-full w-full object-cover"
                    style="image-rendering: pixelated;"
                  />
                </div>
                <div class="min-w-0">
                  <div class="font-sans font-semibold text-foreground text-xs leading-tight group-hover:text-[#f59e0b] transition-colors flex items-center gap-1">
                    <span class="truncate max-w-[160px]">{{ p.fullName }}</span>
                    <Crosshair class="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <div class="text-[10px] text-muted-foreground font-mono truncate">
                    @{{ p.username }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Fakultas -->
            <td class="py-2.5 px-3">
              <span class="text-xs font-semibold text-[#facc15] truncate max-w-[180px] block" :title="p.faculty || '-'">
                {{ p.faculty || '-' }}
              </span>
            </td>

            <!-- Program Studi -->
            <td class="py-2.5 px-3">
              <span class="text-xs font-mono text-cyan-400 truncate max-w-[160px] block" :title="p.prodi || '-'">
                {{ p.prodi || '-' }}
              </span>
            </td>

            <!-- Kelompok Genius -->
            <td class="py-2.5 px-3">
              <div v-if="p.teamName" class="flex flex-col min-w-0">
                <NuxtLink :to="'/teams/' + p.teamId" class="text-xs font-semibold text-[#38bdf8] hover:underline truncate max-w-[140px]" :title="p.teamName">
                  {{ p.teamCode }} ({{ p.teamName }})
                </NuxtLink>
              </div>
              <span v-else class="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[#271d15] border border-[#523e2b] text-muted-foreground/70 italic">
                Free Agent
              </span>
            </td>

            <!-- Total Score -->
            <td class="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-[#4ade80] text-xs">
              {{ Number(p.totalScore || 0).toLocaleString() }} pts
            </td>

            <!-- Status -->
            <td class="py-2.5 px-3 text-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border',
                  p.status === 'ACTIVE'
                    ? 'border-[#16a34a]/60 bg-[#162518] text-[#4ade80]'
                    : 'border-[#dc2626]/60 bg-[#2a1414] text-[#f87171]'
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="p.status === 'ACTIVE' ? 'bg-[#4ade80]' : 'bg-[#f87171]'" />
                {{ p.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
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
                <DropdownMenuContent align="end" class="w-48 bg-[#1e140d] border border-[#5a3a18] text-foreground text-xs font-mono shadow-2xl p-1 z-50">
                  <DropdownMenuItem @click="openTacticalDetail(p)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <Crosshair class="mr-2 h-3.5 w-3.5 text-[#f59e0b]" />
                    <span>Inspect Loadout</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openAwardTitleModal(p)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <Award class="mr-2 h-3.5 w-3.5 text-[#facc15]" />
                    <span>Sematkan Gelar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openLedgerModal(p)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <History class="mr-2 h-3.5 w-3.5 text-[#38bdf8]" />
                    <span>Riwayat Skor</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openEditModal(p)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <Edit class="mr-2 h-3.5 w-3.5 text-[#f59e0b]" />
                    <span>Edit Peserta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openResetPasswordModal(p)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <KeyRound class="mr-2 h-3.5 w-3.5 text-[#eab308]" />
                    <span>Reset Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator class="bg-[#4a321e] my-1" />
                  <DropdownMenuItem @click="confirmDelete(p)" class="cursor-pointer text-red-400 hover:bg-red-950/50 focus:bg-red-950/50 focus:text-red-300 py-1.5 px-2">
                    <Trash2 class="mr-2 h-3.5 w-3.5 text-red-400" />
                    <span>Hapus Peserta</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
    <PixelPagination
      :current-page="currentPage"
      :total-items="filteredParticipants.length"
      :page-size="pageSize"
      @update:current-page="currentPage = $event"
      @update:page-size="pageSize = $event; currentPage = 1"
    />

    <!-- Modal: Award Title & Tier Upgrade -->
    <Dialog :open="showAwardModal" @update:open="showAwardModal = $event">
      <DialogContent class="sm:max-w-[440px] pixel-card border-2 border-[#ca8a04] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#facc15] flex items-center gap-2">
            <Award class="h-4 w-4" />
            <span>SEMATKAN GELAR & TIER UNTUK {{ selectedParticipant?.fullName }}</span>
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="executeAwardTitle" class="space-y-3 py-1 font-mono text-xs">
          <p class="text-muted-foreground">
            Sematkan gelar kehormatan baru atau naikkan status tier evolusi petualang secara langsung:
          </p>

          <!-- Select Title Catalog or Custom -->
          <div class="space-y-1">
            <Label class="text-xs font-semibold text-foreground">Pilih Gelar dari Katalog:</Label>
            <select
              v-model="awardTitleForm.title"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#ca8a04]"
              required
            >
              <option value="">-- Pilih Gelar --</option>
              <option v-for="tItem in titleCatalogList" :key="tItem.id" :value="tItem.title">
                {{ tItem.icon }} {{ tItem.title }} (Tier {{ tItem.requiredTier }})
              </option>
            </select>
          </div>

          <!-- Custom Title Option -->
          <div class="space-y-1">
            <Label class="text-xs font-semibold text-foreground">Atau Ketik Gelar Spesial Kustom:</Label>
            <input
              v-model="awardTitleForm.customTitle"
              placeholder="Contoh: Juara Mini Game L7"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#ca8a04]"
            />
          </div>

          <!-- Promote Tier Option -->
          <div class="space-y-1">
            <Label class="text-xs font-semibold text-foreground">Promosikan ke Tier Evolusi:</Label>
            <select
              v-model.number="awardTitleForm.upgradeTier"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#ca8a04]"
            >
              <option :value="1">⭐ Tier 1: Novice</option>
              <option :value="2">⭐⭐ Tier 2: Advanced (Paladin / Arcanist / Sniper)</option>
              <option :value="3">👑 Tier 3: Ascended (Supreme Sovereign / Singularity Sage)</option>
            </select>
          </div>

          <DialogFooter class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
              @click="showAwardModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold"
              :disabled="saving"
            >
              <RotateCw v-if="saving" class="h-3 w-3 animate-spin mr-1 inline" />
              <span>SEMATKAN GELAR</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Create / Edit Participant -->
    <Dialog :open="showFormModal" @update:open="showFormModal = $event">
      <DialogContent class="sm:max-w-[460px] max-h-[90vh] overflow-y-auto pixel-card border-2 border-[#ca8a04] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#f59e0b] flex items-center gap-2">
            <GraduationCap class="h-4 w-4" />
            <span>{{ isEditing ? 'EDIT DATA MAHASISWA PESERTA' : 'TAMBAH MAHASISWA PESERTA BARU' }}</span>
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitForm" class="space-y-3.5 py-1 font-mono text-xs">
          <!-- Username / NIM -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">NIM (Nomor Induk Mahasiswa):</Label>
            <input
              v-model="form.username"
              placeholder="Contoh: 240101001"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b] disabled:opacity-50 font-bold"
              :disabled="isEditing"
              required
            />
          </div>

          <!-- Full Name -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Nama Lengkap Mahasiswa:</Label>
            <input
              v-model="form.fullName"
              placeholder="Contoh: Ahmad Dahlan"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <!-- Fakultas & Program Studi -->
          <div class="space-y-3">
            <!-- Fakultas -->
            <div class="space-y-1">
              <Label class="text-xs text-foreground font-semibold">Fakultas:</Label>
              <select
                v-model="form.faculty"
                class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
                @change="onFacultyChange"
                required
              >
                <option v-for="f in UNU_FACULTIES" :key="f.name" :value="f.name">
                  {{ f.name }}
                </option>
              </select>
            </div>

            <!-- Program Studi -->
            <div class="space-y-1">
              <Label class="text-xs text-foreground font-semibold">Program Studi (Prodi):</Label>
              <select
                v-model="form.prodi"
                class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
                required
              >
                <option v-for="p in availableProdis" :key="p" :value="p">
                  {{ p }}
                </option>
              </select>
            </div>
          </div>

          <!-- Kelompok Genius (Opsional) -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Kelompok GENIUS (Opsional):</Label>
            <select
              v-model="form.teamId"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              <option :value="null">-- Belum Ditentukan (Free Agent) --</option>
              <option v-for="team in teamsList" :key="team.id" :value="team.id">
                {{ team.code }} - {{ team.name }}
              </option>
            </select>
          </div>

          <!-- Status Akun -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Status Akun:</Label>
            <select
              v-model="form.status"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="ACTIVE">AKTIF</option>
              <option value="INACTIVE">NONAKTIF</option>
            </select>
          </div>

          <div class="p-2.5 rounded bg-[#271d15]/60 border border-[#523e2b] text-[11px] text-muted-foreground space-y-1">
            <p><strong>Catatan:</strong> Avatar, gender, dan kelas RPG akan dipilih sendiri secara mandiri oleh mahasiswa baru di aplikasi user saat pertama kali login.</p>
          </div>

          <DialogFooter class="pt-2 flex items-center justify-end gap-2">
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
              <span>{{ isEditing ? 'SIMPAN' : 'BUAT' }}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Batch Assign Team -->
    <Dialog :open="showBatchAssignModal" @update:open="showBatchAssignModal = $event">
      <DialogContent class="sm:max-w-[400px] pixel-card border-2 border-[#ca8a04] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#f59e0b] flex items-center gap-2">
            <Users class="h-4 w-4" />
            <span>PLOTTING MASSAL KE TIM</span>
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-3 py-1 font-mono text-xs">
          <p class="text-muted-foreground">
            Menugaskan <strong>{{ selectedUserIds.length }} peserta terpilih</strong> ke tim:
          </p>

          <div class="space-y-1">
            <Label class="text-xs font-semibold">Pilih Tim Tujuan:</Label>
            <select
              v-model="batchTargetTeamId"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="">-- Pilih Tim --</option>
              <option v-for="team in teamsList" :key="team.id" :value="team.id">
                {{ team.name }} ({{ team.code }})
              </option>
            </select>
          </div>

          <DialogFooter class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
              @click="showBatchAssignModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold"
              :disabled="!batchTargetTeamId || saving"
              @click="executeBatchAssign"
            >
              <RotateCw v-if="saving" class="h-3 w-3 animate-spin mr-1 inline" />
              <span>TERAPKAN</span>
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal: Bulk CSV Import -->
    <Dialog :open="showImportModal" @update:open="showImportModal = $event">
      <DialogContent class="sm:max-w-[560px] pixel-card border-2 border-[#16a34a] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#4ade80] flex items-center gap-2">
            <Upload class="h-4 w-4" />
            <span>IMPORT MAHASISWA PESERTA VIA CSV</span>
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-3 py-1 font-mono text-xs">
          <div class="flex items-center justify-between border border-[#4a3624] bg-[#15100c] p-2.5">
            <div>
              <p class="font-semibold text-foreground text-xs">Format: nim,nama,fakultas,prodi,kelompok</p>
              <p class="text-[10px] text-muted-foreground">Kolom 'kelompok' bersifat opsional (contoh: GENIUS-01). Avatar & RPG dipilih maba saat login.</p>
            </div>
            <button
              class="pixel-btn text-[10px] px-2.5 h-6 bg-[#271d15] text-[#4ade80] border-[#16a34a]"
              @click="downloadCsvTemplate"
            >
              Download Template
            </button>
          </div>

          <!-- Paste Raw CSV Text -->
          <div class="space-y-1">
            <Label class="text-xs font-semibold">Paste Teks CSV:</Label>
            <textarea
              v-model="csvRawText"
              rows="4"
              placeholder="240101001,Ahmad Dahlan,Fakultas Teknologi Informasi,Informatika,GENIUS-01&#10;240101002,Fatimah Azzahra,Fakultas Industri Halal,Farmasi,GENIUS-02&#10;240101003,Budi Santoso,Fakultas Ekonomi,Manajemen,"
              class="w-full bg-[#15100c] border border-[#523e2b] p-2 text-[11px] font-mono focus:outline-none focus:border-[#4ade80]"
              @input="parseRawCsv"
            ></textarea>
          </div>

          <!-- Preview Table -->
          <div v-if="parsedPreview.length > 0" class="space-y-1.5">
            <div class="font-semibold text-[#4ade80] text-xs">
              {{ parsedPreview.length }} data siap diimpor
            </div>
            <div class="max-h-36 overflow-y-auto border border-[#4a3624] bg-[#15100c]">
              <table class="w-full text-left text-[10px]">
                <thead class="bg-[#271d15] text-[#f59e0b] border-b border-[#4a3624]">
                  <tr>
                    <th class="p-1.5">#</th>
                    <th class="p-1.5">NIM</th>
                    <th class="p-1.5">Nama Lengkap</th>
                    <th class="p-1.5">Fakultas</th>
                    <th class="p-1.5">Program Studi</th>
                    <th class="p-1.5">Kelompok Genius</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3d2d1e]/60">
                  <tr v-for="(item, idx) in parsedPreview.slice(0, 10)" :key="idx">
                    <td class="p-1.5 text-muted-foreground">{{ idx + 1 }}</td>
                    <td class="p-1.5 font-bold text-[#facc15]">{{ item.username }}</td>
                    <td class="p-1.5 text-foreground">{{ item.fullName }}</td>
                    <td class="p-1.5 text-[#38bdf8]">{{ item.faculty || '-' }}</td>
                    <td class="p-1.5 text-[#4ade80]">{{ item.prodi || '-' }}</td>
                    <td class="p-1.5 text-[#ca8a04] font-semibold">{{ item.kelompok || item.teamCode || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
              @click="showImportModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#16a34a] text-white border-[#22c55e] font-bold"
              :disabled="parsedPreview.length === 0 || importing"
              @click="executeImport"
            >
              <RotateCw v-if="importing" class="h-3 w-3 animate-spin mr-1 inline" />
              <span>IMPORT ({{ parsedPreview.length }})</span>
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal: Detail & Point Ledger History -->
    <Dialog :open="showLedgerModal" @update:open="showLedgerModal = $event">
      <DialogContent class="sm:max-w-[480px] pixel-card border-2 border-[#38bdf8] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#38bdf8] flex items-center gap-2">
            <History class="h-4 w-4" />
            <span>POINT LEDGER: {{ selectedParticipant?.fullName }}</span>
          </DialogTitle>
        </DialogHeader>

        <div v-if="selectedParticipant" class="space-y-3 py-1 font-mono text-xs">
          <div class="flex items-center justify-between border border-[#4a3624] bg-[#15100c] p-2.5">
            <div>
              <div class="font-bold text-foreground">{{ selectedParticipant.fullName }}</div>
              <div class="text-[10px] text-muted-foreground">
                @{{ selectedParticipant.username }} • {{ selectedParticipant.teamName || 'Free Agent' }} • [{{ selectedParticipant.characterTitle || 'Novice Adventurer' }}]
              </div>
            </div>
            <div class="font-pixel text-sm font-bold text-[#4ade80]">
              {{ Number(selectedParticipant.totalScore || 0).toLocaleString() }} PTS
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="font-semibold text-foreground text-xs">Riwayat Transaksi Skor:</div>
            <div v-if="ledgerTransactions.length === 0" class="p-6 text-center border border-[#4a3624] bg-[#15100c] text-muted-foreground">
              Belum ada catatan transaksi skor.
            </div>
            <div v-else class="max-h-48 overflow-y-auto space-y-1 pr-1">
              <div
                v-for="tx in ledgerTransactions"
                :key="tx.id"
                class="flex items-center justify-between border border-[#3d2d1e] bg-[#271d15] p-2"
              >
                <div>
                  <span class="font-semibold text-foreground">{{ tx.reason || 'Sesi Game Selesai' }}</span>
                  <div class="text-[9px] text-muted-foreground">{{ formatDate(tx.createdAt) }}</div>
                </div>
                <span class="font-mono font-bold" :class="tx.amount >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'">
                  {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }} pts
                </span>
              </div>
            </div>
          </div>

          <DialogFooter class="pt-2 flex justify-end">
            <button
              class="h-7 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
              @click="showLedgerModal = false"
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
import { ref, computed, onMounted, watchEffect, onUnmounted } from "vue";
import { useLayoutState } from "@/composables/useLayoutState";
import {
  GraduationCap,
  Users,
  UserPlus,
  Search,
  RotateCw,
  Upload,
  Download,
  History,
  Edit,
  Trash2,
  KeyRound,
  CheckSquare,
  Award,
  Crosshair,
  MoreHorizontal,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import PixelPagination from "@/components/PixelPagination.vue";
import { useApi } from "@/composables/useApi";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import {
  RPG_CHARACTERS,
  TITLE_CATALOG,
  CharacterClass,
  CharacterTier,
  getEvolutionForClassAndTier,
  UNU_FACULTIES,
} from "@genius/types";

const api = useApi();
const toast = useToast();
const confirmModal = useConfirm();

const loading = ref(false);
const saving = ref(false);
const importing = ref(false);
const participants = ref<any[]>([]);
const teamsList = ref<any[]>([]);
const searchQuery = ref("");
const selectedFacultyFilter = ref("");
const selectedTeamFilter = ref("");
const selectedStatusFilter = ref("");
const selectedGenderFilter = ref("");
const selectedUserIds = ref<string[]>([]);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);

const showFormModal = ref(false);
const isEditing = ref(false);
const showBatchAssignModal = ref(false);
const batchTargetTeamId = ref("");
const showImportModal = ref(false);
const showLedgerModal = ref(false);
const showAwardModal = ref(false);
const showTacticalModal = ref(false);
const selectedParticipant = ref<any>(null);
const selectedTacticalParticipant = ref<any>(null);
const ledgerTransactions = ref<any[]>([]);

const csvRawText = ref("");
const parsedPreview = ref<any[]>([]);

const characterClassesList = computed(() => Object.values(RPG_CHARACTERS));
const titleCatalogList = computed(() => TITLE_CATALOG);

const form = ref({
  id: "",
  username: "",
  fullName: "",
  faculty: "Fakultas Teknologi Informasi",
  prodi: "Informatika",
  teamId: null as string | null,
  status: "ACTIVE",
});

const availableProdis = computed(() => {
  const fac = UNU_FACULTIES.find((f) => f.name === form.value.faculty);
  return fac ? fac.prodi : [];
});

function onFacultyChange() {
  const fac = UNU_FACULTIES.find((f) => f.name === form.value.faculty);
  if (fac && fac.prodi.length > 0) {
    form.value.prodi = fac.prodi[0];
  }
}

const awardTitleForm = ref({
  title: "",
  customTitle: "",
  upgradeTier: 1,
});

const totalCount = computed(() => participants.value.length);

const filteredParticipants = computed(() => {
  return participants.value;
});

const paginatedParticipants = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredParticipants.value.slice(start, start + pageSize.value);
});

const isAllSelected = computed(() => {
  return (
    paginatedParticipants.value.length > 0 &&
    paginatedParticipants.value.every((p) => selectedUserIds.value.includes(p.id))
  );
});

function getClassColor(classId?: string) {
  const c = classId as CharacterClass;
  return RPG_CHARACTERS[c]?.color || "#38bdf8";
}

function getClassIcon(classId?: string) {
  const c = classId as CharacterClass;
  return RPG_CHARACTERS[c]?.icon || "🛡️";
}

function getEvolvedClassName(classId?: string, tier?: number) {
  const evo = getEvolutionForClassAndTier(classId || "CYBER_KNIGHT", tier || 1);
  return evo?.tierName || "Ksatria Siber";
}

function getTierBadge(tier?: number) {
  if (tier === 3) return "👑 TIER 3: ASCENDED";
  if (tier === 2) return "⭐⭐ TIER 2: ADVANCED";
  return "⭐ TIER 1: NOVICE";
}

function getTierColor(tier?: number) {
  if (tier === 3) return "#ca8a04"; // Gold
  if (tier === 2) return "#38bdf8"; // Bright Cyan
  return "#64748b"; // Silver/Slate
}

function toggleSelectAll(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.checked) {
    const pageIds = paginatedParticipants.value.map((p) => p.id);
    selectedUserIds.value = Array.from(new Set([...selectedUserIds.value, ...pageIds]));
  } else {
    const pageIds = new Set(paginatedParticipants.value.map((p) => p.id));
    selectedUserIds.value = selectedUserIds.value.filter((id) => !pageIds.has(id));
  }
}

let debounceTimer: any = null;
function debounceFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchParticipants();
  }, 300);
}

async function fetchTeams() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/teams?pageSize=100");
    if (res.success && res.data) teamsList.value = res.data;
  } catch (err) {
    console.error("Failed to load teams:", err);
  }
}

async function fetchParticipants() {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      role: "PARTICIPANT",
      pageSize: "1000",
    };
    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedFacultyFilter.value) {
      params.faculty = selectedFacultyFilter.value;
    }
    if (selectedTeamFilter.value === "assigned") {
      params.assignmentStatus = "assigned";
    } else if (selectedTeamFilter.value === "unassigned") {
      params.assignmentStatus = "unassigned";
    } else if (selectedTeamFilter.value) {
      params.teamId = selectedTeamFilter.value;
    }

    const res = await api.get<{ success: boolean; data: any[] }>("/api/users", params);
    if (res.success && res.data) {
      const seen = new Set<string>();
      let list = res.data.filter((p) => {
        if (!p?.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      if (selectedStatusFilter.value) {
        list = list.filter((p) => p.status === selectedStatusFilter.value);
      }
      participants.value = list;
    }
  } catch (err) {
    console.error("Failed to fetch participants:", err);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  form.value = {
    id: "",
    username: "",
    fullName: "",
    faculty: UNU_FACULTIES[1]?.name || "Fakultas Teknologi Informasi",
    prodi: UNU_FACULTIES[1]?.prodi[0] || "Informatika",
    teamId: null,
    status: "ACTIVE",
  };
  showFormModal.value = true;
}

function openEditModal(p: any) {
  isEditing.value = true;
  form.value = {
    id: p.id,
    username: p.username,
    fullName: p.fullName,
    faculty: p.faculty || UNU_FACULTIES[1]?.name || "Fakultas Teknologi Informasi",
    prodi: p.prodi || UNU_FACULTIES[1]?.prodi[0] || "Informatika",
    teamId: p.teamId || null,
    status: p.status || "ACTIVE",
  };
  showFormModal.value = true;
}

function openAwardTitleModal(p: any) {
  selectedParticipant.value = p;
  awardTitleForm.value = {
    title: p.characterTitle || "Novice Adventurer",
    customTitle: "",
    upgradeTier: p.characterTier || 1,
  };
  showAwardModal.value = true;
}

async function executeAwardTitle() {
  if (!selectedParticipant.value) return;
  saving.value = true;
  try {
    const finalTitle = awardTitleForm.value.customTitle.trim() || awardTitleForm.value.title;
    await api.post(`/api/users/${selectedParticipant.value.id}/award-title`, {
      title: finalTitle,
      upgradeTier: awardTitleForm.value.upgradeTier,
    });
    toast.success("Gelar Disematkan!", `Gelar '${finalTitle}' berhasil dianugerahkan ke ${selectedParticipant.value.fullName}.`);
    showAwardModal.value = false;
    await fetchParticipants();
  } catch (err: any) {
    toast.error("Gagal Menyematkan Gelar", err.data?.error?.message || err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  try {
    if (isEditing.value) {
      const payload: any = {
        fullName: form.value.fullName,
        faculty: form.value.faculty,
        prodi: form.value.prodi,
        teamId: form.value.teamId,
        status: form.value.status,
      };
      await api.put(`/api/users/${form.value.id}`, payload);
      toast.success("Peserta Diperbarui!", `Data peserta ${form.value.fullName} (@${form.value.username}) berhasil disimpan.`);
    } else {
      await api.post("/api/users", {
        username: form.value.username,
        nim: form.value.username,
        fullName: form.value.fullName,
        name: form.value.fullName,
        faculty: form.value.faculty,
        prodi: form.value.prodi,
        teamId: form.value.teamId,
        role: "PARTICIPANT",
        password: "genius2026",
        status: form.value.status,
      });
      toast.success("Peserta Didaftarkan!", `Mahasiswa baru ${form.value.fullName} (@${form.value.username}) berhasil ditambahkan.`);
    }
    showFormModal.value = false;
    await fetchParticipants();
  } catch (err: any) {
    toast.error("Gagal Menyimpan", err.data?.error?.message || err.message || "Gagal menyimpan data peserta.");
  } finally {
    saving.value = false;
  }
}

async function openResetPasswordModal(p: any) {
  const confirmed = await confirmModal.show({
    title: "Reset Password Peserta?",
    description: `Reset password untuk ${p.fullName} (@${p.username}) ke default 'genius2026'? Mahasiswa akan login menggunakan password default tersebut.`,
    confirmText: "Ya, Reset Password",
    cancelText: "Batal",
    variant: "warning",
    icon: "shield",
  });
  if (!confirmed) return;

  try {
    await api.post(`/api/users/${p.id}/reset-password`, { password: "genius2026" });
    toast.success("Password Di-reset!", `Password untuk @${p.username} berhasil di-reset ke: genius2026`);
  } catch (err: any) {
    toast.error("Gagal Reset Password", err.message || "Terjadi kesalahan sistem.");
  }
}

async function confirmDelete(p: any) {
  const confirmed = await confirmModal.show({
    title: "Hapus Peserta?",
    description: `Apakah Anda yakin ingin menghapus peserta ${p.fullName} (@${p.username})? Seluruh riwayat petualangan dan poin juga akan terhapus.`,
    confirmText: "Ya, Hapus Peserta",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!confirmed) return;

  try {
    await api.del(`/api/users/${p.id}`);
    toast.success("Peserta Dihapus", `Peserta ${p.fullName} (@${p.username}) berhasil dihapus.`);
    await fetchParticipants();
  } catch (err: any) {
    toast.error("Gagal Menghapus", err.message || "Terjadi kesalahan sistem.");
  }
}

async function executeBatchAssign() {
  if (!batchTargetTeamId.value || selectedUserIds.value.length === 0) return;
  saving.value = true;
  try {
    await api.post("/api/users/batch-assign-team", {
      userIds: selectedUserIds.value,
      teamId: batchTargetTeamId.value,
    });
    toast.success("Plotting Berhasil!", `${selectedUserIds.value.length} peserta berhasil dialokasikan ke tim.`);
    showBatchAssignModal.value = false;
    selectedUserIds.value = [];
    await fetchParticipants();
  } catch (err: any) {
    toast.error("Gagal Alokasi Tim", err.data?.error?.message || err.message || "Gagal alokasi tim.");
  } finally {
    saving.value = false;
  }
}

async function batchUnassignTeam() {
  if (selectedUserIds.value.length === 0) return;
  const count = selectedUserIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Lepaskan ${count} Peserta Dari Tim?`,
    description: `Peserta terpilih akan berstatus sebagai Free Agent (tanpa tim).`,
    confirmText: "Ya, Lepas Dari Tim",
    cancelText: "Batal",
    variant: "warning",
    icon: "shield",
  });
  if (!confirmed) return;

  saving.value = true;
  try {
    await api.post("/api/users/batch-assign-team", {
      userIds: selectedUserIds.value,
      teamId: null,
    });
    toast.success("Peserta Dilepas!", `${count} peserta berhasil dilepaskan dari tim.`);
    selectedUserIds.value = [];
    await fetchParticipants();
  } catch (err: any) {
    toast.error("Gagal Melepaskan Peserta", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function batchResetPassword() {
  if (selectedUserIds.value.length === 0) return;
  const count = selectedUserIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Reset Password ${count} Peserta?`,
    description: `Password untuk ${count} peserta terpilih akan di-reset ke default 'genius2026'.`,
    confirmText: "Ya, Reset Semua",
    cancelText: "Batal",
    variant: "warning",
    icon: "shield",
  });
  if (!confirmed) return;

  saving.value = true;
  try {
    await api.post("/api/users/batch-reset-password", {
      userIds: selectedUserIds.value,
      password: "genius2026",
    });
    toast.success("Password Di-reset!", `Password untuk ${count} peserta berhasil di-reset ke 'genius2026'.`);
    selectedUserIds.value = [];
  } catch (err: any) {
    toast.error("Gagal Reset Password Massal", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function batchDeleteParticipants() {
  if (selectedUserIds.value.length === 0) return;
  const count = selectedUserIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Hapus ${count} Peserta Terpilih?`,
    description: `Tindakan ini permanen! Seluruh data akun, riwayat petualangan, skor, dan keanggotaan tim dari ${count} peserta akan dihapus.`,
    confirmText: "Ya, Hapus Semua",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!confirmed) return;

  saving.value = true;
  try {
    await api.post("/api/users/batch-delete", {
      userIds: selectedUserIds.value,
    });
    toast.success("Peserta Dihapus!", `${count} peserta terpilih berhasil dihapus.`);
    selectedUserIds.value = [];
    await fetchParticipants();
  } catch (err: any) {
    toast.error("Gagal Menghapus Peserta Massal", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

function openTacticalDetail(p: any) {
  navigateTo(`/participants/${p.id}`);
}

async function updateActiveTitleDirect(title: string) {
  if (!selectedTacticalParticipant.value) return;
  try {
    const res = await api.put(`/api/users/${selectedTacticalParticipant.value.id}`, {
      characterTitle: title,
    });
    if (res.success) {
      selectedTacticalParticipant.value.characterTitle = title;
      await fetchParticipants();
    }
  } catch (err: any) {
    alert("Gagal memperbarui gelar: " + (err.data?.error?.message || err.message));
  }
}

async function openLedgerModal(p: any) {
  selectedParticipant.value = p;
  ledgerTransactions.value = [];
  showLedgerModal.value = true;
  try {
    const res = await api.get(`/api/users/${p.id}`);
    if (res.success && res.data?.scoreHistory) {
      ledgerTransactions.value = res.data.scoreHistory;
    }
  } catch (err) {
    console.error("Failed to load ledger:", err);
  }
}

function parseRawCsv() {
  const lines = csvRawText.value.split("\n").map((l) => l.trim()).filter(Boolean);
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && (line.toLowerCase().includes("username") || line.toLowerCase().includes("nim"))) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 1 && parts[0]) {
      const nim = parts[0];
      const fullName = parts[1] || parts[0];
      const faculty = parts[2] || "";
      const prodi = parts[3] || "";
      const kelompok = parts[4] || "";

      results.push({
        username: nim,
        nim: nim,
        fullName: fullName,
        name: fullName,
        faculty: faculty,
        prodi: prodi,
        kelompok: kelompok || undefined,
        teamCode: kelompok || undefined,
        password: "genius2026",
        role: "PARTICIPANT",
      });
    }
  }
  parsedPreview.value = results;
}

async function executeImport() {
  if (parsedPreview.value.length === 0) return;
  importing.value = true;
  try {
    const res = await api.post<{ success: boolean; data: any }>("/api/users/bulk-import", {
      items: parsedPreview.value,
      defaultPassword: "genius2026",
      defaultRole: "PARTICIPANT",
    });

    if (res.success) {
      toast.success("Impor Berhasil!", `Berhasil mengimpor ${res.data?.successCount ?? parsedPreview.value.length} mahasiswa peserta! (${res.data?.skippedCount ?? 0} dilewati)`);
      showImportModal.value = false;
      csvRawText.value = "";
      parsedPreview.value = [];
      await fetchParticipants();
    }
  } catch (err: any) {
    toast.error("Gagal Impor", err.data?.error?.message || err.message || "Gagal mengimpor CSV.");
  } finally {
    importing.value = false;
  }
}

function downloadCsvTemplate() {
  const csvContent = "nim,nama,fakultas,prodi,kelompok\n240101001,Ahmad Dahlan,Fakultas Teknologi Informasi,Informatika,GENIUS-01\n240101002,Fatimah Azzahra,Fakultas Industri Halal,Farmasi,GENIUS-02\n240101003,Budi Santoso,Fakultas Ekonomi,Manajemen,";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "template_peserta_genius_2026.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportCsv() {
  if (participants.value.length === 0) {
    toast.error("Ekspor Gagal", "Tidak ada data peserta");
    return;
  }

  let csv = "ID,NIM,Nama Lengkap,Fakultas,Program Studi,Kelompok Genius,Kode Kelompok,Skor Total,Status,Tanggal Daftar\n";
  participants.value.forEach((p) => {
    csv += `"${p.id}","${p.username}","${p.fullName}","${p.faculty || '-'}","${p.prodi || '-'}","${p.teamName || '-'}","${p.teamCode || '-'}","${p.totalScore || 0}","${p.status}","${p.createdAt}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `peserta_genius_2026_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getInitials(name: string) {
  if (!name) return "P";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const { setPageHeader, clearPageHeader } = useLayoutState();

watchEffect(() => {
  setPageHeader({
    title: "Manajemen Peserta RPG & Evolusi",
    badge: `${totalCount.value} Petualang`,
    icon: GraduationCap,
  });
});

onMounted(() => {
  fetchTeams();
  fetchParticipants();
});

onUnmounted(() => {
  clearPageHeader();
});
</script>
