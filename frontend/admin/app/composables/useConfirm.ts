import { ref } from "vue";

export interface ConfirmOptions {
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  icon?: "logout" | "alert" | "trash" | "shield" | "info" | "check";
  loading?: boolean;
}

const isOpen = ref(false);
const isBusy = ref(false);
const options = ref<ConfirmOptions>({
  title: "Konfirmasi Tindakan",
  description: "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmText: "Konfirmasi",
  cancelText: "Batal",
  variant: "primary",
  icon: "alert",
  loading: false,
});

let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirm() {
  function show(opts: ConfirmOptions): Promise<boolean> {
    // Intelligent auto-defaulting
    const inferredVariant: "danger" | "warning" | "info" | "primary" =
      opts.variant ||
      (opts.icon === "logout" || opts.icon === "trash" ? "danger" : "primary");

    const inferredIcon =
      opts.icon ||
      (inferredVariant === "danger"
        ? "alert"
        : inferredVariant === "info"
        ? "info"
        : "alert");

    const inferredConfirmText =
      opts.confirmText ||
      (opts.icon === "logout"
        ? "Ya, Keluar"
        : inferredVariant === "danger"
        ? "Ya, Lanjutkan"
        : "Konfirmasi");

    options.value = {
      variant: inferredVariant,
      icon: inferredIcon,
      confirmText: inferredConfirmText,
      cancelText: opts.cancelText || "Batal",
      loading: false,
      ...opts,
      title: opts.title || "Konfirmasi Tindakan",
      description: opts.description || opts.message || "Apakah Anda yakin ingin melanjutkan?",
    };

    isOpen.value = true;
    isBusy.value = false;

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  }

  const ask = show;

  function danger(opts: Omit<ConfirmOptions, "variant">): Promise<boolean> {
    return show({ ...opts, variant: "danger" });
  }

  function warning(opts: Omit<ConfirmOptions, "variant">): Promise<boolean> {
    return show({ ...opts, variant: "warning" });
  }

  function handleConfirm() {
    isOpen.value = false;
    isBusy.value = false;
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
  }

  function handleCancel() {
    isOpen.value = false;
    isBusy.value = false;
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  }

  return {
    isOpen,
    isBusy,
    options,
    show,
    ask,
    danger,
    warning,
    handleConfirm,
    handleCancel,
  };
}

// Alias for developers looking for useConfirmModal
export const useConfirmModal = useConfirm;
