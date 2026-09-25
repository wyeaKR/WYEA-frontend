/* global require, process, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
// apps-script/join/Code.gs 모의 테스트입니다. Google 서비스(시트·메일·잠금)를 가짜 객체로 바꿔 doPost를 실행합니다.
// 실행: node apps-script/join/mock-test.cjs  (실제 시트·메일에는 아무것도 보내지 않습니다)
const fs = require('fs')
const vm = require('vm')
const path = require('path')

const written = []
const mails = []
let mailThrow = false
let HEADERS_
const sheet = {
  getRange: (r, c, nr) => ({
    getValues: () => (r === 1 ? [HEADERS_] : written.slice(r - 2, r - 2 + nr).map((x) => [x[c - 1]])),
    setNumberFormat() {},
    setValues: (v) => { written.push(v[0]) },
    setFontWeight() { return this },
  }),
  getLastRow: () => 1 + written.length,
  setFrozenRows() {},
  getSheetId: () => 0,
  getParent: () => ({ getUrl: () => 'https://docs.google.com/spreadsheets/d/x/edit' }),
}
const ctx = {
  console: { log() {}, error() {} },
  ContentService: { createTextOutput: (s) => ({ setMimeType: () => JSON.parse(s) }), MimeType: { JSON: 1 } },
  Utilities: { formatDate: () => '2026-09-26', getUuid: () => 'id' + written.length },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'NOTIFY_EMAILS' ? null : 'x') }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  MailApp: { sendEmail: (m) => { if (mailThrow) throw new Error('quota'); mails.push(m) } },
}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx)
HEADERS_ = vm.runInContext('HEADERS', ctx)

const col = (name) => HEADERS_.indexOf(name)
let phoneSeq = 0
const nextPhone = () => `010-${String(1000 + phoneSeq).slice(-4)}-${String(++phoneSeq).padStart(4, '0')}`
const base = {
  track: 'member', team: '기록단', team_second: '', languages: '', club_topic: '', recommended_dept: '',
  name: '홍길동', birth: '2004-03-01', gender: '남', phone: '010-1234-5678', address: '경상남도 창원시 성산구 대정로 99',
  occupation: '대학생(재학)', university: '경상국립대학교', university_other: false, campus: '가좌캠퍼스', department: '기계공학부',
  student_id: '2021011285', email: 'a@gnu.ac.kr', interests: ['해외 청년 교류회 참가'],
  motivation: '해외 청년들과 직접 만나 교류하고 행사 기획을 배워 보고 싶습니다.', hopes: '', referral: '',
  competencies: '', experience: '', capabilities: '',
  consent: { collect: true, third_party: true, portrait: true, version: '2026-09-25' }, website: '', elapsed_ms: 60000,
}
const staffBase = {
  ...base, track: 'staff', team: '홍보부', interests: ['SNS·콘텐츠 제작 (사진·영상·글)', '디자인·홍보물 제작', '재무·회계'],
  competencies: '일본어 회화 가능하고 문서 정리를 잘합니다 정말로', experience: '',
  capabilities: '청년회 연락과 교류회 일정 조율을 맡을 수 있습니다 매주',
}
const post = (p) => ctx.doPost({ postData: { contents: JSON.stringify({ action: 'join', payload: p }) } })
const m = (over) => ({ ...base, phone: nextPhone(), ...over })
const st = (over) => ({ ...staffBase, phone: nextPhone(), ...over })

const cases = [
  // 공통
  ['ok', base, true],
  ['dup', base, 'duplicate'],
  ['minor', m({ birth: '2013-01-01' }), 'validation_failed'],
  ['bot', m({ website: 'x' }), true],
  ['fast', m({ elapsed_ms: 100 }), 'validation_failed'],
  ['noconsent', m({ consent: { ...base.consent, portrait: false } }), 'validation_failed'],
  ['unknownuni', m({ university: '하버드' }), 'validation_failed'],
  ['otheruni', m({ university: '하버드', university_other: true }), true],
  ['formula', m({ motivation: '=HYPERLINK("x") 해외 청년들과 교류하고 싶습니다 정말로' }), true],
  ['badjson', null, 'validation_failed'],
  ['notrack', m({ track: undefined }), 'validation_failed'],
  ['nointerest', m({ interests: [] }), 'validation_failed'],
  ['unknowninterest', m({ interests: ['아직 잘 모르겠음'] }), 'validation_failed'],
  // 일반 트랙
  ['member-record', m({ team: '기록단', interests: ['SNS·콘텐츠 제작 (사진·영상·글)'] }), true],
  ['member-event-support', m({ team: '행사지원단' }), true],
  ['member-old-basic-rejected', m({ team: '참여회원' }), 'validation_failed'],
  ['member-old-club-name-rejected', m({ team: '소모임 희망', club_topic: '음악' }), 'validation_failed'],
  ['member-deptname-rejected', m({ team: '홍보부' }), 'validation_failed'],
  ['member-translator-needs-languages', m({ team: '통번역단' }), 'validation_failed'],
  ['member-translator-ok', m({ team: '통번역단', languages: '일본어(회화), 영어' }), true],
  ['member-club-needs-topic', m({ team: '소모임', club_topic: '   ' }), 'validation_failed'],
  ['member-club-ok', m({ team: '소모임', club_topic: '음악' }), true],
  ['member-languages-ignored-elsewhere', m({ team: '정책제안단', languages: '일본어' }), true],
  // 집행부 트랙
  ['staff-first-only', st({}), true],
  ['staff-with-second', st({ team_second: '기획부' }), true],
  ['staff-member-dept-first', st({ team: '회원부', team_second: '총무부', interests: ['대학 지부 운영·회원 모집', '행정·문서 (회의록·서류)'] }), true],
  ['staff-old-dept-name-rejected', st({ team: '조직부' }), 'validation_failed'],
  ['staff-second-same-as-first', st({ team_second: '홍보부' }), 'validation_failed'],
  ['staff-unitname-rejected', st({ team: '기록단' }), 'validation_failed'],
  ['staff-unknown-second', st({ team_second: '감사' }), 'validation_failed'],
  ['staff-short-competencies', st({ competencies: '일본어' }), 'validation_failed'],
  ['staff-nointerest', st({ interests: [] }), 'validation_failed'],
]

let fail = 0
for (const [name, p, expected] of cases) {
  const r = p === null ? ctx.doPost({ postData: { contents: '{bad' } }) : post(p)
  const got = r.ok === true ? true : r.error
  const pass = got === expected
  if (!pass) fail++
  console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(r))
}

const check = (name, cond) => { console.log(cond ? 'PASS' : 'FAIL', name); if (!cond) fail++ }
const rowOf = (teamName, extra) => written.find((r) => r[col('team')] === teamName && (!extra || extra(r)))
check('row-length-matches-headers', written.every((r) => r.length === HEADERS_.length))
check('translator-languages-saved', rowOf('통번역단')[col('languages')] === '일본어(회화), 영어')
check('club-topic-saved', rowOf('소모임')[col('club_topic')] === '음악')
check('languages-blank-for-other-unit', rowOf('정책제안단')[col('languages')] === '')
check('staff-second-saved', rowOf('홍보부', (r) => r[col('team_second')] === '기획부') !== undefined)
check('staff-recommended-dept', rowOf('홍보부')[col('recommended_dept')] === '홍보부')
check('member-recommended-blank-when-no-dept-interest', rowOf('기록단', (r) => r[col('interests')] === '해외 청년 교류회 참가')[col('recommended_dept')] === '')
check('exchange-interest-maps-nowhere', ctx.recommendDepartments_(['해외 청년 교류회 참가']).length === 0 && ctx.INTEREST_MAPPING['해외 청년 교류회 참가'] === undefined)
check('member-dept-recommended-and-tie', rowOf('회원부')[col('recommended_dept')] === '총무부, 회원부')
check('formula-escaped', written.some((r) => String(r[col('motivation')]).startsWith("'=")))
check('mail-count-equals-saved-rows', mails.length === written.length)
check('mail-subject-member', mails.some((x) => x.subject === '[WYEA] 새 회원 가입 신청: 홍길동 (일반 · 기록단)'))
check('mail-subject-staff', mails.some((x) => x.subject === '[WYEA] 새 회원 가입 신청: 홍길동 (집행부 · 홍보부)'))
check('mail-subject-staff-memberdept', mails.some((x) => x.subject === '[WYEA] 새 회원 가입 신청: 홍길동 (집행부 · 회원부)'))
check('mail-no-old-names', !mails.some((x) => /실무진|조직부|참여회원/.test(x.subject + x.body)))
check('mail-has-no-pii', !mails.some((x) => /010-|대정로|2004-03-01/.test(x.body + x.htmlBody)))
check('mail-staff-has-second-and-recommend', mails.some((x) => /2지망: 기획부/.test(x.body) && /추천 부서: 홍보부/.test(x.body)))
mailThrow = true
const r2 = post(m({}))
check('mail-failure-still-ok', r2.ok === true)
mailThrow = false
const notifyPost = (request) => ctx.doPost({ postData: { contents: JSON.stringify({ action: 'notify', ...request }) } })
const rowsBeforeNotify = written.length
const mailsBeforeNotify = mails.length
check('notify-placeholder-forbidden', notifyPost({ secret: 'NOTIFY_SECRET_PLACEHOLDER', subject: '알림 시험', text: '본문' }).error === 'forbidden')
ctx.NOTIFY_SECRET = '0123456789abcdef0123456789abcdef'
check('notify-wrong-secret-forbidden', notifyPost({ secret: 'wrong', subject: '알림 시험', text: '본문' }).error === 'forbidden')
check('notify-valid-sends-mail', notifyPost({ secret: ctx.NOTIFY_SECRET, subject: '알림 시험', text: 'Codex 알림 경로 확인' }).ok === true &&
  mails.length === mailsBeforeNotify + 1 && mails[mails.length - 1].to === 'wyea@wyea.info' &&
  mails[mails.length - 1].subject === '[WYEA 작업] 알림 시험' && mails[mails.length - 1].body === 'Codex 알림 경로 확인')
check('notify-no-sheet-write', written.length === rowsBeforeNotify)
check('notify-long-subject-rejected', notifyPost({ secret: ctx.NOTIFY_SECRET, subject: 'x'.repeat(201), text: '본문' }).error === 'validation_failed')
check('notify-long-text-rejected', notifyPost({ secret: ctx.NOTIFY_SECRET, subject: '알림', text: 'x'.repeat(5001) }).error === 'validation_failed')

console.log(`rows written ${written.length}, mails ${mails.length}, failures ${fail}`)
process.exit(fail ? 1 : 0)
