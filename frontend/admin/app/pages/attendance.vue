<template>
  <div class="flex-1 flex flex-col min-h-0 select-none font-mono">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#1e293b] text-[#38bdf8] border-[#0284c7] flex items-center gap-1.5 hover:bg-[#0369a1] hover:text-white cursor-pointer"
        @click="showSessionModal = true"
        title="Buka / Atur Sesi Presensi"
      >
        <Sliders class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">KELOLA SESI</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308] cursor-pointer"
        @click="openQrProjector"
        title="Tampilkan QR Gerbang Live Sesi Aktif (Rotasi 5 Menit)"
      >
        <Tv class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">QR GERBANG LIVE (5M)</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] flex items-center gap-1.5 hover:bg-[#1f3822] cursor-pointer"
        @click="exportAttendanceCsv"
        title="Export Data Presensi"
      >
        <Download class="h-3.5 w-3.5 text-[#4ade80]" />
        <span class="hidden sm:inline">EXPORT REKAP (CSV)</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] cursor-pointer"
        @click="loadData"
        :disabled="loading"
        title="Refresh Data"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- Subtitle / Info Header -->
    <div class="px-4 md:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#4a3624]/60 text-xs text-muted-foreground bg-[#15100c] shrink-0">
      <div>
        <h1 class="font-pixel text-xs sm:text-sm text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-2">
          <CalendarCheck class="h-4 w-4 text-[#facc15]" />
          <span>SISTEM PRESENSI GERBANG FLEKSIBEL (SESI AKTIF)</span>
        </h1>
        <p class="text-[11px] text-gray-400 mt-0.5">
          Kontrol buka/tutup presensi gerbang, auto-generate QR Check-In / Check-Out, verifikasi ketepatan waktu, dan reward XP.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="activeSession"
          class="border border-emerald-500/50 bg-[#132215] px-2.5 py-1 text-[10px] font-pixel text-emerald-400 flex items-center gap-1.5"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          GERBANG BUKA: {{ activeSession.title }} ({{ activeSession.type }})
        </span>
        <span
          v-else
          class="border border-red-800 bg-[#2b1616] px-2.5 py-1 text-[10px] font-pixel text-red-400 flex items-center gap-1.5"
        >
          <span class="h-2 w-2 rounded-full bg-red-400"></span>
          GERBANG DITUTUP (TIDAK ADA SESI AKTIF)
        </span>
      </div>
    </div>

    <!-- 1. HERO COMMAND CARD: Active Session Control Banner -->
    <div class="px-4 md:px-6 py-3 border-b border-[#3d2a1b] bg-[#100b07] shrink-0">
      <div
        v-if="activeSession"
        class="relative overflow-hidden p-3.5 sm:p-4 rounded border-2 border-[#ca8a04] bg-gradient-to-r from-[#22160d] via-[#2d1b0e] to-[#1e130a] shadow-[0_0_20px_rgba(202,138,4,0.15)] flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <!-- Left Side: Session Details -->
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-0.5 text-[9px] font-pixel bg-emerald-950/80 border border-emerald-500 text-emerald-400 font-bold flex items-center gap-1 rounded">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              SESI AKTIF SAAT INI
            </span>
            <span
              :class="[
                'px-2 py-0.5 text-[9px] font-pixel rounded border font-bold flex items-center gap-1',
                activeSession.type === 'CHECK_IN'
                  ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300'
                  : 'bg-sky-900/60 border-sky-400 text-sky-300'
              ]"
            >
              <CheckCircle2 v-if="activeSession.type === 'CHECK_IN'" class="h-3 w-3" />
              <LogOut v-else class="h-3 w-3" />
              {{ activeSession.type === 'CHECK_IN' ? 'CHECK-IN (PRESENSI MASUK)' : 'CHECK-OUT (PRESENSI PULANG)' }}
            </span>
            <span class="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#ca8a04]/20 border border-[#facc15] text-[#facc15] rounded">
              +{{ activeSession.xpReward }} XP
            </span>
          </div>

          <h2 class="font-pixel text-sm sm:text-base text-[#facc15] font-bold tracking-wide truncate">
            {{ activeSession.title }}
          </h2>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-300 font-sans">
            <span class="flex items-center gap-1">
              <Clock class="h-3.5 w-3.5 text-[#f59e0b]" />
              <span v-if="activeSession.allowLate">Batas Tepat Waktu: <strong>&le; {{ activeSession.lateTime || '07:30' }} WIB</strong></span>
              <span v-else>Wajib Tepat Waktu (Tanpa Toleransi)</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="text-gray-400">Token Dasar:</span>
              <code class="px-1.5 py-0.2 bg-black/40 border border-[#523e2b] rounded font-mono text-[10px] text-[#facc15] font-bold">
                {{ activeSession.qrToken }}
              </code>
            </span>
          </div>
        </div>

        <!-- Right Side: Command Buttons -->
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            class="pixel-btn h-8 px-3.5 text-xs font-mono font-bold bg-[#ca8a04] text-black border-[#facc15] hover:bg-[#eab308] flex items-center gap-1.5 shadow"
            @click="openQrProjector"
            title="Tampilkan QR Layar Penuh untuk Proyektor"
          >
            <Tv class="h-4 w-4" />
            <span>TAMPILKAN QR LIVE</span>
          </button>

          <button
            class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#3f1616] text-red-300 border-red-700 hover:bg-red-800 hover:text-white flex items-center gap-1.5"
            @click="deactivateCurrentSession"
            title="Tutup gerbang presensi"
          >
            <X class="h-3.5 w-3.5" />
            <span>TUTUP GERBANG</span>
          </button>

          <button
            class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#1e150e] text-[#facc15] border-[#523e2b] hover:bg-[#2b1f15] flex items-center gap-1.5"
            @click="showSessionModal = true"
            title="Ganti atau buat sesi lain"
          >
            <Sliders class="h-3.5 w-3.5" />
            <span>GANTI SESI</span>
          </button>
        </div>
      </div>

      <!-- Inactive Gate State Card -->
      <div
        v-else
        class="p-3.5 sm:p-4 rounded border-2 border-red-900/80 bg-gradient-to-r from-[#200e0e] to-[#180a0a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-[9px] font-pixel bg-red-950 border border-red-700 text-red-400 font-bold rounded">
              GERBANG DITUTUP
            </span>
            <span class="text-xs text-red-300 font-bold font-pixel">Tidak Ada Sesi Presensi Aktif</span>
          </div>
          <p class="text-[11px] text-gray-400 font-sans">
            Mahasiswa saat ini tidak dapat memindai QR. Buka atau buat sesi presensi (Check-In pagi atau Check-Out sore) untuk membuka gerbang.
          </p>
        </div>

        <button
          class="pixel-btn h-8 px-4 text-xs font-mono font-bold bg-[#166534] text-[#86efac] border-[#22c55e] hover:bg-[#22c55e] hover:text-black flex items-center gap-1.5 shrink-0 shadow"
          @click="showSessionModal = true"
        >
          <Plus class="h-4 w-4" />
          <span>BUKA SESI PRESENSI</span>
        </button>
      </div>
    </div>

    <!-- 2. Session Selector & Metrics HUD Section -->
    <div class="px-4 md:px-6 py-2.5 space-y-2.5 border-b border-[#3d2a1b] bg-[#120d09] shrink-0">
      <!-- Session Selector Dropdown Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#19110b] p-2 border border-[#4a3624] rounded">
        <div class="flex items-center gap-2 text-xs">
          <Layers class="h-4 w-4 text-[#f59e0b]" />
          <span class="font-bold text-[#facc15]">REKAPITULASI SESI:</span>
          <select
            v-model="selectedSessionId"
            @change="onSessionFilterChange"
            class="h-7 bg-[#24170e] border border-[#ca8a04]/50 px-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-[#facc15] rounded"
          >
            <option v-for="s in allSessions" :key="s.id" :value="s.id">
              {{ s.isActive ? '🟢 [AKTIF] ' : '' }}{{ s.title }} ({{ s.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out' }} • +{{ s.xpReward }} XP)
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2 text-[11px] text-gray-400">
          <span>Menampilkan rekap presensi untuk sesi terpilih di atas.</span>
        </div>
      </div>

      <!-- Metrics HUD Stat Cards (Non-Redundant) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="p-2 border border-[#523e2b] bg-[#1a140f] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-gray-400 uppercase block">TOTAL MAHASISWA</span>
            <span class="font-pixel text-base text-foreground font-bold">{{ filteredList.length }}</span>
          </div>
          <span class="text-[10px] text-muted-foreground">Maba</span>
        </div>

        <div class="p-2 border border-[#16a34a] bg-[#132215] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-[#4ade80] uppercase block">TEPAT WAKTU</span>
            <span class="font-pixel text-base text-[#4ade80] font-bold">{{ metrics.onTimeCount }}</span>
          </div>
          <span class="text-[9px] text-[#86efac]">On-Time</span>
        </div>

        <div class="p-2 border border-[#ca8a04] bg-[#221a0f] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-[#facc15] uppercase block">TERLAMBAT</span>
            <span class="font-pixel text-base text-[#facc15] font-bold">{{ metrics.lateCount }}</span>
          </div>
          <span class="text-[9px] text-[#fde047]">Late</span>
        </div>

        <div class="p-2 border border-red-800 bg-[#201010] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-red-400 uppercase block">BELUM HADIR</span>
            <span class="font-pixel text-base text-red-400 font-bold">{{ metrics.absentCount }}</span>
          </div>
          <span class="text-[9px] text-red-300/80">Belum Ada Log</span>
        </div>
      </div>
    </div>

    <!-- 3. Toolbar Filters (Search & Batch Actions) -->
    <div class="pixel-toolbar-sticky px-4 md:px-6 py-2 border-b border-[#3d2a1b] shrink-0 bg-[#17110c]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f59e0b]" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Nama Mahasiswa atau NIM..."
            class="w-full h-7 pl-8 pr-3 bg-[#1d1611] border border-[#523e2b] text-xs text-foreground focus:outline-none focus:border-[#f59e0b] rounded"
            @input="currentPage = 1"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <!-- Filter Kelompok -->
          <select
            v-model="selectedTeamFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#f59e0b] rounded"
            @change="currentPage = 1"
          >
            <option value="">Semua Kelompok</option>
            <option v-for="team in teamOptions" :key="team" :value="team">
              {{ team }}
            </option>
          </select>

          <!-- Filter Status Kehadiran -->
          <select
            v-model="selectedStatusFilter"
            class="h-7 bg-[#1d1611] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#f59e0b] rounded"
            @change="currentPage = 1"
          >
            <option value="">Semua Status</option>
            <option value="ON_TIME">Tepat Waktu</option>
            <option value="LATE">Terlambat</option>
            <option value="ABSENT">Belum Hadir</option>
          </select>
        </div>
      </div>

      <!-- Batch Actions Bar (Shows when selected) -->
      <div
        v-if="selectedParticipantIds.length > 0"
        class="mt-2 -mx-4 md:-mx-6 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#2a1d14] via-[#352115] to-[#2a1d14] border-t border-[#ca8a04]/50 px-4 md:px-6 py-2 text-xs font-mono text-[#facc15] shadow-inner"
      >
        <div class="flex items-center gap-2">
          <CheckSquare class="h-4 w-4 text-[#f59e0b]" />
          <span class="font-bold">{{ selectedParticipantIds.length }} mahasiswa terpilih</span>
          <span class="text-muted-foreground text-[11px] hidden sm:inline">(dari {{ filteredList.length }})</span>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#166534] text-[#86efac] font-bold border-[#22c55e] hover:bg-[#22c55e] hover:text-[#0f172a] transition-colors rounded"
            @click="batchCheckIn('ON_TIME')"
          >
            Hadir Tepat Waktu
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#78350f] text-[#fef08a] font-bold border-[#92400e] hover:bg-[#92400e] transition-colors rounded"
            @click="batchCheckIn('LATE')"
          >
            Hadir Terlambat
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#0369a1] text-[#e0f2fe] font-bold border-[#38bdf8] hover:bg-[#38bdf8] hover:text-black transition-colors rounded"
            @click="batchCheckOut"
          >
            Check-Out Pulang
          </button>
          <button
            class="pixel-btn h-6 px-2.5 text-[10px] bg-[#450a0a] text-[#f87171] font-bold border-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors rounded"
            @click="batchReset"
          >
            Reset Presensi
          </button>
          <button
            class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
            @click="selectedParticipantIds = []"
          >
            Batal
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Main Table Area: Flush Edge-to-Edge -->
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
            <th class="px-3 py-2.5">MAHASISWA / NIM</th>
            <th class="px-3 py-2.5">KELOMPOK & BUDDY</th>
            <th class="px-3 py-2.5">TANGGAL & JAM PRESENSI</th>
            <th class="px-3 py-2.5 text-center">STATUS KEHADIRAN</th>
            <th class="px-3 py-2.5 text-right">XP DIPEROLEH</th>
            <th class="pr-4 md:pr-6 pl-3 py-2.5 text-center w-16">AKSI</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#3d2d1e]/60 font-mono">
          <tr v-if="loading" class="text-center">
            <td colspan="7" class="p-8 text-muted-foreground">
              <div class="flex items-center justify-center gap-2">
                <RotateCw class="h-4 w-4 animate-spin text-[#f59e0b]" />
                <span>Memuat data presensi sesi terpilih...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="paginatedList.length === 0" class="text-center">
            <td colspan="7" class="p-8 text-muted-foreground">
              Tidak ada data presensi yang sesuai dengan filter.
            </td>
          </tr>

          <tr
            v-for="row in paginatedList"
            :key="row.id"
            :class="['hover:bg-[#271d15]/50 transition-colors', selectedParticipantIds.includes(row.id) ? 'bg-[#3b2716]/30' : '']"
          >
            <!-- Checkbox -->
            <td class="py-2.5 pl-4 md:pl-6 pr-3 text-center">
              <input
                type="checkbox"
                :value="row.id"
                v-model="selectedParticipantIds"
                class="rounded bg-[#1a140f] border-[#523e2b] text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
              />
            </td>

            <!-- Nama & NIM -->
            <td class="px-3 py-2.5">
              <div class="flex items-center gap-2.5">
                <img
                  :src="row.avatarUrl || '/character-cowok-avatar.png'"
                  alt="Avatar"
                  class="h-7 w-7 rounded border border-[#f59e0b] object-cover bg-black/40 shrink-0"
                  style="image-rendering: pixelated;"
                />
                <div>
                  <div class="font-sans font-semibold text-foreground text-xs leading-tight">{{ row.fullName }}</div>
                  <div class="text-[10px] text-muted-foreground mt-0.5">NIM: {{ row.username }}</div>
                </div>
              </div>
            </td>

            <!-- Kelompok -->
            <td class="px-3 py-2.5">
              <div class="font-semibold text-foreground text-xs">{{ row.teamName }}</div>
              <div class="text-[10px] text-muted-foreground">Buddy: {{ row.buddyName }}</div>
            </td>

            <!-- Tanggal & Jam Presensi (Check-in atau Check-out) -->
            <td class="px-3 py-2.5">
              <div v-if="row.attendance.checkInAt">
                <div class="text-[11px] font-semibold text-foreground">
                  {{ formatDate(row.attendance.checkInAt) }}
                </div>
                <div class="text-[#4ade80] font-bold text-xs font-mono flex items-center gap-1">
                  <span>{{ formatTime(row.attendance.checkInAt) }} WIB</span>
                  <span class="text-[9px] text-gray-400 font-normal">(Masuk)</span>
                </div>
              </div>
              <div v-else-if="row.attendance.checkOutAt">
                <div class="text-[11px] font-semibold text-foreground">
                  {{ formatDate(row.attendance.checkOutAt) }}
                </div>
                <div class="text-[#38bdf8] font-bold text-xs font-mono flex items-center gap-1">
                  <span>{{ formatTime(row.attendance.checkOutAt) }} WIB</span>
                  <span class="text-[9px] text-gray-400 font-normal">(Pulang)</span>
                </div>
              </div>
              <div v-else class="text-muted-foreground/40 font-mono text-xs">-</div>
            </td>

            <!-- Status Kehadiran -->
            <td class="px-3 py-2.5 text-center">
              <span
                v-if="row.attendance.status === 'ON_TIME'"
                class="px-2 py-0.5 rounded border border-[#22c55e] bg-[#142612] text-[#86efac] font-pixel text-[9px] inline-flex items-center gap-1"
              >
                <CheckCircle2 class="h-3 w-3 text-[#22c55e]" />
                TEPAT WAKTU
              </span>
              <span
                v-else-if="row.attendance.status === 'LATE'"
                class="px-2 py-0.5 rounded border border-[#eab308] bg-[#2a220d] text-[#fef08a] font-pixel text-[9px] inline-flex items-center gap-1"
              >
                <AlertTriangle class="h-3 w-3 text-[#eab308]" />
                TERLAMBAT
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded border border-gray-700 bg-black/40 text-gray-400 font-pixel text-[9px] inline-flex items-center gap-1"
              >
                BELUM HADIR
              </span>
            </td>

            <!-- XP Presensi -->
            <td class="px-3 py-2.5 text-right font-bold text-[#facc15]">
              +{{ row.attendance.xpAwarded || 0 }} pts
            </td>

            <!-- Aksi Dropdown -->
            <td class="pr-4 md:pr-6 pl-3 py-2.5 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="h-7 w-7 rounded border border-[#523e2b] bg-[#1d1611] text-gray-300 hover:text-white hover:border-[#f59e0b] flex items-center justify-center cursor-pointer transition-colors"
                    title="Menu Aksi Presensi"
                  >
                    <MoreHorizontal class="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48 bg-[#1a140f] border border-[#523e2b] text-xs font-mono text-foreground">
                  <DropdownMenuItem
                    v-if="!row.attendance.checkInAt && !row.attendance.checkOutAt"
                    @click="openManualCheckInModal(row)"
                    class="cursor-pointer text-[#4ade80] hover:bg-[#271d15] flex items-center gap-2"
                  >
                    <LogIn class="h-3.5 w-3.5" />
                    <span>Tandai Hadir (Manual)</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    v-if="row.attendance.checkInAt && !row.attendance.checkOutAt"
                    @click="singleCheckOut(row)"
                    class="cursor-pointer text-[#38bdf8] hover:bg-[#271d15] flex items-center gap-2"
                  >
                    <LogOut class="h-3.5 w-3.5" />
                    <span>Check-Out Kepulangan</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator class="bg-[#3d2d1e]" />

                  <DropdownMenuItem
                    @click="singleReset(row)"
                    class="cursor-pointer text-red-400 hover:bg-[#3d1818] flex items-center gap-2"
                  >
                    <RotateCcw class="h-3.5 w-3.5" />
                    <span>Reset Data Presensi</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 5. Footer Pagination -->
    <div class="px-4 md:px-6 py-2 border-t border-[#3d2a1b] bg-[#15100c] shrink-0 flex items-center justify-between">
      <div class="text-[11px] text-muted-foreground">
        Menampilkan <strong>{{ paginatedList.length }}</strong> dari <strong>{{ filteredList.length }}</strong> mahasiswa
      </div>
      <PixelPagination
        :current-page="currentPage"
        :total-items="filteredList.length"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
      />
    </div>

    <!-- MODAL 1: KELOLA SESI PRESENSI FLEKSIBEL -->
    <div
      v-if="showSessionModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-in fade-in select-none font-mono"
      @click.self="showSessionModal = false"
    >
      <div class="w-full max-w-2xl bg-[#18110b] border-2 border-[#ca8a04] rounded-xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[#4a3624] pb-3 shrink-0">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded bg-[#ca8a04]/20 border border-[#facc15] flex items-center justify-center">
              <Sliders class="h-4 w-4 text-[#facc15]" />
            </div>
            <div>
              <h3 class="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
                MANAJEMEN SESI PRESENSI AKTIF
              </h3>
              <p class="text-[11px] text-gray-400 font-sans">
                Atur sesi mana yang saat ini dibuka untuk generate QR gerbang (Check-In atau Check-Out).
              </p>
            </div>
          </div>
          <button
            @click="showSessionModal = false"
            class="h-7 w-7 rounded bg-[#2d1b0e] border border-[#5a3a18] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Quick Templates Bar -->
        <div class="p-3 bg-[#120c08] border border-[#4a3624] rounded-lg shrink-0 space-y-2">
          <span class="text-[10px] font-pixel text-[#facc15] block uppercase">TEMPLATE CEPAT PEMBUATAN SESI:</span>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-2.5 py-1 text-[10px] bg-[#162518] border border-[#16a34a] text-[#86efac] font-pixel rounded hover:bg-[#22c55e] hover:text-black transition-all flex items-center gap-1 cursor-pointer"
              @click="applyQuickTemplate('CHECK_IN_PAGI')"
            >
              <Plus class="h-3 w-3" />
              Presensi Masuk Pagi (+100 XP)
            </button>
            <button
              class="px-2.5 py-1 text-[10px] bg-[#0c1a24] border border-[#0284c7] text-[#7dd3fc] font-pixel rounded hover:bg-[#38bdf8] hover:text-black transition-all flex items-center gap-1 cursor-pointer"
              @click="applyQuickTemplate('CHECK_OUT_SORE')"
            >
              <Plus class="h-3 w-3" />
              Presensi Pulang Sore (+50 XP)
            </button>
            <button
              class="px-2.5 py-1 text-[10px] bg-[#271d15] border border-[#ca8a04] text-[#fef08a] font-pixel rounded hover:bg-[#facc15] hover:text-black transition-all flex items-center gap-1 cursor-pointer"
              @click="showCreateForm = !showCreateForm"
            >
              <Sliders class="h-3 w-3" />
              {{ showCreateForm ? 'Tutup Form Kustom' : 'Buat Sesi Kustom...' }}
            </button>
          </div>
        </div>

        <!-- Create Session Form (Expandable) -->
        <div v-if="showCreateForm" class="p-3.5 bg-[#140e0a] border border-[#ca8a04]/50 rounded-lg space-y-3 shrink-0 text-xs">
          <h4 class="font-pixel text-[11px] text-[#facc15] font-bold">BUAT SESI PRESENSI BARU</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="text-[10px] text-gray-400 block mb-0.5">Judul Sesi Presensi *</label>
              <input
                v-model="newSessionForm.title"
                type="text"
                placeholder="misal: Presensi Pagi Gedung Terpadu"
                class="w-full h-7 px-2 bg-[#1d1611] border border-[#523e2b] text-foreground text-xs rounded"
              />
            </div>

            <div>
              <label class="text-[10px] text-gray-400 block mb-0.5">Tipe Sesi *</label>
              <select
                v-model="newSessionForm.type"
                class="w-full h-7 px-2 bg-[#1d1611] border border-[#523e2b] text-foreground text-xs rounded"
              >
                <option value="CHECK_IN">CHECK_IN (Presensi Masuk)</option>
                <option value="CHECK_OUT">CHECK_OUT (Presensi Kepulangan)</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] text-gray-400 block mb-0.5">Hadiah XP Poin *</label>
              <input
                v-model.number="newSessionForm.xpReward"
                type="number"
                class="w-full h-7 px-2 bg-[#1d1611] border border-[#523e2b] text-foreground text-xs rounded"
              />
            </div>

            <div>
              <label class="text-[10px] text-gray-400 block mb-0.5">Batas Jam Tepat Waktu (WIB)</label>
              <input
                v-model="newSessionForm.lateTime"
                type="text"
                placeholder="07:30"
                class="w-full h-7 px-2 bg-[#1d1611] border border-[#523e2b] text-foreground text-xs rounded"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              class="px-3 py-1 text-xs border border-gray-600 text-gray-300 rounded hover:bg-gray-800 cursor-pointer"
              @click="showCreateForm = false"
            >
              Batal
            </button>
            <button
              class="pixel-btn px-4 py-1 text-xs bg-[#ca8a04] text-black font-bold border-[#facc15] hover:bg-[#eab308] rounded cursor-pointer"
              @click="submitCreateSession"
              :disabled="creatingSession"
            >
              Simpan & Buat Sesi
            </button>
          </div>
        </div>

        <!-- Sessions List -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <div
            v-for="s in allSessions"
            :key="s.id"
            :class="[
              'p-3 rounded border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5',
              s.isActive
                ? 'bg-[#1c2419] border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                : 'bg-[#15100c] border-[#4a3624] hover:border-[#8b6f4e]'
            ]"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'px-2 py-0.2 text-[8px] font-pixel rounded border font-bold',
                    s.isActive
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                      : 'bg-gray-800 border-gray-600 text-gray-400'
                  ]"
                >
                  {{ s.isActive ? '🟢 SEDANG AKTIF' : '⚪ TIDAK AKTIF' }}
                </span>

                <span
                  :class="[
                    'px-2 py-0.2 text-[8px] font-pixel rounded border font-bold',
                    s.type === 'CHECK_IN'
                      ? 'bg-emerald-900/50 border-emerald-500/70 text-emerald-400'
                      : 'bg-sky-900/50 border-sky-500/70 text-sky-400'
                  ]"
                >
                  {{ s.type === 'CHECK_IN' ? 'CHECK-IN' : 'CHECK-OUT' }}
                </span>

                <span class="text-[10px] text-[#facc15] font-mono font-bold">+{{ s.xpReward }} XP</span>
              </div>

              <div class="font-bold text-foreground text-xs truncate">{{ s.title }}</div>
              <div class="text-[10px] text-gray-400 flex flex-wrap gap-x-3">
                <span>Token: <code class="text-[#facc15]">{{ s.qrToken }}</code></span>
                <span v-if="s.allowLate">Toleransi: &le; {{ s.lateTime || '07:30' }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="!s.isActive"
                class="pixel-btn h-7 px-3 text-[10px] bg-[#166534] text-[#86efac] border-[#22c55e] hover:bg-[#22c55e] hover:text-black font-pixel font-bold rounded cursor-pointer"
                @click="activateSession(s)"
              >
                AKTIFKAN SEKARANG
              </button>

              <button
                v-else
                class="pixel-btn h-7 px-3 text-[10px] bg-[#450a0a] text-red-300 border-red-700 hover:bg-red-800 hover:text-white font-pixel font-bold rounded cursor-pointer"
                @click="deactivateSession(s)"
              >
                NONAKTIFKAN
              </button>

              <button
                class="h-7 w-7 rounded bg-[#271d15] border border-[#523e2b] text-gray-400 hover:text-red-400 flex items-center justify-center cursor-pointer"
                @click="deleteSession(s)"
                title="Hapus Sesi"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div class="text-right pt-2 border-t border-[#4a3624] shrink-0">
          <button
            class="pixel-btn h-8 px-4 bg-[#ca8a04] text-black font-pixel text-xs font-bold rounded cursor-pointer hover:bg-[#eab308]"
            @click="showSessionModal = false"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: DETAIL HASIL REFLEKSI -->
    <div
      v-if="activeReflectionRow"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none font-mono"
    >
      <div class="w-full max-w-lg bg-[#1a140f] border-2 border-[#0284c7] rounded-xl p-5 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#4a3624] pb-2.5">
          <div>
            <h3 class="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
              HASIL REFLEKSI MAHASISWA
            </h3>
            <p class="text-[11px] text-gray-400 font-sans">
              {{ activeReflectionRow.fullName }} (NIM: {{ activeReflectionRow.username }})
            </p>
          </div>
          <button
            @click="activeReflectionRow = null"
            class="h-7 w-7 rounded bg-[#2d1b0e] border border-[#5a3a18] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2.5 text-xs text-center">
          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded">
            <span class="text-[9px] text-gray-400 block">Fasilitas Kampus:</span>
            <span class="font-pixel text-sm text-[#facc15]">★ {{ activeReflectionRow.attendance.reflection?.ratingFasilitas }} / 5</span>
          </div>
          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded">
            <span class="text-[9px] text-gray-400 block">Materi & Nilai:</span>
            <span class="font-pixel text-sm text-[#facc15]">★ {{ activeReflectionRow.attendance.reflection?.ratingMateri }} / 5</span>
          </div>
          <div class="p-2.5 bg-black/40 border border-[#523e2b] rounded">
            <span class="text-[9px] text-gray-400 block">Peran Buddy:</span>
            <span class="font-pixel text-sm text-[#facc15]">★ {{ activeReflectionRow.attendance.reflection?.ratingBuddy }} / 5</span>
          </div>
        </div>

        <div class="space-y-1">
          <span class="text-[10px] font-pixel text-gray-400 uppercase">Esai Refleksi & Pembelajaran:</span>
          <div class="p-3 bg-[#130d08] border border-[#4a301a] rounded text-xs text-[#e0c090] italic font-sans leading-relaxed">
            "{{ activeReflectionRow.attendance.reflection?.essayInsight || 'Tidak ada catatan esai.' }}"
          </div>
        </div>

        <div class="text-right">
          <button
            @click="activeReflectionRow = null"
            class="pixel-btn h-8 px-4 bg-[#ca8a04] text-black font-pixel text-xs font-bold rounded cursor-pointer hover:bg-[#eab308]"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: BUDDY MANUAL CHECK-IN OVERRIDE -->
    <div
      v-if="manualCheckInTarget"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none font-mono"
    >
      <div class="w-full max-w-md bg-[#1a140f] border-2 border-[#16a34a] rounded-xl p-5 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#4a3624] pb-2">
          <h3 class="font-pixel text-xs sm:text-sm text-[#4ade80] font-bold">
            TANDAI HADIR MANUAL (PANITIA/BUDDY)
          </h3>
          <button
            @click="manualCheckInTarget = null"
            class="h-7 w-7 rounded bg-[#2d1b0e] border border-[#5a3a18] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="text-xs space-y-2">
          <p class="text-gray-300 font-sans">
            Anda akan menandai kehadiran manual pada sesi aktif untuk:
          </p>
          <div class="bg-black/40 border border-[#523e2b] p-3 rounded space-y-0.5">
            <div class="font-bold text-[#facc15] font-sans">{{ manualCheckInTarget.fullName }}</div>
            <div class="text-[11px] text-gray-400">NIM: {{ manualCheckInTarget.username }} • {{ manualCheckInTarget.teamName }}</div>
          </div>
        </div>

        <div class="space-y-1 text-xs">
          <label class="text-gray-300 text-[11px] block">Alasan Kehadiran Manual *</label>
          <select
            v-model="manualReason"
            class="w-full h-8 px-2 bg-[#1d1611] border border-[#523e2b] text-foreground focus:outline-none focus:border-[#4ade80] rounded"
          >
            <option value="Kamera HP Mahasiswa Rusak">Kamera HP Mahasiswa Rusak</option>
            <option value="Baterai Smartphone Habis">Baterai Smartphone Habis</option>
            <option value="Kendala Jaringan / Kuota Habis">Kendala Jaringan / Kuota Habis</option>
            <option value="Dispensasi Panitia Acara">Dispensasi Panitia Acara</option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="manualCheckInTarget = null"
            class="pixel-btn h-8 px-3 border border-[#523e2b] text-gray-400 text-xs font-pixel cursor-pointer rounded"
          >
            BATAL
          </button>
          <button
            @click="confirmManualCheckIn"
            class="pixel-btn h-8 px-4 bg-[#16a34a] hover:bg-[#22c55e] text-black font-pixel text-xs font-bold rounded cursor-pointer"
          >
            KONFIRMASI HADIR (+{{ activeSession?.xpReward || 100 }} XP)
          </button>
        </div>
      </div>
    </div>

    <!-- Live Gate Projector Modal (Bound to Active Session) -->
    <GateProjectorModal
      v-model="showGateProjectorModal"
      :active-session="activeSession"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  CalendarCheck,
  Clock,
  Search,
  Download,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Star,
  X,
  CheckSquare,
  MoreHorizontal,
  LogIn,
  LogOut,
  RotateCcw,
  Tv,
  Sliders,
  Plus,
  Layers,
  Trash2,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import PixelPagination from "@/components/PixelPagination.vue";
import GateProjectorModal from "@/components/qr/GateProjectorModal.vue";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";

const api = useApi();
const toast = useToast();
const confirmModal = useConfirm();

// Session Management State
export interface AttendanceSessionItem {
  id: string;
  title: string;
  description?: string;
  type: "CHECK_IN" | "CHECK_OUT";
  isActive: boolean;
  qrToken: string;
  xpReward: number;
  allowLate: boolean;
  lateTime?: string;
  createdAt: string;
  updatedAt?: string;
}

const activeSession = ref<AttendanceSessionItem | null>(null);
const allSessions = ref<AttendanceSessionItem[]>([]);
const selectedSessionId = ref<string>("");
const showSessionModal = ref(false);
const showCreateForm = ref(false);
const creatingSession = ref(false);

const newSessionForm = ref({
  title: "",
  type: "CHECK_IN" as "CHECK_IN" | "CHECK_OUT",
  xpReward: 100,
  lateTime: "07:30",
});

const searchQuery = ref("");
const selectedTeamFilter = ref("");
const selectedStatusFilter = ref("");
const loading = ref(false);
const showGateProjectorModal = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const selectedParticipantIds = ref<string[]>([]);

// Modals
const activeReflectionRow = ref<ParticipantAttendanceRow | null>(null);
const manualCheckInTarget = ref<ParticipantAttendanceRow | null>(null);
const manualReason = ref("Kamera HP Mahasiswa Rusak");

interface ParticipantAttendanceRow {
  id: string;
  fullName: string;
  username: string;
  prodi?: string;
  avatarUrl?: string;
  teamName: string;
  buddyName: string;
  attendance: {
    checkInAt: string | null;
    status: "ON_TIME" | "LATE" | "ABSENT";
    checkOutAt: string | null;
    xpAwarded: number;
    reflection?: {
      ratingFasilitas: number;
      ratingMateri: number;
      ratingBuddy: number;
      essayInsight: string;
    } | null;
  };
}

const participantsList = ref<ParticipantAttendanceRow[]>([]);

const teamOptions = computed(() => {
  const set = new Set(participantsList.value.map((p) => p.teamName));
  return Array.from(set);
});

// Load real attendance data & sessions from Backend REST API
const loadData = async () => {
  loading.value = true;
  try {
    const [recapRes, usersRes]: any = await Promise.allSettled([
      api.get("/api/attendance/recap", {
        sessionId: selectedSessionId.value || undefined,
      }),
      api.get("/api/users", { role: "PARTICIPANT", pageSize: "200" }),
    ]);

    if (recapRes.status === "fulfilled" && recapRes.value?.success) {
      activeSession.value = recapRes.value.data?.activeSession || null;
      allSessions.value = recapRes.value.data?.sessions || [];
      if (!selectedSessionId.value && activeSession.value) {
        selectedSessionId.value = activeSession.value.id;
      }
    }

    const attendeeMap = new Map<string, any>();
    if (recapRes.status === "fulfilled" && recapRes.value?.success && Array.isArray(recapRes.value.data?.attendees)) {
      recapRes.value.data.attendees.forEach((a: any) => {
        attendeeMap.set(a.participantId || a.username, a);
      });
    }

    const participants: ParticipantAttendanceRow[] = [];
    const seen = new Set<string>();
    if (usersRes.status === "fulfilled" && usersRes.value?.success && Array.isArray(usersRes.value.data)) {
      usersRes.value.data.forEach((u: any) => {
        if (!u?.id || seen.has(u.id)) return;
        seen.add(u.id);
        const att = attendeeMap.get(u.id) || attendeeMap.get(u.username);
        participants.push({
          id: u.id,
          fullName: u.fullName,
          username: u.username,
          prodi: u.prodi || "UNU Yogyakarta",
          avatarUrl: u.avatarUrl || (u.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png"),
          teamName: u.teamName || "Belum Ada Regu",
          buddyName: u.buddyName || "Game Master",
          attendance: {
            checkInAt: att?.checkInAt || null,
            status: att?.checkInStatus || (att?.checkInAt || att?.checkOutAt ? "ON_TIME" : "ABSENT"),
            checkOutAt: att?.checkOutAt || null,
            xpAwarded: att?.xpAwarded || 0,
            reflection: att?.reflection || null,
          },
        });
      });
    }

    participantsList.value = participants;
  } catch (err) {
    console.error("Gagal memuat data presensi dari server:", err);
  } finally {
    loading.value = false;
  }
};

function onSessionFilterChange() {
  currentPage.value = 1;
  selectedParticipantIds.value = [];
  loadData();
}

const openQrProjector = () => {
  if (!activeSession.value) {
    toast.warning("Tidak Ada Sesi Aktif", "Aktifkan atau buat sesi presensi terlebih dahulu.");
    showSessionModal.value = true;
    return;
  }
  showGateProjectorModal.value = true;
};

// Session Controller Functions
const activateSession = async (session: AttendanceSessionItem) => {
  try {
    const res: any = await api.put(`/api/attendance/sessions/${session.id}/activate`, {});
    toast.success("Sesi Diaktifkan!", `Sesi "${session.title}" kini aktif untuk generate QR.`);
    selectedSessionId.value = session.id;
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Mengaktifkan Sesi", err.message || "Terjadi kesalahan.");
  }
};

const deactivateSession = async (session: AttendanceSessionItem) => {
  try {
    await api.put(`/api/attendance/sessions/${session.id}/deactivate`, {});
    toast.info("Gerbang Ditutup", `Sesi "${session.title}" telah dinonaktifkan.`);
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Menonaktifkan Sesi", err.message || "Terjadi kesalahan.");
  }
};

const deactivateCurrentSession = async () => {
  if (!activeSession.value) return;
  await deactivateSession(activeSession.value);
};

const deleteSession = async (session: AttendanceSessionItem) => {
  const confirmed = await confirmModal.show({
    title: `Hapus Sesi "${session.title}"?`,
    description: "Sesi presensi ini akan dihapus dari daftar sistem.",
    confirmText: "Ya, Hapus",
    cancelText: "Batal",
    variant: "danger",
    icon: "shield",
  });
  if (!confirmed) return;

  try {
    await api.delete(`/api/attendance/sessions/${session.id}`);
    toast.success("Sesi Dihapus", "Sesi presensi berhasil dihapus.");
    if (selectedSessionId.value === session.id) {
      selectedSessionId.value = "";
    }
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Menghapus Sesi", err.message || "Terjadi kesalahan.");
  }
};

const applyQuickTemplate = async (template: "CHECK_IN_PAGI" | "CHECK_OUT_SORE") => {
  if (template === "CHECK_IN_PAGI") {
    newSessionForm.value = {
      title: "Presensi Masuk Pagi",
      type: "CHECK_IN",
      xpReward: 100,
      lateTime: "07:30",
    };
  } else {
    newSessionForm.value = {
      title: "Presensi Kepulangan Sore",
      type: "CHECK_OUT",
      xpReward: 50,
      lateTime: "17:00",
    };
  }
  await submitCreateSession();
};

const submitCreateSession = async () => {
  if (!newSessionForm.value.title.trim()) {
    toast.warning("Form Tidak Lengkap", "Judul sesi presensi wajib diisi.");
    return;
  }
  creatingSession.value = true;
  try {
    const res: any = await api.post("/api/attendance/sessions", {
      title: newSessionForm.value.title.trim(),
      type: newSessionForm.value.type,
      xpReward: newSessionForm.value.xpReward || (newSessionForm.value.type === "CHECK_IN" ? 100 : 50),
      lateTime: newSessionForm.value.lateTime || "07:30",
      allowLate: true,
      isActive: true, // Otomatis aktifkan sesi yang baru dibuat
    });

    toast.success("Sesi Baru Dibuat & Aktif!", `Sesi "${newSessionForm.value.title}" siap digunakan.`);
    showCreateForm.value = false;
    newSessionForm.value = { title: "", type: "CHECK_IN", xpReward: 100, lateTime: "07:30" };
    if (res.data?.id) {
      selectedSessionId.value = res.data.id;
    }
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Membuat Sesi", err.message || "Terjadi kesalahan.");
  } finally {
    creatingSession.value = false;
  }
};

const filteredList = computed(() => {
  return participantsList.value.filter((p) => {
    const matchesSearch =
      !searchQuery.value.trim() ||
      p.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesTeam = !selectedTeamFilter.value || p.teamName === selectedTeamFilter.value;
    const matchesStatus = !selectedStatusFilter.value || p.attendance.status === selectedStatusFilter.value;

    return matchesSearch && matchesTeam && matchesStatus;
  });
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

const isAllSelected = computed(() => {
  if (paginatedList.value.length === 0) return false;
  return paginatedList.value.every((p) => selectedParticipantIds.value.includes(p.id));
});

function toggleSelectAll() {
  const pageIds = new Set(paginatedList.value.map((p) => p.id));
  if (isAllSelected.value) {
    selectedParticipantIds.value = selectedParticipantIds.value.filter((id) => !pageIds.has(id));
  } else {
    selectedParticipantIds.value = Array.from(new Set([...selectedParticipantIds.value, ...pageIds]));
  }
}

const metrics = computed(() => {
  const list = participantsList.value;
  return {
    totalCount: list.length,
    onTimeCount: list.filter((p) => p.attendance.status === "ON_TIME").length,
    lateCount: list.filter((p) => p.attendance.status === "LATE").length,
    reflectionCount: list.filter((p) => Boolean(p.attendance.reflection)).length,
    absentCount: list.filter((p) => !p.attendance.checkInAt && !p.attendance.checkOutAt).length,
  };
});

// Bulk Operations
async function batchCheckIn(status: "ON_TIME" | "LATE") {
  if (selectedParticipantIds.value.length === 0) return;
  const count = selectedParticipantIds.value.length;
  const statusLabel = status === "ON_TIME" ? "Tepat Waktu" : "Terlambat";
  try {
    await api.post("/api/attendance/batch-check-in", {
      participantIds: selectedParticipantIds.value,
      sessionId: selectedSessionId.value || activeSession.value?.id,
      status,
    });
    toast.success("Presensi Berhasil!", `${count} mahasiswa berhasil dicatat hadir (${statusLabel}).`);
    selectedParticipantIds.value = [];
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Presensi Massal", err.message || "Terjadi kesalahan sistem.");
  }
}

async function batchCheckOut() {
  if (selectedParticipantIds.value.length === 0) return;
  const count = selectedParticipantIds.value.length;
  try {
    await api.post("/api/attendance/batch-check-out", {
      participantIds: selectedParticipantIds.value,
      sessionId: selectedSessionId.value || activeSession.value?.id,
    });
    toast.success("Check-Out Berhasil!", `${count} mahasiswa berhasil dicatat kepulangan.`);
    selectedParticipantIds.value = [];
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Check-Out Massal", err.message || "Terjadi kesalahan sistem.");
  }
}

async function batchReset() {
  if (selectedParticipantIds.value.length === 0) return;
  const count = selectedParticipantIds.value.length;
  const confirmed = await confirmModal.show({
    title: `Reset Presensi ${count} Mahasiswa?`,
    description: `Data presensi untuk ${count} mahasiswa terpilih pada sesi ini akan di-reset ke status awal.`,
    confirmText: "Ya, Reset Semua",
    cancelText: "Batal",
    variant: "warning",
    icon: "shield",
  });
  if (!confirmed) return;

  try {
    await api.post("/api/attendance/batch-reset", {
      participantIds: selectedParticipantIds.value,
      sessionId: selectedSessionId.value || activeSession.value?.id,
    });
    toast.success("Presensi Di-reset!", `Data presensi ${count} mahasiswa berhasil di-reset.`);
    selectedParticipantIds.value = [];
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Reset Presensi Massal", err.message || "Terjadi kesalahan sistem.");
  }
}

// Single Operations
const viewReflectionDetail = (row: ParticipantAttendanceRow) => {
  activeReflectionRow.value = row;
};

const openManualCheckInModal = (row: ParticipantAttendanceRow) => {
  manualCheckInTarget.value = row;
};

const confirmManualCheckIn = async () => {
  if (!manualCheckInTarget.value) return;
  try {
    const targetToken = activeSession.value?.qrToken || "UNU-PRESENSI-GATE-MANUAL";
    await api.post("/api/attendance/scan", {
      participantId: manualCheckInTarget.value.id,
      qrToken: targetToken,
    });
    toast.success("Presensi Masuk Berhasil!", `Presensi masuk ${manualCheckInTarget.value.fullName} berhasil dikonfirmasi (+${activeSession.value?.xpReward || 100} XP).`);
    manualCheckInTarget.value = null;
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Check-In Manual", err?.data?.error?.message || err?.message || "Terjadi kesalahan.");
  }
};

const singleCheckOut = async (row: ParticipantAttendanceRow) => {
  try {
    await api.post("/api/attendance/batch-check-out", {
      participantIds: [row.id],
      sessionId: selectedSessionId.value || activeSession.value?.id,
    });
    toast.success("Check-Out Berhasil!", `Mahasiswa ${row.fullName} berhasil check-out kepulangan.`);
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Check-Out", err.message || "Terjadi kesalahan.");
  }
};

const singleReset = async (row: ParticipantAttendanceRow) => {
  const confirmed = await confirmModal.show({
    title: `Reset Presensi ${row.fullName}?`,
    description: `Data presensi sesi ini untuk ${row.fullName} akan dihapus dan di-reset.`,
    confirmText: "Ya, Reset Presensi",
    cancelText: "Batal",
    variant: "warning",
    icon: "shield",
  });
  if (!confirmed) return;

  try {
    await api.post("/api/attendance/batch-reset", {
      participantIds: [row.id],
      sessionId: selectedSessionId.value || activeSession.value?.id,
    });
    toast.success("Presensi Di-reset!", `Data presensi ${row.fullName} berhasil di-reset.`);
    await loadData();
  } catch (err: any) {
    toast.error("Gagal Reset Presensi", err.message || "Terjadi kesalahan.");
  }
};

const formatDate = (isoString?: string | null) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return isoString;
  }
};

const formatTime = (isoString?: string | null) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
};

const exportAttendanceCsv = () => {
  const sessionName = activeSession.value?.title || "Sesi";
  const rows = [
    ["NIM", "Nama Lengkap", "Kelompok", "Buddy", "Sesi", "Jam Masuk", "Status Masuk", "Jam Pulang", "Total XP Presensi"],
    ...filteredList.value.map((p) => [
      p.username,
      p.fullName,
      p.teamName,
      p.buddyName,
      sessionName,
      formatTime(p.attendance.checkInAt),
      p.attendance.status || "ABSENT",
      formatTime(p.attendance.checkOutAt),
      p.attendance.xpAwarded.toString(),
    ]),
  ];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Rekap_Presensi_PKKMB_UNU_${sessionName.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  loadData();
});
</script>
