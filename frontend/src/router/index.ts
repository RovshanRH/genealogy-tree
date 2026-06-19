// frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import FamilyTreeView from '@/views/FamilyTreeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: FamilyTreeView,
    },
    {
      path: '/tree/:id',
      name: 'tree',
      component: FamilyTreeView,
      props: true,
    },
  ],
});

export default router;