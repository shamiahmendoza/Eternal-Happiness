import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/Home/HomeView.vue'
import PhotosView from '../views/Photo/PhotosView.vue'
import VideosView from '../views/Video/VideosView.vue'
import MemoriesView from '../views/Memories/MemoriesView.vue'
import AboutView from '../views/About/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/photos', component: PhotosView },
    { path: '/videos', component: VideosView },
    { path: '/memories', component: MemoriesView },
    { path: '/about', component: AboutView }
  ]
})

export default router
