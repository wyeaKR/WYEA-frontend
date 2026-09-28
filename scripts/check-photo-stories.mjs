import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'

// Exercise the real component state and rendered links without a browser or API writes.
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { default: Photo } = await server.ssrLoadModule('/src/components/HomeViewPhoto.vue')
  const { default: Detail } = await server.ssrLoadModule('/src/views/ActivitiesView.vue')
  const { activities, homeActivityPhotos } = await server.ssrLoadModule('/src/content/activities.ts')
  assert.ok(homeActivityPhotos.length > 0)
  for (const photo of homeActivityPhotos) {
    const stories = activities.filter(story => story.path === photo.path && story.photos.includes(photo.src))
    assert.equal(stories.length, 1, 'Each displayed photo must belong to its linked story')
    assert.equal(photo.title, stories[0].title)
  }

  async function renderPhoto(change) {
    const component = { ...Photo, setup(props, context) {
      const state = Photo.setup(props, context)
      change(state)
      return state
    } }
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component }, ...activities.map(story => ({ path: story.path, component: Detail })),
    ] })
    const app = createSSRApp(component).use(router)
    await router.push('/')
    await router.isReady()
    return renderToString(app)
  }

  // The September 23 design uses pagination and autoplay, without story buttons or swipe controls.
  for (let index = 0; index < homeActivityPhotos.length; index++) {
    const html = await renderPhoto(state => {
      assert.equal(state.photos.length, homeActivityPhotos.length);
      state.activeIndex.value = index;
      assert.equal(state.nextIndex.value, (index + 1) % homeActivityPhotos.length);
    });
    assert.equal([...html.matchAll(/class="[^"]*is-current[^"]*"/g)].length, 1);
    assert.ok(html.includes('photo-pagination'));
    assert.ok(!html.includes('photo-swipe-area'));
    assert.ok(!html.includes('photo-story-button'));
  }

  for (const path of new Set(homeActivityPhotos.map(photo => photo.path))) {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path, component: Detail, meta: { activityDetail: true } },
      { path: '/activities', component: Detail },
    ] })
    const app = createSSRApp(Detail).use(router)
    await router.push(path)
    await router.isReady()
    const html = await renderToString(app)
    assert.match(html, /<h1 id="activity-title" tabindex="-1"[^>]*>/)
    assert.ok(html.includes(activities.find(story => story.path === path).title))
  }
  console.log('Photo checks passed: restored pagination, active image, wrap, and preserved detail pages.')
} finally {
  await server.close()
}
