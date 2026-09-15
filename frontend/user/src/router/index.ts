import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import DashboardView from '@/views/DashboardView.vue';
import Floor1View from '@/views/Floor1View.vue';
import PlayView from '@/views/PlayView.vue';
import FloorIntroView from '@/views/FloorIntroView.vue';
import LinearSpotView from '@/views/LinearSpotView.vue';
import FloorCompleteView from '@/views/FloorCompleteView.vue';
import BoothDetailView from '@/views/BoothDetailView.vue';
import PasporView from '@/views/PasporView.vue';
import LeaderboardView from '@/views/LeaderboardView.vue';
import BantuanView from '@/views/BantuanView.vue';
import AttendanceView from '@/views/AttendanceView.vue';
import OrmawaExpoView from '@/views/OrmawaExpoView.vue';
import ProfileView from '@/views/ProfileView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/floor/1',
    name: 'floor-1',
    component: Floor1View,
  },
  {
    path: '/floor/2',
    name: 'floor-2',
    component: () => import('@/views/Floor2View.vue'),
  },
  {
    path: '/floor/:floorId',
    redirect: (to) => `/play/floor/${to.params.floorId || 1}/intro`,
  },
  {
    path: '/peta',
    name: 'peta',
    alias: ['/map'],
    component: () => import('@/views/PetaView.vue'),
  },
  {
    path: '/play',
    name: 'play',
    alias: ['/onboard', '/menu', '/main'],
    component: PlayView,
  },
  {
    path: '/play/floor/:floorId/intro',
    name: 'floor-intro',
    component: FloorIntroView,
  },
  {
    path: '/play/floor/:floorId/spot/:spotId',
    name: 'linear-spot',
    component: LinearSpotView,
  },
  {
    path: '/play/floor/:floorId/complete',
    name: 'floor-complete',
    component: FloorCompleteView,
  },
  {
    path: '/booth/:id',
    name: 'booth-detail',
    component: BoothDetailView,
  },
  {
    path: '/paspor',
    name: 'paspor',
    alias: ['/passport', '/passpor', '/stamps', '/stempel'],
    component: PasporView,
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: LeaderboardView,
  },
  {
    path: '/presensi',
    name: 'presensi',
    alias: ['/attendance'],
    component: AttendanceView,
  },
  {
    path: '/ormawa',
    name: 'ormawa',
    alias: ['/expo'],
    component: OrmawaExpoView,
  },
  {
    path: '/bantuan',
    name: 'bantuan',
    alias: ['/help', '/panduan'],
    component: BantuanView,
  },
  {
    path: '/profile',
    name: 'profile',
    alias: ['/profil', '/ktm'],
    component: ProfileView,
  },
  {
    path: '/team',
    name: 'team',
    alias: ['/regu', '/kelompok', '/my-team'],
    component: () => import('@/views/TeamView.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

/**
 * Navigation Guard (Auth Middleware):
 * Seluruh halaman eksplorasi, game, paspor, leaderboard, presensi, profil, dan booth
 * mewajibkan peserta telah masuk (minimal login). Hanya landing page ('/' / name: 'home')
 * yang dapat diakses publik tanpa login.
 */
router.beforeEach((to, _from, next) => {
  // 1. Landing page ('/' atau route dengan nama 'home') bersifat publik
  if (to.path === '/' || to.name === 'home') {
    return next();
  }

  // 2. Periksa status autentikasi melalui JWT token atau state login maba
  const token = localStorage.getItem('genius_user_token');
  const rawState = localStorage.getItem('genius_game_state_2026');
  let isAuthenticated = Boolean(token);

  if (!isAuthenticated && rawState) {
    try {
      const parsed = JSON.parse(rawState);
      isAuthenticated = Boolean(parsed.isLoggedIn && (parsed.participant?.nim || parsed.participant?.id));
    } catch {
      // Abaikan error parsing JSON
    }
  }

  // 3. Jika belum login, redirect ke Landing Page dengan query auth=required dan url tujuan
  if (!isAuthenticated) {
    return next({
      path: '/',
      query: {
        auth: 'required',
        redirect: to.fullPath,
      },
    });
  }

  next();
});

export default router;
