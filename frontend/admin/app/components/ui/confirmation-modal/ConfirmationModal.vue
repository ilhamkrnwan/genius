<template>
  <Dialog :open="modelOpen" @update:open="onOpenChange">
    <DialogContent
      class="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !z-[99999] w-[calc(100%-2rem)] max-w-md p-6 rounded-xl border-2 backdrop-blur-xl duration-200 shadow-2xl overflow-hidden"
      :class="containerClasses"
    >
      <!-- Top Decorative Ambient Glow -->
      <div
        class="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-2xl pointer-events-none opacity-40"
        :class="ambientGlowClasses"
      />

      <!-- Modal Inner Container -->
      <div class="relative z-10 space-y-4">
        <!-- Top Visual Badge + Title -->
        <div class="flex items-start gap-3.5">
          <!-- Icon Badge -->
          <div
            class="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border text-base shadow-lg transition-transform"
            :class="badgeClasses"
          >
            <!-- Logout Icon -->
            <LogOut v-if="activeIcon === 'logout'" class="h-5 w-5" />
            <!-- Trash Icon -->
            <Trash2 v-else-if="activeIcon === 'trash'" class="h-5 w-5" />
            <!-- Shield Icon -->
            <ShieldAlert v-else-if="activeIcon === 'shield'" class="h-5 w-5" />
            <!-- Info Icon -->
            <Info v-else-if="activeIcon === 'info'" class="h-5 w-5" />
            <!-- Check Icon -->
            <CheckCircle2 v-else-if="activeIcon === 'check'" class="h-5 w-5" />
            <!-- Default Alert Triangle -->
            <AlertTriangle v-else class="h-5 w-5" />
          </div>

          <!-- Title & Sub-badge -->
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 font-pixel text-[10px] tracking-wider uppercase rounded border font-bold"
                :class="tagClasses"
              >
                {{ tagLabel }}
              </span>
            </div>
            <DialogTitle class="font-sans font-bold text-base sm:text-lg text-white leading-snug tracking-tight">
              {{ activeTitle }}
            </DialogTitle>
          </div>
        </div>

        <!-- Description -->
        <DialogDescription class="font-sans text-sm text-stone-300/90 leading-relaxed">
          {{ activeDescription }}
        </DialogDescription>

        <!-- Footer Buttons -->
        <DialogFooter class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            @click="onCancel"
            class="h-10 px-4 rounded-lg font-sans text-xs sm:text-sm font-medium text-stone-300 bg-[#281c13] hover:bg-[#3b2b1d] border border-[#523d2b] hover:text-white transition-all cursor-pointer flex items-center justify-center active:scale-[0.98]"
          >
            {{ activeCancelText }}
          </button>

          <button
            type="button"
            :disabled="activeLoading"
            @click="onConfirm"
            class="h-10 px-5 rounded-lg font-sans text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            :class="confirmBtnClasses"
          >
            <RotateCw v-if="activeLoading" class="h-4 w-4 animate-spin" />
            <LogOut v-else-if="activeIcon === 'logout'" class="h-4 w-4" />
            <Trash2 v-else-if="activeIcon === 'trash'" class="h-4 w-4" />
            <CheckCircle2 v-else-if="activeIcon === 'check'" class="h-4 w-4" />
            <span>{{ activeConfirmText }}</span>
          </button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  LogOut,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Info,
  CheckCircle2,
  RotateCw,
} from "lucide-vue-next";
import { useConfirm } from "~/composables/useConfirm";

interface Props {
  open?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  icon?: "logout" | "alert" | "trash" | "shield" | "info" | "check";
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: undefined,
  title: undefined,
  description: undefined,
  confirmText: undefined,
  cancelText: undefined,
  variant: undefined,
  icon: undefined,
  loading: undefined,
});

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const globalConfirm = useConfirm();

// Resolve controlled vs global composable state
const modelOpen = computed(() => {
  return props.open !== undefined ? props.open : globalConfirm.isOpen.value;
});

const activeTitle = computed(() => {
  return props.title ?? globalConfirm.options.value.title;
});

const activeDescription = computed(() => {
  return props.description ?? globalConfirm.options.value.description;
});

const activeConfirmText = computed(() => {
  return props.confirmText ?? globalConfirm.options.value.confirmText ?? "Konfirmasi";
});

