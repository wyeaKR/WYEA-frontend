/* global require, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
// apps-script/ops/report.gs 모의 테스트. 가짜 시트·메일로 doGet/doPost 를 실행하며 실제 Google 자산에는 아무것도 보내지 않습니다.
// 실행: node apps-script/ops/mock-test.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

let checks = 0
const ok = (value, label) => { assert.ok(value, label); checks++ }
const eq = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++ }

let sent = 0
const joinHeaders = ['status', 'name', 'phone', 'university', 'team']
const joinValues = [
  joinHeaders,
  ['검토 대기', '회원 예시', '010-1234-5678', '예시대학교', '기록단'],
  ['반려', '반려 예시', '01022223333', '예시대학교', '기록단'],
  ['검토 대기', '가입 폴백', '01044445555', '가입대학교', '행사지원단'],
  ['검토 대기', '갱신 우선', '01066667777', '가입대학교', '기록단'],
  ['초대 완료', '초대 예시', '01088880001', '초대대학교', '통번역단'],
  ['입장 완료', '입장 예시', '01088880002', '입장대학교', '소모임'],
]
const consentAll = '개인정보 수집·이용에 동의합니다, 개인정보 제3자 제공에 동의합니다, 초상권(사진·영상) 활용에 동의합니다'
const renewalHeaders = ['Timestamp', '성명', '생년월일', '성별', '휴대전화', '주소', '직업', '대학교', '캠퍼스', '학과', '학번', '이메일',
  '[필수] 동의 항목 (모두 선택)', '소속 단', '가능 언어', '관심 주제', '비고']
const at = time => new Date(time)
const renewalRow = (time, name, phone, university, consent, unit, language, topic, note = '') =>
  [time, name, '', '', phone, '', '', university, '', '', '', '', consent, unit, language, topic, note]
const renewalValues = [
  renewalHeaders,
  // 기존 응답(소속 단·동의 추가 전)은 재제출 대상
  renewalRow(at('2026-09-20T10:00:00+09:00'), '기존 응답', '01033334444', '갱신대학교', '', '', '', '', '재제출 대상'),
  // 유효 응답이 여러 개면 가장 최근 것(시트 순서가 아니라 Timestamp 기준). 전화 앞자리 0이 빠진 숫자 값도 같은 번호
  renewalRow(at('2026-09-27T10:00:00+09:00'), '갱신 회원', 1055556666, '최신대학교', consentAll, '통번역단', '일본어', ''),
  renewalRow(at('2026-09-20T10:00:00+09:00'), '갱신 회원', '01055556666', '예전대학교', consentAll, '기록단', '', ''),
  // 소모임인데 관심 주제가 빠지면 실패
  renewalRow(at('2026-09-27T10:00:00+09:00'), '주제 누락', '01014141414', '갱신대학교', consentAll, '소모임', '', ''),
  // 통번역단인데 가능 언어가 빠지면 실패
  renewalRow(at('2026-09-27T10:00:00+09:00'), '언어 누락', '01077778888', '갱신대학교', consentAll, '통번역단', '', ''),
  // 동의 3개 중 2개만 있으면 실패
  renewalRow(at('2026-09-27T10:00:00+09:00'), '동의 누락', '01099990000', '갱신대학교', '개인정보 수집·이용에 동의합니다, 개인정보 제3자 제공에 동의합니다', '기록단', '', ''),
  // 대학교가 비었으면 나머지가 모두 있어도 실패
  renewalRow(at('2026-09-27T10:00:00+09:00'), '대학 누락', '01012121212', '  ', consentAll, '기록단', '', ''),
  // 최신 응답이 불완전하면 그 이전의 유효한 응답을 쓴다
  renewalRow(at('2026-09-21T10:00:00+09:00'), '최신 불완전', '01011112222', '이전대학교', consentAll, '소모임', '', '보드게임'),
  renewalRow(at('2026-09-27T10:00:00+09:00'), '최신 불완전', '01011112222', '이전대학교', consentAll, '', '', ''),
  // 갱신 응답이 전부 불완전하면 가입 기록을 씀
  renewalRow(at('2026-09-27T10:00:00+09:00'), '가입 폴백', '01044445555', '갱신대학교', '', '기록단', '', ''),
  // 가입 기록과 유효한 갱신 응답이 모두 있으면 갱신 응답이 먼저
  renewalRow(at('2026-09-26T10:00:00+09:00'), '갱신 우선', '01066667777', '갱신대학교', consentAll, '정책제안단', '', ''),
  // Timestamp 가 날짜가 아닌 응답은 쓰지 않는다(아래쪽 행이라도)
  renewalRow(at('2026-09-22T10:00:00+09:00'), '시각 오류', '01088889999', '정상대학교', consentAll, '기록단', '', ''),
  renewalRow('2026-12-31 23:59', '시각 오류', '01088889999', '문자시각대학교', consentAll, '소모임', '', '영화'),
  renewalRow(new Date(NaN), '시각 오류', '01088889999', '깨진시각대학교', consentAll, '소모임', '', '영화'),
  renewalRow('', '시각 없음', '01013131313', '빈시각대학교', consentAll, '기록단', '', ''),
]
let renewalAvailable = true
const renewalSheet = { getName: () => '설문지 응답 시트1', getDataRange: () => ({ getValues: () => renewalValues.map(row => [...row]) }) }
const eventValues = [['event_name'], ['26-2기 회원 OT']]

// records: submission_id 열 추가 전(20열) 시트에 기존 행 1건이 있는 상태에서 시작
const legacyHeaders = ['record_id', 'submitted_at', 'name', 'phone', 'university', 'team',
  'g_event', 'g_when', 'g_role', 'g_confirmed', 'p_scene', 'p_comment', 'p_photo_link',
  'k_issue', 'k_improvement', 'k_next', 'k_partner_reaction', 'm_club_topic', 'm_companions', 'm_rejoin']
const legacyRow = ['old-record', '2026-09-26', '기존 기록', '01000001111', '예전대학교', '기록단', '26-2기 회원 OT', '2026-09-26', '참가', '확인',
  '', '좋았음', '', '', '', '다음에도', '', '', '', '예']
const grid = [[...legacyHeaders], [...legacyRow]]
const cell = (r, c) => (grid[r - 1] && grid[r - 1][c - 1] !== undefined ? grid[r - 1][c - 1] : '')
const records = {
  getLastRow: () => grid.length,
  getDataRange: () => ({ getValues: () => grid.map(row => [...row]) }),
  getRange: (row, col, numRows = 1, numCols = 1) => ({
    getValues: () => Array.from({ length: numRows }, (_, r) => Array.from({ length: numCols }, (_, c) => cell(row + r, col + c))),
    setValues: values => values.forEach((line, r) => line.forEach((value, c) => {
      while (grid.length < row + r) grid.push([])
      grid[row + r - 1][col + c - 1] = value
    })),
    setValue: value => { grid[row - 1][col - 1] = value },
    setNumberFormat() { return this },
  }),
}
const dataRows = () => grid.slice(1)
// 스크립트 잠금: 잡은 상태를 기록하고, 이미 잡혀 있으면 Apps Script 처럼 시간 초과 예외를 던진다
const lockState = { held: false, events: [] }
let onFlush = null
const scriptLock = {
  waitLock() { if (lockState.held) throw new Error('Lock timeout'); lockState.held = true; lockState.events.push('lock') },
  releaseLock() { lockState.held = false; lockState.events.push('release') },
}
const recordsGetRange = records.getRange
records.getRange = (row, col, numRows = 1, numCols = 1) => {
  const range = recordsGetRange(row, col, numRows, numCols)
  const guard = (label, fn) => (...args) => { if (row > 1 || label === 'header') assert.ok(lockState.held, label + ' outside lock'); lockState.events.push(label); return fn(...args) }
  return { ...range, getValues: guard(col === 21 && row === 2 ? 'check' : 'read', range.getValues), setValues: guard('append', range.setValues) }
}
let uuidCount = 0
const sheets = {
  applications: { getDataRange: () => ({ getValues: () => joinValues.map(row => [...row]) }) },
  events: { getDataRange: () => ({ getValues: () => eventValues.map(row => [...row]) }) },
  records,
}
const sandbox = {
  console: { log() {}, error() {} },
  Date,
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({ JOIN_SPREADSHEET_ID: 'join', REPORT_SPREADSHEET_ID: 'report' })[key] }) },
  SpreadsheetApp: { openById: id => ({
    getSheets: () => id === '1rnuGqL2QwYUlDYV3EXdkWrjrrjOEExr0qu3C4V4KUa0' && renewalAvailable ? [renewalSheet] : [],
    getSheetByName: name => id === 'join' ? (name === 'applications' ? sheets.applications : null) : (id === 'report' ? sheets[name] || null : null),
    getUrl: () => 'https://example.test/sheet',
  }), flush: () => { assert.ok(lockState.held, 'flush inside lock'); lockState.events.push('flush'); if (onFlush) { const run = onFlush; onFlush = null; run() } } },
  LockService: { getScriptLock: () => scriptLock },
  Utilities: { getUuid: () => `aaaaaaaa-0000-4000-8000-${String(++uuidCount).padStart(12, '0')}` },
  MailApp: { sendEmail: message => { assert.match(message.subject, /^\[WYEA\] 참가 기록서:/); sent++ } },
}
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(__dirname, 'report.gs'), 'utf8'), sandbox)
const post = value => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(value) } }).text)
const get = action => JSON.parse(sandbox.doGet({ parameter: { action } }).text)
const lookup = (name, phone) => post({ action: 'lookup', name, phone })

// 행사 목록·알 수 없는 요청
eq(get('events').events, ['26-2기 회원 OT'])
eq(get('nope').error, 'unknown_action')

// 가입 시트 조회
eq(lookup('다른 사람', '01012345678').error, 'not_found', '없는 사람')
eq(lookup('회원 예시', '01000000000').error, 'not_found', '이름만 일치')
const found = lookup('회원 예시', '01012345678')
eq(found, { ok: true, university: '예시대학교', team: '기록단' }, '검토 대기 통과')
eq(Object.keys(found).sort(), ['ok', 'team', 'university'], '응답은 대학·단만')
eq(lookup('반려 예시', '01022223333').error, 'not_found', '반려 실패')
eq(lookup('초대 예시', '01088880001'), { ok: true, university: '초대대학교', team: '통번역단' }, '초대 완료 통과')
eq(lookup('입장 예시', '01088880002'), { ok: true, university: '입장대학교', team: '소모임' }, '입장 완료 통과')

// 갱신 폼 조회: 가장 최근의 유효한 응답
eq(lookup('갱신 회원', '010-5555-6666'), { ok: true, university: '최신대학교', team: '통번역단' }, '여러 유효 응답 중 최신, 앞자리 0 빠진 전화')
eq(lookup('갱신 회원', '01000000000').error, 'not_found', '갱신 이름만 일치')
eq(lookup('최신 불완전', '01011112222'), { ok: true, university: '이전대학교', team: '소모임' }, '최신이 불완전하면 이전 정상 응답')
eq(lookup('대학 누락', '01012121212').error, 'not_found', '대학 빈 값 거절')
eq(lookup('언어 누락', '01077778888').error, 'not_found', '가능 언어 누락')
eq(lookup('주제 누락', '01014141414').error, 'not_found', '관심 주제 누락')
eq(lookup('동의 누락', '01099990000').error, 'not_found', '동의 누락')
eq(lookup('기존 응답', '01033334444').error, 'not_found', '재제출 대상')
eq(lookup('가입 폴백', '01044445555'), { ok: true, university: '가입대학교', team: '행사지원단' }, '갱신이 전부 불완전하면 가입 기록')
eq(lookup('갱신 우선', '01066667777'), { ok: true, university: '갱신대학교', team: '정책제안단' }, '갱신 응답 우선')
eq(lookup('시각 오류', '01088889999'), { ok: true, university: '정상대학교', team: '기록단' }, '잘못된 Timestamp 무시')
eq(lookup('시각 없음', '01013131313').error, 'not_found', 'Timestamp 없는 응답만 있으면 실패')

// 조회 중 서버 오류는 not_found 가 아니다
renewalAvailable = false
eq(lookup('회원 예시', '01012345678').error, 'server_error', '갱신 시트 오류는 server_error')
renewalAvailable = true

// 참가 기록서 제출
const payload = {
  name: '회원 예시', phone: '01012345678', g_event: '26-2기 회원 OT', g_when: '2026-10-03T14:00', g_role: '참가', g_confirmed: true,
  p_comment: '좋은 만남', k_next: '다음에도 함께하기', m_rejoin: '예', submission_id: '11111111-1111-4111-8111-111111111111',
}
const report = extra => post({ action: 'report', payload: { ...payload, ...extra } })
eq(report({ g_confirmed: false }).error, 'validation_failed')
eq(report({ p_comment: '' }).error, 'validation_failed')
eq(report({ g_event: '임의 행사' }).error, 'validation_failed')
eq(report({ p_photo_link: 'javascript:bad' }).error, 'validation_failed')
eq(report({ submission_id: 'not-a-uuid' }).error, 'validation_failed', 'submission_id 형식 오류')
eq(dataRows().length, 1, '검증 실패는 저장 안 함')

eq(report({}), { ok: true }, 'submission_id 있는 새 요청 성공')
eq(grid[0][20], 'submission_id', '기존 시트에 submission_id 헤더 추가')
eq(grid[0].slice(0, 20), legacyHeaders, '기존 헤더 유지')
eq(grid[1], legacyRow, '기존 행 그대로')
eq(dataRows().length, 2)
eq(grid[2][2], '회원 예시')
eq(grid[2][20], payload.submission_id, 'submission_id 저장')
eq(sent, 1)

// 같은 submission_id 재시도(응답 유실 가정)는 행·메일 추가 없이 성공
eq(report({}), { ok: true, duplicate: true }, '같은 submission_id 두 번째는 성공 취급')
eq(report({ p_comment: '재시도' }), { ok: true, duplicate: true }, '응답 유실 뒤 재시도')
eq(report({ submission_id: payload.submission_id.toUpperCase() }), { ok: true, duplicate: true }, '대소문자만 다른 같은 ID')
eq(dataRows().length, 2, '같은 submission_id 는 1건')
eq(sent, 1, '알림 메일 중복 없음')

// 중복 확인·기록·flush 가 한 잠금 안에서 일어난다
lockState.events.length = 0
eq(report({ submission_id: '44444444-4444-4444-8444-444444444444' }), { ok: true })
const ev = lockState.events
ok(ev[0] === 'lock' && ev.indexOf('check') > 0 && ev.indexOf('append') > ev.indexOf('check') && ev.indexOf('flush') > ev.indexOf('append') &&
  ev.indexOf('release') > ev.indexOf('flush'), '잠금, 중복 확인, 기록, flush, 해제 순서: ' + ev.join(','))
eq(dataRows().length, 3)
eq(sent, 2)

// 거의 동시에 같은 ID: 첫 요청이 잠금을 쥔 채 행을 쓴 순간 두 번째 요청이 오면 잠금 대기(시간 초과)로 저장되지 않고,
// 두 번째 요청의 재시도는 첫 요청의 행을 보고 duplicate 로 끝난다
const racingId = '55555555-5555-4555-8555-555555555555'
let racing = null
onFlush = () => { racing = report({ submission_id: racingId }) }
eq(report({ submission_id: racingId }), { ok: true }, '동시 요청 중 첫 요청 성공')
eq(racing, { ok: false, error: 'server_error' }, '잠금을 못 잡은 두 번째 요청은 저장하지 않음')
eq(report({ submission_id: racingId }), { ok: true, duplicate: true }, '두 번째 요청 재시도는 duplicate')
eq(dataRows().filter(row => row[20] === racingId).length, 1, '동시 요청도 1건')
eq(sent, 3, '동시 요청도 메일 1회')

// submission_id 없는 기존 화면 요청: 거절하지 않고 서버가 만든 ID 로 접수(재전송 중복까지는 막지 못함)
const legacyPayload = { ...payload }
delete legacyPayload.submission_id
eq(post({ action: 'report', payload: legacyPayload }), { ok: true }, 'submission_id 없는 legacy 요청 성공')
const legacySaved = grid[grid.length - 1]
ok(/^aaaaaaaa-0000-4000-8000-\d{12}$/.test(legacySaved[20]), 'legacy 요청은 서버 생성 ID 저장')
eq(post({ action: 'report', payload: { ...legacyPayload, submission_id: '' } }), { ok: true }, '빈 submission_id 도 legacy 로 접수')
eq(dataRows().length, 6)
eq(sent, 5)

// 다른 submission_id 는 각각 저장
eq(report({ name: '갱신 회원', phone: '01055556666', submission_id: '22222222-2222-4222-8222-222222222222' }), { ok: true })
eq(dataRows().length, 7)
eq(grid[grid.length - 1].slice(2, 6), ['갱신 회원', '01055556666', '최신대학교', '통번역단'], '갱신 응답 회원 정보로 저장')
eq(sent, 6)
eq(report({ name: '언어 누락', phone: '01077778888', submission_id: '33333333-3333-4333-8333-333333333333' }).error, 'not_found')
eq(dataRows().length, 7)
ok(!lockState.held, '모든 요청 뒤 잠금 해제')

eq(post({ action: 'admin', secret: 'wrong', operation: 'deleteTestRows' }).error, 'forbidden')
eq(dataRows().length, 7)
console.log(`report mock tests: ${checks} passed`)
