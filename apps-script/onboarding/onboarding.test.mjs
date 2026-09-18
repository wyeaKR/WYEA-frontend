import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8')
const code = 'TEST-ONLY-CODE-001'
const valid = () => ({
  name_ko: '테스트',
  last_name_en: 'Test',
  first_name_en: 'User',
  desired_id: 'test.user',
  contact_email: 'test@example.com',
  expectations: '교류',
  desired_activities: '기획',
  interests: ['행사 기획'],
  interest_other: '',
  agree_privacy: true,
})

function setup({ lockAvailable = true, failMark = false } = {}) {
  let locked = false
  let released = 0
  const makeSheet = (rows, name) => ({
    rows,
    getLastRow: () => rows.length,
    getRange(row, col, height, width) {
      return {
        getValues: () =>
          Array.from({ length: height }, (_, r) =>
            Array.from({ length: width }, (_, c) => rows[row - 1 + r]?.[col - 1 + c] ?? ''),
          ),
        setNumberFormat: () => {},
        setValues(values) {
          assert.ok(locked, 'All writes must hold the script lock')
          if (name === 'invites' && failMark) {
            failMark = false
            throw new Error('temporary write failure')
          }
          values.forEach((valuesRow, r) => {
            rows[row - 1 + r] ||= []
            valuesRow.forEach((value, c) => {
              rows[row - 1 + r][col - 1 + c] = value
            })
          })
        },
      }
    },
  })
  const context = vm.createContext({
    console,
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }),
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test-sheet' }) },
    Utilities: { getUuid: randomUUID },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          locked = lockAvailable
          return locked
        },
        releaseLock: () => {
          locked = false
          released++
        },
      }),
    },
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: (name) => ({ invites, responses })[name] }),
      flush: () => {},
    },
  })
  vm.runInContext(source, context)
  const invites = makeSheet(
    [Array.from(context.INVITE_HEADERS), [code, '2026-09-18', 'active', '', '']],
    'invites',
  )
  const responses = makeSheet([Array.from(context.RESPONSE_HEADERS)], 'responses')
  return {
    context,
    invites,
    responses,
    released: () => released,
    verify: (value = code) => context.doGet({ parameter: { action: 'verify', code: value } }),
    submit: (payload = valid(), value = code) =>
      context.doPost({
        postData: { contents: JSON.stringify({ action: 'submit', code: value, payload }) },
      }),
  }
}

test('verify exposes only validity; invalid/used/revoked/duplicate codes fail identically', () => {
  const app = setup()
  assert.deepEqual(app.verify(), { ok: true })
  const failure = { ok: false, error: 'invalid_code' }
  assert.deepEqual(app.verify('missing'), failure)
  for (const status of ['used', 'revoked']) {
    app.invites.rows[1][2] = status
    assert.deepEqual(app.verify(), failure)
  }
  app.invites.rows[1][2] = 'active'
  app.invites.rows.push([...app.invites.rows[1]])
  assert.deepEqual(app.verify(), failure)
  assert.equal(app.responses.rows.length, 1)
})
test('first submission writes matching ID and one row; retries cannot duplicate it', () => {
  const app = setup()
  const result = app.submit()
  assert.equal(result.ok, true)
  assert.equal(app.responses.rows.length, 2)
  assert.equal(app.responses.rows[1].length, 13)
  assert.equal(app.responses.rows[1][0], result.response_id)
  assert.equal(app.responses.rows[1][12], true)
  assert.equal(app.invites.rows[1][2], 'used')
  assert.equal(app.invites.rows[1][4], result.response_id)
  assert.match(app.invites.rows[1][3], /^\d{4}-\d\d-\d\dT/)
  assert.equal(app.submit().error, 'invalid_code')
  assert.equal(app.verify().error, 'invalid_code')
  assert.equal(app.responses.rows.length, 2)
  app.invites.rows.push(['SECOND-TEST-CODE-002', '', 'active', '', ''])
  assert.equal(app.submit(valid(), 'SECOND-TEST-CODE-002').ok, true)
  assert.equal(app.responses.rows.length, 3)
  assert.equal(app.released(), 3)
})
test('server rejects missing values, email errors, unknown interests and nonboolean consent', () => {
  const app = setup()
  const cases = [
    null,
    [],
    { ...valid(), name_ko: ' ' },
    { ...valid(), first_name_en: 1 },
    { ...valid(), contact_email: 'invalid' },
    { ...valid(), interests: [] },
    { ...valid(), interests: ['unknown'] },
    { ...valid(), interests: ['기타'], interest_other: ' ' },
    { ...valid(), agree_privacy: 'true' },
    { ...valid(), agree_privacy: false },
  ]
  for (const payload of cases) assert.equal(app.submit(payload).error, 'validation_failed')
  assert.equal(app.context.doPost({ postData: { contents: '{' } }).error, 'validation_failed')
  assert.equal(app.responses.rows.length, 1)
  assert.equal(app.invites.rows[1][2], 'active')
})
test('direct submission cannot bypass inactive or nonexistent invite', () => {
  const app = setup()
  assert.equal(app.submit(valid(), 'missing').error, 'invalid_code')
  app.invites.rows[1][2] = 'revoked'
  assert.equal(app.submit().error, 'invalid_code')
  assert.equal(app.responses.rows.length, 1)
})
test('lock contention fails without writing', () => {
  const app = setup({ lockAvailable: false })
  assert.equal(app.submit().error, 'server_error')
  assert.equal(app.responses.rows.length, 1)
  assert.equal(app.released(), 0)
})
test('saved response survives failed status update; retry repairs invite without duplicate', () => {
  const app = setup({ failMark: true })
  assert.equal(app.submit().error, 'server_error')
  assert.equal(app.responses.rows.length, 2)
  assert.equal(app.invites.rows[1][2], 'active')
  assert.equal(app.verify().error, 'invalid_code')
  assert.equal(app.submit().error, 'invalid_code')
  assert.equal(app.invites.rows[1][2], 'used')
  assert.equal(app.invites.rows[1][4], app.responses.rows[1][0])
  assert.equal(app.responses.rows.length, 2)
  assert.equal(app.released(), 2)
})
test('sheet schema mismatch fails closed', () => {
  const app = setup()
  app.responses.rows[0][2] = 'wrong_header'
  assert.equal(app.verify().error, 'server_error')
  assert.equal(app.submit().error, 'server_error')
  assert.equal(app.responses.rows.length, 1)
})
test('formula prefixes are escaped and interests are stored as readable text', () => {
  const app = setup()
  assert.equal(
    app.submit({
      ...valid(),
      expectations: '=1+1',
      desired_activities: '+1',
      interests: ['기타', '번역', '번역'],
      interest_other: '@test',
    }).ok,
    true,
  )
  assert.equal(app.responses.rows[1][8], "'=1+1")
  assert.equal(app.responses.rows[1][9], "'+1")
  assert.equal(app.responses.rows[1][10], '번역, 기타')
  assert.equal(app.responses.rows[1][11], "'@test")
  assert.equal(app.context.safeCell_('\t-1'), "'\t-1")
})

