import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'

// /report 화면의 응답 분류와 제출 ID 규칙을 브라우저·API 호출 없이 확인한다.
// 실행: node scripts/check-report-client.mjs
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
try {
  const { lookupMessage, submitMessage, reportMessages: m, newSubmissionId, createSubmissionAttempt } = await server.ssrLoadModule('/src/content/report.ts')

  // 회원 확인: 회원 없음·입력 오류·서버 오류·연결 실패를 섞지 않는다
  assert.equal(lookupMessage({ ok: true, university: '대학', team: '기록단' }), '')
  assert.equal(lookupMessage({ ok: false, error: 'not_found' }), m.lookupNotFound)
  assert.equal(lookupMessage({ ok: false, error: 'validation_failed' }), m.lookupInvalid)
  assert.equal(lookupMessage({ ok: false, error: 'server_error' }), m.lookupServerError)
  assert.equal(lookupMessage({ ok: false, error: 'something_new' }), m.lookupServerError, '알 수 없는 오류는 not_found 가 아니다')
  assert.equal(lookupMessage({ ok: false }), m.lookupServerError)
  assert.equal(lookupMessage(null), m.lookupNetwork)
  assert.ok(!m.lookupServerError.includes('갱신 폼') && !m.lookupNetwork.includes('갱신 폼'), '서버·연결 오류에서 회원 정보 재제출을 권하지 않는다')

  // 제출: 성공(중복 포함)·명확한 실패·결과 불명
  assert.equal(submitMessage({ ok: true }), '')
  assert.equal(submitMessage({ ok: true, duplicate: true }), '', '같은 submission_id 재전송도 성공')
  assert.equal(submitMessage({ ok: false, error: 'not_found' }), m.submitExpired)
  assert.equal(submitMessage({ ok: false, error: 'validation_failed' }), m.submitInvalid)
  assert.equal(submitMessage({ ok: false, error: 'server_error' }), m.submitUnconfirmed)
  assert.equal(submitMessage(null), m.submitUnconfirmed)
  assert.match(m.submitUnconfirmed, /이미 접수되었을 수 있습니다/)

  // 제출 ID: UUID 형식, 매번 다름, crypto.randomUUID 가 없어도 만든다
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  assert.match(newSubmissionId(), uuid)
  assert.notEqual(newSubmissionId(), newSubmissionId())
  assert.match(newSubmissionId({ getRandomValues: bytes => bytes.fill(7) }), uuid)
  assert.match(newSubmissionId(undefined), uuid)

  // 제출 ID: 결과 불명 뒤 무수정 재시도는 같은 ID, 내용을 바꾸면 새 ID, 성공 뒤 reset 하면 새 ID
  let n = 0
  const attempt = createSubmissionAttempt(() => `id-${++n}`)
  const content = JSON.stringify({ name: '회원', p_comment: '좋았음' })
  assert.equal(attempt.idFor(content), 'id-1')
  assert.equal(attempt.idFor(content), 'id-1', '결과 불명 후 무수정 재시도 → 같은 ID')
  assert.equal(attempt.idFor(JSON.stringify({ name: '회원', p_comment: '고침' })), 'id-2', '내용 수정 후 재시도 → 새 ID')
  assert.equal(attempt.idFor(content), 'id-3', '이전 내용으로 되돌려도 직전과 다르면 새 ID')
  attempt.reset()
  assert.equal(attempt.idFor(content), 'id-4', '성공 뒤 reset → 새 ID')

  // 제출 중(busy)에는 참가 기록서 입력칸·선택·체크박스·버튼이 모두 disabled 인 fieldset 안에 있다
  const { default: ReportView } = await server.ssrLoadModule('/src/views/ReportView.vue')
  async function renderForm(busy) {
    const component = { ...ReportView, setup(props, context) {
      const state = ReportView.setup(props, context)
      state.verified.value = true
      state.team.value = '기록단'
      state.busy.value = busy
      return state
    } }
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component }, { path: '/join', component: { render: () => null } }] })
    const app = createSSRApp(component).use(router)
    await router.push('/')
    await router.isReady()
    const html = await renderToString(app)
    return html.slice(html.indexOf('<form'), html.indexOf('</form>'))
  }
  const busyForm = await renderForm(true)
  const fieldsetOpen = busyForm.match(/<fieldset[^>]*>/)?.[0] || ''
  assert.match(fieldsetOpen, /\sdisabled/, 'busy 중 fieldset disabled')
  const inside = busyForm.slice(busyForm.indexOf(fieldsetOpen) + fieldsetOpen.length, busyForm.lastIndexOf('</fieldset>'))
  const controls = busyForm.match(/<(input|select|textarea|button)\b/g) || []
  const controlsInside = inside.match(/<(input|select|textarea|button)\b/g) || []
  assert.ok(controls.length >= 14, `폼 입력 요소 수 ${controls.length}`)
  assert.equal(controlsInside.length, controls.length, '모든 입력 요소가 잠기는 fieldset 안에 있다')
  const idleForm = await renderForm(false)
  assert.doesNotMatch(idleForm.match(/<fieldset[^>]*>/)?.[0] || '', /\sdisabled/, '제출 중이 아니면 입력 가능')
  console.log('Report client checks passed: lookup/submit message classes, submission id reuse, form locked while submitting.')
} finally {
  await server.close()
}
