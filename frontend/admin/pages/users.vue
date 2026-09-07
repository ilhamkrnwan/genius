<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#166534] text-[#86efac] border-[#22c55e] flex items-center gap-1.5 hover:bg-[#15803d] hover:text-white transition-colors"
        @click="openQrModal()"
        title="Pindai QR Presensi / Hit Poin Mahasiswa"
      >
        <QrCode class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">PINDAI QR / HIT PRESENSI</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308]"
        @click="openCreateModal"
        title="Tambah Pengguna"
      >
        <UserPlus class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">TAMBAH PENGGUNA</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e]"
        @click="fetchUsers"
        :disabled="loading"
        title="Refresh Data"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- Sticky Top Pixel Toolbar (Flush nempel Topbar) -->
    <div class="pixel-toolbar-sticky px-4 md:px-6 py-2.5 space-y-2.5 shrink-0">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <!-- Role Tabs -->
        <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            v-for="r in roleTabs"
            :key="r.value"
            @click="setRole(r.value)"
            :class="[
              'h-7 px-2.5 text-xs font-pixel transition-colors border',
              selectedRole === r.value
                ? 'bg-[#f59e0b] border-[#f59e0b] text-[#16110d] font-bold'
                : 'bg-[#271d15] border-[#523e2b] text-muted-foreground hover:text-foreground'
            ]"
          >
            {{ r.label }}
          </button>
        </div>

        <!-- Search & Status Select -->
        <div class="flex items-center gap-2">
          <div class="relative w-48 sm:w-60">
            <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f59e0b]" />
            <input
              v-model="searchQuery"
              placeholder="Cari nama atau username..."
              class="w-full h-7 text-xs font-mono pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              @input="debounceFetch"
            />
          </div>

          <select
            v-model="selectedStatus"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs font-mono text-foreground focus:outline-none focus:border-[#f59e0b]"
            @change="currentPage = 1; fetchUsers()"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
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
          <span class="font-bold">{{ selectedUserIds.length }} pengguna terpilih</span>
          <span class="text-muted-foreground text-[11px] hidden sm:inline">(dari {{ filteredUsers.length }})</span>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#166534] text-[#86efac] font-bold border-[#22c55e] hover:bg-[#22c55e] hover:text-[#0f172a] transition-colors"
            @click="batchUpdateStatus('ACTIVE')"
          >
            Aktifkan Akun
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#78350f] text-[#fef08a] font-bold border-[#92400e] hover:bg-[#92400e] transition-colors"
            @click="batchUpdateStatus('INACTIVE')"
          >
            Nonaktifkan Akun
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#1e293b] text-[#38bdf8] font-bold border-[#0284c7] hover:bg-[#0284c7] hover:text-white transition-colors"
            @click="batchResetPassword"
          >
            Reset Password
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#450a0a] text-[#f87171] font-bold border-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors"
            @click="batchDeleteUsers"
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

    <!-- Main Page Content Area: Flush Table -->
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
            <th class="px-3 py-2.5">PENGGUNA</th>
            <th class="px-3 py-2.5 text-center">ROLE / PERAN</th>
            <th class="px-3 py-2.5">TIM TERKAIT</th>
            <th class="px-3 py-2.5 text-center">TOTAL XP</th>
            <th class="px-3 py-2.5 text-center">STATUS</th>
            <th class="px-3 py-2.5">TERDAFTAR</th>
            <th class="pr-4 md:pr-6 pl-3 py-2.5 text-center w-16">AKSI</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#3d2d1e]/60 font-mono">
          <tr v-if="loading" class="text-center">
            <td colspan="8" class="p-8 text-muted-foreground">
              <div class="flex items-center justify-center gap-2">
                <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                <span>Memuat data pengguna...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="paginatedUsers.length === 0" class="text-center">
            <td colspan="8" class="p-8 text-muted-foreground">
              Tidak ada akun pengguna ditemukan.
            </td>
          </tr>

          <tr
            v-for="u in paginatedUsers"
            :key="u.id"
            :class="['hover:bg-[#271d15]/50 transition-colors', selectedUserIds.includes(u.id) ? 'bg-[#3b2716]/30' : '']"
          >
            <!-- Checkbox -->
            <td class="py-2.5 pl-4 md:pl-6 pr-3 text-center">
              <input
                type="checkbox"
                :value="u.id"
                v-model="selectedUserIds"
                class="rounded bg-[#1a140f] border-[#523e2b] text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
              />
            </td>

            <!-- Name & Username -->
            <td class="px-3 py-2.5">
              <div class="flex items-center gap-2.5">
                <div
                  :class="[
                    'h-7 w-7 border flex items-center justify-center font-pixel text-[9px] shrink-0',
                    u.role === 'ADMIN'
                      ? 'border-[#dc2626]/60 bg-[#2a1414] text-[#f87171]'
                      : u.role === 'BUDDY'
                        ? 'border-[#0284c7]/60 bg-[#16222f] text-[#38bdf8]'
                        : 'border-[#16a34a]/60 bg-[#162518] text-[#4ade80]'
                  ]"
                >
                  {{ getInitials(u.fullName) }}
                </div>
                <div>
                  <div class="font-sans font-semibold text-foreground text-xs leading-tight">
                    {{ u.fullName }}
                  </div>
                  <div class="text-[10px] text-muted-foreground font-mono">
                    @{{ u.username }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Role Badge -->
            <td class="px-3 py-2.5 text-center">
              <span
                :class="[
                  'px-2 py-0.5 text-[9px] font-pixel border inline-block',
                  u.role === 'ADMIN'
                    ? 'border-[#dc2626]/80 bg-[#2a1414] text-[#f87171]'
                    : u.role === 'BUDDY'
                      ? 'border-[#0284c7]/80 bg-[#16222f] text-[#38bdf8]'
                      : 'border-[#ca8a04]/80 bg-[#2b2014] text-[#facc15]'
                ]"
              >
                {{ u.role }}
              </span>
            </td>

            <!-- Team -->
            <td class="px-3 py-2.5">
              <span v-if="u.teamName" class="text-[#facc15] font-pixel text-[10px]">
                {{ u.teamName }} <span class="text-muted-foreground font-mono">({{ u.teamCode }})</span>
              </span>
              <span v-else class="text-muted-foreground/60 italic text-[11px]">-</span>
            </td>

            <!-- Total XP Column (Clickable to open Log Poin Modal) -->
            <td class="px-3 py-2.5 text-center">
              <button
                v-if="u.role === 'PARTICIPANT'"
                type="button"
                @click="openPointLogModal(u)"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-pixel font-bold rounded border border-[#ca8a04]/70 bg-[#2b2014] text-[#facc15] hover:bg-[#ca8a04]/30 hover:border-[#f59e0b] hover:shadow-sm transition-all cursor-pointer group"
                title="Klik untuk melihat riwayat log poin"
              >
                <Award class="h-3.5 w-3.5 text-[#f59e0b] group-hover:scale-110 transition-transform" />
                <span>{{ u.totalScore || 0 }} XP</span>
              </button>
              <span v-else class="text-muted-foreground/50 text-[11px] font-mono">-</span>
            </td>

            <!-- Status -->
            <td class="px-3 py-2.5 text-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border',
                  u.status === 'ACTIVE'
                    ? 'border-[#16a34a]/60 bg-[#162518] text-[#4ade80]'
                    : 'border-[#dc2626]/60 bg-[#2a1414] text-[#f87171]'
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="u.status === 'ACTIVE' ? 'bg-[#4ade80]' : 'bg-[#f87171]'" />
                {{ u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>

            <!-- Created At -->
            <td class="px-3 py-2.5 text-[11px] text-muted-foreground">
              {{ formatDate(u.createdAt) }}
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
                  <DropdownMenuItem @click="openPointLogModal(u)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-[#facc15] py-1.5 px-2">
                    <History class="mr-2 h-3.5 w-3.5 text-[#facc15]" />
                    <span>Lihat Log Poin</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem v-if="u.role === 'PARTICIPANT'" @click="openQuickPresensiModal(u)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-[#4ade80] py-1.5 px-2">
                    <QrCode class="mr-2 h-3.5 w-3.5 text-[#4ade80]" />
                    <span>Hit Presensi / Poin</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator class="bg-[#4a3624] my-1" />

                  <DropdownMenuItem @click="openEditModal(u)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <Edit class="mr-2 h-3.5 w-3.5 text-[#f59e0b]" />
                    <span>Edit Pengguna</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openResetPasswordModal(u)" class="cursor-pointer hover:bg-[#2e1e12] focus:bg-[#2e1e12] text-foreground py-1.5 px-2">
                    <KeyRound class="mr-2 h-3.5 w-3.5 text-[#facc15]" />
                    <span>Reset Password</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator class="bg-[#4a3624] my-1" />

                  <DropdownMenuItem @click="confirmDelete(u)" class="cursor-pointer hover:bg-[#2a1414] focus:bg-[#2a1414] text-[#f87171] py-1.5 px-2">
                    <Trash2 class="mr-2 h-3.5 w-3.5 text-[#f87171]" />
                    <span>Hapus Pengguna</span>
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
        :total-items="filteredUsers.length"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event; currentPage = 1"
      />
    </div>

    <!-- MODAL 1: PEMINDAI QR & HIT PRESENSI (showQrModal) -->
    <Dialog :open="showQrModal" @update:open="handleQrModalChange">
      <DialogContent class="sm:max-w-[560px] pixel-card border-2 border-[#ca8a04] bg-[#1a140f] text-foreground p-5 max-h-[92vh] overflow-y-auto">
        <DialogHeader class="border-b border-[#4a3624] pb-3">
          <DialogTitle class="font-pixel text-sm text-[#f59e0b] flex items-center justify-between">
            <span class="flex items-center gap-2">
              <QrCode class="h-4 w-4 text-[#f59e0b]" />
              <span>PEMINDAI QR PRESENSI & XP</span>
            </span>
            <span v-if="activeSession" class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14321d] text-[#4ade80] border border-[#22c55e]/40">
              Sesi: {{ activeSession.type }}
            </span>
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground font-mono mt-1">
            Arahkan kamera ke QR kartu mahasiswa atau ketik / tempel NIM / kode token untuk melakukan presensi & award poin.
          </DialogDescription>
        </DialogHeader>

        <!-- Active Session Status Banner -->
        <div
          v-if="activeSession"
          class="p-2.5 rounded border border-[#22c55e]/50 bg-[#122416] text-[#86efac] text-xs font-mono flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
            <div>
              <span class="font-bold text-white">{{ activeSession.title }}</span>
              <span class="text-muted-foreground ml-1 text-[11px]">
                ({{ activeSession.type === 'CHECK_IN' ? 'Presensi Masuk' : 'Presensi Kepulangan' }})
              </span>
            </div>
          </div>
          <span class="font-pixel text-xs text-[#facc15] font-bold">
            +{{ activeSession.xpReward }} XP
          </span>
        </div>
        <div
          v-else
          class="p-2.5 rounded border border-[#ca8a04]/50 bg-[#2b1e12] text-[#fde047] text-xs font-mono flex items-center gap-2"
        >
          <AlertTriangle class="h-4 w-4 shrink-0 text-[#f59e0b]" />
          <span>Tidak ada sesi presensi aktif. Anda tetap dapat memberikan poin secara langsung atau mengaktifkan sesi di menu Presensi.</span>
        </div>

        <!-- Mode Selector: Kamera vs Input Manual -->
        <div class="flex items-center gap-1 border-b border-[#3d2d1e] pb-2 text-xs font-pixel">
          <button
            type="button"
            @click="switchScannerTab('camera')"
            :class="[
              'px-3 py-1.5 border transition-colors flex items-center gap-1.5',
              scannerTab === 'camera'
                ? 'bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold'
                : 'bg-[#271d15] border-[#523e2b] text-muted-foreground hover:text-foreground'
            ]"
          >
            <Camera class="h-3.5 w-3.5" />
            <span>KAMERA WEBCAM</span>
          </button>
          <button
            type="button"
            @click="switchScannerTab('manual')"
            :class="[
              'px-3 py-1.5 border transition-colors flex items-center gap-1.5',
              scannerTab === 'manual'
                ? 'bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold'
                : 'bg-[#271d15] border-[#523e2b] text-muted-foreground hover:text-foreground'
            ]"
          >
            <Keyboard class="h-3.5 w-3.5" />
            <span>INPUT MANUAL / BARCODE GUN</span>
          </button>
        </div>

        <!-- TAB 1: Mode Kamera -->
        <div v-if="scannerTab === 'camera'" class="space-y-3">
          <div class="relative w-full h-56 bg-black border-2 border-[#523e2b] rounded overflow-hidden flex items-center justify-center">
            <video
              ref="videoRef"
              class="w-full h-full object-cover"
              playsinline
              muted
            />

            <!-- Viewfinder Reticle (Retro Scan Overlay) -->
            <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div class="relative w-44 h-44 border-2 border-[#f59e0b]/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <!-- Corner Pixel Accents -->
                <span class="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#facc15]" />
                <span class="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#facc15]" />
                <span class="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#facc15]" />
                <span class="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#facc15]" />

                <!-- Laser Scan Line -->
                <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <!-- Camera Error Message Overlay -->
            <div
              v-if="cameraError"
              class="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center text-xs font-mono text-[#f87171] space-y-2"
            >
              <AlertTriangle class="h-6 w-6 text-[#ef4444]" />
              <p>{{ cameraError }}</p>
              <button
                type="button"
                class="pixel-btn px-3 py-1 bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold text-[11px]"
                @click="startCamera"
              >
                Coba Lagi Kamera
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Arahkan kamera tepat ke QR Mahasiswa.</span>
            <button
              type="button"
              class="text-[#f59e0b] hover:underline"
              @click="switchScannerTab('manual')"
            >
              Gunakan mode input manual &rarr;
            </button>
          </div>
        </div>

        <!-- TAB 2: Mode Input Manual / Barcode Scanner -->
        <div v-else class="space-y-3 font-mono text-xs">
          <!-- Target Action Mode -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Tipe Aksi Presensi / Poin:</Label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="scanActionMode = 'ATTENDANCE'"
                :class="[
                  'h-8 px-2 border text-xs font-mono transition-colors text-left flex items-center gap-1.5',
                  scanActionMode === 'ATTENDANCE'
                    ? 'border-[#22c55e] bg-[#142c18] text-[#86efac] font-bold'
                    : 'border-[#523e2b] bg-[#271d15] text-muted-foreground'
                ]"
              >
                <CheckCircle2 class="h-3.5 w-3.5 text-[#4ade80]" />
                <span>Presensi Sesi Aktif</span>
              </button>
              <button
                type="button"
                @click="scanActionMode = 'CUSTOM_XP'"
                :class="[
                  'h-8 px-2 border text-xs font-mono transition-colors text-left flex items-center gap-1.5',
                  scanActionMode === 'CUSTOM_XP'
                    ? 'border-[#ca8a04] bg-[#2e1f14] text-[#facc15] font-bold'
                    : 'border-[#523e2b] bg-[#271d15] text-muted-foreground'
                ]"
              >
                <Sparkles class="h-3.5 w-3.5 text-[#f59e0b]" />
                <span>Beri Poin Langsung</span>
              </button>
            </div>
          </div>

          <!-- Target Student Selector (Optional) -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">
              Target Mahasiswa (Pilih dari daftar atau masukkan lewat QR):
            </Label>
            <select
              v-model="scanTargetUserId"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="">-- Deteksi otomatis dari hasil scan QR --</option>
              <option
                v-for="u in participantUsers"
                :key="u.id"
                :value="u.id"
              >
                {{ u.fullName }} (@{{ u.username }}) - {{ u.totalScore || 0 }} XP
              </option>
            </select>
          </div>

          <!-- QR Token / Barcode Input -->
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">
              Kode QR / NIM / Token Sesi:
            </Label>
            <div class="relative">
              <input
                ref="qrInputRef"
                v-model="qrManualInput"
                placeholder="Scan dengan Barcode Gun atau ketik (e.g. peserta_1)..."
                class="w-full h-9 px-3 bg-[#271d15] border border-[#523e2b] text-foreground font-mono text-xs focus:outline-none focus:border-[#f59e0b]"
                @keydown.enter.prevent="submitManualScan"
              />
              <button
                v-if="qrManualInput"
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="qrManualInput = ''"
              >
                &times;
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground">
              Mendukung NIM maba, UUID pengguna, token sesi, atau payload JSON QR. Tekan <b>Enter</b> untuk memproses.
            </p>
          </div>

          <!-- Custom XP Inputs (if CUSTOM_XP mode selected) -->
          <div v-if="scanActionMode === 'CUSTOM_XP'" class="grid grid-cols-2 gap-2 p-2.5 rounded border border-[#523e2b] bg-[#22170f]">
            <div class="space-y-1">
              <Label class="text-[11px] text-[#facc15] font-semibold">Jumlah XP:</Label>
              <input
                type="number"
                v-model.number="customXpAmount"
                class="w-full h-7 px-2 bg-[#1a140f] border border-[#523e2b] text-[#facc15] font-bold text-xs focus:outline-none focus:border-[#f59e0b]"
                placeholder="50"
              />
            </div>
            <div class="space-y-1">
              <Label class="text-[11px] text-[#facc15] font-semibold">Alasan / Catatan:</Label>
              <input
                v-model="customXpReason"
                class="w-full h-7 px-2 bg-[#1a140f] border border-[#523e2b] text-foreground text-xs focus:outline-none focus:border-[#f59e0b]"
                placeholder="Keaktifan PKKMB..."
              />
            </div>
          </div>

          <!-- Quick Test Presets -->
          <div class="space-y-1 pt-1 border-t border-[#3d2d1e]/60">
            <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              Shortcut Cepat (Testing / Demo):
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="sample in samplePresets"
                :key="sample.value"
                type="button"
                @click="applyPreset(sample.value)"
                class="px-2 py-0.5 text-[10px] font-mono bg-[#271d15] border border-[#523e2b] text-[#facc15] hover:border-[#f59e0b] hover:bg-[#3d2d1e] rounded"
              >
                {{ sample.label }}
              </button>
              <button
                v-if="activeSession?.qrToken"
                type="button"
                @click="applyPreset(activeSession.qrToken)"
                class="px-2 py-0.5 text-[10px] font-mono bg-[#142c18] border border-[#22c55e] text-[#86efac] hover:bg-[#1a3820] rounded"
              >
                QR Sesi Aktif
              </button>
            </div>
          </div>
        </div>

        <DialogFooter class="border-t border-[#4a3624] pt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground"
            @click="closeQrModal"
          >
            Tutup
          </button>
          <button
            type="button"
            class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#166534] text-[#86efac] border-[#22c55e] font-bold hover:bg-[#22c55e] hover:text-[#0f172a] disabled:opacity-50"
            @click="submitManualScan"
            :disabled="processingQr"
          >
            <RotateCw v-if="processingQr" class="h-3.5 w-3.5 animate-spin mr-1.5 inline" />
            <span>{{ processingQr ? 'MEMPROSES...' : 'PROSES KODE QR' }}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- MODAL 2: MODAL VALID (showValidModal) -->
    <Dialog :open="showValidModal" @update:open="showValidModal = $event">
      <DialogContent class="sm:max-w-[460px] pixel-card border-2 border-[#22c55e] bg-[#0d1e12] text-foreground p-5 shadow-2xl">
        <div class="text-center space-y-3">
          <!-- Animated Check Badge -->
          <div class="mx-auto w-14 h-14 rounded-full bg-[#166534]/40 border-2 border-[#22c55e] flex items-center justify-center text-[#4ade80] shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <CheckCircle2 class="h-8 w-8 text-[#4ade80]" />
          </div>

          <div>
            <h2 class="font-pixel text-base text-[#4ade80] tracking-wide">
              PRESENSI VALID & XP BERHASIL!
            </h2>
            <p class="text-xs text-muted-foreground font-mono mt-1">
              Kode QR berhasil diverifikasi dan poin XP telah ditambahkan ke profil mahasiswa.
            </p>
          </div>

          <!-- Student & Points Celebration Card -->
          <div class="p-3.5 rounded border-2 border-[#ca8a04]/80 bg-[#1e160e] text-left space-y-2.5 font-mono text-xs">
            <div class="flex items-center justify-between border-b border-[#4a3624] pb-2">
              <div>
                <span class="text-[10px] text-muted-foreground uppercase block">Mahasiswa:</span>
                <span class="font-sans font-bold text-sm text-foreground">
                  {{ validModalData.participantName || '-' }}
                </span>
                <span class="text-[11px] text-[#facc15] block">
                  @{{ validModalData.username || '-' }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-muted-foreground uppercase block">Status:</span>
                <span
                  :class="[
                    'inline-block px-2 py-0.5 text-[10px] font-pixel border rounded',
                    validModalData.checkInStatus === 'ON_TIME'
                      ? 'border-[#22c55e] bg-[#142c18] text-[#86efac]'
                      : 'border-[#f59e0b] bg-[#2e1f14] text-[#facc15]'
                  ]"
                >
                  {{ validModalData.checkInStatus === 'ON_TIME' ? 'TEPAT WAKTU' : validModalData.checkInStatus === 'LATE' ? 'TERLAMBAT (1/2 XP)' : 'HADIR' }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 border-b border-[#4a3624]/60 pb-2">
              <div>
                <span class="text-[10px] text-muted-foreground uppercase block">Sesi Presensi:</span>
                <span class="font-semibold text-foreground text-xs leading-tight block">
                  {{ validModalData.sessionTitle || 'Presensi Sesi' }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-muted-foreground uppercase block">Tanggal & Jam:</span>
                <span class="text-[#facc15] font-semibold text-xs block">
                  {{ validModalData.date }}
                </span>
                <span class="text-muted-foreground text-[10px] font-mono">
                  Pukul {{ validModalData.time }}
                </span>
              </div>
            </div>

            <!-- Golden XP Award Highlight Box -->
            <div class="p-2.5 rounded bg-gradient-to-r from-[#2b2014] to-[#3a2818] border border-[#ca8a04] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Award class="h-6 w-6 text-[#facc15] animate-bounce" />
                <div>
                  <span class="text-[10px] text-[#fde047] uppercase font-bold block">Poin Diperoleh:</span>
                  <span class="font-pixel text-lg text-[#facc15] font-bold">
                    +{{ validModalData.xpAwarded || 0 }} XP
                  </span>
                </div>
              </div>

              <div class="text-right">
                <span class="text-[10px] text-muted-foreground uppercase block">Total XP Baru:</span>
                <span class="font-pixel text-sm text-[#4ade80] font-bold">
                  {{ validModalData.totalXp || 0 }} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="border-t border-[#22c55e]/40 pt-3 mt-1 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            class="pixel-btn flex-1 h-8 px-3 text-xs font-pixel bg-[#166534] text-[#86efac] border-[#22c55e] font-bold hover:bg-[#22c55e] hover:text-[#0f172a]"
            @click="scanNextFromValid"
          >
            Pindai Berikutnya &rarr;
          </button>
          <button
            type="button"
            class="h-8 px-3 text-xs border border-[#ca8a04] bg-[#271d15] text-[#facc15] hover:bg-[#3d2d1e] font-mono"
            @click="openLogFromValid"
          >
            Lihat Log Poin
          </button>
          <button
            type="button"
            class="h-8 px-3 text-xs border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground"
            @click="showValidModal = false"
          >
            Selesai
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- MODAL 3: MODAL TIDAK VALID (showInvalidModal) -->
    <Dialog :open="showInvalidModal" @update:open="showInvalidModal = $event">
      <DialogContent class="sm:max-w-[460px] pixel-card border-2 border-[#dc2626] bg-[#241010] text-foreground p-5 shadow-2xl">
        <div class="text-center space-y-3">
          <!-- Animated Error Badge -->
          <div class="mx-auto w-14 h-14 rounded-full bg-[#7f1d1d]/40 border-2 border-[#dc2626] flex items-center justify-center text-[#f87171] shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <XCircle class="h-8 w-8 text-[#f87171]" />
          </div>

          <div>
            <h2 class="font-pixel text-base text-[#f87171] tracking-wide">
              KODE QR TIDAK VALID!
            </h2>
            <p class="text-xs text-muted-foreground font-mono mt-1">
              Sistem menolak kode QR ini karena tidak memenuhi ketentuan presensi.
            </p>
          </div>

          <!-- Error Details Card -->
          <div class="p-3.5 rounded border-2 border-[#7f1d1d] bg-[#1a0a0a] text-left space-y-2.5 font-mono text-xs">
            <div>
              <span class="text-[10px] text-muted-foreground uppercase block">Alasan Penolakan:</span>
              <p class="text-xs text-[#fca5a5] font-semibold mt-0.5 leading-snug">
                {{ invalidModalData.message || 'Kode QR tidak dikenali atau kedaluwarsa.' }}
              </p>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-[#451212] text-[11px]">
              <div v-if="invalidModalData.code" class="flex items-center gap-1.5">
                <span class="text-[10px] text-muted-foreground uppercase">Kode:</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono bg-[#351515] text-[#f87171] border border-[#7f1d1d] rounded">
                  {{ invalidModalData.code }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-muted-foreground uppercase block">Waktu Percobaan:</span>
                <span class="text-[#fca5a5] font-mono text-[10px]">{{ invalidModalData.dateTime || 'Baru saja' }}</span>
              </div>
            </div>

            <!-- Scanned Raw Token Display -->
            <div v-if="invalidModalData.scannedToken" class="space-y-1">
              <span class="text-[10px] text-muted-foreground uppercase block">Nilai yang Dipindai:</span>
              <div class="p-2 rounded bg-[#130707] border border-[#5c1d1d] text-[#fca5a5] font-mono text-[11px] break-all">
                {{ invalidModalData.scannedToken }}
              </div>
            </div>

            <!-- Tips & Resolution -->
            <div class="p-2 rounded bg-[#2e1212] border border-[#7f1d1d]/60 text-[11px] text-[#fed7aa] space-y-1">
              <div class="flex items-center gap-1 font-bold text-[#facc15]">
                <AlertTriangle class="h-3 w-3 text-[#f59e0b]" />
                <span>Petunjuk Penyelesaian:</span>
              </div>
              <ul class="list-disc pl-4 space-y-0.5 text-[10px] text-muted-foreground">
                <li v-if="invalidModalData.code === 'ALREADY_ATTENDED'">
                  Mahasiswa sudah melakukan presensi pada sesi ini sebelumnya.
                </li>
                <li v-else-if="invalidModalData.code === 'NO_ACTIVE_SESSION'">
                  Sesi presensi belum diaktifkan oleh panitia. Aktifkan di menu Presensi.
                </li>
                <li v-else-if="invalidModalData.code === 'USER_NOT_FOUND'">
                  ID/NIM tidak terdaftar. Pastikan mahasiswa sudah memiliki akun aktif.
                </li>
                <li v-else>
                  Pastikan memindai QR resmi dari aplikasi atau kartu identitas PKKMB.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter class="border-t border-[#dc2626]/40 pt-3 mt-1 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            class="pixel-btn flex-1 h-8 px-3 text-xs font-pixel bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626] font-bold hover:bg-[#dc2626] hover:text-white"
            @click="retryScanFromInvalid"
          >
            Coba Pindai Ulang
          </button>
          <button
            type="button"
            class="h-8 px-3 text-xs border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground font-mono"
            @click="showInvalidModal = false"
          >
            Tutup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- MODAL 4: MODAL RIWAYAT LOG POIN PENGGUNA (showPointLogModal) -->
    <Dialog :open="showPointLogModal" @update:open="showPointLogModal = $event">
      <DialogContent class="sm:max-w-[620px] pixel-card border-2 border-[#ca8a04] bg-[#1a140f] text-foreground p-5 max-h-[90vh] overflow-y-auto">
        <DialogHeader class="border-b border-[#4a3624] pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="h-10 w-10 border-2 border-[#ca8a04] bg-[#2b2014] text-[#facc15] flex items-center justify-center font-pixel text-xs font-bold"
              >
                {{ getInitials(selectedUserForLog?.fullName || 'U') }}
              </div>
              <div>
                <DialogTitle class="font-sans font-bold text-sm text-foreground">
                  {{ selectedUserForLog?.fullName || 'Mahasiswa' }}
                </DialogTitle>
                <div class="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <span>@{{ selectedUserForLog?.username }}</span>
                  <span v-if="selectedUserForLog?.teamName" class="text-[#facc15]">
                    • {{ selectedUserForLog.teamName }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Total XP Counter Badge -->
            <div class="px-3 py-1.5 rounded border-2 border-[#ca8a04] bg-[#2b2014] text-right font-pixel">
              <span class="text-[9px] text-[#fde047] uppercase block">TOTAL SKOR:</span>
              <span class="text-sm text-[#facc15] font-bold">
                {{ selectedUserTotalXp }} XP
              </span>
            </div>
          </div>
        </DialogHeader>

        <div class="space-y-4 py-2 font-mono text-xs">
          <!-- Quick XP Award Form -->
          <div class="p-3 rounded border border-[#ca8a04]/50 bg-[#241a12] space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-pixel text-[#facc15] flex items-center gap-1.5">
                <Sparkles class="h-3.5 w-3.5 text-[#f59e0b]" />
                <span>BERI POIN TAMBAHAN / BONUS ADMIN</span>
              </span>
              <span class="text-[10px] text-muted-foreground">Otomatis sinkron ke leaderboard</span>
            </div>

            <form @submit.prevent="submitQuickAward" class="flex flex-col sm:flex-row gap-2 items-end">
              <div class="w-full sm:w-28 space-y-1">
                <Label class="text-[10px] text-muted-foreground">Jumlah XP:</Label>
                <input
                  type="number"
                  v-model.number="quickAwardAmount"
                  placeholder="50"
                  class="w-full h-8 px-2 bg-[#1a140f] border border-[#523e2b] text-[#facc15] font-bold text-xs focus:outline-none focus:border-[#f59e0b]"
                  required
                />
              </div>
              <div class="w-full sm:flex-1 space-y-1">
                <Label class="text-[10px] text-muted-foreground">Keterangan / Alasan:</Label>
                <input
                  v-model="quickAwardReason"
                  placeholder="e.g. Keaktifan PKKMB, Juara Ice Breaking..."
                  class="w-full h-8 px-2 bg-[#1a140f] border border-[#523e2b] text-foreground text-xs focus:outline-none focus:border-[#f59e0b]"
                  required
                />
              </div>
              <button
                type="submit"
                class="pixel-btn h-8 px-3 text-xs font-pixel bg-[#ca8a04] text-[#16110d] border-[#eab308] font-bold hover:bg-[#eab308] shrink-0"
                :disabled="savingQuickAward"
              >
                <RotateCw v-if="savingQuickAward" class="h-3 w-3 animate-spin mr-1 inline" />
                <span>+ BERI XP</span>
              </button>
            </form>
          </div>

          <!-- Transaction Ledger Table -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-pixel text-foreground flex items-center gap-1.5">
                <History class="h-3.5 w-3.5 text-[#f59e0b]" />
                <span>RIWAYAT TRANSAKSI & LOG POIN</span>
              </span>
              <span class="text-[11px] text-muted-foreground font-mono">
                {{ userPointLogs.length }} transaksi tercatat
              </span>
            </div>

            <div class="border border-[#4a3624] rounded overflow-hidden max-h-56 overflow-y-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-[#15100c] text-muted-foreground border-b border-[#4a3624] text-[10px] uppercase font-pixel sticky top-0">
                  <tr>
                    <th class="px-2.5 py-1.5">TANGGAL & JAM</th>
                    <th class="px-2.5 py-1.5">SUMBER</th>
                    <th class="px-2.5 py-1.5">KETERANGAN</th>
                    <th class="px-2.5 py-1.5 text-right">POIN</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3d2d1e]/50 font-mono text-[11px]">
                  <tr v-if="loadingPointLogs" class="text-center">
                    <td colspan="4" class="p-6 text-muted-foreground">
                      <div class="flex items-center justify-center gap-2">
                        <RotateCw class="h-3.5 w-3.5 animate-spin text-[#f59e0b]" />
                        <span>Memuat riwayat log poin...</span>
                      </div>
                    </td>
                  </tr>

                  <tr v-else-if="userPointLogs.length === 0" class="text-center">
                    <td colspan="4" class="p-6 text-muted-foreground italic">
                      Belum ada riwayat transaksi poin untuk mahasiswa ini.
                    </td>
                  </tr>

                  <tr
                    v-for="tx in userPointLogs"
                    :key="tx.id"
                    class="hover:bg-[#271d15]/60 transition-colors"
                  >
                    <!-- Date & Time -->
                    <td class="px-2.5 py-2 text-muted-foreground whitespace-nowrap">
                      <div class="text-foreground font-semibold text-xs leading-tight">{{ formatDateWithYear(tx.createdAt) }}</div>
                      <div class="text-[#facc15] text-[10px] font-mono mt-0.5">{{ formatTimeOnly(tx.createdAt) }} WIB</div>
                    </td>

                    <!-- Source Type Badge -->
                    <td class="px-2.5 py-2 whitespace-nowrap">
                      <span
                        :class="[
                          'px-1.5 py-0.5 text-[9px] font-pixel border rounded',
                          tx.sourceType === 'ATTENDANCE'
                            ? 'border-[#22c55e] bg-[#142c18] text-[#86efac]'
                            : tx.sourceType === 'BONUS'
                              ? 'border-[#ca8a04] bg-[#2b2014] text-[#facc15]'
                              : tx.sourceType === 'GAME'
                                ? 'border-[#0284c7] bg-[#16222f] text-[#38bdf8]'
                                : 'border-[#9333ea] bg-[#241433] text-[#d8b4fe]'
                        ]"
                      >
                        {{ tx.sourceType }}
                      </span>
                    </td>

                    <!-- Reason -->
                    <td class="px-2.5 py-2 text-foreground font-sans text-xs">
                      {{ tx.reason || '-' }}
                    </td>

                    <!-- Amount -->
                    <td class="px-2.5 py-2 text-right font-pixel text-xs font-bold whitespace-nowrap">
                      <span :class="tx.amount >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'">
                        {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }} XP
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter class="border-t border-[#4a3624] pt-3 flex items-center justify-end">
          <button
            type="button"
            class="h-8 px-4 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground font-mono"
            @click="showPointLogModal = false"
          >
            Tutup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal: Create / Edit User -->
    <Dialog :open="showFormModal" @update:open="showFormModal = $event">
      <DialogContent class="sm:max-w-[440px] pixel-card border-2 border-[#f59e0b] bg-[#1a140f] text-foreground">
        <DialogHeader>
          <DialogTitle class="font-pixel text-sm text-[#f59e0b] flex items-center gap-2">
            <UserPlus class="h-4 w-4" />
            <span>{{ isEditing ? 'EDIT DATA PENGGUNA' : 'TAMBAH PENGGUNA BARU' }}</span>
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitForm" class="space-y-3 py-1 font-mono text-xs">
          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Username:</Label>
            <input
              v-model="form.username"
              placeholder="Username login..."
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b] disabled:opacity-50"
              :disabled="isEditing"
              required
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Nama Lengkap:</Label>
            <input
              v-model="form.fullName"
              placeholder="Nama lengkap pengguna..."
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">Peran Sistem (Role):</Label>
            <select
              v-model="form.role"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
              :disabled="isEditing"
            >
              <option value="PARTICIPANT">PARTICIPANT (Mahasiswa Peserta)</option>
              <option value="BUDDY">BUDDY (Game Master)</option>
              <option value="ADMIN">ADMIN (Super Administrator)</option>
            </select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-foreground font-semibold">
              {{ isEditing ? 'Ganti Password (Kosongkan jika tetap):' : 'Password Awal:' }}
            </Label>
            <input
              type="password"
              v-model="form.password"
              :placeholder="isEditing ? '••••••••' : 'Default: genius2026'"
              class="w-full h-8 px-2 bg-[#271d15] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

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
              <span>{{ isEditing ? 'SIMPAN' : 'BUAT' }}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import {
  UserPlus,
  RotateCw,
  Search,
  KeyRound,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckSquare,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  History,
  Sparkles,
  Camera,
  Keyboard,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PixelPagination from "@/components/PixelPagination.vue";
import { useApi } from "@/composables/useApi";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";

const api = useApi();
const toast = useToast();
const confirmModal = useConfirm();

const loading = ref(false);
const saving = ref(false);
const users = ref<any[]>([]);
const searchQuery = ref("");
const selectedRole = ref("");
const selectedStatus = ref("");

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);

const roleTabs = [
  { label: "SEMUA", value: "" },
  { label: "ADMIN", value: "ADMIN" },
  { label: "BUDDY", value: "BUDDY" },
  { label: "PESERTA", value: "PARTICIPANT" },
];

const showFormModal = ref(false);
const isEditing = ref(false);
const form = ref({
  id: "",
  username: "",
  fullName: "",
  role: "PARTICIPANT",
  password: "",
  status: "ACTIVE",
});

const totalUsers = computed(() => users.value.length);

const filteredUsers = computed(() => {
  return users.value;
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

const participantUsers = computed(() => {
  return users.value.filter((u) => u.role === "PARTICIPANT");
});

const selectedUserIds = ref<string[]>([]);

const isAllSelected = computed(() => {
  if (paginatedUsers.value.length === 0) return false;
  return paginatedUsers.value.every((u) => selectedUserIds.value.includes(u.id));
});

function toggleSelectAll() {
  const pageIds = new Set(paginatedUsers.value.map((u) => u.id));
  if (isAllSelected.value) {
    selectedUserIds.value = selectedUserIds.value.filter((id) => !pageIds.has(id));
  } else {
    selectedUserIds.value = Array.from(new Set([...selectedUserIds.value, ...pageIds]));
  }
}

async function batchUpdateStatus(status: "ACTIVE" | "INACTIVE") {
  if (selectedUserIds.value.length === 0) return;
  const count = selectedUserIds.value.length;
  const statusLabel = status === "ACTIVE" ? "Aktif" : "Nonaktif";
  saving.value = true;
  try {
    await api.post("/api/users/batch-status", {
      userIds: selectedUserIds.value,
      status,
    });
    toast.success("Status Diperbarui!", `Status ${count} akun pengguna berhasil diubah menjadi ${statusLabel}.`);
    selectedUserIds.value = [];
    await fetchUsers();
  } catch (err: any) {
    toast.error("Gagal Memperbarui Status", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function batchResetPassword() {
  if (selectedUserIds.value.length === 0) return;
  const count = selectedUserIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Reset Password ${count} Pengguna?`,
    description: `Password untuk ${count} pengguna terpilih akan di-reset ke default 'genius2026'.`,
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
    toast.success("Password Di-reset!", `Password untuk ${count} pengguna berhasil di-reset ke 'genius2026'.`);
    selectedUserIds.value = [];
  } catch (err: any) {
    toast.error("Gagal Reset Password Massal", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

async function batchDeleteUsers() {
  if (selectedUserIds.value.length === 0) return;
  const count = selectedUserIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Hapus ${count} Akun Pengguna?`,
    description: `Tindakan ini permanen! Seluruh data akun pengguna, penugasan tim, dan riwayat yang terkait akan dihapus.`,
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
    toast.success("Pengguna Dihapus!", `${count} akun pengguna berhasil dihapus.`);
    selectedUserIds.value = [];
    await fetchUsers();
  } catch (err: any) {
    toast.error("Gagal Menghapus Pengguna Massal", err.message || "Terjadi kesalahan sistem.");
  } finally {
    saving.value = false;
  }
}

function setRole(role: string) {
  selectedRole.value = role;
  currentPage.value = 1;
  fetchUsers();
}

let debounceTimer: any = null;
function debounceFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 300);
}

async function fetchUsers() {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      pageSize: "1000",
    };
    if (selectedRole.value) params.role = selectedRole.value;
    if (searchQuery.value) params.search = searchQuery.value;

    const res = await api.get<{ success: boolean; data: any[] }>("/api/users", params);
    if (res.success && res.data) {
      const seen = new Set<string>();
      let list = res.data.filter((u) => {
        if (!u?.id || seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });
      if (selectedStatus.value) {
        list = list.filter((u) => u.status === selectedStatus.value);
      }
      users.value = list;

      // Update selectedUserForLog if currently open
      if (selectedUserForLog.value) {
        const fresh = list.find((u) => u.id === selectedUserForLog.value.id);
        if (fresh) {
          selectedUserForLog.value = fresh;
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch users:", err);
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
    role: selectedRole.value || "PARTICIPANT",
    password: "",
    status: "ACTIVE",
  };
  showFormModal.value = true;
}

function openEditModal(u: any) {
  isEditing.value = true;
  form.value = {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    password: "",
    status: u.status || "ACTIVE",
  };
  showFormModal.value = true;
}

async function submitForm() {
  saving.value = true;
  try {
    if (isEditing.value) {
      const payload: any = {
        fullName: form.value.fullName,
        status: form.value.status,
      };
      if (form.value.password) payload.password = form.value.password;
      await api.put(`/api/users/${form.value.id}`, payload);
      toast.success("Pengguna Diperbarui!", `Data @${form.value.username} berhasil disimpan.`);
    } else {
      await api.post("/api/users", {
        username: form.value.username,
        fullName: form.value.fullName,
        role: form.value.role,
        password: form.value.password || "genius2026",
        status: form.value.status,
      });
      toast.success("Pengguna Dibuat!", `Akun @${form.value.username} berhasil didaftarkan.`);
    }
    showFormModal.value = false;
    await fetchUsers();
  } catch (err: any) {
    toast.error("Gagal Menyimpan", err.data?.error?.message || err.message || "Gagal menyimpan pengguna.");
  } finally {
    saving.value = false;
  }
}

async function openResetPasswordModal(u: any) {
  const confirmed = await confirmModal.show({
    title: "Reset Password Pengguna?",
    description: `Reset password untuk ${u.fullName} (@${u.username}) ke default 'genius2026'? Pengguna harus menggunakan password baru ini untuk login.`,
    confirmText: "Ya, Reset Password",
    cancelText: "Batal",
    variant: "warning",
    icon: "shield",
  });
  if (!confirmed) return;

  try {
    await api.post(`/api/users/${u.id}/reset-password`, { password: "genius2026" });
    toast.success("Password Di-reset!", `Password untuk @${u.username} berhasil di-reset ke: genius2026`);
  } catch (err: any) {
    toast.error("Gagal Reset Password", err.message || "Terjadi kesalahan sistem.");
  }
}

async function confirmDelete(u: any) {
  const confirmed = await confirmModal.show({
    title: "Hapus Pengguna?",
    description: `Apakah Anda yakin ingin menghapus akun ${u.fullName} (@${u.username})? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: "Ya, Hapus Akun",
    cancelText: "Batal",
    variant: "danger",
    icon: "trash",
  });
  if (!confirmed) return;

  try {
    await api.del(`/api/users/${u.id}`);
    toast.success("Pengguna Dihapus", `Akun @${u.username} berhasil dihapus.`);
    await fetchUsers();
  } catch (err: any) {
    toast.error("Gagal Menghapus", err.message || "Terjadi kesalahan saat menghapus pengguna.");
  }
}

// -------------------------------------------------------------
// QR SCANNER & MODAL LOGIC (Presensi & Point Awarding)
// -------------------------------------------------------------
const showQrModal = ref(false);
const showValidModal = ref(false);
const showInvalidModal = ref(false);
const showPointLogModal = ref(false);

const activeSession = ref<any>(null);
const scannerTab = ref<"camera" | "manual">("manual");
const scanActionMode = ref<"ATTENDANCE" | "CUSTOM_XP">("ATTENDANCE");
const scanTargetUserId = ref("");
const qrManualInput = ref("");
const customXpAmount = ref(50);
const customXpReason = ref("Apresiasi Keaktifan Mahasiswa");
const processingQr = ref(false);

const videoRef = ref<HTMLVideoElement | null>(null);
const cameraStream = ref<MediaStream | null>(null);
const cameraError = ref<string | null>(null);
let cameraScanInterval: any = null;
const qrInputRef = ref<HTMLInputElement | null>(null);

const samplePresets = [
  { label: "Maba 1 (peserta_1)", value: "peserta_1" },
  { label: "Maba 2 (peserta_2)", value: "peserta_2" },
  { label: "Maba 3 (peserta_3)", value: "peserta_3" },
  { label: "Maba 4 (peserta_4)", value: "peserta_4" },
];

const validModalData = ref({
  participantName: "",
  username: "",
  sessionTitle: "",
  checkInStatus: "",
  xpAwarded: 0,
  totalXp: 0,
  date: "",
  time: "",
  message: "",
});

const invalidModalData = ref({
  message: "",
  code: "",
  scannedToken: "",
  dateTime: "",
});

// Point Log Modal State
const selectedUserForLog = ref<any>(null);
const userPointLogs = ref<any[]>([]);
const loadingPointLogs = ref(false);
const quickAwardAmount = ref(50);
const quickAwardReason = ref("");
const savingQuickAward = ref(false);

const selectedUserTotalXp = computed(() => {
  if (!selectedUserForLog.value) return 0;
  if (userPointLogs.value.length > 0) {
    return userPointLogs.value.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }
  return selectedUserForLog.value.totalScore || 0;
});

async function fetchActiveSession() {
  try {
    const res = await api.get<{ success: boolean; data: any }>("/api/attendance/active-session");
    if (res.success && res.data) {
      activeSession.value = res.data;
    } else {
      activeSession.value = null;
    }
  } catch (err) {
    console.error("Failed to fetch active session:", err);
  }
}

async function openQrModal(preselectedUser?: any) {
  await fetchActiveSession();
  if (preselectedUser) {
    scanTargetUserId.value = preselectedUser.id;
    qrManualInput.value = preselectedUser.username;
    scannerTab.value = "manual";
  } else {
    scanTargetUserId.value = "";
    qrManualInput.value = "";
  }
  showQrModal.value = true;
  nextTick(() => {
    if (scannerTab.value === "camera") {
      startCamera();
    } else if (qrInputRef.value) {
      qrInputRef.value.focus();
    }
  });
}

function openQuickPresensiModal(user: any) {
  openQrModal(user);
}

function handleQrModalChange(val: boolean) {
  if (!val) {
    closeQrModal();
  } else {
    showQrModal.value = true;
  }
}

function closeQrModal() {
  stopCamera();
  showQrModal.value = false;
  processingQr.value = false;
}

function switchScannerTab(tab: "camera" | "manual") {
  scannerTab.value = tab;
  if (tab === "camera") {
    startCamera();
  } else {
    stopCamera();
    nextTick(() => {
      qrInputRef.value?.focus();
    });
  }
}

function applyPreset(val: string) {
  qrManualInput.value = val;
}

async function startCamera() {
  cameraError.value = null;
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    cameraError.value = "Peramban web tidak mendukung akses kamera langsung. Silakan gunakan input manual.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });

    cameraStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.setAttribute("playsinline", "true");
      await videoRef.value.play();
      startBarcodeDetection();
    }
  } catch (err: any) {
    console.warn("Camera start failed:", err);
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      cameraError.value = "Izin kamera ditolak. Silakan izinkan kamera di browser atau gunakan input manual.";
    } else {
      cameraError.value = "Kamera tidak terdeteksi atau sedang digunakan aplikasi lain.";
    }
  }
}

function stopCamera() {
  if (cameraScanInterval) {
    clearInterval(cameraScanInterval);
    cameraScanInterval = null;
  }
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
}

function startBarcodeDetection() {
  if (typeof window === "undefined") return;
  const BarcodeDetectorAPI = (window as any).BarcodeDetector;
  if (!BarcodeDetectorAPI) {
    return;
  }

  try {
    const detector = new BarcodeDetectorAPI({ formats: ["qr_code", "code_128", "ean_13"] });
    cameraScanInterval = setInterval(async () => {
      if (!videoRef.value || processingQr.value) return;
      try {
        const barcodes = await detector.detect(videoRef.value);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue && rawValue.trim()) {
            clearInterval(cameraScanInterval);
            processScannedCode(rawValue.trim());
          }
        }
      } catch {
        // Ignore single frame error
      }
    }, 500);
  } catch (err) {
    console.warn("BarcodeDetector error:", err);
  }
}

async function submitManualScan() {
  const token = (qrManualInput.value || "").trim();
  const targetId = scanTargetUserId.value;

  if (!token && !targetId) {
    toast.error("Input Kosong", "Masukkan kode QR, NIM, atau pilih target mahasiswa terlebih dahulu.");
    return;
  }

  const payloadString = token || targetId;
  await processScannedCode(payloadString);
}

async function processScannedCode(scannedString: string) {
  if (processingQr.value) return;
  processingQr.value = true;

  try {
    // Determine participant and token
    let targetParticipant = scanTargetUserId.value;
    let targetToken = scannedString;

    // Cek apakah string yang dipindai adalah JSON
    if (scannedString.startsWith("{") && scannedString.endsWith("}")) {
      try {
        const parsed = JSON.parse(scannedString);
        if (parsed.participantId || parsed.userId || parsed.nim || parsed.username) {
          targetParticipant = parsed.participantId || parsed.userId || parsed.nim || parsed.username;
        }
        if (parsed.qrToken || parsed.token) {
          targetToken = parsed.qrToken || parsed.token;
        }
      } catch {
        // ignore json error
      }
    }

    // Jika mode adalah CUSTOM_XP (Beri Poin Langsung):
    if (scanActionMode.value === "CUSTOM_XP") {
      const participantIdToAward = targetParticipant || scannedString;
      const res = await api.post<{ success: boolean; message: string; data: any }>("/api/scores/award", {
        participantId: participantIdToAward,
        amount: Number(customXpAmount.value) || 50,
        reason: customXpReason.value || "Bonus Poin Admin",
        sourceType: "BONUS",
      });

      if (res.success && res.data) {
        closeQrModal();
        const now = new Date();
        validModalData.value = {
          participantName: res.data.participantName || "Mahasiswa",
          username: res.data.username || "-",
          sessionTitle: "Bonus Poin Admin Langsung",
          checkInStatus: "BONUS",
          xpAwarded: res.data.amount,
          totalXp: res.data.totalXp,
          date: formatDateFullIndonesian(now),
          time: formatTimeOnly(now) + " WIB",
          message: res.message,
        };
        showValidModal.value = true;
        await fetchUsers();
      }
      return;
    }

    // Mode ATTENDANCE: Hit /api/attendance/scan
    // Jika targetParticipant belum terisi tapi scannedString mirip NIM/username (bukan format token 'UNU-PRESENSI-...')
    if (!targetParticipant) {
      if (
        !scannedString.startsWith("UNU-PRESENSI") &&
        !scannedString.startsWith("QR-PRESENSI") &&
        !scannedString.includes("TOKEN")
      ) {
        targetParticipant = scannedString;
        targetToken = activeSession.value?.qrToken || "";
      }
    }

    const payload: any = {};
    if (targetParticipant) payload.participantId = targetParticipant;
    if (targetToken) payload.qrToken = targetToken;

    const res = await api.post<{ success: boolean; message: string; data: any }>("/api/attendance/scan", payload);

    if (res.success && res.data) {
      closeQrModal();
      const p = res.data.participant;
      const s = res.data.session;
      const now = new Date();
      validModalData.value = {
        participantName: p?.fullName || "Mahasiswa Peserta",
        username: p?.username || "-",
        sessionTitle: s?.title || "Presensi Mahasiswa",
        checkInStatus: res.data.checkInStatus || "ON_TIME",
        xpAwarded: res.data.xpAwarded || 0,
        totalXp: res.data.totalXp || 0,
        date: formatDateFullIndonesian(now),
        time: formatTimeOnly(now) + " WIB",
        message: res.message,
      };
      showValidModal.value = true;
      await fetchUsers();
    }
  } catch (err: any) {
    console.warn("Scan failed with error:", err);
    closeQrModal();
    const errorObj = err.data?.error || err.error || {};
    const now = new Date();
    invalidModalData.value = {
      message: errorObj.message || err.message || "Kode QR tidak valid atau gagal diproses.",
      code: errorObj.code || "SCAN_ERROR",
      scannedToken: scannedString,
      dateTime: `${formatDateWithYear(now)}, ${formatTimeOnly(now)} WIB`,
    };
    showInvalidModal.value = true;
  } finally {
    processingQr.value = false;
  }
}

function scanNextFromValid() {
  showValidModal.value = false;
  openQrModal();
}

function openLogFromValid() {
  showValidModal.value = false;
  // Cari user berdasarkan username
  const found = users.value.find(
    (u) => u.username === validModalData.value.username || u.fullName === validModalData.value.participantName
  );
  if (found) {
    openPointLogModal(found);
  } else {
    toast.info("Pengguna", "Membuka riwayat log poin...");
  }
}

function retryScanFromInvalid() {
  showInvalidModal.value = false;
  openQrModal();
}

// -------------------------------------------------------------
// POINT LOG MODAL LOGIC
// -------------------------------------------------------------
async function openPointLogModal(user: any) {
  selectedUserForLog.value = user;
  quickAwardAmount.value = 50;
  quickAwardReason.value = "Bonus Keaktifan PKKMB 2026";
  showPointLogModal.value = true;
  await fetchPointLogs(user.id);
}

async function fetchPointLogs(participantId: string) {
  loadingPointLogs.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/scores/transactions", {
      participantId,
      pageSize: "100",
    });
    if (res.success && res.data) {
      userPointLogs.value = res.data;
    } else {
      userPointLogs.value = [];
    }
  } catch (err) {
    console.error("Failed to fetch point logs:", err);
    userPointLogs.value = [];
  } finally {
    loadingPointLogs.value = false;
  }
}

async function submitQuickAward() {
  if (!selectedUserForLog.value) return;
  savingQuickAward.value = true;
  try {
    const res = await api.post<{ success: boolean; message: string; data: any }>("/api/scores/award", {
      participantId: selectedUserForLog.value.id,
      amount: Number(quickAwardAmount.value) || 50,
      reason: quickAwardReason.value || "Bonus Poin Admin",
      sourceType: "BONUS",
    });

    if (res.success) {
      toast.success("Poin Diberikan!", `+${quickAwardAmount.value} XP berhasil diberikan ke ${selectedUserForLog.value.fullName}!`);
      quickAwardReason.value = "";
      await fetchPointLogs(selectedUserForLog.value.id);
      await fetchUsers();
    }
  } catch (err: any) {
    toast.error("Gagal Memberikan Poin", err.data?.error?.message || err.message || "Terjadi kesalahan.");
  } finally {
    savingQuickAward.value = false;
  }
}

// -------------------------------------------------------------
// FORMATTING UTILITIES
// -------------------------------------------------------------
function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateWithYear(iso: string | Date | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateFullIndonesian(iso: string | Date | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTimeOnly(iso: string | Date | null | undefined) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

onMounted(() => {
  fetchUsers();
  fetchActiveSession();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>
