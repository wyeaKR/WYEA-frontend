const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const rows = []
let sent = 0
const joinHeaders = ['name', 'phone', 'university', 'team']
const joinValues = [joinHeaders, ['회원 예시', '010-1234-5678', '예시대학교', '기록단']]
const eventValues = [['event_name'], ['26-2기 회원 OT']]
const sheets = {
  applications: { getDataRange: () => ({ getValues: () => joinValues.map(row => [...row]) }) },
  events: { getDataRange: () => ({ getValues: () => eventValues.map(row => [...row]) }) },
  records: { appendRow: row => rows.push(row) },
}
const sandbox = {
  console,
  Date,
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({ JOIN_SPREADSHEET_ID: 'join', REPORT_SPREADSHEET_ID: 'report' })[key] }) },
  SpreadsheetApp: { openById: id => ({ getSheetByName: name => id === 'join' ? (name === 'applications' ? sheets.applications : null) : (id === 'report' ? sheets[name] || null : null), getUrl: () => 'https://example.test/sheet' }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { getUuid: () => 'example-record-id' },
  MailApp: { sendEmail: message => { assert.match(message.subject, /^\[WYEA\] 참가 기록서:/); sent++ } },
}
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(__dirname, 'report.gs'), 'utf8'), sandbox)
const post = value => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(value) } }).text)
const get = action => JSON.parse(sandbox.doGet({ parameter: { action } }).text)

assert.deepEqual(get('events').events, ['26-2기 회원 OT'])
assert.equal(get('nope').error, 'unknown_action')
assert.equal(post({ action: 'lookup', name: '다른 사람', phone: '01012345678' }).error, 'not_found')
assert.equal(post({ action: 'lookup', name: '회원 예시', phone: '01000000000' }).error, 'not_found')
const found = post({ action: 'lookup', name: '회원 예시', phone: '01012345678' })
assert.equal(found.ok, true)
assert.deepEqual(Object.keys(found).sort(), ['ok', 'team', 'university'])
const payload = {
  name: '회원 예시', phone: '01012345678', g_event: '26-2기 회원 OT', g_when: '2026-10-03T14:00', g_role: '참가', g_confirmed: true,
  p_comment: '좋은 만남', k_next: '다음에도 함께하기', m_rejoin: '예',
}
assert.equal(post({ action: 'report', payload: { ...payload, g_confirmed: false } }).error, 'validation_failed')
assert.equal(post({ action: 'report', payload: { ...payload, p_comment: '' } }).error, 'validation_failed')
assert.equal(post({ action: 'report', payload: { ...payload, g_event: '임의 행사' } }).error, 'validation_failed')
assert.equal(post({ action: 'report', payload: { ...payload, p_photo_link: 'javascript:bad' } }).error, 'validation_failed')
assert.equal(post({ action: 'report', payload }).ok, true)
assert.equal(rows.length, 1)
assert.equal(rows[0][2], '회원 예시')
assert.equal(sent, 1)
assert.equal(post({ action: 'admin', secret: 'wrong', operation: 'deleteTestRows' }).error, 'forbidden')
assert.equal(rows.length, 1)
console.log('report mock tests: 15 passed')
