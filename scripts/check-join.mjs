import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'
import { computed, reactive, ref, watch, nextTick } from 'vue'

// 실제 화면의 상태/검증/전송 코드를 실행합니다. 서버·시트·메일에는 연결하지 않습니다.
const source = await readFile('src/views/JoinView.vue', 'utf8')
const { descriptor } = parse(source)
const content = ts.transpileModule(await readFile('src/content/join.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const config = await import(`data:text/javascript;base64,${Buffer.from(content).toString('base64')}`)
const script = descriptor.scriptSetup.content.replace(/import[\s\S]*?from '[^']+'\s*/g, '')
const compiled = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const server = vm.createContext({ Utilities: { formatDate: () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }) } })
vm.runInContext(await readFile('apps-script/join/Code.gs', 'utf8'), server)

function screen(track) {
  const route = reactive({ query: track ? { track } : {} })
  const requests = []
  let response = { ok: true }
  const ctx = vm.createContext({
    ...config, computed, reactive, ref, watch, nextTick,
    onMounted: (fn) => fn(),
    useRoute: () => route,
    useRouter: () => ({ push: async ({ query }) => { route.query = query } }),
    document: { querySelector: () => ({ focus() {} }) },
    fetch: async (_url, options) => {
      requests.push(JSON.parse(options.body).payload)
      if (response instanceof Error) throw response
      return { json: async () => response }
    },
  })
  vm.runInContext(compiled + '\nglobalThis.state = { form, errors, step, formSteps, busy, agree, startedAt, submitError, payload, next, back, setTrack, submit, formatBirthDate };', ctx)
  ctx.state.startedAt.value -= 10000
  return { ...ctx.state, requests, respond: (value) => { response = value } }
}

const minimal = { name: '가입 시험', birth: '2000-01-01', phone: '010-1234-5678', email: '', campus: '본캠퍼스', department: '시험학과' }
const member = screen()
for (const [value, expected] of [['20020209', '2002-02-09'], ['2002-02-09', '2002-02-09'], ['2000', '2000'], ['', '']]) {
  const input = { value }
  member.formatBirthDate({ target: input })
  assert.equal(input.value, expected, 'birth input must visibly keep YYYY-MM-DD order')
  assert.equal(member.form.birth, expected, 'visible birth must match the submitted value')
}
assert.equal(member.step.value, 'info')
member.next()
assert.equal(member.step.value, 'info')
assert.deepEqual(Object.keys(member.errors).sort(), ['birth', 'campus', 'department', 'memberUnit', 'name', 'phone', 'university'])
Object.assign(member.form, minimal, { memberUnit: '기록단', university: '경상국립대학교' })
member.next()
assert.equal(member.step.value, 'consent')
await member.submit()
assert.equal(member.requests.length, 0, 'missing consent must block submission')
member.back()
assert.equal(member.step.value, 'info')
assert.equal(member.form.name, minimal.name)
member.form.university = '기타'
member.next()
assert.ok(member.errors.universityOther)
member.form.university = '경상국립대학교'
member.form.birth = '2000-02-31'
member.next()
assert.ok(member.errors.birth)
member.form.birth = minimal.birth
member.form.email = 'invalid'
member.next()
assert.ok(member.errors.email)
member.form.email = ''
member.next()
member.agree.collect = true
const payload = member.payload()
assert.equal(payload.consent.collect, true)
assert.equal('third_party' in payload.consent, false)
assert.equal('portrait' in payload.consent, false)
assert.equal(config.consents.length, 1)
assert.ok(server.validate_(payload), 'minimal frontend payload accepted by server')
assert.equal(payload.team, '기록단')
assert.equal(payload.email, '')
assert.equal(payload.campus, minimal.campus)
assert.equal(payload.department, minimal.department)
for (const field of ['address', 'gender', 'occupation', 'student_id', 'motivation', 'interests']) {
  assert.equal(field in payload, false, `member payload must omit ${field}`)
}
// 필수 단 누락 시 정보 입력 화면으로 돌아갑니다.
member.form.memberUnit = ''
await member.submit()
assert.equal(member.step.value, 'info')
assert.equal(member.requests.length, 0)
member.form.memberUnit = '기록단'
Object.assign(member.form, minimal)
member.next()
member.respond({ ok: false, error: 'duplicate' })
await member.submit()
assert.equal(member.step.value, 'consent')
assert.match(member.submitError.value, /이미 신청/)
member.respond(new Error('network'))
await member.submit()
assert.match(member.submitError.value, /이미 접수되었을 수/)
assert.equal(member.form.name, minimal.name)
member.respond({ ok: true })
await Promise.all([member.submit(), member.submit()])
assert.equal(member.requests.length, 3, 'double click must send only one final request')
assert.equal(member.step.value, 'done')

const staff = screen('staff')
assert.equal(staff.step.value, 'info')
staff.next()
assert.equal(staff.errors.hopes, undefined)
assert.equal(staff.errors.interests, undefined)
Object.assign(staff.form, minimal, {
  gender: '남', occupation: '대학생(재학)', university: '경상국립대학교', campus: '본캠퍼스',
  department: '시험학과', interests: [], team: '기획부',
  hopes: '다양한 청년들과 협업하며 행사 기획과 운영 경험을 얻고 싶습니다.',
})
staff.form.hopes = '가'.repeat(101)
staff.next()
assert.equal(staff.step.value, 'info')
assert.ok(staff.errors.hopes)
staff.form.hopes = '가'.repeat(100)
staff.next()
assert.equal(staff.step.value, 'consent')
assert.equal('team_second' in staff.payload(), false)
assert.equal('student_id' in staff.payload(), false)
for (const key of ['motivation', 'competencies', 'experience', 'capabilities', 'referral']) assert.equal(key in staff.payload(), false)
staff.back()
assert.equal(staff.step.value, 'info')
assert.equal(staff.form.hopes.length, 100)
staff.form.hopes = ''
staff.form.occupation = '기타'
staff.form.occupationOther = ''
staff.next()
assert.equal(staff.step.value, 'info')
assert.ok(staff.errors.occupationOther)
staff.form.occupationOther = '직장인'
staff.next()
assert.equal(staff.step.value, 'consent')
staff.agree.collect = true
assert.ok(server.validate_(staff.payload()), 'staff frontend payload accepted without address')
staff.setTrack('member')
await nextTick()
assert.equal(staff.step.value, 'info')
assert.equal(staff.agree.collect, false, 'track switch resets consent')
assert.equal('motivation' in staff.payload(), false, 'staff answers must not leak into member request')
assert.equal(staff.payload().team, '', 'staff department must not become member unit')
staff.form.memberUnit = '행사지원단'
staff.next()
assert.equal(staff.step.value, 'consent')
staff.agree.collect = true
assert.ok(server.validate_(staff.payload()))
staff.setTrack('staff')
await nextTick()
assert.equal(staff.step.value, 'info')
assert.equal(staff.form.team, '기획부', 'staff draft survives switching tracks')
staff.setTrack('member')
await nextTick()
assert.equal(staff.form.memberUnit, '행사지원단', 'member unit survives switching tracks')
console.log('PASS join flow: minimal/staff validation, server contract, back/track switching, consent, duplicate/network responses, double submission')
