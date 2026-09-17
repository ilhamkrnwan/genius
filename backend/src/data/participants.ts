/**
 * @deprecated
 * Data peserta maba statis (100 dummy) telah digantikan oleh dataset resmi 403 mahasiswa baru
 * yang dimuat secara dinamis dari `maba_2026.csv` di root repository melalui script seeder.
 */

export interface ParticipantSeed {
  nim: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  faculty: string;
  prodi: string;
  characterClass: "CYBER_KNIGHT" | "DATA_WIZARD" | "TECH_MONK" | "QUANTUM_SAGE" | "BIO_ALCHEMIST";
  teamIndex: number;
  isCaptain: boolean;
}

export const OFFICIAL_PARTICIPANTS: ParticipantSeed[] = [];
