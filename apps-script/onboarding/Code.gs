// 스크립트 속성 ONBOARDING_SPREADSHEET_ID에 테스트용 스프레드시트 ID를 설정합니다.
var INVITE_HEADERS = ['code', 'issued_at', 'status', 'used_at', 'response_id'];
var RESPONSE_HEADERS = ['response_id', 'submitted_at', 'invite_code', 'name_ko', 'last_name_en', 'first_name_en', 'desired_id', 'contact_email', 'expectations', 'desired_activities', 'interests', 'interest_other', 'agree_privacy'];
var INTEREST_OPTIONS = ['행정·문서', 'SNS·콘텐츠', '행사 기획', '대외협력', '지부 운영·모집', '디자인', '번역', '사진·영상', '웹·개발', '아직 정하지 못함', '기타'];

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function sheets_() {
  var id = PropertiesService.getScriptProperties().getProperty('ONBOARDING_SPREADSHEET_ID');
  if (!id) throw new Error('Missing spreadsheet configuration');
  var book = SpreadsheetApp.openById(id);
  var invites = book.getSheetByName('invites');
  var responses = book.getSheetByName('responses');
  [[invites, INVITE_HEADERS], [responses, RESPONSE_HEADERS]].forEach(function (item) {
    if (!item[0]) throw new Error('Missing sheet');
    var actual = item[0].getRange(1, 1, 1, item[1].length).getValues()[0];
    if (item[1].some(function (header, index) { return actual[index] !== header; })) throw new Error('Invalid sheet headers');
  });
  return { invites: invites, responses: responses };
}
function rows_(sheet, width) {
  var count = sheet.getLastRow() - 1;
  return count > 0 ? sheet.getRange(2, 1, count, width).getValues() : [];
}
function invite_(sheet, code) {
  var matches = [];
  rows_(sheet, 5).forEach(function (row, index) {
    if (String(row[0]) === code) matches.push({ row: row, number: index + 2 });
  });
  return matches.length === 1 && matches[0].row[2] === 'active' ? matches[0] : null;
}
function existing_(sheet, code) {
  return rows_(sheet, 13).find(function (row) { return String(row[2]) === code; });
}
function code_(value) { return typeof value === 'string' ? value.trim() : ''; }
function doGet(e) {
  try {
    var params = e && e.parameter || {};
    var code = code_(params.code);
    if (params.action !== 'verify' || !code) return json_({ ok: false, error: 'invalid_code' });
    var sheets = sheets_();
    if (!invite_(sheets.invites, code) || existing_(sheets.responses, code)) return json_({ ok: false, error: 'invalid_code' });
    return json_({ ok: true });
  } catch (_) { return json_({ ok: false, error: 'server_error' }); }
}
function validate_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  var result = {};
  var keys = ['name_ko', 'last_name_en', 'first_name_en', 'desired_id', 'contact_email', 'expectations', 'desired_activities'];
  if (keys.some(function (key) {
    if (typeof input[key] !== 'string' || !input[key].trim()) return true;
    result[key] = input[key].trim(); return false;
  })) return null;
  if (result.name_ko.length > 30) return null;
  if (['last_name_en', 'first_name_en'].some(function (key) {
    return result[key].length > 50 || !/^[A-Za-z '-]+$/.test(result[key]);
  })) return null;
  if (!/^[a-z0-9.]{3,30}$/.test(result.desired_id)) return null;
  if (result.expectations.length > 1000 || result.desired_activities.length > 1000) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contact_email)) return null;
  if (!Array.isArray(input.interests) || !input.interests.length || input.interests.some(function (value) { return INTEREST_OPTIONS.indexOf(value) === -1; })) return null;
  result.interests = INTEREST_OPTIONS.filter(function (value) { return input.interests.indexOf(value) !== -1; });
  if (result.interests.indexOf('아직 정하지 못함') !== -1 && result.interests.length > 1) return null;
  if (input.interest_other !== undefined && typeof input.interest_other !== 'string') return null;
  if ((input.interest_other || '').trim().length > 200) return null;
  result.interest_other = result.interests.indexOf('기타') !== -1 ? (input.interest_other || '').trim() : '';
  if (result.interests.indexOf('기타') !== -1 && !result.interest_other) return null;
  if (input.agree_privacy !== true) return null;
  result.agree_privacy = true;
  return result;
}
// 수식 접두 문자와 선행 공백/제어문자를 방어합니다. 시트에는 일반 텍스트로 저장합니다.
function safeCell_(value) {
  return typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value;
}
function markUsed_(sheet, invite, time, responseId) {
  sheet.getRange(invite.number, 3, 1, 3).setValues([['used', time, responseId]]);
  SpreadsheetApp.flush();
}
function doPost(e) {
  var lock;
  var acquired = false;
  try {
    var request;
    try { request = JSON.parse(e && e.postData && e.postData.contents || ''); }
    catch (_) { return json_({ ok: false, error: 'validation_failed' }); }
    var payload = request && validate_(request.payload);
    var code = request && code_(request.code);
    if (!request || request.action !== 'submit' || !payload || !code) return json_({ ok: false, error: 'validation_failed' });
    lock = LockService.getScriptLock();
    acquired = lock.tryLock(10000);
    if (!acquired) return json_({ ok: false, error: 'server_error' });
    var sheets = sheets_();
    var invite = invite_(sheets.invites, code);
    if (!invite) return json_({ ok: false, error: 'invalid_code' });
    var previous = existing_(sheets.responses, code);
    if (previous) {
      // 이전 저장 후 코드 상태 변경만 실패한 경우에도 응답을 다시 저장하지 않습니다.
      markUsed_(sheets.invites, invite, previous[1], previous[0]);
      return json_({ ok: false, error: 'invalid_code' });
    }
    var id = Utilities.getUuid();
    var time = new Date().toISOString();
    var row = [id, time, code, payload.name_ko, payload.last_name_en, payload.first_name_en, payload.desired_id, payload.contact_email, payload.expectations, payload.desired_activities, payload.interests.join(', '), payload.interest_other, payload.agree_privacy];
    var range = sheets.responses.getRange(sheets.responses.getLastRow() + 1, 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row.map(safeCell_)]);
    SpreadsheetApp.flush();
    markUsed_(sheets.invites, invite, time, id);
    return json_({ ok: true, response_id: id });
  } catch (_) { return json_({ ok: false, error: 'server_error' }); }
  finally { if (acquired) lock.releaseLock(); }
}
// 편집기에서 한 번 실행해 권한과 시트 헤더를 확인합니다. 데이터를 쓰지 않습니다.
function checkSetup() {
  sheets_();
  console.log('온보딩 테스트 시트 연결 및 헤더 확인 완료');
}

