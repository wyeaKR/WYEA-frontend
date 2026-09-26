const REPORT_HEADERS = [
  'record_id', 'submitted_at', 'name', 'phone', 'university', 'team',
  'g_event', 'g_when', 'g_role', 'g_confirmed',
  'p_scene', 'p_comment', 'p_photo_link',
  'k_issue', 'k_improvement', 'k_next', 'k_partner_reaction',
  'm_club_topic', 'm_companions', 'm_rejoin'
];
const REPORT_ROLES = ['참가', '스태프', '통역', '발표', '기타'];
const REPORT_REJOIN = ['예', '아니오', '미정'];
const REPORT_JOIN_ID = '1mukE06RTlPCI4Xu3_N8u2RKBAA67QZq-hMhn0XKSO8M';
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
function reportLookup_(name, phone) {
  const cleanName = reportText_(name, 100);
  const cleanPhone = reportDigits_(phone);
  if (!cleanName || !/^01\d{8,9}$/.test(cleanPhone)) return null;
  const sheet = reportSheet_('JOIN_SPREADSHEET_ID', 'applications');
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  const nameCol = headers.indexOf('name');
  const phoneCol = headers.indexOf('phone');
  const universityCol = headers.indexOf('university');
  const teamCol = headers.indexOf('team');
  if ([nameCol, phoneCol, universityCol, teamCol].some(i => i < 0)) throw new Error('join sheet headers missing');
  const match = values.find(row => String(row[nameCol]).trim() === cleanName && reportDigits_(row[phoneCol]) === cleanPhone);
  return match ? { university: String(match[universityCol] || ''), team: String(match[teamCol] || '') } : null;
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
  const values = {};
  for (const header of REPORT_HEADERS.slice(6)) values[header] = reportText_(payload[header], 2000);
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
    university: member.university, team: member.team, ...values, g_confirmed: '확인'
  };
  const row = REPORT_HEADERS.map(key => reportSafe_(record[key] == null ? '' : String(record[key])));
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = reportSheet_('REPORT_SPREADSHEET_ID', 'records');
    const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row]);
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
