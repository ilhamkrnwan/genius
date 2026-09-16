export type OrmawaCategory =
  | 'BELA_DIRI'
  | 'TEKNOLOGI'
  | 'SENI_BUDAYA'
  | 'SOSIAL_KEMANUSIAAN'
  | 'OLAHRAGA'
  | 'PENALARAN_KEISLAMAN'
  | 'Himpunan Mahasiswa'
  | 'Seni & Musik'
  | 'Seni & Vokal'
  | 'Seni & Budaya'
  | 'Keagamaan & Bahasa'
  | 'Olahraga'
  | 'Pecinta Alam & Lingkungan'
  | 'Olahraga & Seni Beladiri'
  | 'Sosial & Kemanusiaan'
  | 'Organisasi Daerah & Kebudayaan'
  | (string & {});

export interface OrmawaStand {
  id: string;
  name: string;
  shortName: string;
  category: OrmawaCategory;
  floor: number;
  location: string;
  qrToken: string;
  tagline: string;
  description: string;
  instagram: string;
  activities: string[];
  requirements: string[];
  stampInstructions?: string[];
  xpReward?: number;
  contactPerson?: string;
  contactPhone?: string;
  logoUrl?: string;
  badgeTitle?: string;
  badgeColor?: string;
}

export interface OrmawaInterest {
  id: string;
  boothId: string;
  participantId: string;
  phoneNumber: string;
  instagramUsername: string;
  motivation?: string;
  experience?: string;
  xpBonusEarned: number;
  createdAt: string;
}

export interface OrmawaInterestPayload {
  boothId: string;
  phoneNumber: string;
  instagramUsername: string;
  motivation?: string;
  experience?: string;
}

export interface OrmawaScanResult {
  success: boolean;
  message: string;
  xpEarned: number;
  stand?: OrmawaStand;
  isCapped?: boolean;
}
