const REPORT_HEADERS = [
  'record_id', 'submitted_at', 'name', 'phone', 'university', 'team',
  'g_event', 'g_when', 'g_role', 'g_confirmed',
  'p_scene', 'p_comment', 'p_photo_link',
  'k_issue', 'k_improvement', 'k_next', 'k_partner_reaction',
  'm_club_topic', 'm_companions', 'm_rejoin',
  'submission_id'
];
// 맨 끝 열 추가 전에 만든 records 시트는 submission_id 헤더가 없다. 기존 열 순서·데이터는 그대로 두고 헤더만 채운다.
const REPORT_LEGACY_HEADER_COUNT = REPORT_HEADERS.indexOf('submission_id');
const REPORT_ROLES = ['참가', '스태프', '통역', '발표', '기타'];
const REPORT_REJOIN = ['예', '아니오', '미정'];
const REPORT_JOIN_ID = '1mukE06RTlPCI4Xu3_N8u2RKBAA67QZq-hMhn0XKSO8M';
const REPORT_RENEWAL_RESPONSE_ID = '1rnuGqL2QwYUlDYV3EXdkWrjrrjOEExr0qu3C4V4KUa0';
// 가입 시트에서 참가 기록서를 쓸 수 있는 상태. '시험'은 관리자 시험 회원(prepareTestMember_)용이다.
const REPORT_MEMBER_STATUSES = ['검토 대기', '승인', '시험'];
const REPORT_UNITS = ['기록단', '행사지원단', '통번역단', '정책제안단', '소모임'];
const REPORT_RENEWAL_CONSENTS = [
  '개인정보 수집·이용에 동의합니다',
  '개인정보 제3자 제공에 동의합니다',
  '초상권(사진·영상) 활용에 동의합니다'
];
const REPORT_EMAIL = 'wyea@wyea.info';
const OPS_SECRET = 'OPS_SECRET_PLACEHOLDER';
const TEST_NAME = '테스트 기록(삭제 예정)';
const TEST_PHONE = '01000009998';

function reportJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function reportText_(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function reportSafe_(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}
function reportDigits_(phone) {
  return String(phone || '').replace(/\D/g, '');
}
function reportSheet_(key, tab) {
  const id = PropertiesService.getScriptProperties().getProperty(key);
  if (!id) throw new Error(key + ' is not set');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(tab);
  if (!sheet) throw new Error(tab + ' tab is missing');
  return sheet;
}
function reportPhoneEquals_(value, cleanPhone) {
  const digits = reportDigits_(value);
  return digits === cleanPhone || '0' + digits === cleanPhone;
}
function reportLookup_(name, phone) {
  const cleanName = reportText_(name, 100);
  const cleanPhone = reportDigits_(phone);
  if (!cleanName || !/^01\d{8,9}$/.test(cleanPhone)) return null;
  // 가장 최근의 유효한 갱신 응답이 있으면 그것을, 없으면 가입 신청 기록을 쓴다.
  return reportLookupRenewal_(cleanName, cleanPhone) || reportLookupJoin_(cleanName, cleanPhone);
}
// (1) 가입 시트: 이름+휴대전화가 모두 일치하고 상태가 REPORT_MEMBER_STATUSES 인 행
function reportLookupJoin_(cleanName, cleanPhone) {
  const sheet = reportSheet_('JOIN_SPREADSHEET_ID', 'applications');
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  const nameCol = headers.indexOf('name');
  const phoneCol = headers.indexOf('phone');
  const statusCol = headers.indexOf('status');
  const universityCol = headers.indexOf('university');
  const teamCol = headers.indexOf('team');
  if ([nameCol, phoneCol, statusCol, universityCol, teamCol].some(i => i < 0)) throw new Error('join sheet headers missing');
  const match = values.find(row => String(row[nameCol]).trim() === cleanName && reportPhoneEquals_(row[phoneCol], cleanPhone) &&
    REPORT_MEMBER_STATUSES.includes(String(row[statusCol]).trim()));
  return match ? { university: String(match[universityCol] || ''), team: String(match[teamCol] || '') } : null;
}
// (2) 회원 정보 갱신 폼 응답: 이름+휴대전화가 일치하는 응답을 Timestamp 최신순으로 보고,
// 필수 항목(대학교, 소속 단, 통번역단→가능 언어, 소모임→관심 주제, 동의 3개)을 모두 갖춘 가장 최근 응답을 쓴다.
// Timestamp 가 날짜가 아닌 응답은 최신 판단에 쓰지 않는다. 같은 시각이면 시트 아래쪽(나중에 들어온) 행이 먼저다.
function reportRenewalTime_(value) {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value.getTime();
  return null;
}
function reportRenewalComplete_(row, cols) {
  const unit = String(row[cols.unit] || '').trim();
  const consent = String(row[cols.consent] || '');
  return Boolean(String(row[cols.university] || '').trim()) &&
    REPORT_UNITS.includes(unit) &&
    (unit !== '통번역단' || Boolean(String(row[cols.language] || '').trim())) &&
    (unit !== '소모임' || Boolean(String(row[cols.topic] || '').trim())) &&
    REPORT_RENEWAL_CONSENTS.every(choice => consent.includes(choice));
}
function reportLookupRenewal_(cleanName, cleanPhone) {
  const book = SpreadsheetApp.openById(REPORT_RENEWAL_RESPONSE_ID);
  const sheet = book.getSheets().find(candidate => /응답|Response/i.test(candidate.getName()));
  if (!sheet) throw new Error('renewal response tab missing');
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(value => String(value).trim());
  const col = title => headers.indexOf(title);
  const cols = {
    time: headers.findIndex(title => title === 'Timestamp' || title === '타임스탬프'),
    name: col('성명'), phone: col('휴대전화'), university: col('대학교'), unit: col('소속 단'),
    language: col('가능 언어'), topic: col('관심 주제'), consent: headers.findIndex(title => title.includes('동의 항목'))
  };
  if (Object.keys(cols).some(key => cols[key] < 0)) throw new Error('renewal sheet headers missing');
  const candidates = values
    .map((row, index) => ({ row, index, time: reportRenewalTime_(row[cols.time]) }))
    .filter(item => item.time !== null && String(item.row[cols.name]).trim() === cleanName && reportPhoneEquals_(item.row[cols.phone], cleanPhone))
    .sort((a, b) => b.time - a.time || b.index - a.index);
  const valid = candidates.find(item => reportRenewalComplete_(item.row, cols));
  return valid ? { university: String(valid.row[cols.university]).trim(), team: String(valid.row[cols.unit]).trim() } : null;
}
function reportEvents_() {
  const values = reportSheet_('REPORT_SPREADSHEET_ID', 'events').getDataRange().getValues();
  return values.slice(1).map(row => String(row[0] || '').trim()).filter(Boolean);
}
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === 'events') return reportJson_({ ok: true, events: reportEvents_() });
    return reportJson_({ ok: false, error: 'unknown_action' });
  } catch (error) {
    console.error(error);
    return reportJson_({ ok: false, error: 'server_error' });
  }
}
function doPost(e) {
  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (_) {
    return reportJson_({ ok: false, error: 'invalid_json' });
  }
  try {
    if (request.action === 'admin') {
      if (request.secret !== OPS_SECRET) return reportJson_({ ok: false, error: 'forbidden' });
      if (request.operation === 'setupAll') {
        try {
          setupAll();
          return reportJson_(setupStatus_());
        } catch (error) {
          return reportJson_({ ok: false, error: 'setup_failed', detail: String(error) });
        }
      }
      if (request.operation === 'prepareTestMember') return reportJson_(prepareTestMember_());
      if (request.operation === 'inspectTestRows') return reportJson_(inspectTestRows());
      if (request.operation === 'deleteTestRows') return reportJson_(deleteTestRows());
      if (request.operation === 'inspectForms') return reportJson_(inspectFormDetails_());
      if (request.operation === 'applyFormChanges') return reportJson_({ ok: true, forms: applyFormChanges() });
      if (request.operation === 'applyConsentHelp') return reportJson_(applyConsentHelp());
      if (request.operation === 'setupStatus') return reportJson_(setupStatus_());
      return reportJson_({ ok: false, error: 'unknown_operation' });
    }
    if (request.action === 'lookup') {
      const member = reportLookup_(request.name, request.phone);
      return reportJson_(member ? { ok: true, ...member } : { ok: false, error: 'not_found' });
    }
    if (request.action === 'report') return reportJson_(submitReport_(request.payload));
    return reportJson_({ ok: false, error: 'unknown_action' });
  } catch (error) {
    console.error(error);
    return reportJson_({ ok: false, error: 'server_error' });
  }
}
function submitReport_(payload) {
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'validation_failed' };
  const name = reportText_(payload.name, 100);
  const phone = reportDigits_(payload.phone);
  const member = reportLookup_(name, phone);
  if (!member) return { ok: false, error: 'not_found' };
  // submission_id 는 선택 항목이다. 새 화면은 UUID 를 보내 재전송 중복을 막고, 보내지 않는 기존 화면 요청은
  // 서버가 새 ID 를 만들어 그대로 접수한다(기존 화면의 재전송 중복까지는 막지 못한다).
  const clientId = reportText_(payload.submission_id, 100).toLowerCase();
  if (clientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(clientId)) return { ok: false, error: 'validation_failed' };
  const submissionId = clientId || String(Utilities.getUuid()).toLowerCase();
  const values = {};
  for (const header of REPORT_HEADERS.slice(6, REPORT_LEGACY_HEADER_COUNT)) values[header] = reportText_(payload[header], 2000);
  if (!reportEvents_().includes(values.g_event) || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/.test(values.g_when) ||
      !REPORT_ROLES.includes(values.g_role) || payload.g_confirmed !== true ||
      !['p_scene', 'p_comment', 'p_photo_link'].some(key => values[key]) ||
      !['k_issue', 'k_improvement', 'k_next', 'k_partner_reaction'].some(key => values[key]) ||
      !['m_club_topic', 'm_companions', 'm_rejoin'].some(key => values[key]) ||
      (values.m_rejoin && !REPORT_REJOIN.includes(values.m_rejoin)) ||
      (values.p_photo_link && !/^https:\/\//i.test(values.p_photo_link))) {
    return { ok: false, error: 'validation_failed' };
  }
  const record = {
    record_id: Utilities.getUuid(), submitted_at: new Date(), name, phone,
    university: member.university, team: member.team, ...values, g_confirmed: '확인', submission_id: submissionId
  };
  const row = REPORT_HEADERS.map(key => reportSafe_(record[key] == null ? '' : String(record[key])));
  // 중복 확인과 기록을 한 스크립트 잠금 안에서 끝내고, 잠금을 풀기 전에 flush 해서
  // 거의 동시에 들어온 같은 submission_id 요청이 이 행을 보고 중복으로 판단하게 한다.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = reportRecordsSheet_();
    // 응답만 유실된 뒤 같은 submission_id 로 다시 보내면 새 행·메일 없이 성공으로 돌려준다.
    if (clientId && reportSubmissionExists_(sheet, submissionId)) return { ok: true, duplicate: true };
    const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  try {
    MailApp.sendEmail({
      to: REPORT_EMAIL,
      subject: '[WYEA] 참가 기록서: ' + name + ' (' + member.university + ' · ' + member.team + ' · ' + values.g_event + ')',
      body: '새 참가 기록서가 접수되었습니다.\n행사: ' + values.g_event + '\n기록서: ' + SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('REPORT_SPREADSHEET_ID')).getUrl(),
      name: 'WYEA 참가 기록서'
    });
  } catch (error) {
    console.error('report mail failed: ' + error);
  }
  return { ok: true };
}
function reportRecordsSheet_() {
  const sheet = reportSheet_('REPORT_SPREADSHEET_ID', 'records');
  const headerRange = sheet.getRange(1, 1, 1, REPORT_HEADERS.length);
  const headers = headerRange.getValues()[0].map(value => String(value).trim());
  const legacy = REPORT_HEADERS.slice(0, REPORT_LEGACY_HEADER_COUNT);
  if (legacy.some((header, i) => headers[i] !== header)) throw new Error('records headers mismatch');
  const idCol = REPORT_LEGACY_HEADER_COUNT;
  if (headers[idCol] === '') sheet.getRange(1, idCol + 1).setValue('submission_id');
  else if (headers[idCol] !== 'submission_id') throw new Error('records headers mismatch');
  return sheet;
}
function reportSubmissionExists_(sheet, submissionId) {
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return false;
  return sheet.getRange(2, REPORT_LEGACY_HEADER_COUNT + 1, rows, 1).getValues()
    .some(row => String(row[0]).trim().toLowerCase() === submissionId);
}
function inspectTestRows() {
  const sheet = reportSheet_('REPORT_SPREADSHEET_ID', 'records');
  const values = sheet.getDataRange().getValues();
  const count = values.slice(1).filter(row => row[2] === TEST_NAME).length;
  console.log('testRows=' + count + ', sheet=' + sheet.getParent().getUrl());
  return { ok: true, reportTestRows: count, sheet: sheet.getParent().getUrl() };
}
function deleteTestRows() {
  const sheet = reportSheet_('REPORT_SPREADSHEET_ID', 'records');
  let removed = 0;
  for (let row = sheet.getLastRow(); row >= 2; row--) {
    if (sheet.getRange(row, 3).getValue() === TEST_NAME) {
      sheet.deleteRow(row);
      removed++;
    }
  }
  const join = reportSheet_('JOIN_SPREADSHEET_ID', 'applications');
  const headers = join.getRange(1, 1, 1, join.getLastColumn()).getValues()[0].map(String);
  const nameCol = headers.indexOf('name') + 1;
  const phoneCol = headers.indexOf('phone') + 1;
  let joinRemoved = 0;
  for (let row = join.getLastRow(); row >= 2; row--) {
    if (join.getRange(row, nameCol).getValue() === TEST_NAME && testPhoneMatches_(join.getRange(row, phoneCol).getValue())) {
      join.deleteRow(row);
      joinRemoved++;
    }
  }
  console.log('deletedTestRows=' + removed + ', deletedJoinTestRows=' + joinRemoved);
  return { ok: true, reportDeleted: removed, joinDeleted: joinRemoved };
}
function prepareTestMember_() {
  const join = reportSheet_('JOIN_SPREADSHEET_ID', 'applications');
  const values = join.getDataRange().getValues();
  const headers = values.shift().map(String);
  const nameCol = headers.indexOf('name');
  const phoneCol = headers.indexOf('phone');
  if (nameCol < 0 || phoneCol < 0) throw new Error('join headers missing');
  for (let row = join.getLastRow(); row >= 2; row--) {
    if (join.getRange(row, nameCol + 1).getValue() === TEST_NAME && testPhoneMatches_(join.getRange(row, phoneCol + 1).getValue())) join.deleteRow(row);
  }
  const row = headers.map(header => ({ name: TEST_NAME, phone: TEST_PHONE, university: '시험 대학교', team: '기록단', status: '시험' })[header] || '');
  const range = join.getRange(join.getLastRow() + 1, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row]);
  return { ok: true, existing: false };
}
function testPhoneMatches_(value) {
  const digits = reportDigits_(value);
  return digits === TEST_PHONE || digits === TEST_PHONE.slice(1);
}
