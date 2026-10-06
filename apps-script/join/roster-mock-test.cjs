/* global require, process, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
// apps-script/join/Code.gs의 회원 명부 자동 반영 모의 테스트입니다. 시트·트리거·메일을 가짜 객체로 바꿔 실행합니다.
// 실행: node apps-script/join/roster-mock-test.cjs  (실제 시트·명부·메일에는 아무것도 보내지 않습니다)
const fs = require('fs')
const vm = require('vm')
const path = require('path')

const cell = (v = '') => ({ v, bg: null, color: null, bold: false, note: '', fmt: '', dv: null })
const filled = (x) => x && x.v !== '' && x.v !== null && x.v !== undefined
class FakeSheet {
  constructor(book, name, rows = []) {
    Object.assign(this, { book, name, rows: rows.map((r) => r.map((v) => cell(v))), maxRows: 1000, maxCols: 26, frozen: [0, 0], filter: null, widths: {}, validations: [] })
  }
  ensure(r, c) {
    while (this.rows.length < r) this.rows.push([])
    const row = this.rows[r - 1]
    while (row.length < c) row.push(cell())
    return row[c - 1]
  }
  peek(r, c) { return (this.rows[r - 1] || [])[c - 1] }
  getName() { return this.name }
  setName(n) { delete this.book.sheets[this.name]; this.name = n; this.book.sheets[n] = this; return this }
  getParent() { return this.book }
  getSheetId() { return 0 }
  getMaxRows() { return this.maxRows }
  getMaxColumns() { return this.maxCols }
  insertRowsAfter(r, n) { this.maxRows += n; return this }
  insertColumnsAfter(c, n) { this.maxCols += n; return this }
  getLastRow() { for (let r = this.rows.length; r >= 1; r--) if (this.rows[r - 1].some(filled)) return r; return 0 }
  getLastColumn() { let m = 0; this.rows.forEach((row) => row.forEach((x, i) => { if (filled(x)) m = Math.max(m, i + 1) })); return m }
  getDataRange() { return this.getRange(1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)) }
  getRange(r, c, nr = 1, nc = 1) { return new FakeRange(this, r, c, nr, nc) }
  deleteRow(r) { this.rows.splice(r - 1, 1); this.maxRows -= 1 }
  setFrozenRows(n) { this.frozen[0] = n }
  setFrozenColumns(n) { this.frozen[1] = n }
  getFilter() { return this.filter }
  setColumnWidth(c, w) { this.widths[c] = w }
}
class FakeRange {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }) }
  map(fn) {
    const out = []
    for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push(fn(this.sheet.peek(this.r + i, this.c + j) || cell())); out.push(row) }
    return out
  }
  each(arr, fn) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) fn(this.sheet.ensure(this.r + i, this.c + j), arr ? arr[i][j] : undefined) }
  getValues() { return this.map((x) => x.v) }
  setValues(v) { this.each(v, (x, val) => { x.v = val }); return this }
  setValue(v) { this.each(null, (x) => { x.v = v }); return this }
  setBackgrounds(v) { this.each(v, (x, val) => { x.bg = val }); return this }
  setBackground(b) { this.each(null, (x) => { x.bg = b }); return this }
  setFontColor(c) { this.each(null, (x) => { x.color = c }); return this }
  setFontWeight(w) { this.each(null, (x) => { x.bold = w === 'bold' }); return this }
  setFontSize() { return this }
  setVerticalAlignment() { return this }
  setWrap() { return this }
  setNotes(v) { this.each(v, (x, val) => { x.note = val }); return this }
  setNumberFormats(v) { this.each(v, (x, val) => { x.fmt = val }); return this }
  setNumberFormat(f) { if (this.nr > 50) { this.sheet.columnFormats = { ...(this.sheet.columnFormats || {}), [this.c]: f } } else this.each(null, (x) => { x.fmt = f }); return this }
  setDataValidation(rule) { this.sheet.validations.push({ r: this.r, c: this.c, nr: this.nr, nc: this.nc, rule }); return this }
  createFilter() { this.sheet.filter = { r: this.r, c: this.c, nr: this.nr, nc: this.nc }; return this.sheet.filter }
  getSheet() { return this.sheet }
  getColumn() { return this.c }
  getLastColumn() { return this.c + this.nc - 1 }
  getLastRow() { return this.r + this.nr - 1 }
}
const books = {}
const makeBook = (id, name, sheets) => {
  const b = { id, name, tz: null, sheets: {}, order: [] }
  b.getId = () => id
  b.getName = () => name
  b.getUrl = () => `https://docs.google.com/spreadsheets/d/${id}/edit`
  b.getSheetByName = (n) => b.sheets[n] || null
  b.getSheets = () => Object.values(b.sheets)
  b.insertSheet = (n) => { b.sheets[n] = new FakeSheet(b, n); return b.sheets[n] }
  b.setSpreadsheetTimeZone = (tz) => { b.tz = tz }
  Object.entries(sheets).forEach(([n, rows]) => { b.sheets[n] = new FakeSheet(b, n, rows) })
  books[id] = b
  return b
}

const pad = (n) => String(n).padStart(2, '0')
const kst = (d, tz, fmt) => {
  const k = new Date(d.getTime() + 9 * 3600e3)
  const ymd = `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`
  return fmt === 'yyyy-MM-dd' ? ymd : `${ymd} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`
}
const mails = []
const logs = []
let triggers = []
const ctx = {
  console: { log: (...a) => logs.push(a.join(' ')), error: (...a) => logs.push('ERROR ' + a.join(' ')) },
  Utilities: { formatDate: kst, getUuid: () => 'uuid' },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'JOIN_SPREADSHEET_ID' ? 'join-id' : null) }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  MailApp: { sendEmail: (m) => mails.push(m) },
  SpreadsheetApp: {
    openById: (id) => { if (!books[id]) throw new Error('no spreadsheet ' + id); return books[id] },
    flush() {},
    newDataValidation: () => {
      const rule = {}
      const b = { requireValueInList: (list) => { rule.list = list; return b }, setAllowInvalid: (x) => { rule.allowInvalid = x; return b },
        setHelpText: (t) => { rule.help = t; return b }, build: () => rule }
      return b
    },
  },
  ScriptApp: {
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: (t) => { triggers = triggers.filter((x) => x !== t) },
    newTrigger: (fn) => ({ forSpreadsheet: (id) => ({ onEdit: () => ({ create: () => {
      const t = { fn, id, getHandlerFunction: () => fn }
      triggers.push(t)
      return t
    } }) }) }),
  },
}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx)
const isDate = (x) => Object.prototype.toString.call(x) === '[object Date]'
const ymdOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const HEADERS = vm.runInContext('HEADERS', ctx)
const RC = vm.runInContext('ROSTER_COLUMNS', ctx)
const YELLOW = vm.runInContext('ROSTER_YELLOW', ctx)

let fail = 0
const check = (name, cond) => { console.log(cond ? 'PASS' : 'FAIL', name); if (!cond) fail++ }

// 신청 시트
const baseApp = {
  submitted_at: '2026-10-06T03:00:00.000Z', status: '입장 완료', track: 'member', team: '기록단', birth: '2001-05-06', gender: '',
  address: '', occupation: '', university: '국립창원대학교', university_other: 'FALSE', campus: '창원캠퍼스', department: '국제무역학과',
  student_id: '', email: '', consent_collect: 'TRUE', consent_third_party: 'FALSE', consent_portrait: 'FALSE',
  consent_version: '2026-10-06-v4', source: 'homepage',
}
const appRow = (o) => HEADERS.map((h) => ({ ...baseApp, ...o })[h] ?? '')
const join = makeBook('join-id', 'WYEA 회원 가입 신청(홈페이지)', { applications: [HEADERS.slice(),
  appRow({ application_id: 'app-a', name: '신규회원', phone: '010-1111-2222' }),
  appRow({ application_id: 'app-b', name: '=집행부', status: '입장완료', track: 'staff', team: '회원부', gender: '여', phone: '010-3333-4444',
    occupation: '대학생(휴학)', university: '다른대학교', university_other: 'TRUE', email: 'staff@example.com', submitted_at: '2026-09-30T16:30:00.000Z',
    consent_third_party: 'TRUE', consent_portrait: 'TRUE', consent_version: '2026-09-25' }),
  appRow({ application_id: 'app-c', name: '이전회원', phone: '010-9999-8888' }),
  appRow({ application_id: 'app-d', name: '초대만', status: '초대 완료', phone: '010-7777-6666' }),
  appRow({ application_id: 'app-e', name: '검토중', status: '검토 대기', phone: '010-1212-3434' }),
] })
const apps = join.sheets.applications
const colOf = (h) => apps.rows[0].findIndex((x) => x.v === h) + 1
const appCell = (id, h) => apps.ensure(apps.rows.findIndex((r) => r[0].v === id) + 1, colOf(h))

// 홈페이지 이전 명부(읽기만): 머리글 2행, 이전회원 번호 포함
makeBook('1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c', 'WYEA_회원명부_2026-09_v2', { 회원명부: [['기본 정보'], ['No', '성명', '생년월일', '성별', '휴대전화'],
  [1, '가회원', '', '남', '010-5555-6666'], [2, '이전회원', '', '남', '01099998888']] })
const legacyBefore = JSON.stringify(books['1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c'].sheets.회원명부.rows)

// 새 명부: 빈 파일(시트 1개)
const roster = makeBook('1_MMgkFktfF7-zNpQoINdnKiyyOVAC1VjZ7guqK70LPg', 'WYEA_회원명부_홈페이지가입', { 시트1: [] })
roster.sheets.시트1.maxRows = 1000
const rs = () => roster.sheets.회원명부
const rCell = (r, h) => rs().peek(r, RC.indexOf(h) + 1) || cell()

check('cohort-rule', ['2026-10-06', '2026-09-01', '2027-01-15', '2026-02-26', '2026-08-02'].map((d) => ctx.cohort_(d)).join() === '26-2기,26-2기,26-2기,26-1기,26-1기')

// setupRoster: 명부 생성·반영 열·상태 목록·트리거·첫 반영
triggers = [{ fn: 'onApplicationsEdit', getHandlerFunction: () => 'onApplicationsEdit' }, { fn: 'otherJob', getHandlerFunction: () => 'otherJob' }]
ctx.setupRoster()
const today = kst(new Date(), '', 'yyyy-MM-dd')
check('roster-built-from-blank-file', rs() && !roster.sheets.시트1 && roster.tz === 'Asia/Seoul' && rs().rows[0].map((x) => x.v).join() === RC.join())
check('roster-header-style', ['No', '성명', '신청 ID'].every((h) => rCell(1, h).bg === '#003366' && rCell(1, h).bold) &&
  ['주소', '직업', '단체 등록 명부 제출 동의'].every((h) => rCell(1, h).bg === YELLOW) && /등록 준비/.test(rCell(1, '주소').note))
check('roster-layout', rs().frozen.join() === '1,2' && rs().filter && rs().filter.r === 1 && rs().filter.nc === RC.length && rs().maxRows >= 1000 &&
  rs().columnFormats[RC.indexOf('휴대전화') + 1] === '@' && rs().columnFormats[RC.indexOf('생년월일') + 1] === 'yyyy-mm-dd' && rs().columnFormats[1] === '0')
const consentDv = rs().validations.find((v) => v.c === RC.indexOf('단체 등록 명부 제출 동의') + 1)
check('roster-consent-dropdown', consentDv && consentDv.rule.list.join() === '동의,미동의' && consentDv.r === 2)
const guide = roster.sheets.안내
const guideMap = Object.fromEntries(guide.rows.map((r) => [r[0].v, r[1] && r[1].v]))
check('guide-tab-formulas', guideMap['총 회원'] === "=COUNTA('회원명부'!B2:B)" && guideMap['집행부'] === "=COUNTIF('회원명부'!I2:I,\"집행부\")" &&
  guideMap['주소 확보'] === "=COUNTA('회원명부'!O2:O)" && guideMap['직업 확보'] === "=COUNTA('회원명부'!P2:P)" &&
  guideMap['단체 등록 명부 제출 동의'] === "=COUNTIF('회원명부'!Q2:Q,\"동의\")" && /WYEA_회원명부_2026-09_v2/.test(guide.rows[1][0].v))
check('setup-mark-column-added-at-end', apps.rows[0][HEADERS.length].v === 'roster_added_at')
const v = apps.validations[0]
check('setup-status-dropdown-without-approve', v && v.r === 2 && v.c === 3 && v.rule.list.join() === '검토 대기,초대 완료,입장 완료,반려' && v.rule.allowInvalid === false)
check('setup-trigger-replaced', triggers.filter((t) => t.fn === 'onApplicationsEdit').length === 1 && triggers.some((t) => t.fn === 'otherJob') &&
  triggers.find((t) => t.fn === 'onApplicationsEdit').id === 'join-id')
check('setup-log', logs.some((l) => /WYEA_회원명부_홈페이지가입 \(회원 0명\)/.test(l) && /"added":3,"existing":0/.test(l)))

// 첫 반영: 신청 시트 순서(가입 순서)대로 2~4행
check('rows-in-join-order', rs().getLastRow() === 4 && rCell(2, '성명').v === '신규회원' && rCell(3, '성명').v === "'=집행부" && rCell(4, '성명').v === '이전회원' &&
  [2, 3, 4].map((r) => rCell(r, 'No').v).join() === '1,2,3')
check('member-values', rCell(2, '휴대전화').v === '010-1111-2222' && rCell(2, '대학교').v === '국립창원대학교' && rCell(2, '캠퍼스').v === '창원캠퍼스' &&
  rCell(2, '학과').v === '국제무역학과' && rCell(2, '구분').v === '일반' && rCell(2, '소속 단·희망 부서').v === '기록단' && rCell(2, '기수').v === '26-2기' &&
  rCell(2, '가입 동의').v === '수집·이용 (2026-10-06-v4)' && rCell(2, '신청 ID').v === 'app-a' && rCell(2, '이메일').v === '' && rCell(2, '비고').v === '')
check('member-dates', isDate(rCell(2, '생년월일').v) && ymdOf(rCell(2, '생년월일').v) === '2001-05-06' && rCell(2, '생년월일').fmt === 'yyyy-mm-dd' &&
  ymdOf(rCell(2, '신청일').v) === '2026-10-06' && ymdOf(rCell(2, '가입일(입장 완료)').v) === today)
check('member-collect-columns-yellow', ['주소', '직업', '단체 등록 명부 제출 동의'].every((h) => rCell(2, h).v === '' && rCell(2, h).bg === YELLOW) &&
  RC.filter((h) => !['주소', '직업', '단체 등록 명부 제출 동의'].includes(h)).every((h) => rCell(2, h).bg === null))
check('text-cells-plain-text', rCell(2, '휴대전화').fmt === '@' && rCell(2, '신청 ID').fmt === '@' && rCell(2, 'No').fmt === '0')
check('staff-values', rCell(3, '구분').v === '집행부' && rCell(3, '소속 단·희망 부서').v === '회원부' && rCell(3, '직업').v === '대학생(휴학)' &&
  rCell(3, '직업').bg === null && rCell(3, '주소').bg === YELLOW && rCell(3, '이메일').v === 'staff@example.com' &&
  ymdOf(rCell(3, '신청일').v) === '2026-10-01' && rCell(3, '가입 동의').v === '수집·이용·제3자 제공·초상권 (2026-09-25)' && /목록 밖 학교/.test(rCell(3, '비고').v))
check('legacy-phone-noted', rCell(4, '비고').v === '홈페이지 이전 명부 No.2와 같은 휴대전화' &&
  JSON.stringify(books['1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c'].sheets.회원명부.rows) === legacyBefore)
check('apps-marks', /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} 명부 No\.1$/.test(appCell('app-a', 'roster_added_at').v) && /명부 No\.2$/.test(appCell('app-b', 'roster_added_at').v) &&
  /명부 No\.3$/.test(appCell('app-c', 'roster_added_at').v) && appCell('app-d', 'roster_added_at').v === '' && appCell('app-e', 'roster_added_at').v === '' &&
  appCell('app-a', 'roster_added_at').fmt === '@')

// 다시 반영: 이미 반영한 행은 넣지 않고 새로 입장 완료된 행만, 명부에 같은 번호가 있으면 기록만
appCell('app-d', 'status').v = '입장 완료'
apps.rows.push(appRow({ application_id: 'app-dup', name: '재신청', phone: '010-1111-2222' }).map((x) => cell(x)))
const second = ctx.syncRoster_()
check('sync-new-only-and-existing', second.added === 1 && second.existing === 1 && rs().getLastRow() === 5 && rCell(5, '성명').v === '초대만' &&
  rCell(5, 'No').v === 4 && /기존 명부 No\.1$/.test(appCell('app-dup', 'roster_added_at').v))
check('sync-again-no-change', JSON.stringify(ctx.syncRoster_()) === '{"added":0,"existing":0}' && rs().getLastRow() === 5)

// setupRoster 재실행: 명부·안내를 다시 만들지 않음
const guideRows = guide.rows.length
ctx.setupRoster()
check('setup-rerun-idempotent', roster.sheets.안내 === guide && guide.rows.length === guideRows && rs().getLastRow() === 5 &&
  apps.rows[0].filter((x) => x.v === 'roster_added_at').length === 1 && triggers.filter((t) => t.fn === 'onApplicationsEdit').length === 1)

// 안내 탭: 예전 문구·굵은 글씨가 남아 있어도 setupRoster가 최신 문구로 다시 씀. 지워지면 다시 만듦
guide.rows[0][0].v = 'WYEA 회원명부 — 홈페이지 가입 (옛 제목)'
guide.rows[3][0].bold = true
ctx.setupRoster()
check('guide-refreshed-by-setup', guide.rows[0][0].v === 'WYEA 회원명부 (홈페이지 가입, 2026-09-26 /join 개설 이후)' && guide.rows[0][0].bold &&
  !guide.rows[3][0].bold && guide.rows[4][0].bg === YELLOW && guide.rows.every((r) => r.every((x) => !/[—→•]/.test(String(x.v)))))
delete roster.sheets.안내
ctx.rosterOpen_()
check('guide-recreated-when-missing', roster.sheets.안내 && roster.sheets.안내.rows[3][0].v === '추가 방식' && rs().getLastRow() === 5)

// 편집 트리거: status 칸이 포함된 편집에만 반영
const realSync = ctx.syncRoster_
let syncCalls = 0
ctx.syncRoster_ = function () { syncCalls++; return realSync() }
ctx.onApplicationsEdit({ range: apps.getRange(2, colOf('name')) })
ctx.onApplicationsEdit({ range: apps.getRange(1, 3) })
ctx.onApplicationsEdit({ range: guide.getRange(2, 3) })
check('trigger-ignores-other-edits', syncCalls === 0)
ctx.onApplicationsEdit({ range: apps.getRange(3, 3) })
ctx.onApplicationsEdit({ range: apps.getRange(2, 1, 3, 5) })
check('trigger-runs-on-status-edit', syncCalls === 2)
ctx.syncRoster_ = realSync

// 이전 명부를 못 읽어도 반영은 계속
const legacyBook = books['1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c']
delete books['1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c']
apps.rows.push(appRow({ application_id: 'app-g', name: '이전확인불가', phone: '010-5555-6666' }).map((x) => cell(x)))
const noLegacy = ctx.syncRoster_()
check('legacy-unreadable-still-adds', noLegacy.added === 1 && rCell(6, '성명').v === '이전확인불가' && rCell(6, '비고').v === '' && logs.some((l) => /legacy roster read failed/.test(l)))
books['1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c'] = legacyBook

// 실패 알림: 명부 열 이름이 바뀌면 쓰지 않고 메일로 알림
rs().rows[0][RC.indexOf('직업')].v = '직업(변경)'
apps.rows.push(appRow({ application_id: 'app-f', name: '실패시험', phone: '010-2020-3030' }).map((x) => cell(x)))
const mailsBefore = mails.length
ctx.onApplicationsEdit({ range: apps.getRange(apps.rows.length, 3) })
check('trigger-failure-mail', mails.length === mailsBefore + 1 && mails[mails.length - 1].subject === '[WYEA] 회원 명부 자동 반영 실패' &&
  /회원 명부 열이 없습니다: 직업/.test(mails[mails.length - 1].body) && !/010-/.test(mails[mails.length - 1].body) && appCell('app-f', 'roster_added_at').v === '' && rs().getLastRow() === 6)
rs().rows[0][RC.indexOf('직업')].v = '직업'
appCell('app-f', 'status').v = '반려'

// 시험 행 삭제: 이름과 시험 번호가 모두 같은 행만
apps.rows.push(appRow({ application_id: 'test-1', name: '배포테스트(삭제예정)', phone: '010-0000-1008' }).map((x) => cell(x)))
apps.rows.push(appRow({ application_id: 'test-2', name: '배포테스트(삭제예정)', phone: '010-0000-1999' }).map((x) => cell(x)))
apps.rows.push(appRow({ application_id: 'test-3', name: '다른사람', phone: '010-0000-1009', status: '검토 대기' }).map((x) => cell(x)))
ctx.syncRoster_()
const rosterNames = () => rs().rows.slice(1).map((r) => r[1] && r[1].v)
check('test-rows-reach-roster-before-delete', rosterNames().filter((n) => n === '배포테스트(삭제예정)').length === 2)
const appsBefore = apps.rows.length
ctx.deleteDeployTestRows()
check('delete-only-exact-test-rows', apps.rows.length === appsBefore - 1 && !apps.rows.some((r) => r[0].v === 'test-1') &&
  apps.rows.some((r) => r[0].v === 'test-2') && apps.rows.some((r) => r[0].v === 'test-3') &&
  rosterNames().filter((n) => n === '배포테스트(삭제예정)').length === 1 && rosterNames().includes('신규회원'))
check('delete-log', logs.some((l) => l === '시험 행 삭제: 신청 시트 1행, 회원 명부 1행'))

console.log(`roster rows ${rs().getLastRow() - 1}, mails ${mails.length}, failures ${fail}`)
process.exit(fail ? 1 : 0)
