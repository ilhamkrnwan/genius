import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import QRCode from "qrcode";

export interface DynamicQrCard {
  code: string;
  name?: string;
  title?: string;
  subtitle?: string;
  [key: string]: any;
}

// Global shared state agar timer tersinkronisasi di seluruh halaman admin
const autoRefreshEnabled = ref<boolean>(true);
const remainingSeconds = ref<number>(300); // 5 menit = 300 detik
const intervalDuration = 300; // 5 menit
const saltMap = ref<Record<string, string>>({});
const qrDataUrlCache = ref<Record<string, string>>({});
let timerInstance: ReturnType<typeof setInterval> | null = null;

// Fungsi pembuat salt acak 4 karakter huruf besar dan angka
function generateSalt(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useDynamicQr() {
  // Mendapatkan token lengkap (statis atau dinamis dengan salt)
  function getDynamicToken(baseCode: string): string {
    if (!baseCode) return "";
    if (!autoRefreshEnabled.value) {
      return baseCode; // Mode statis bersih untuk cetak A4
    }
    if (!saltMap.value[baseCode]) {
      saltMap.value[baseCode] = generateSalt();
    }
    return `${baseCode}-${saltMap.value[baseCode]}`;
  }

  // Mengacak ulang salt untuk seluruh kode dan reset timer
  function randomizeAll(baseCodes?: string[]) {
    const updatedMap: Record<string, string> = { ...saltMap.value };

    if (baseCodes && baseCodes.length > 0) {
      for (const code of baseCodes) {
        updatedMap[code] = generateSalt();
      }
    } else {
      // Perbarui semua yang sudah terdaftar
      for (const code of Object.keys(updatedMap)) {
        updatedMap[code] = generateSalt();
      }
    }

    saltMap.value = updatedMap;
    remainingSeconds.value = intervalDuration;
    qrDataUrlCache.value = {}; // Invalidate cache QR
  }

  // Toggle pembaruan otomatis
  function toggleAutoRefresh(forcedState?: boolean) {
    if (forcedState !== undefined) {
      autoRefreshEnabled.value = forcedState;
    } else {
      autoRefreshEnabled.value = !autoRefreshEnabled.value;
    }

    if (autoRefreshEnabled.value) {
      // Jika diaktifkan kembali dan timer sudah habis/rendah, reset ke 300
      if (remainingSeconds.value <= 0) {
        remainingSeconds.value = intervalDuration;
      }
      startTimer();
    } else {
      stopTimer();
    }
  }

  // Menjalankan hitung mundur 1 detik
  function startTimer() {
    if (timerInstance) return;
    timerInstance = setInterval(() => {
      if (!autoRefreshEnabled.value) return;

      if (remainingSeconds.value > 0) {
        remainingSeconds.value -= 1;
      } else {
        // Waktu 5 menit habis -> Otomatis acak kode baru dan reset ke 300 detik
        randomizeAll();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInstance) {
      clearInterval(timerInstance);
      timerInstance = null;
    }
  }

  // Generate Data URL QR Code secara offline instan menggunakan pustaka qrcode
  async function renderQrDataUrl(text: string): Promise<string> {
    if (!text) return "";
    if (qrDataUrlCache.value[text]) {
      return qrDataUrlCache.value[text];
    }

    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 380,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
      qrDataUrlCache.value[text] = dataUrl;
      return dataUrl;
    } catch (err) {
      console.warn("[QRCode] Fallback ke external API:", err);
      // Fallback transparan jika terjadi kendala canvas
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(text)}`;
      qrDataUrlCache.value[text] = fallbackUrl;
      return fallbackUrl;
    }
  }

  // Format MM:SS (e.g. "04:59")
  const formattedCountdown = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  });

  // Persentase sisa waktu (0% s/d 100%)
  const progressPercentage = computed(() => {
    return Math.max(0, Math.min(100, (remainingSeconds.value / intervalDuration) * 100));
  });

  // Inisialisasi timer otomatis
  if (autoRefreshEnabled.value && !timerInstance) {
    startTimer();
  }

  return {
    autoRefreshEnabled,
    remainingSeconds,
    intervalDuration,
    saltMap,
    formattedCountdown,
    progressPercentage,
    getDynamicToken,
    randomizeAll,
    toggleAutoRefresh,
    renderQrDataUrl,
    startTimer,
    stopTimer,
  };
}