// 관리자 편집기/Sheets 메뉴용입니다. doGet/doPost에서는 호출하지 않습니다.
function generateInviteCode() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('다른 작업이 진행 중입니다. 잠시 후 다시 실행하세요.');
  try {
    var sheets = sheets_();
    var existingCodes = rows_(sheets.invites, 5).map(function (row) { return String(row[0]); });
    var responseCodes = rows_(sheets.responses, 13).map(function (row) { return String(row[2]); });
    for (var attempt = 0; attempt < 10; attempt++) {
      var code = Utilities.getUuid().replace(/-/g, '');
      if (existingCodes.indexOf(code) !== -1 || responseCodes.indexOf(code) !== -1) continue;
      var row = sheets.invites.getLastRow() + 1;
      sheets.invites.getRange(row, 1, 1, 1).setNumberFormat('@');
      sheets.invites.getRange(row, 1, 1, 5).setValues([[code, new Date().toISOString(), 'active', '', '']]);
      SpreadsheetApp.flush();
      console.log('초대코드를 발급했습니다. invites 시트의 ' + row + '행에서 확인하세요.');
      return code;
    }
    throw new Error('중복되지 않는 초대코드를 생성하지 못했습니다. 다시 실행하세요.');
  } finally { lock.releaseLock(); }
}

// 시트를 열 때 메뉴만 추가하며 코드를 자동 발급하지 않습니다.
function onOpen() {
  SpreadsheetApp.getUi().createMenu('WYEA 온보딩')
    .addItem('초대코드 발급', 'generateInviteCodeFromMenu')
    .addToUi();
}

function generateInviteCodeFromMenu() {
  var ui = SpreadsheetApp.getUi();
  var code;
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var id = PropertiesService.getScriptProperties().getProperty('ONBOARDING_SPREADSHEET_ID');
    if (!book || book.getId() !== id) {
      ui.alert('설정된 onboarding 스프레드시트에서 실행해 주세요.');
      return;
    }
    code = generateInviteCode();
  } catch (_) {
    ui.alert('발급 결과를 확인하지 못했습니다. invites 시트를 확인한 뒤 다시 시도해 주세요.');
    return;
  }
  // 생성 함수가 잠금을 해제한 뒤 UI를 조작합니다. 마지막 행 대신 반환된 코드로 찾습니다.
  try {
    var sheet = book.getSheetByName('invites');
    var index = rows_(sheet, 5).findIndex(function (row) { return String(row[0]) === code; });
    if (index === -1) throw new Error('Generated code not found');
    sheet.activate();
    sheet.getRange(index + 2, 1, 1, 1).activate();
  } catch (_) {
    ui.alert('초대코드는 발급되었습니다. 셀을 자동 선택하지 못했으니 invites에서 확인해 주세요.\n' + code);
    return;
  }
  ui.alert('초대코드 발급이 완료되었습니다. 선택된 셀을 복사해 전달해 주세요.');
}