test('field length limits accept boundaries and reject overflow without writing', () => {
  for (const [field, limit, character] of [
    ['name_ko', 30, '가'], ['last_name_en', 50, 'A'], ['first_name_en', 50, 'B'],
    ['desired_id', 30, 'a'], ['expectations', 1000, '가'],
    ['desired_activities', 1000, '나'], ['interest_other', 200, '다'],
  ]) {
    const app = setup()
    const payload = { ...valid(), interests: ['기타'], interest_other: '기타', [field]: character.repeat(limit) }
    assert.equal(app.submit({ ...payload, [field]: character.repeat(limit + 1) }).error, 'validation_failed', field)
    assert.equal(app.responses.rows.length, 1)
    assert.equal(app.invites.rows[1][2], 'active')
    assert.equal(app.submit(payload).ok, true, field)
  }
})

test('English names and account IDs enforce allowed characters and minimum length', () => {
  for (const field of ['last_name_en', 'first_name_en']) {
    for (const value of ['홍길동', 'Test1', 'Test_User', 'Test.User', 'Test\tUser', 'Test\nUser', 'José', 'O’Neil']) {
      assert.equal(setup().submit({ ...valid(), [field]: value }).error, 'validation_failed', field + ':' + value)
    }
    assert.equal(setup().submit({ ...valid(), [field]: "Mary Jane-O'Neil" }).ok, true)
  }
  for (const value of ['ab', 'a'.repeat(31), 'ABC', 'ab_c', 'ab-c', 'a b', 'a@b', '가나다']) {
    assert.equal(setup().submit({ ...valid(), desired_id: value }).error, 'validation_failed', value)
  }
  assert.equal(setup().submit({ ...valid(), desired_id: 'a.1' }).ok, true)
})

test('undecided is exclusive; other requires text and rejects oversized unused text', () => {
  assert.equal(setup().submit({ ...valid(), interests: ['아직 정하지 못함'] }).ok, true)
  for (const option of ['번역', '기타']) {
    const app = setup()
    assert.equal(app.submit({ ...valid(), interests: ['아직 정하지 못함', option], interest_other: '기타' }).error, 'validation_failed')
    assert.equal(app.responses.rows.length, 1)
  }
  assert.equal(setup().submit({ ...valid(), interests: ['기타'], interest_other: '' }).error, 'validation_failed')
  assert.equal(setup().submit({ ...valid(), interest_other: '가'.repeat(201) }).error, 'validation_failed')
})

