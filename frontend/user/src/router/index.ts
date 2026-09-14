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

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/play',
    alias: ['/dashboard', '/main'],
    name: 'play',
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
    alias: ['/passport', '/passpor', '/stamps', '/stempel'],
    name: 'paspor',
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
    component: AttendanceView,
  },
  {
    path: '/ormawa',
    name: 'ormawa',
    component: OrmawaExpoView,
  },
  {
    path: '/bantuan',
    name: 'bantuan',
    component: BantuanView,
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

export default router;