const activeCancelText = computed(() => {
  return props.cancelText ?? globalConfirm.options.value.cancelText ?? "Batal";
});

const activeVariant = computed(() => {
  return props.variant ?? globalConfirm.options.value.variant ?? "primary";
});

const activeIcon = computed(() => {
  return props.icon ?? globalConfirm.options.value.icon ?? "alert";
});

const activeLoading = computed(() => {
  return props.loading ?? globalConfirm.options.value.loading ?? false;
});

// Container theme classes based on activeVariant
const containerClasses = computed(() => {
  switch (activeVariant.value) {
    case "danger":
      return "border-red-500/70 bg-gradient-to-b from-[#221010] via-[#1a0c0c] to-[#120707] shadow-[0_0_40px_rgba(239,68,68,0.25)] text-stone-100";
    case "warning":
      return "border-amber-500/70 bg-gradient-to-b from-[#24170c] via-[#1a1008] to-[#120b05] shadow-[0_0_40px_rgba(245,158,11,0.25)] text-stone-100";
    case "info":
      return "border-sky-500/70 bg-gradient-to-b from-[#0e1822] via-[#091119] to-[#050b10] shadow-[0_0_40px_rgba(14,165,233,0.25)] text-stone-100";
    case "primary":
    default:
      return "border-[#ca8a04]/70 bg-gradient-to-b from-[#1f160e] via-[#160f0a] to-[#0f0a06] shadow-[0_0_40px_rgba(202,138,4,0.25)] text-stone-100";
  }
});

const ambientGlowClasses = computed(() => {
  switch (activeVariant.value) {
    case "danger":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    case "info":
      return "bg-sky-500";
    case "primary":
    default:
      return "bg-amber-500";
  }
});

// UI helpers
const badgeClasses = computed(() => {
  switch (activeVariant.value) {
    case "danger":
      return "border-red-500/60 bg-gradient-to-br from-red-950/90 to-red-900/30 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.35)]";
    case "warning":
      return "border-amber-500/60 bg-gradient-to-br from-amber-950/90 to-amber-900/30 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)]";
    case "info":
      return "border-sky-500/60 bg-gradient-to-br from-sky-950/90 to-sky-900/30 text-sky-400 shadow-[0_0_16px_rgba(14,165,233,0.35)]";
    case "primary":
    default:
      return "border-emerald-500/60 bg-gradient-to-br from-emerald-950/90 to-emerald-900/30 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]";
  }
});

const tagClasses = computed(() => {
  switch (activeVariant.value) {
    case "danger":
      return "border-red-500/50 bg-red-950/70 text-red-300";
    case "warning":
      return "border-amber-500/50 bg-amber-950/70 text-amber-300";
    case "info":
      return "border-sky-500/50 bg-sky-950/70 text-sky-300";
    case "primary":
    default:
      return "border-emerald-500/50 bg-emerald-950/70 text-emerald-300";
  }
});

const tagLabel = computed(() => {
  if (activeIcon.value === "logout") return "Sesi Keluar";
  if (activeIcon.value === "trash") return "Hapus Data";
  switch (activeVariant.value) {
    case "danger":
      return "Peringatan";
    case "warning":
      return "Perhatian";
    case "info":
      return "Informasi";
    case "primary":
    default:
      return "Konfirmasi";
  }
});

const confirmBtnClasses = computed(() => {
  switch (activeVariant.value) {
    case "danger":
      return "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-400/50 shadow-red-950/60 hover:shadow-red-900/70";
    case "warning":
      return "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-400/50 shadow-amber-950/60 hover:shadow-amber-900/70";
    case "info":
      return "bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white border border-sky-400/50 shadow-sky-950/60 hover:shadow-sky-900/70";
    case "primary":
    default:
      return "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border border-emerald-400/50 shadow-emerald-950/60 hover:shadow-emerald-900/70";
  }
});

function onConfirm() {
  if (props.open !== undefined) {
    emit("confirm");
  } else {
    globalConfirm.handleConfirm();
  }
}

function onCancel() {
  if (props.open !== undefined) {
    emit("cancel");
    emit("update:open", false);
  } else {
    globalConfirm.handleCancel();
  }
}

function onOpenChange(val: boolean) {
  if (!val) {
    onCancel();
  }
}
</script>