test('editor generator creates unique active invites usable by verify and submit', () => {
  const app = setup()
  const first = app.context.generateInviteCode()
  const second = app.context.generateInviteCode()
  assert.match(first, /^[a-f0-9]{32}$/)
  assert.notEqual(first, second)
  assert.equal(app.invites.rows.length, 4)
  assert.equal(app.invites.rows[2][0], first)
  assert.match(app.invites.rows[2][1], /^\d{4}-\d\d-\d\dT/)
  assert.deepEqual(app.invites.rows[2].slice(2), ['active', '', ''])
  assert.deepEqual(app.verify(first), { ok: true })
  assert.equal(app.submit(valid(), first).ok, true)
  assert.equal(app.released(), 3)
})

test('generator retries collisions including retired codes and existing responses', () => {
  const app = setup()
  const a = 'a'.repeat(32), b = 'b'.repeat(32), c = 'c'.repeat(32)
  app.invites.rows.push([a, '', 'revoked', '', ''])
  app.responses.rows.push(['old-response', '', b])
  const candidates = [a, b, c]
  app.context.Utilities.getUuid = () => candidates.shift()
  assert.equal(app.context.generateInviteCode(), c)
  assert.equal(app.invites.rows.length, 4)
  app.context.Utilities.getUuid = () => a
  assert.throws(() => app.context.generateInviteCode(), /생성하지 못했습니다/)
  assert.equal(app.invites.rows.length, 4)
  assert.equal(app.released(), 2)
})

test('generator does not write on lock failure and releases lock on write failure', () => {
  const busy = setup({ lockAvailable: false })
  assert.throws(() => busy.context.generateInviteCode(), /진행 중/)
  assert.equal(busy.invites.rows.length, 2)
  assert.equal(busy.released(), 0)
  const broken = setup({ failMark: true })
  assert.throws(() => broken.context.generateInviteCode(), /temporary write failure/)
  assert.equal(broken.invites.rows.length, 2)
  assert.equal(broken.released(), 1)
})

test('GET and POST never dispatch invite generation', () => {
  const app = setup()
  for (const action of ['generateInviteCode', 'generateInviteCodeFromMenu', 'onOpen', 'generate']) {
    assert.equal(app.context.doGet({ parameter: { action, code } }).ok, false)
    assert.equal(app.context.doPost({ postData: { contents: JSON.stringify({ action, code, payload: valid() }) } }).ok, false)
  }
  assert.equal(app.invites.rows.length, 2)
  assert.equal(app.responses.rows.length, 1)
})

function menuSetup(options) {
  const app = setup(options)
  app.alerts = []
  app.selection = null
  app.context.SpreadsheetApp.getUi = () => ({
    alert: (message) => { assert.ok(app.released() > 0 || app.invites.rows.length === 2); app.alerts.push(message) },
    createMenu: (title) => ({ addItem: (label, callback) => ({ addToUi: () => { app.menu = { title, label, callback } } }) }),
  })
  app.context.SpreadsheetApp.getActiveSpreadsheet = () => ({ getId: () => 'test-sheet', getSheetByName: () => app.invites })
  app.invites.activate = () => {}
  const getRange = app.invites.getRange
  app.invites.getRange = (...args) => ({ ...getRange(...args), activate: () => { app.selection = args } })
  return app
}

test('onOpen only registers the menu without issuing codes', () => {
  const app = menuSetup()
  app.context.onOpen()
  assert.deepEqual(app.menu, { title: 'WYEA 온보딩', label: '초대코드 발급', callback: 'generateInviteCodeFromMenu' })
  assert.equal(app.invites.rows.length, 2)
})

test('menu reuses generator and selects returned code even if another row is appended', () => {
  const app = menuSetup()
  const generate = app.context.generateInviteCode
  app.context.generateInviteCode = () => {
    const value = generate()
    app.invites.rows.push(['another-code', '', 'active', '', ''])
    return value
  }
  app.context.generateInviteCodeFromMenu()
  assert.deepEqual(app.selection, [3, 1, 1, 1])
  assert.equal(app.invites.rows[2][2], 'active')
  assert.match(app.alerts[0], /발급이 완료/)
  assert.equal(app.released(), 1)
})

test('menu refuses a different spreadsheet and handles issuance failure', () => {
  const app = menuSetup()
  app.context.SpreadsheetApp.getActiveSpreadsheet = () => ({ getId: () => 'wrong-sheet' })
  app.context.generateInviteCodeFromMenu()
  assert.equal(app.invites.rows.length, 2)
  assert.match(app.alerts[0], /설정된/)
  const busy = menuSetup({ lockAvailable: false })
  busy.context.generateInviteCodeFromMenu()
  assert.equal(busy.invites.rows.length, 2)
  assert.match(busy.alerts[0], /발급 결과를 확인하지 못/)
})

test('selection failure reports successful issuance without generating again', () => {
  const app = menuSetup()
  app.invites.activate = () => { throw new Error('UI failure') }
  app.context.generateInviteCodeFromMenu()
  assert.equal(app.invites.rows.length, 3)
  assert.match(app.alerts[0], /초대코드는 발급되었습니다/)
  assert.ok(app.alerts[0].includes(app.invites.rows[2][0]))
})
