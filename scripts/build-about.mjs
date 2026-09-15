import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'

// Reuse the Vue page as the source of static content for GitHub Pages.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: AboutView } = await server.ssrLoadModule('/src/views/AboutView.vue')
  const { default: ActivitiesView } = await server.ssrLoadModule('/src/views/ActivitiesView.vue')
  const { seoulExchange } = await server.ssrLoadModule('/src/content/activities.ts')
  const pages = [
    { path: '/about', component: AboutView, title: '단체소개 | 세계청년교류회(WYEA)', description: '세계청년교류회(WYEA)의 설립 배경, 목적, 단체 기본정보와 문의 방법을 안내합니다.' },
    { path: '/activities', component: ActivitiesView, title: '활동소식 | 세계청년교류회(WYEA)', description: '세계청년교류회(WYEA)의 만남과 교류 활동을 기록합니다.' },
    { path: seoulExchange.path, component: ActivitiesView, title: `${seoulExchange.title} | WYEA`, description: seoulExchange.summary, meta: { activityDetail: true } },
  ]
  const shell = await readFile('dist/index.html', 'utf8')
  const styles = (await readdir('dist/assets'))
    .filter(name => /^(AboutView|ActivitiesView)-.*\.css$/.test(name))
    .map(name => `<link rel="stylesheet" href="/assets/${name}">`).join('\n')
  for (const page of pages) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...pages,
      { path: '/financialreport', component: { render: () => null } },
    ],
  })
  const app = createSSRApp(page.component)
  app.use(router)
  await router.push(page.path)
  await router.isReady()
  const body = await renderToString(app)
  const html = shell
    .replace('<html lang="">', '<html lang="ko">')
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${page.description}">`)
    .replace('</head>', `${styles}\n<link rel="canonical" href="https://wyea.info${page.path}/">\n</head>`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`)
  await mkdir(`dist${page.path}`, { recursive: true })
  await writeFile(`dist${page.path}/index.html`, html)
  console.log(`Generated ${page.path}/index.html with rendered content.`)
  }
} finally {
  await server.close()
}
