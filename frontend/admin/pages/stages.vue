<template>
  <div class="p-4 md:p-6 space-y-6 flex-1 flex flex-col min-h-0">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308] flex items-center gap-1.5 hover:bg-[#eab308] shadow-md transition-transform active:scale-95"
        @click="syncOfficialRoadmap"
        :disabled="syncing"
        title="Sinkronkan struktur resmi 3-Day Roadmap & Rundown ke Database"
      >
        <Sparkles :class="['h-3.5 w-3.5', syncing && 'animate-spin']" />
        <span class="hidden sm:inline">{{ syncing ? 'MENYINKRONKAN...' : 'SINKRONKAN ROADMAP' }}</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#1e293b] text-[#38bdf8] border-[#0284c7] flex items-center gap-1.5 hover:bg-[#0369a1] hover:text-white transition-all active:scale-95"
        @click="exportRundownCsv"
        title="Ekspor Jadwal Rundown ke format CSV / Spreadsheet"
      >
        <Download class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">EXPORT CSV</span>
      </button>

      <button
        class="pixel-btn h-8 px-3 text-xs font-mono font-bold bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center gap-1.5 hover:bg-[#3d2d1e] transition-colors active:scale-95"
        @click="printRundown"
        title="Cetak Jadwal Acara"
      >
        <Printer class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">CETAK</span>
      </button>

      <button
        class="pixel-btn h-8 w-8 bg-[#271d15] text-[#f59e0b] border-[#523e2b] flex items-center justify-center hover:bg-[#3d2d1e] active:scale-95"
        @click="loadAllData"
        :disabled="loading"
        title="Muat Ulang Data Rundown"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- 1. Active Stage Hero Banner & Quick Switcher -->
    <div class="pixel-card p-5 border-2 border-[#ca8a04] bg-[#1a130c] rounded-xl shadow-lg relative overflow-hidden space-y-4">
      <!-- Background Ambient Glow -->
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#3d2d1e] pb-4">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#f59e0b] flex items-center gap-1.5">
              <CalendarClock class="h-3.5 w-3.5 text-amber-400" />
              <span>TIMELINE RESMI PKKMB / GENIUS UNU 2026</span>
            </span>
            <span class="border border-emerald-500/60 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5 rounded-full">
              <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>TAHAPAN AKTIF: HARI {{ activeDayOrder }}</span>
            </span>
            <span class="border border-[#ca8a04]/40 bg-[#2b2014] px-2 py-0.5 text-[10px] font-mono font-bold text-[#facc15] rounded">
              3 HARI • 34 AGENDA RESMI
            </span>
          </div>

          <h2 class="font-sans text-lg sm:text-xl font-bold text-white tracking-wide">
            {{ activeStage?.name || 'DAY 1: THE INCUBATION & ONBOARDING (22 Sept 2026)' }}
          </h2>

          <p class="text-xs font-mono text-gray-300 max-w-3xl leading-relaxed">
            {{ activeStage?.description || 'Check-In QR presensi, Opening Ceremony akbar, FGD Intention & Agent of Change, Sesi Hubbul Wathan, Literasi Keuangan, Prodi Connect & HMP, serta Daily Check-Out kuesioner.' }}
          </p>
        </div>

        <div class="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
          <button
            class="pixel-btn h-9 px-4 text-xs font-mono font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] flex items-center gap-2 hover:bg-[#1f3722] transition-colors shadow-md active:scale-95"
            @click="openTransitionModal"
          >
            <Play class="h-3.5 w-3.5 text-emerald-400" />
            <span>TRANSISI TAHAPAN HARI</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div class="border border-[#3d2d1e] bg-[#0f0c09] p-3 rounded-lg flex items-center gap-3">
          <div class="h-9 w-9 rounded border border-amber-500/40 bg-amber-950/40 flex items-center justify-center shrink-0 text-amber-400">
            <Layers class="h-4 w-4" />
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase">Total Agenda</div>
            <div class="text-base font-bold text-white">{{ stats.totalAgenda }} Sesi</div>
          </div>
        </div>

        <div class="border border-[#3d2d1e] bg-[#0f0c09] p-3 rounded-lg flex items-center gap-3">
          <div class="h-9 w-9 rounded border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center shrink-0 text-cyan-400">
            <Smartphone class="h-4 w-4" />
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase">Sesi Pakai Aplikasi</div>
            <div class="text-base font-bold text-cyan-300">{{ stats.appIntegratedCount }} Agenda</div>
          </div>
        </div>

        <div class="border border-[#3d2d1e] bg-[#0f0c09] p-3 rounded-lg flex items-center gap-3">
          <div class="h-9 w-9 rounded border border-emerald-500/40 bg-emerald-950/40 flex items-center justify-center shrink-0 text-emerald-400">
            <Clock class="h-4 w-4" />
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase">Rentang Waktu</div>
            <div class="text-base font-bold text-emerald-300">07:00 - 16:30 WIB</div>
          </div>
        </div>

        <div class="border border-[#3d2d1e] bg-[#0f0c09] p-3 rounded-lg flex items-center gap-3">
          <div class="h-9 w-9 rounded border border-purple-500/40 bg-purple-950/40 flex items-center justify-center shrink-0 text-purple-400">
            <Building2 class="h-4 w-4" />
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase">Venue Kampus</div>
            <div class="text-base font-bold text-purple-300">Hall, 9 Lt, Masjid</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Controls & Tabs Bar -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#3d2d1e] pb-4">
      <!-- Day Switcher Tabs -->
      <div class="flex items-center gap-1.5 p-1 bg-[#140e0a] border border-[#3d2d1e] rounded-lg overflow-x-auto custom-scrollbar shrink-0">
        <button
          v-for="tab in dayTabs"
          :key="tab.id"
          @click="selectedDay = tab.id"
          class="px-3 py-1.5 text-xs font-mono font-bold rounded transition-all whitespace-nowrap flex items-center gap-2"
          :class="selectedDay === tab.id
            ? 'bg-[#ca8a04] text-[#16110d] shadow-sm'
            : 'text-gray-300 hover:text-white hover:bg-[#271d15]'"
        >
          <span>{{ tab.label }}</span>
          <span
            class="px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold"
            :class="selectedDay === tab.id ? 'bg-[#16110d] text-[#ca8a04]' : 'bg-[#2b2014] text-gray-400'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Search, Filters, and View Mode Switcher -->
      <div class="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
        <!-- Search Input -->
        <div class="relative flex-1 md:w-64 min-w-[200px]">
          <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            v-model="searchQuery"
            placeholder="Cari kegiatan, lokasi, PIC..."
            class="w-full h-8 pl-8 pr-3 text-xs font-mono bg-[#140e0a] border border-[#3d2d1e] text-foreground rounded focus:outline-none focus:border-[#ca8a04] placeholder:text-gray-500"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Filter: Aplikasi -->
        <select
          v-model="filterApp"
          class="h-8 px-2 text-xs font-mono bg-[#140e0a] border border-[#3d2d1e] text-foreground rounded focus:outline-none focus:border-[#ca8a04]"
        >
          <option value="ALL">Semua Integrasi</option>
          <option value="APP_ONLY">Pakai Aplikasi (Ya)</option>
          <option value="NON_APP">Tanpa Aplikasi (Tidak)</option>
        </select>

        <!-- Filter: Pilar -->
        <select
          v-model="filterPilar"
          class="h-8 px-2 text-xs font-mono bg-[#140e0a] border border-[#3d2d1e] text-foreground rounded focus:outline-none focus:border-[#ca8a04]"
        >
          <option value="ALL">Semua Pilar</option>
          <option value="Pilar 1">Pilar 1 (Bela Negara)</option>
          <option value="Pilar 2">Pilar 2 (Sistem PT)</option>
          <option value="Pilar 3">Pilar 3 (Kecakapan Abad 21)</option>
          <option value="Pilar 4">Pilar 4 (Karakter)</option>
          <option value="Pilar 5">Pilar 5 (Muatan Lokal)</option>
          <option value="Non-Materi">Non-Materi</option>
        </select>

        <!-- View Mode Switcher -->
        <div class="flex items-center border border-[#3d2d1e] bg-[#140e0a] rounded p-0.5 shrink-0">
          <button
            @click="viewMode = 'table'"
            class="h-7 px-2.5 flex items-center gap-1.5 text-xs font-mono rounded transition-colors"
            :class="viewMode === 'table' ? 'bg-[#ca8a04] text-[#16110d] font-bold' : 'text-gray-400 hover:text-white'"
            title="Tampilan Tabel Matriks Excel"
          >
            <Table class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Tabel</span>
          </button>
          <button
            @click="viewMode = 'timeline'"
            class="h-7 px-2.5 flex items-center gap-1.5 text-xs font-mono rounded transition-colors"
            :class="viewMode === 'timeline' ? 'bg-[#ca8a04] text-[#16110d] font-bold' : 'text-gray-400 hover:text-white'"
            title="Tampilan Visual Alur / Timeline"
          >
            <GitCommit class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Timeline</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Filter Counter -->
    <div class="flex items-center justify-between text-xs font-mono text-gray-400">
      <div class="flex items-center gap-2">
        <span>Menampilkan <strong class="text-white font-bold">{{ filteredRundown.length }}</strong> dari {{ totalRundownItems }} agenda</span>
        <span v-if="searchQuery || filterApp !== 'ALL' || filterPilar !== 'ALL'" class="text-amber-400 text-[11px]">
          (Filter aktif)
        </span>
      </div>
      <button
        v-if="searchQuery || filterApp !== 'ALL' || filterPilar !== 'ALL'"
        @click="resetFilters"
        class="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
      >
        <RotateCcw class="h-3 w-3" />
        <span>Reset Filter</span>
      </button>
    </div>

    <!-- 3. VIEW MODE A: TABLE MATRIX (Spreadsheet Alike) -->
    <div v-if="viewMode === 'table'" class="flex-1 min-h-0 pixel-card border-2 border-[#3d2d1e] bg-[#120d09] rounded-xl overflow-hidden flex flex-col shadow-inner">
      <div class="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table class="w-full text-left font-mono text-xs border-collapse">
          <thead class="sticky top-0 z-10 bg-[#1e150d] border-b-2 border-[#3d2d1e] text-gray-300 uppercase tracking-wider text-[11px]">
            <tr>
              <th class="p-3 w-16 text-center">No</th>
              <th class="p-3 w-28">Hari & Tanggal</th>
              <th class="p-3 w-32">Waktu (WIB)</th>
              <th class="p-3 w-24 text-center">Durasi</th>
              <th class="p-3 min-w-[200px]">Nama Kegiatan</th>
              <th class="p-3 min-w-[240px]">Keterangan / Detail Aktivitas</th>
              <th class="p-3 w-36">Format</th>
              <th class="p-3 w-40">Pilar PKKMB</th>
              <th class="p-3 w-36">Lokasi</th>
              <th class="p-3 w-32">PIC</th>
              <th class="p-3 w-24 text-center">Aplikasi?</th>
              <th class="p-3 min-w-[160px]">Speaker Kampus</th>
              <th class="p-3 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#271d15] text-gray-200">
            <tr
              v-for="(item, idx) in filteredRundown"
              :key="item.id"
              class="hover:bg-[#1f1610] transition-colors cursor-pointer group"
              @click="openDetailModal(item)"
            >
              <!-- 1. No -->
              <td class="p-3 text-center text-gray-400 font-bold group-hover:text-amber-400">
                {{ String(idx + 1).padStart(2, '0') }}
              </td>

              <!-- 2. Hari & Tanggal -->
              <td class="p-3 whitespace-nowrap">
                <div class="font-bold text-white">Hari {{ item.day }}</div>
                <div class="text-[10px] text-gray-400">{{ item.date }}</div>
              </td>

              <!-- 3. Waktu -->
              <td class="p-3 whitespace-nowrap">
                <div class="font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock class="h-3 w-3 text-amber-400" />
                  <span>{{ item.startTime }} - {{ item.endTime }}</span>
                </div>
              </td>

              <!-- 4. Durasi -->
              <td class="p-3 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 rounded bg-[#2b2014] border border-[#523e2b] text-amber-300 font-bold text-[10px]">
                  {{ item.durationMin }}m
                </span>
              </td>

              <!-- 5. Nama Kegiatan -->
              <td class="p-3">
                <div class="font-bold text-white font-sans text-sm group-hover:text-amber-300 transition-colors">
                  {{ item.name }}
                </div>
                <div v-if="item.id.startsWith('H1-02')" class="text-[10px] text-emerald-400 mt-0.5 font-mono">
                  8 Rangkaian Acara Opening
                </div>
              </td>

              <!-- 6. Keterangan -->
              <td class="p-3">
                <p class="text-xs text-gray-300 line-clamp-2 max-w-sm leading-relaxed" :title="item.description">
                  {{ item.description }}
                </p>
              </td>

              <!-- 7. Format -->
              <td class="p-3 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded text-[10px] border border-[#3d2d1e] bg-[#1a140f] text-gray-300">
                  {{ item.format || '-' }}
                </span>
              </td>

              <!-- 8. Pilar PKKMB -->
              <td class="p-3 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold border"
                  :class="getPilarBadgeClass(item.pilar)"
                >
                  {{ item.pilar }}
                </span>
              </td>

              <!-- 9. Lokasi -->
              <td class="p-3 whitespace-nowrap">
                <div class="flex items-center gap-1 text-gray-200">
                  <MapPin class="h-3 w-3 text-amber-400 shrink-0" />
                  <span class="truncate max-w-[130px]" :title="item.location">{{ item.location }}</span>
                </div>
              </td>

              <!-- 10. PIC -->
              <td class="p-3 whitespace-nowrap">
                <div class="flex items-center gap-1 text-gray-300">
                  <UserCheck class="h-3 w-3 text-cyan-400 shrink-0" />
                  <span class="truncate max-w-[110px]" :title="item.pic">{{ item.pic }}</span>
                </div>
              </td>

              <!-- 11. Aplikasi? -->
              <td class="p-3 text-center whitespace-nowrap">
                <span
                  v-if="item.useApp"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/60 bg-emerald-950/60 text-emerald-300 flex items-center justify-center gap-1"
                >
                  <Smartphone class="h-3 w-3" />
                  <span>YA</span>
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold border border-gray-700 bg-gray-900/60 text-gray-400"
                >
                  TIDAK
                </span>
              </td>

              <!-- 12. Speaker Kampus -->
              <td class="p-3">
                <div v-if="item.speaker" class="flex items-center gap-1 text-amber-300 font-sans text-xs">
                  <Megaphone class="h-3 w-3 text-amber-400 shrink-0" />
                  <span class="truncate max-w-[160px]" :title="item.speaker">{{ item.speaker }}</span>
                </div>
                <span v-else class="text-gray-600 text-[11px]">-</span>
              </td>

              <!-- 13. Aksi -->
              <td class="p-3 text-center whitespace-nowrap">
                <button
                  @click.stop="openDetailModal(item)"
                  class="h-6 px-2 text-[10px] font-mono font-bold bg-[#271d15] text-[#f59e0b] border border-[#523e2b] rounded hover:bg-[#3d2d1e] transition-colors"
                >
                  DETAIL
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredRundown.length === 0">
              <td colspan="13" class="py-12 text-center text-gray-400 space-y-2">
                <CalendarX class="h-8 w-8 text-amber-500/40 mx-auto" />
                <div class="text-sm font-bold text-gray-300">Tidak ada agenda yang cocok dengan filter</div>
                <div class="text-xs">Coba sesuaikan kata kunci pencarian atau reset filter.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. VIEW MODE B: VISUAL TIMELINE / ROADMAP FLOW -->
    <div v-else class="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1">
      <div class="relative border-l-2 border-[#523e2b] ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6 my-2">
        <div
          v-for="(item, idx) in filteredRundown"
          :key="item.id"
          class="relative group"
        >
          <!-- Timeline Node Point on Left Rail -->
          <div
            class="absolute -left-[25px] sm:-left-[33px] top-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all bg-[#120d09]"
            :class="item.useApp ? 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'border-amber-500/80 text-amber-400'"
          >
            <span class="h-2 w-2 rounded-full" :class="item.useApp ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
          </div>

          <!-- Timeline Content Card -->
          <div
            class="pixel-card p-4 sm:p-5 border-2 rounded-xl bg-[#140e0a] hover:bg-[#1a120c] transition-all cursor-pointer space-y-3"
            :class="item.useApp ? 'border-[#38761d]/70 hover:border-emerald-500' : 'border-[#3d2d1e] hover:border-amber-500/60'"
            @click="openDetailModal(item)"
          >
            <!-- Card Header: Time, Day, Badges -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#271d15] pb-2.5">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Time Badge -->
                <div class="px-2.5 py-1 rounded bg-[#2b2014] border border-[#ca8a04]/40 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5">
                  <Clock class="h-3.5 w-3.5 text-amber-400" />
                  <span>{{ item.startTime }} - {{ item.endTime }} WIB</span>
                  <span class="text-gray-400">({{ item.durationMin }}m)</span>
                </div>

                <!-- Day Badge -->
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e150d] text-gray-300 border border-[#3d2d1e]">
                  Hari {{ item.day }} • {{ item.date }}
                </span>

                <!-- App Badge -->
                <span
                  v-if="item.useApp"
                  class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-emerald-500/60 bg-emerald-950/60 text-emerald-300 flex items-center gap-1"
                >
                  <Smartphone class="h-3 w-3" />
                  <span>INTEGRASI APLIKASI</span>
                </span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Pilar Badge -->
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  :class="getPilarBadgeClass(item.pilar)"
                >
                  {{ item.pilar }}
                </span>

                <!-- Format Badge -->
                <span class="px-2 py-0.5 rounded text-[10px] font-mono border border-[#3d2d1e] bg-[#0e0a07] text-gray-400">
                  {{ item.format }}
                </span>
              </div>
            </div>

            <!-- Card Body: Title & Description -->
            <div class="space-y-1.5">
              <h4 class="font-sans text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                <span>{{ item.name }}</span>
                <ChevronRight class="h-4 w-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </h4>

              <!-- Multiline Description with line break rendering -->
              <p class="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-line line-clamp-3">
                {{ item.description }}
              </p>
            </div>

            <!-- Card Footer: Meta Info (Location, PIC, Speaker) -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#271d15] text-[11px] font-mono text-gray-300">
              <div class="flex items-center gap-1.5 truncate">
                <MapPin class="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span class="text-gray-400">Lokasi:</span>
                <span class="text-white font-semibold truncate">{{ item.location }}</span>
              </div>

              <div class="flex items-center gap-1.5 truncate">
                <UserCheck class="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span class="text-gray-400">PIC:</span>
                <span class="text-white font-semibold truncate">{{ item.pic }}</span>
              </div>

              <div class="flex items-center gap-1.5 truncate">
                <Megaphone class="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span class="text-gray-400">Speaker:</span>
                <span class="text-amber-300 font-semibold truncate">{{ item.speaker || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. MODAL: DETAIL LENGKAP KEGIATAN -->
    <Dialog :open="showDetailModal" @update:open="showDetailModal = $event">
      <DialogContent class="sm:max-w-[620px] pixel-card border-2 border-[#ca8a04] bg-[#140f0c] text-foreground p-5 space-y-4">
        <DialogHeader>
          <div class="flex items-center justify-between border-b border-[#3d2d1e] pb-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ca8a04] text-[#16110d]">
                  HARI {{ selectedItem?.day }} • {{ selectedItem?.date }}
                </span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  :class="getPilarBadgeClass(selectedItem?.pilar || '')"
                >
                  {{ selectedItem?.pilar }}
                </span>
              </div>
              <DialogTitle class="font-sans text-base sm:text-lg font-bold text-white">
                {{ selectedItem?.name }}
              </DialogTitle>
            </div>

            <div class="text-right font-mono text-xs shrink-0">
              <div class="text-amber-400 font-bold text-sm">
                {{ selectedItem?.startTime }} - {{ selectedItem?.endTime }} WIB
              </div>
              <div class="text-gray-400 text-[10px]">Durasi: {{ selectedItem?.durationMin }} Menit</div>
            </div>
          </div>
        </DialogHeader>

        <!-- Detail Meta Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div class="border border-[#3d2d1e] bg-[#0e0a07] p-2.5 rounded">
            <div class="text-[10px] text-gray-400 uppercase">Format Kegiatan</div>
            <div class="font-bold text-white mt-0.5">{{ selectedItem?.format || '-' }}</div>
          </div>

          <div class="border border-[#3d2d1e] bg-[#0e0a07] p-2.5 rounded">
            <div class="text-[10px] text-gray-400 uppercase">Lokasi Ruang</div>
            <div class="font-bold text-amber-300 mt-0.5 truncate" :title="selectedItem?.location">{{ selectedItem?.location }}</div>
          </div>

          <div class="border border-[#3d2d1e] bg-[#0e0a07] p-2.5 rounded">
            <div class="text-[10px] text-gray-400 uppercase">Penanggung Jawab (PIC)</div>
            <div class="font-bold text-cyan-300 mt-0.5">{{ selectedItem?.pic }}</div>
          </div>

          <div class="border border-[#3d2d1e] bg-[#0e0a07] p-2.5 rounded">
            <div class="text-[10px] text-gray-400 uppercase">Integrasi Aplikasi</div>
            <div class="font-bold mt-0.5" :class="selectedItem?.useApp ? 'text-emerald-400' : 'text-gray-500'">
              {{ selectedItem?.useApp ? 'Aktif (Ya)' : 'Tidak Digunakan' }}
            </div>
          </div>
        </div>

        <!-- Speaker Kampus Note if any -->
        <div v-if="selectedItem?.speaker" class="p-3 rounded border border-amber-500/40 bg-amber-950/20 font-mono text-xs flex items-start gap-2.5">
          <Megaphone class="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div class="text-[10px] text-amber-400 uppercase font-bold">Speaker / Pengumuman Terjadwal:</div>
            <div class="text-white font-sans text-sm font-semibold mt-0.5">{{ selectedItem.speaker }}</div>
          </div>
        </div>

        <!-- Detail Aktivitas & Rangkaian Acara -->
        <div class="space-y-2 font-mono text-xs">
          <div class="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <FileText class="h-3.5 w-3.5" />
            <span>Keterangan & Rincian Aktivitas:</span>
          </div>

          <div class="p-3.5 rounded-lg border border-[#3d2d1e] bg-[#0c0906] text-gray-200 leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
            <!-- If this is Opening Ceremony with list, render clean breakdown -->
            <div v-if="selectedItem?.id === 'H1-02'" class="space-y-2">
              <div class="font-bold text-amber-300">Rangkaian Acara Opening Ceremony:</div>
              <ul class="space-y-1.5 pl-2 text-xs font-mono">
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">1.</span>
                  <span>Opening dari MC : <strong class="text-white">5 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">2.</span>
                  <span>Pembacaan ayat suci Al-Quran : <strong class="text-white">5 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">3.</span>
                  <div>
                    <span>Paduan Suara Mahasiswa: <strong class="text-white">15 menit</strong></span>
                    <div class="text-[11px] text-gray-400 pl-4">
                      • Lagu Indonesia Raya<br />
                      • Mars NU<br />
                      • Mars UNU Yogyakarta
                    </div>
                  </div>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">4.</span>
                  <span>Sambutan Pimpinan oleh Rektor : <strong class="text-white">10 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">5.</span>
                  <span>Pembukaan dengan Gong: <strong class="text-white">3 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">6.</span>
                  <span>Video Perkenalan Dekan Fakultas: <strong class="text-white">2 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">7.</span>
                  <span>Penampilan Silat Mahasiswa UNU: <strong class="text-white">10 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">8.</span>
                  <span>Pembacaan Do'a: <strong class="text-white">5 menit</strong></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-400">9.</span>
                  <span>Penutup & Transisi ke FGD 1</span>
                </li>
              </ul>
            </div>

            <!-- Generic description for other items -->
            <p v-else class="whitespace-pre-line">
              {{ selectedItem?.description }}
            </p>
          </div>
        </div>

        <DialogFooter class="pt-2 border-t border-[#3d2d1e] flex items-center justify-between">
          <span class="text-[10px] font-mono text-gray-500">ID Agenda: {{ selectedItem?.id }}</span>
          <button
            type="button"
            class="pixel-btn h-8 px-4 text-xs font-mono font-bold bg-[#ca8a04] text-[#16110d] border-[#eab308]"
            @click="showDetailModal = false"
          >
            TUTUP
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 5. MODAL: TRANSISI TAHAPAN HARI (Switch Live Stage) -->
    <Dialog :open="showTransitionModal" @update:open="showTransitionModal = $event">
      <DialogContent class="sm:max-w-[480px] pixel-card border-2 border-[#16a34a] bg-[#140f0c] text-foreground p-5 space-y-4">
        <DialogHeader>
          <DialogTitle class="font-mono text-sm font-bold text-[#4ade80] flex items-center gap-2">
            <Play class="h-4 w-4 text-emerald-400" />
            <span>TRANSISI TAHAPAN HARI (LIVE EVENT SWITCH)</span>
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-3 font-mono text-xs">
          <p class="text-gray-300 leading-relaxed">
            Pilih tahapan hari baru untuk diaktifkan di seluruh ekosistem (aplikasi mahasiswa, modul game, leaderboard, dan pos scan):
          </p>

          <div class="space-y-2">
            <div
              v-for="s in stages"
              :key="s.id"
              @click="targetTransitionStageId = s.id"
              class="p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between"
              :class="targetTransitionStageId === s.id
                ? 'border-emerald-500 bg-emerald-950/30'
                : 'border-[#3d2d1e] bg-[#0e0a07] hover:border-gray-500'"
            >
              <div>
                <div class="font-bold text-white">{{ s.name }}</div>
                <div class="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{{ s.description }}</div>
              </div>
              <span
                class="px-2 py-0.5 text-[9px] font-bold rounded"
                :class="s.status === 'ACTIVE' ? 'bg-emerald-900 text-emerald-300' : 'bg-gray-800 text-gray-400'"
              >
                {{ s.status }}
              </span>
            </div>
          </div>

          <DialogFooter class="pt-3 flex items-center justify-end gap-2 border-t border-[#3d2d1e]">
            <button
              type="button"
              class="h-8 px-3 text-xs border border-[#523e2b] bg-[#271d15] text-muted-foreground hover:text-foreground rounded"
              @click="showTransitionModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="pixel-btn h-8 px-4 text-xs font-mono font-bold bg-[#16a34a] text-white border-[#4ade80] shadow-md active:scale-95"
              @click="confirmStageTransition"
              :disabled="saving || !targetTransitionStageId"
            >
              <RotateCw v-if="saving" class="h-3 w-3 animate-spin mr-1 inline" />
              <span>AKTIFKAN SEKARANG</span>
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
  CalendarClock,
  Layers,
  Smartphone,
  Clock,
  Building2,
  Search,
  X,
  Table,
  GitCommit,
  RotateCcw,
  MapPin,
  UserCheck,
  Megaphone,
  Download,
  Printer,
  RotateCw,
  Sparkles,
  Play,
  FileText,
  ChevronRight,
  CalendarX,
} from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/composables/useApi";
import { OFFICIAL_RUNDOWN_LIST, type RundownItem } from "~/data/officialRundown";

const api = useApi();

const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);

// State Data
const stages = ref<any[]>([]);
const rundownList = ref<RundownItem[]>([...OFFICIAL_RUNDOWN_LIST]);

// Filter & View State
const selectedDay = ref<number | "ALL">("ALL");
const searchQuery = ref("");
const filterApp = ref<"ALL" | "APP_ONLY" | "NON_APP">("ALL");
const filterPilar = ref<string>("ALL");
const viewMode = ref<"table" | "timeline">("table");

// Modal State
const showDetailModal = ref(false);
const selectedItem = ref<RundownItem | null>(null);
const showTransitionModal = ref(false);
const targetTransitionStageId = ref("");

// Computed: Active Stage & Day Order
const activeStage = computed(() => {
  return stages.value.find((s) => s.status === "ACTIVE") || stages.value[0];
});

const activeDayOrder = computed(() => {
  return activeStage.value?.order || 1;
});

// Computed: Day Tabs with live counts
const dayTabs = computed(() => [
  { id: "ALL" as const, label: "Semua Hari (3-Day)", count: rundownList.value.length },
  { id: 1 as const, label: "Hari 1 (22 Sept)", count: rundownList.value.filter((r) => r.day === 1).length },
  { id: 2 as const, label: "Hari 2 (23 Sept)", count: rundownList.value.filter((r) => r.day === 2).length },
  { id: 3 as const, label: "Hari 3 (24 Sept)", count: rundownList.value.filter((r) => r.day === 3).length },
]);

// Computed: Overall Stats
const stats = computed(() => {
  const total = rundownList.value.length;
  const withApp = rundownList.value.filter((r) => r.useApp).length;
  return {
    totalAgenda: total,
    appIntegratedCount: withApp,
  };
});

const totalRundownItems = computed(() => rundownList.value.length);

// Computed: Filtered Rundown List
const filteredRundown = computed(() => {
  return rundownList.value.filter((item) => {
    // Filter by Day Tab
    if (selectedDay.value !== "ALL" && item.day !== selectedDay.value) {
      return false;
    }

    // Filter by Application Integration
    if (filterApp.value === "APP_ONLY" && !item.useApp) return false;
    if (filterApp.value === "NON_APP" && item.useApp) return false;

    // Filter by Pilar PKKMB
    if (filterPilar.value !== "ALL") {
      if (!item.pilar.toLowerCase().includes(filterPilar.value.toLowerCase())) {
        return false;
      }
    }

    // Filter by Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLocation = item.location.toLowerCase().includes(q);
      const matchPic = item.pic.toLowerCase().includes(q);
      const matchSpeaker = item.speaker ? item.speaker.toLowerCase().includes(q) : false;
      const matchFormat = item.format.toLowerCase().includes(q);

      if (!matchName && !matchDesc && !matchLocation && !matchPic && !matchSpeaker && !matchFormat) {
        return false;
      }
    }

    return true;
  });
});

// Pilar Badge Color Helpers
function getPilarBadgeClass(pilar: string) {
  if (pilar.includes("Pilar 1")) {
    return "border-red-500/60 bg-red-950/50 text-red-300";
  } else if (pilar.includes("Pilar 2")) {
    return "border-blue-500/60 bg-blue-950/50 text-blue-300";
  } else if (pilar.includes("Pilar 3")) {
    return "border-cyan-500/60 bg-cyan-950/50 text-cyan-300";
  } else if (pilar.includes("Pilar 4")) {
    return "border-purple-500/60 bg-purple-950/50 text-purple-300";
  } else if (pilar.includes("Pilar 5")) {
    return "border-amber-500/60 bg-amber-950/50 text-amber-300";
  } else {
    return "border-gray-600/60 bg-gray-900/60 text-gray-400";
  }
}

// Reset all search/filter
function resetFilters() {
  searchQuery.value = "";
  filterApp.value = "ALL";
  filterPilar.value = "ALL";
  selectedDay.value = "ALL";
}

// Detail Modal
function openDetailModal(item: RundownItem) {
  selectedItem.value = item;
  showDetailModal.value = true;
}

// Fetch Data from Backend API (with fallback)
async function fetchStages() {
  try {
    const res: any = await api.get("/api/stages");
    if (res.success && res.data && res.data.length > 0) {
      stages.value = res.data;
    }
  } catch (err) {
    console.warn("Using offline stages data:", err);
  }
}

async function fetchRundownFromApi() {
  loading.value = true;
  try {
    const res: any = await api.get("/api/stages/rundown");
    if (res.success && res.data && res.data.length > 0) {
      rundownList.value = res.data;
    }
  } catch (err) {
    console.warn("Backend API rundown unreachable, relying on official dataset:", err);
    // Keep local OFFICIAL_RUNDOWN_LIST
    rundownList.value = [...OFFICIAL_RUNDOWN_LIST];
  } finally {
    loading.value = false;
  }
}

async function loadAllData() {
  loading.value = true;
  await Promise.all([fetchStages(), fetchRundownFromApi()]);
  loading.value = false;
}

// Sync Official Roadmap to Database
async function syncOfficialRoadmap() {
  syncing.value = true;
  try {
    const res: any = await api.post("/api/stages/sync-roadmap", {});
    if (res.success) {
      await loadAllData();
      alert(res.message || "Berhasil menyinkronkan 3-Day Event Roadmap & Rundown resmi!");
    }
  } catch (err: any) {
    alert("Gagal sinkronisasi roadmap: " + (err.message || "Pastikan backend aktif"));
  } finally {
    syncing.value = false;
  }
}

// Stage Transition
function openTransitionModal() {
  if (stages.value.length > 0) {
    targetTransitionStageId.value = activeStage.value?.id || stages.value[0].id;
  }
  showTransitionModal.value = true;
}

async function confirmStageTransition() {
  if (!targetTransitionStageId.value) return;
  saving.value = true;
  try {
    const res: any = await api.put(`/api/stages/${targetTransitionStageId.value}/activate`, {});
    if (res.success) {
      showTransitionModal.value = false;
      await fetchStages();
      alert(res.message || "Tahapan berhasil diaktifkan!");
    }
  } catch (err: any) {
    alert("Gagal transisi stage: " + (err.message || "Error"));
  } finally {
    saving.value = false;
  }
}

// Export CSV Functionality
function exportRundownCsv() {
  const headers = [
    "ID",
    "Hari",
    "Tanggal",
    "Jam Mulai",
    "Jam Berakhir",
    "Durasi (Menit)",
    "Nama Kegiatan",
    "Keterangan (Detail Aktivitas)",
    "Format Kegiatan",
    "Kategori Pilar PKKMB",
    "Lokasi",
    "PIC",
    "Aplikasi?",
    "Speaker Kampus",
  ];

  const rows = filteredRundown.value.map((item) => [
    `"${item.id}"`,
    `"Hari ${item.day}"`,
    `"${item.date}"`,
    `"${item.startTime}"`,
    `"${item.endTime}"`,
    item.durationMin,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.description.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${item.format}"`,
    `"${item.pilar}"`,
    `"${item.location}"`,
    `"${item.pic}"`,
    item.useApp ? '"Ya"' : '"Tidak"',
    `"${(item.speaker || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Rundown_Resmi_PKKMB_GENIUS_UNU_2026_${selectedDay.value === 'ALL' ? 'SemuaHari' : 'Hari' + selectedDay.value}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Print Rundown Functionality
function printRundown() {
  window.print();
}

onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
@media print {
  /* Print Optimization: clean white-friendly or print-specific */
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
  .pixel-btn,
  .topbar-actions,
  button {
    display: none !important;
  }
}
</style>
