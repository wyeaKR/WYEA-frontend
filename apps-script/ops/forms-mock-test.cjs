/* global require, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
// apps-script/ops/forms.gs 의 applyConsentHelp 모의 테스트. 실제 폼·시트에는 아무것도 보내지 않습니다.
// 실행: node apps-script/ops/forms-mock-test.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

let checks = 0
const ok = (value, label) => { assert.ok(value, label); checks++ }

// 필수 여부·검증 규칙·도움말을 상태로 들고, 구조를 바꾸는 호출은 기록하는 가짜 문항
const mutations = []
function fakeItem(id, title, type, extra = {}) {
  const item = {
    id, title, type, required: true, validation: 'existing-validation', help: extra.help || '', choices: extra.choices || [],
    getId: () => id,
    getTitle: () => title,
    getType: () => type,
    getHelpText: () => item.help,
    getChoices: () => item.choices,
    setHelpText(text) { item.help = text; mutations.push(['help', id]); return item },
    setRequired(value) { item.required = value; mutations.push(['required', id]); return item },
    setValidation(value) { item.validation = value; mutations.push(['validation', id]); return item },
    isRequired: () => item.required,
  }
  item.asCheckboxItem = () => item
  item.asTextItem = () => item
  item.asMultipleChoiceItem = () => item
  return item
}
const items = [
  fakeItem('i-name', '성명', 'TEXT'),
  fakeItem('i-consent', '[필수] 동의 항목 (모두 선택)', 'CHECKBOX', { help: '옛 도움말: 지원 동기, 관심 활동', choices: ['a', 'b', 'c'] }),
  // 동의 제목과 같은 중복 문항이 있어도 applyConsentHelp 는 지우지 않아야 한다
  fakeItem('i-dup', '개인정보 수집·이용 동의', 'CHECKBOX'),
  fakeItem('i-unit', '소속 단', 'MULTIPLE_CHOICE'),
]
const responses = [['Timestamp', '성명'], ['2026-09-20', '기존 응답']]
const renewalForm = {
  getItems: () => [...items],
  deleteItem: item => { mutations.push(['delete', item.getId()]); items.splice(items.indexOf(item), 1) },
  moveItem: () => mutations.push(['move']),
  addMultipleChoiceItem: () => { mutations.push(['add']); return fakeItem('new', '', 'MULTIPLE_CHOICE') },
  addTextItem: () => { mutations.push(['add']); return fakeItem('new', '', 'TEXT') },
  addPageBreakItem: () => { mutations.push(['add']); return fakeItem('new', '', 'PAGE_BREAK') },
  getDestinationId: () => { mutations.push(['responses']); return 'responses' },
  setDescription: () => mutations.push(['description']),
}
const sandbox = {
  FormApp: {
    ItemType: { CHECKBOX: 'CHECKBOX', MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', PARAGRAPH_TEXT: 'PARAGRAPH_TEXT', TEXT: 'TEXT', SECTION_HEADER: 'SECTION_HEADER' },
    openById: () => renewalForm,
    createCheckboxValidation: () => { mutations.push(['createValidation']); return { setHelpText() { return this }, requireSelectExactly() { return this }, build() { return {} } } },
  },
  DriveApp: {
    searchFiles: () => {
      let done = false
      return { hasNext: () => !done, next: () => { done = true; return { getName: () => '세계청년교류연합(WYEA) 기존 회원 정보 갱신', getId: () => 'renewal' } } }
    },
  },
  SpreadsheetApp: { openById: () => { mutations.push(['spreadsheet']); return {} } },
}
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(__dirname, 'forms.gs'), 'utf8'), sandbox)

const snapshot = () => JSON.stringify(items.map(item => ({ id: item.id, title: item.title, required: item.required, validation: item.validation })))
const before = snapshot()
const beforeCount = items.length
const responsesBefore = JSON.stringify(responses)
const result = sandbox.applyConsentHelp()
ok(result.ok === true, 'ok')
ok(result.consentHelpMatchesRenewal === true, 'matches')
ok(items.length === beforeCount, 'item count unchanged')
ok(snapshot() === before, 'item ids/order/required/validation unchanged')
ok(JSON.stringify(responses) === responsesBefore, 'responses unchanged')
ok(JSON.stringify(mutations) === JSON.stringify([['help', 'i-consent']]), 'only the consent help text was written: ' + JSON.stringify(mutations))

const helpText = items.find(item => item.id === 'i-consent').help
ok(/항목: 성명, 생년월일, 성별, 휴대전화, 주소\(도로명주소까지\), 직업, 소속 대학·캠퍼스·학과·학번, 이메일, 소속 단, 가능 언어\(통번역단 선택 시\), 관심 주제\(소모임 선택 시\)/.test(helpText), 'items')
for (const missing of ['지원 동기', '관심 활동', '희망 부서', '해 보고 싶은 활동', '가입 경로', '집행부']) ok(!helpText.includes(missing), missing)
// 목적·보유 기간·제3자 제공·초상권 문구는 /join 과 같게 유지
for (const consent of vm.runInContext('JOIN_CONSENT_DETAILS', sandbox)) {
  ok(helpText.includes(consent.title), consent.title)
  for (const line of consent.details) if (!line.startsWith('항목: ')) ok(helpText.includes(line), line)
}

// 동의 문항이 없으면 아무것도 바꾸지 않고 실패
mutations.length = 0
const consentIndex = items.findIndex(item => item.id === 'i-consent')
const [removed] = items.splice(consentIndex, 1)
assert.throws(() => sandbox.applyConsentHelp(), /consent checkbox not found/)
checks++
ok(mutations.length === 0, 'no writes when consent item missing')
items.splice(consentIndex, 0, removed)

console.log(`forms mock tests: ${checks} passed`)
