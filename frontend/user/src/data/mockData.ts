import {
  Floor,
  Booth,
  Participant,
  LevelInfo,
} from '../types/game';
import {
  OFFICIAL_LEVEL_CONFIG,
  OFFICIAL_FLOORS_DATA,
  OFFICIAL_BOOTHS_MAP,
} from './genius2026QuizData';

export const LEVEL_CONFIG: LevelInfo[] = OFFICIAL_LEVEL_CONFIG;

export const FLOORS_DATA: Floor[] = OFFICIAL_FLOORS_DATA;

export const BOOTHS_DATA: Record<string, Booth> = OFFICIAL_BOOTHS_MAP;

export const UNU_FACULTIES = [
  {
    name: 'Fakultas Industri Halal',
    prodi: ['Agribisnis', 'Teknologi Hasil Pertanian', 'Farmasi'],
  },
  {
    name: 'Fakultas Teknologi Informasi',
    prodi: ['Informatika', 'Teknik Elektro'],
  },
  {
    name: 'Fakultas Ilmu Pendidikan',
    prodi: ['PGSD', 'Pendidikan Bahasa Inggris'],
  },
  {
    name: 'Fakultas Ekonomi',
    prodi: ['Manajemen', 'Akuntansi'],
  },
  {
    name: 'Fakultas Dirasah Islamiyah',
    prodi: ['Studi Islam Interdisipliner'],
  },
];

export const GENIUS_GROUPS = [
  { id: 'group-01', name: 'Jabu' },
  { id: 'group-02', name: 'Bolon' },
  { id: 'group-03', name: 'Gadang' },
  { id: 'group-04', name: 'Limas' },
  { id: 'group-05', name: 'Lontik' },
  { id: 'group-06', name: 'Kajang' }, { id: 'group-07', name: 'Bubung' }, { id: 'group-08', name: 'Panggung' }, { id: 'group-09', name: 'Nuwo' }, { id: 'group-10', name: 'Baduy' },
  { id: 'group-11', name: 'Gudang' }, { id: 'group-12', name: 'Bapang' }, { id: 'group-13', name: 'Joglo' }, { id: 'group-14', name: 'Kampung' }, { id: 'group-15', name: 'Panggang' },
  { id: 'group-16', name: 'Jompongan' }, { id: 'group-17', name: 'Jolopong' }, { id: 'group-18', name: 'Julang' }, { id: 'group-19', name: 'Tagog' }, { id: 'group-20', name: 'Badak' },
  { id: 'group-21', name: 'Capit' }, { id: 'group-22', name: 'Jubleg' }, { id: 'group-23', name: 'Tikel' }, { id: 'group-24', name: 'Baresan' }, { id: 'group-25', name: 'Crocogan' },
  { id: 'group-26', name: 'Tengger' }, { id: 'group-27', name: 'Bale' }, { id: 'group-28', name: 'Lumbung' }, { id: 'group-29', name: 'Uma' }, { id: 'group-30', name: 'Omo' },
  { id: 'group-31', name: 'Sebua' }, { id: 'group-32', name: 'Hada' }, { id: 'group-33', name: 'Betang' }, { id: 'group-34', name: 'Lamin' }, { id: 'group-35', name: 'Baloy' },
  { id: 'group-36', name: 'Banjar' }, { id: 'group-37', name: 'Tambi' }, { id: 'group-38', name: 'Laika' }, { id: 'group-39', name: 'Boyang' }, { id: 'group-40', name: 'Buton' },
  { id: 'group-41', name: 'Lego' }, { id: 'group-42', name: 'Lopo' }, { id: 'group-43', name: 'Mbaru' }, { id: 'group-44', name: 'Sao' }, { id: 'group-45', name: 'Musalaki' },
  { id: 'group-46', name: 'Uma' }, { id: 'group-47', name: 'Honai' }, { id: 'group-48', name: 'Lopo' }, { id: 'group-49', name: 'Baileo' }, { id: 'group-50', name: 'Sasadu' },
];

export const INITIAL_PARTICIPANT: Participant = {
  name: '',
  nim: '',
  prodi: '',
  faculty: '',
  avatar: 'character_cowok',
  gender: 'MALE',
  totalXp: 0,
  completedBooths: [],
  stamps: {},
  unlockedFloors: [1],
  groupId: '',
  groupName: '',
  isRegistered: false,
};

export const AVATAR_OPTIONS = [
  {
    id: 'character_cowok',
    name: 'Mahasiswa Baru (Pria)',
    gender: 'pria',
    title: 'Calon Generasi Baru UNU (Pria)',
    image: '/character-cowok.avif',
    avatarImage: '/character-cowok-avatar.png',
    desc: 'Karakter Pria (Peci Hitam & Jas Almamater UNU)',
  },
  {
    id: 'character_cewek',
    name: 'Mahasiswa Baru (Wanita)',
    gender: 'wanita',
    title: 'Calon Generasi Baru UNU (Wanita)',
    image: '/character-cewek.avif',
    avatarImage: '/character-cewek-avatar.png',
    desc: 'Karakter Wanita (Hijab Putih & Jas Almamater UNU)',
  },
];
