import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SurveyView from '../views/SurveyView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { parseSurveyLink } from '../models/shareLink'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/s/:id', name: 'survey', component: SurveyView },
    { path: '/demo', name: 'demo', component: SurveyView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
router.beforeEach(to => {
  if (to.name === 'survey' && !parseSurveyLink(String(to.params.id))) {
    return '/not-found'
  }
  if (to.name === 'home') document.title = '微问卷 · 让每一份想法都被听见'
})
