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
      try { change(state) } finally { state.stopAutoplay() }
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

  for (let index = 0; index < homeActivityPhotos.length; index++) {
    const html = await renderPhoto(state => {
      for (let step = 0; step < index; step++) state.selectRelative(1)
      assert.equal(state.currentPhoto.value.path, homeActivityPhotos[index].path)
    })
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)]
    assert.deepEqual(links.map(match => match[1]), [homeActivityPhotos[index].path + '#activity-title'])
    assert.match(html, /<div[^>]*class="photo-swipe-area"/)
    assert.match(html, /이 순간의 이야기 보기/)
  }
  await renderPhoto(state => {
    state.selectRelative(-1)
    assert.equal(state.activeIndex.value, homeActivityPhotos.length - 1)
    state.selectRelative(1)
    assert.equal(state.activeIndex.value, 0)
    const target = { setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} }
    const event = { pointerId: 1, pointerType: 'touch', button: 0, currentTarget: target }
    state.onPhotoPointerDown({ ...event, clientX: 200 })
    state.onPhotoPointerUp({ ...event, clientX: 100 })
    assert.equal(state.activeIndex.value, 1, 'Swipe changes the current story')
    state.onPhotoPointerDown({ ...event, clientX: 100 })
    state.onPhotoPointerUp({ ...event, clientX: 100 })
    assert.equal(state.activeIndex.value, 1, 'Photo tap does not change selection')
  })

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
  console.log('Photo story checks passed: image ownership, every rendered destination, wrap, swipe, tap, and detail title anchors.')
} finally {
  await server.close()
}
