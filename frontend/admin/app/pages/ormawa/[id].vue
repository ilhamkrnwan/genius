<template>
  <div class="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden select-none font-mono text-gray-200">
    <!-- Topbar Actions Teleport -->
    <TopbarActions>
      <NuxtLink
        to="/ormawa"
        class="pixel-btn h-8 px-3 bg-[#1c1611] border border-[#523e2b] text-[#f59e0b] hover:bg-[#2e2116] hover:border-[#f59e0b] text-xs font-pixel flex items-center gap-1.5 transition-all shadow-sm"
        title="Kembali ke Daftar Stan"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">KEMBALI</span>
      </NuxtLink>

      <button
        v-if="booth"
        @click="openQrModal = true"
        class="pixel-btn h-8 px-3 bg-[#9333ea]/20 border border-[#c084fc] text-[#e9d5ff] hover:bg-[#9333ea]/40 text-xs font-pixel flex items-center gap-1.5 transition-all cursor-pointer"
        title="Lihat & Cetak QR Code Stan"
      >
        <QrCode class="h-3.5 w-3.5 text-[#facc15]" />
        <span class="hidden sm:inline">PRINT QR</span>
      </button>

      <button
        v-if="booth"
        @click="openEditModal"
        class="pixel-btn h-8 px-3 bg-[#ca8a04]/20 border border-[#f59e0b] text-[#facc15] hover:bg-[#ca8a04]/40 text-xs font-pixel flex items-center gap-1.5 transition-all cursor-pointer"
        title="Edit Data Stan"
      >
        <Pencil class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">EDIT</span>
      </button>

      <button
        @click="fetchBoothDetail"
        :disabled="loading"
        class="pixel-btn h-8 w-8 bg-[#1c1611] border border-[#523e2b] text-gray-300 hover:text-white hover:border-gray-500 text-xs flex items-center justify-center transition-all cursor-pointer"
        title="Refresh Data"
      >
        <RotateCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
      </button>
    </TopbarActions>

    <!-- Subtitle / Info Header -->
    <div class="px-4 md:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#4a3624]/60 text-xs text-muted-foreground bg-[#15100c] shrink-0 w-full">
      <div class="flex items-center gap-2 min-w-0">
        <NuxtLink to="/ormawa" class="text-gray-400 hover:text-[#f59e0b] shrink-0">STAN ORMAWA</NuxtLink>
        <span>/</span>
        <span class="text-[#c084fc] font-bold uppercase truncate max-w-[200px] sm:max-w-md">
          {{ booth?.name || 'DETAIL STAN' }}
        </span>
        <span v-if="booth?.boothNumber" class="text-amber-400 font-bold shrink-0">
          ({{ booth.boothNumber }})
        </span>
      </div>

      <div v-if="booth" class="flex items-center gap-2 shrink-0">
        <span class="border border-[#9333ea]/60 bg-[#251538] px-2 py-0.5 text-[10px] font-pixel text-[#c084fc]">
          {{ booth.category }}
        </span>
        <span class="border border-[#ca8a04]/40 bg-[#2b2014] px-2 py-0.5 text-[10px] font-pixel text-[#facc15]">
          {{ totalAttendees }} HADIR
        </span>
      </div>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="loading && !booth" class="py-24 flex flex-col items-center justify-center space-y-4 w-full">
      <RotateCw class="h-10 w-10 text-[#c084fc] animate-spin" />
      <div class="font-pixel text-sm text-[#c084fc] tracking-wider animate-pulse">
        MEMUAT DATA STAN...
      </div>
    </div>

    <!-- 404 / Error State -->
    <div v-else-if="!booth" class="p-8 text-center space-y-3 bg-[#1e1429]/60 border border-red-500/30 rounded m-4">
      <AlertTriangle class="h-10 w-10 text-red-400 mx-auto" />
      <h2 class="font-pixel text-sm text-red-400">STAN TIDAK DITEMUKAN</h2>
      <p class="text-xs text-gray-400">ID stan tidak valid atau telah dihapus.</p>
      <NuxtLink
        to="/ormawa"
        class="inline-flex h-8 px-4 items-center gap-2 rounded bg-[#ca8a04] text-black font-pixel text-xs font-bold hover:bg-[#eab308]"
      >
        KEMBALI KE STAN
      </NuxtLink>
    </div>

    <!-- Main Detail Content -->
    <template v-else>
      <!-- Hero / Profile Card Stan (Compact Top Section) -->
      <div class="px-4 md:px-6 py-3 border-b border-[#3d2a1b] bg-[#1a1324] shrink-0 w-full">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full min-w-0">
          <!-- Left: Identity & Info -->
          <div class="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div
              class="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded border-2 border-[#facc15] flex items-center justify-center font-pixel text-base sm:text-lg font-bold text-white shadow"
              :style="{ backgroundColor: booth.badgeColor || '#9333ea' }"
            >
              {{ booth.shortName?.slice(0, 3) || booth.code.slice(0, 3) }}
            </div>

            <div class="space-y-1 flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-1.5 py-0.2 text-[9px] font-pixel bg-[#9333ea] text-white border border-[#c084fc] rounded">
                  {{ booth.category }}
                </span>
                <span v-if="booth.boothNumber" class="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#2b2014] text-[#facc15] border border-[#ca8a04]/60 rounded">
                  {{ booth.boothNumber }}
                </span>
                <span class="px-1.5 py-0.2 text-[9px] font-mono bg-[#162518] text-[#4ade80] border border-[#16a34a] rounded">
                  {{ booth.floorName ? `${booth.floorName}` : (booth.floorNumber ? `Lantai ${booth.floorNumber}` : 'Lantai 3-5') }}
                </span>
              </div>

              <h1 class="font-pixel text-sm sm:text-base text-[#facc15] font-bold tracking-wide truncate">
                {{ booth.name }}
                <span v-if="booth.shortName" class="text-xs text-amber-300 font-mono font-normal">
                  ({{ booth.shortName }})
                </span>
              </h1>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground font-mono">
                <span class="text-amber-400 font-bold">KODE: {{ booth.code }}</span>
                <span v-if="booth.contactPerson" class="text-gray-300">CP: {{ booth.contactPerson }}</span>
                <span v-if="booth.instagram" class="text-[#d8b4fe]">{{ booth.instagram }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Status Toggle & Token Preview -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="toggleBoothStatus"
              class="px-2.5 py-1 text-[10px] font-pixel border rounded transition-all cursor-pointer shadow flex items-center gap-1.5"
              :class="booth.isActive
                ? 'border-[#4ade80] bg-[#16351b] text-[#86efac] hover:bg-[#1f4a26]'
                : 'border-red-600 bg-[#351616] text-red-300 hover:bg-[#4a1f1f]'"
              :title="booth.isActive ? 'Nonaktifkan' : 'Aktifkan'"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="booth.isActive ? 'bg-[#4ade80] animate-pulse' : 'bg-red-400'"></span>
              <span>{{ booth.isActive ? 'AKTIF' : 'NONAKTIF' }}</span>
            </button>

            <div class="flex items-center gap-1 bg-[#140e1c] border border-[#523e2b] px-2 py-0.5 rounded">
              <code class="text-[10px] text-[#facc15] font-bold">
                {{ booth.qrCode }}
              </code>
              <button
                @click="copyQrToken"
                class="h-5 px-1.5 text-[9px] font-pixel bg-[#271d15] border border-[#523e2b] text-gray-300 hover:text-white rounded cursor-pointer"
                title="Salin Token"
              >
                {{ copied ? 'OK' : 'SALIN' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats HUD Cards (Compact Deck) -->
      <div class="px-4 md:px-6 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-[#3d2a1b] bg-[#120d09] shrink-0">
        <div class="p-2 border border-[#16a34a] bg-[#132215] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-[#4ade80] uppercase block">TOTAL HADIR</span>
            <span class="font-pixel text-base text-[#4ade80] font-bold">{{ totalAttendees }}</span>
          </div>
          <span class="text-[10px] text-[#86efac]">Maba scan</span>
        </div>

        <div class="p-2 border border-[#9333ea] bg-[#1e1329] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-[#c084fc] uppercase block">TOTAL XP</span>
            <span class="font-pixel text-base text-[#c084fc] font-bold">+{{ totalXpEarned.toLocaleString('id-ID') }}</span>
          </div>
          <span class="text-[10px] text-[#e9d5ff]">Disalurkan</span>
        </div>

        <div class="p-2 border border-[#ca8a04] bg-[#221a0f] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-[#facc15] uppercase block">REGU HADIR</span>
            <span class="font-pixel text-base text-[#facc15] font-bold">{{ uniqueTeamsCount }}</span>
          </div>
          <span class="text-[10px] text-[#fde047]">Kelompok</span>
        </div>

        <div class="p-2 border border-[#523e2b] bg-[#1a140f] rounded flex items-center justify-between">
          <div>
            <span class="text-[8px] font-pixel text-gray-400 uppercase block">REWARD SCAN</span>
            <span class="font-pixel text-base text-foreground font-bold">+{{ booth.xpReward || 75 }} XP</span>
          </div>
          <span class="text-[10px] text-muted-foreground">Per maba</span>
        </div>
      </div>

      <!-- Sticky Filter Toolbar -->
      <div class="pixel-toolbar-sticky px-4 md:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div class="flex flex-wrap items-center gap-2 flex-1">
          <div class="relative flex-1 min-w-[200px] max-w-sm">
            <Search class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari maba atau NIM..."
              class="h-7 w-full bg-[#15100c] border border-[#523e2b] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
            />
          </div>

          <select
            v-model="selectedTeam"
            class="h-7 bg-[#15100c] border border-[#523e2b] px-2 text-xs text-foreground focus:outline-none focus:border-[#c084fc]"
          >
            <option value="">Semua Regu</option>
            <option v-for="t in availableTeams" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="exportAllAttendanceCsv"
            :disabled="attendees.length === 0"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] hover:bg-[#1f3822] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download Data Presensi Stan CSV"
          >
            <Download class="h-3 w-3 text-[#4ade80]" />
            <span>Export (CSV)</span>
          </button>
        </div>
      </div>

      <!-- Bulk Action Bar - Attendees -->
      <div
        v-if="selectedAttendeeIds.length > 0"
        class="bg-[#271d15] border-b-2 border-[#ca8a04] px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1 shrink-0"
      >
        <div class="flex items-center gap-2 text-[#f59e0b]">
          <CheckSquare class="h-4 w-4" />
          <span><b>{{ selectedAttendeeIds.length }}</b> maba terpilih</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportSelectedAttendanceCsv"
            class="pixel-btn h-7 px-3 text-[11px] font-bold bg-[#162518] text-[#4ade80] border-[#16a34a] hover:bg-[#1f3822] flex items-center gap-1.5 cursor-pointer"
          >
            <Download class="h-3.5 w-3.5" />
            <span>Export Terpilih (CSV)</span>
          </button>
          <button
            @click="selectedAttendeeIds = []"
            class="h-7 px-2.5 text-[11px] border border-[#523e2b] bg-[#1d1611] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Flush Edge-to-Edge Attendees Table -->
      <div class="flex-1 overflow-x-auto min-h-0">
        <table class="pixel-table w-full text-left text-xs font-mono">
          <thead class="bg-[#15100c] border-b-2 border-[#4a3624] sticky top-0 z-10">
            <tr>
              <th class="pl-4 md:pl-6 pr-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllAttendeesSelected"
                  @change="toggleSelectAllAttendees"
                  class="accent-[#f59e0b] cursor-pointer"
                  title="Pilih Semua Halaman Ini"
                />
              </th>
              <th class="p-3 w-12 text-center">#</th>
              <th class="p-3 min-w-[180px]">MAHASISWA</th>
              <th class="p-3 min-w-[120px]">REGU</th>
              <th class="p-3 min-w-[120px]">KELAS</th>
              <th class="p-3 min-w-[110px]">WAKTU</th>
              <th class="p-3 text-center min-w-[80px]">XP</th>
              <th class="pr-4 md:pr-6 pl-3 py-3 text-right w-24">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#3d2d1e]/60">
            <tr v-if="loadingAttendees">
              <td colspan="8" class="p-8 text-center text-muted-foreground">
                <div class="flex items-center justify-center gap-2">
                  <RotateCw class="h-4 w-4 animate-spin text-[#c084fc]" />
                  <span>Memuat daftar kehadiran...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredAttendees.length === 0">
              <td colspan="8" class="p-8 text-center text-muted-foreground">
                Belum ada mahasiswa yang absen di stan ini.
              </td>
            </tr>

            <tr
              v-for="(att, idx) in paginatedAttendees"
              :key="att.scanId"
              :class="[
                'hover:bg-[#271d15]/50 transition-colors',
                selectedAttendeeIds.includes(att.scanId) ? 'bg-[#3b2716]/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="pl-4 md:pl-6 pr-3 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedAttendeeIds.includes(att.scanId)"
                  @change="toggleSelectAttendee(att.scanId)"
                  class="accent-[#f59e0b] cursor-pointer"
                />
              </td>

              <!-- Index -->
              <td class="p-3 text-center font-pixel text-[10px] text-muted-foreground">
                {{ (attendeePage - 1) * attendeePageSize + idx + 1 }}
              </td>

              <!-- Mahasiswa -->
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <div class="h-6 w-6 rounded-full border border-[#523e2b] bg-[#271d15] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                    <img
                      :src="att.avatarUrl || (att.gender === 'PEREMPUAN' ? '/character-cewek-avatar.png' : '/character-cowok-avatar.png')"
                      alt="Avatar"
                      class="h-full w-full object-contain"
                    />
                  </div>
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/participants/${att.participantId}`"
                      class="font-bold text-foreground hover:text-[#facc15] truncate block transition-colors text-xs"
                    >
                      {{ att.fullName }}
                    </NuxtLink>
                    <div class="font-mono text-[10px] text-amber-400">
                      {{ att.username }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Regu -->
              <td class="p-3 font-mono">
                <NuxtLink
                  v-if="att.teamId"
                  :to="`/teams/${att.teamId}`"
                  class="inline-block px-1.5 py-0.5 text-[9px] font-bold border border-[#ca8a04]/50 bg-[#2b2014] text-[#facc15] rounded hover:border-[#facc15]"
                >
                  {{ att.teamName || 'Regu' }}
                </NuxtLink>
                <span
                  v-else
                  class="inline-block px-1.5 py-0.5 text-[9px] font-bold border border-gray-600 bg-black/40 text-gray-400 rounded"
                >
                  {{ att.teamName || 'Individu' }}
                </span>
              </td>

              <!-- Karakter -->
              <td class="p-3 font-mono text-[11px] text-gray-300">
                <span class="text-[#c084fc] font-bold">{{ att.characterClass || 'Petualang' }}</span>
                <span v-if="att.characterTier" class="text-[10px] text-muted-foreground ml-1">
                  (T{{ att.characterTier }})
                </span>
              </td>

              <!-- Waktu -->
              <td class="p-3 font-mono">
                <div class="text-foreground font-bold flex items-center gap-1 text-[11px]">
                  <Clock class="h-3 w-3 text-[#f59e0b]" />
                  <span>{{ formatTime(att.scannedAt) }}</span>
                </div>
                <div class="text-[10px] text-muted-foreground">
                  {{ formatDate(att.scannedAt) }}
                </div>
              </td>

              <!-- XP -->
              <td class="p-3 text-center font-mono font-bold text-emerald-400 text-xs">
                +{{ att.xpEarned || 75 }}
              </td>

              <!-- Status -->
              <td class="pr-4 md:pr-6 pl-3 py-3 text-right">
                <span class="px-2 py-0.5 text-[9px] font-pixel border border-[#4ade80] bg-[#16351b] text-[#86efac] rounded inline-flex items-center gap-1">
                  <CheckCircle2 class="h-3 w-3" />
                  <span>HADIR</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sticky Bottom Dashboard Footer: Pixel Pagination -->
      <PixelPagination
        :current-page="attendeePage"
        :total-items="filteredAttendees.length"
        :page-size="attendeePageSize"
        @update:current-page="attendeePage = $event"
        @update:page-size="attendeePageSize = $event; attendeePage = 1"
      />
    </template>

    <!-- Modal: Pratinjau QR Code Stan -->
    <div
      v-if="openQrModal && booth"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono"
    >
      <div class="pixel-card w-full max-w-sm border-2 border-[#9333ea] bg-[#1e1429] p-5 space-y-4 shadow-2xl text-center rounded">
        <div class="border-b border-[#9333ea] pb-2">
          <div class="flex items-center justify-between">
            <span class="font-pixel text-[9px] font-bold text-[#c084fc]">
              QR EXPO
            </span>
            <span class="border border-[#c084fc] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#facc15]">
              {{ booth.boothNumber || booth.code }}
            </span>
          </div>
          <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] mt-1 uppercase tracking-wider truncate">
            {{ booth.name }}
          </h2>
        </div>

        <!-- Big QR Image -->
        <div class="flex flex-col items-center justify-center p-3 bg-white border border-black rounded shadow-inner">
          <img
            :src="getQrImageUrl(booth.qrCode)"
            :alt="booth.code"
            class="h-48 w-48 object-contain"
          />
          <span class="font-mono text-xs text-black font-bold mt-2 tracking-wider">
            {{ booth.qrCode }}
          </span>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#6b21a8]">
          <NuxtLink
            to="/qr-center"
            class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#ca8a04] text-black border-[#facc15] flex items-center justify-center gap-1 hover:bg-[#eab308] cursor-pointer"
          >
            <Printer class="h-3 w-3" />
            <span>CETAK QR</span>
          </NuxtLink>

          <button
            @click="openQrModal = false"
            class="pixel-btn h-8 px-3 text-[10px] font-pixel bg-[#271d15] text-gray-300 border-[#523e2b] hover:bg-[#3d2d1e] cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Form Edit Stan -->
    <div
      v-if="showEditModal && booth"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono"
    >
      <div class="pixel-card w-full max-w-lg border-2 border-[#9333ea] bg-[#1a140f] p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col rounded">
        <!-- Header -->
        <div class="flex items-start justify-between border-b border-[#523e2b] pb-2.5 shrink-0">
          <div>
            <h2 class="font-pixel text-xs sm:text-sm text-[#facc15] uppercase tracking-wider">
              EDIT STAN
            </h2>
            <p class="text-[10px] text-gray-400 mt-0.5">
              {{ formState.name }}
            </p>
          </div>

          <button
            @click="showEditModal = false"
            class="h-7 w-7 rounded bg-[#271d15] border border-[#523e2b] text-gray-400 hover:text-white hover:bg-[#3d2d1e] flex items-center justify-center cursor-pointer"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Form Fields Scrollable -->
        <form @submit.prevent="submitBoothForm" class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 text-xs">
          <!-- Kode Stan & Nomor Booth -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Kode Stan
              </label>
              <input
                v-model="formState.code"
                disabled
                type="text"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground uppercase opacity-60 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Nomor Booth
              </label>
              <input
                v-model="formState.boothNumber"
                type="text"
                placeholder="BOOTH E3-01"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Nama Stan & Singkatan -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div class="sm:col-span-2">
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Nama Stan <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formState.name"
                type="text"
                placeholder="Nama stan..."
                required
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Singkatan
              </label>
              <input
                v-model="formState.shortName"
                type="text"
                placeholder="SINGKATAN"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Kategori & Lantai -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Kategori <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formState.category"
                type="text"
                required
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Lokasi Lantai
              </label>
              <select
                v-model="formState.floorId"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2 text-foreground focus:outline-none focus:border-[#c084fc]"
              >
                <option :value="null">Pilih Lantai...</option>
                <option v-for="f in floors" :key="f.id" :value="f.id">
                  Lantai {{ f.number }} — {{ f.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Deskripsi Stan -->
          <div>
            <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
              Deskripsi Singkat
            </label>
            <textarea
              v-model="formState.description"
              rows="2"
              placeholder="Kegiatan stan..."
              class="w-full bg-[#15100c] border border-[#523e2b] p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]"
            ></textarea>
          </div>

          <!-- Token QR & XP Reward -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Kode QR
              </label>
              <input
                v-model="formState.qrCode"
                type="text"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Reward XP
              </label>
              <input
                v-model.number="formState.xpReward"
                type="number"
                min="0"
                step="5"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Kontak & Instagram -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Narahubung
              </label>
              <input
                v-model="formState.contactPerson"
                type="text"
                placeholder="08123456789"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>

            <div>
              <label class="block font-pixel text-[9px] text-gray-300 mb-1 uppercase">
                Instagram
              </label>
              <input
                v-model="formState.instagram"
                type="text"
                placeholder="@unu_robotik"
                class="h-8 w-full bg-[#15100c] border border-[#523e2b] px-2.5 text-foreground focus:outline-none focus:border-[#c084fc]"
              />
            </div>
          </div>

          <!-- Status Switch -->
          <div class="pt-2 border-t border-[#4a3624] flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsActiveCheck"
              v-model="formState.isActive"
              class="h-4 w-4 rounded accent-[#9333ea] cursor-pointer"
            />
            <label for="editIsActiveCheck" class="text-xs text-gray-200 cursor-pointer">
              Stan aktif dan dapat dipindai saat expo
            </label>
          </div>

          <!-- Modal Action Buttons -->
          <div class="pt-3 border-t border-[#523e2b] flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showEditModal = false"
              class="pixel-btn h-8 px-4 text-xs font-pixel bg-[#271d15] text-gray-300 border-[#523e2b] hover:bg-[#3d2d1e] cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              :disabled="savingForm"
              class="pixel-btn h-8 px-5 text-xs font-pixel font-bold bg-[#9333ea] text-white border-[#c084fc] hover:bg-[#a855f7] cursor-pointer shadow flex items-center gap-1.5"
            >
              <RotateCw v-if="savingForm" class="h-3 w-3 animate-spin" />
              <span>SIMPAN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowLeft,
  Users,
  Pencil,
  RotateCw,
  QrCode,
  Search,
  X,
  Clock,
  CheckCircle2,
  Download,
  Printer,
  AlertTriangle,
  CheckSquare,
} from "lucide-vue-next";
import PixelPagination from "@/components/PixelPagination.vue";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";

const route = useRoute();
const api = useApi();
const toast = useToast();
const boothId = computed(() => route.params.id as string);

// State
const loading = ref(false);
const loadingAttendees = ref(false);
const booth = ref<any>(null);
const attendees = ref<any[]>([]);
const floors = ref<any[]>([]);

// Selection State
const selectedAttendeeIds = ref<string[]>([]);

// Pagination
const attendeePage = ref(1);
const attendeePageSize = ref(25);

// Filter states
const searchQuery = ref("");
const selectedTeam = ref("");
const copied = ref(false);

// Modals
const openQrModal = ref(false);
const showEditModal = ref(false);
const savingForm = ref(false);
const formState = reactive({
  code: "",
  name: "",
  shortName: "",
  category: "",
  floorId: null as string | null,
  boothNumber: "",
  description: "",
  qrCode: "",
  xpReward: 75,
  contactPerson: "",
  instagram: "",
  isActive: true,
});

// Computed Available Teams
const availableTeams = computed(() => {
  const set = new Set<string>();
  attendees.value.forEach((a) => {
    if (a.teamName) set.add(a.teamName);
  });
  return Array.from(set).sort();
});

// Filtered Attendees
const filteredAttendees = computed(() => {
  return attendees.value.filter((a) => {
    if (selectedTeam.value && a.teamName !== selectedTeam.value) {
      return false;
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = a.fullName?.toLowerCase().includes(q);
      const matchNim = a.username?.toLowerCase().includes(q);
      const matchTeam = a.teamName?.toLowerCase().includes(q);
      if (!matchName && !matchNim && !matchTeam) return false;
    }
    return true;
  });
});

const paginatedAttendees = computed(() => {
  const start = (attendeePage.value - 1) * attendeePageSize.value;
  return filteredAttendees.value.slice(start, start + attendeePageSize.value);
});

// Selection Helpers
const isAllAttendeesSelected = computed(() => {
  if (paginatedAttendees.value.length === 0) return false;
  return paginatedAttendees.value.every((a) => selectedAttendeeIds.value.includes(a.scanId));
});

function toggleSelectAllAttendees() {
  if (isAllAttendeesSelected.value) {
    selectedAttendeeIds.value = selectedAttendeeIds.value.filter(
      (id) => !paginatedAttendees.value.some((a) => a.scanId === id)
    );
  } else {
    const toAdd = paginatedAttendees.value
      .map((a) => a.scanId)
      .filter((id) => !selectedAttendeeIds.value.includes(id));
    selectedAttendeeIds.value.push(...toAdd);
  }
}

function toggleSelectAttendee(id: string) {
  const idx = selectedAttendeeIds.value.indexOf(id);
  if (idx > -1) {
    selectedAttendeeIds.value.splice(idx, 1);
  } else {
    selectedAttendeeIds.value.push(id);
  }
}

// Metrics
const totalAttendees = computed(() => attendees.value.length);
const totalXpEarned = computed(() => {
  return attendees.value.reduce((acc, a) => acc + (a.xpEarned || 75), 0);
});
const uniqueTeamsCount = computed(() => availableTeams.value.length);

// Data Fetching
async function fetchFloors() {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>("/api/floors");
    if (res?.success && Array.isArray(res.data)) {
      floors.value = res.data;
    }
  } catch (err) {
    console.error("Gagal memuat data lantai:", err);
  }
}

async function fetchBoothDetail() {
  if (!boothId.value) return;
  loading.value = true;
  try {
    const res = await api.get<{ success: boolean; data: any }>(`/api/ormawa/booths/${boothId.value}`);
    if (res?.success && res.data) {
      booth.value = res.data;
    }
  } catch (err) {
    console.error("Gagal memuat detail stan ormawa:", err);
    booth.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchAttendees() {
  if (!boothId.value) return;
  loadingAttendees.value = true;
  try {
    const res = await api.get<{ success: boolean; data: { attendees: any[] } }>(`/api/ormawa/booths/${boothId.value}/visitors`);
    if (res?.success && res.data?.attendees) {
      attendees.value = res.data.attendees;
    }
  } catch (err) {
    console.error("Gagal memuat rekap presensi stan:", err);
  } finally {
    loadingAttendees.value = false;
  }
}

// Actions
async function toggleBoothStatus() {
  if (!booth.value) return;
  const newStatus = !booth.value.isActive;
  try {
    await api.put(`/api/ormawa/booths/${booth.value.id}`, { isActive: newStatus });
    booth.value.isActive = newStatus;
    toast.info(`Stan "${booth.value.name}" sekarang ${newStatus ? 'aktif' : 'nonaktif'}.`);
  } catch (err) {
    toast.error("Gagal mengubah status stan.");
  }
}

function openEditModal() {
  if (!booth.value) return;
  formState.code = booth.value.code;
  formState.name = booth.value.name;
  formState.shortName = booth.value.shortName || "";
  formState.category = booth.value.category;
  formState.floorId = booth.value.floorId || null;
  formState.boothNumber = booth.value.boothNumber || "";
  formState.description = booth.value.description || "";
  formState.qrCode = booth.value.qrCode || "";
  formState.xpReward = booth.value.xpReward || 75;
  formState.contactPerson = booth.value.contactPerson || "";
  formState.instagram = booth.value.instagram || "";
  formState.isActive = booth.value.isActive;
  showEditModal.value = true;
}

async function submitBoothForm() {
  if (!booth.value) return;
  savingForm.value = true;
  try {
    const res = await api.put(`/api/ormawa/booths/${booth.value.id}`, {
      name: formState.name,
      shortName: formState.shortName || null,
      category: formState.category,
      floorId: formState.floorId || null,
      boothNumber: formState.boothNumber || null,
      description: formState.description || null,
      qrCode: formState.qrCode || undefined,
      xpReward: formState.xpReward,
      contactPerson: formState.contactPerson || null,
      instagram: formState.instagram || null,
      isActive: formState.isActive,
    });

    if (res?.success && res.data) {
      booth.value = { ...booth.value, ...res.data };
    }
    showEditModal.value = false;
    toast.success(`Informasi stan "${formState.name}" berhasil diperbarui.`);
    await fetchBoothDetail();
  } catch (err: any) {
    toast.error(err?.data?.error?.message || err?.message || "Gagal menyimpan perubahan stan.");
  } finally {
    savingForm.value = false;
  }
}

function copyQrToken() {
  if (!booth.value?.qrCode) return;
  navigator.clipboard.writeText(booth.value.qrCode);
  copied.value = true;
  toast.success(`Token QR "${booth.value.qrCode}" disalin ke clipboard.`);
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function getQrImageUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(code || '')}`;
}

// CSV Export
function exportSelectedAttendanceCsv() {
  const toExport = attendees.value.filter((a) => selectedAttendeeIds.value.includes(a.scanId));
  if (toExport.length === 0) return;
  generateCsvDownload(toExport, `presensi-${booth.value?.code || 'stan'}-terpilih-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${toExport.length} data terpilih.`);
}

function exportAllAttendanceCsv() {
  if (!booth.value || filteredAttendees.value.length === 0) {
    toast.warning("Tidak ada data presensi untuk diexport.");
    return;
  }
  generateCsvDownload(filteredAttendees.value, `presensi-${booth.value.code}-${Date.now()}.csv`);
  toast.success(`Berhasil mengunduh ${filteredAttendees.value.length} baris.`);
}

function generateCsvDownload(rows: any[], filename: string) {
  const headers = ["No", "NIM", "Nama Lengkap", "Regu / Tim", "Kelas Karakter", "Tier", "Waktu Scan", "XP Didapat"];
  const csvContent = [
    headers.join(","),
    ...rows.map((a, i) =>
      [
        i + 1,
        `"${a.username || ''}"`,
        `"${(a.fullName || '').replace(/"/g, '""')}"`,
        `"${(a.teamName || 'Independen').replace(/"/g, '""')}"`,
        `"${a.characterClass || 'Petualang'}"`,
        `"Tier ${a.characterTier || 1}"`,
        `"${formatDateTime(a.scannedAt)}"`,
        a.xpEarned || 75,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Formatters
function formatTime(isoString: string) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoString: string) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function formatDateTime(isoString: string) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

onMounted(() => {
  fetchFloors();
  fetchBoothDetail();
  fetchAttendees();
});
</script>
