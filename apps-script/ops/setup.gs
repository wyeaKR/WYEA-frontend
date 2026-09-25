const REPORT_DRIVE_FOLDER_ID = '0AOfI0OjR2MyyUk9PVA';

function setupAll() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('JOIN_SPREADSHEET_ID', REPORT_JOIN_ID);
  let id = props.getProperty('REPORT_SPREADSHEET_ID');
  let book = id ? SpreadsheetApp.openById(id) : null;
  if (!book) {
    book = SpreadsheetApp.create('WYEA 참가 기록서');
    id = book.getId();
    props.setProperty('REPORT_SPREADSHEET_ID', id);
    console.log('reportSpreadsheet=' + book.getUrl());
    try {
      DriveApp.getFileById(id).moveTo(DriveApp.getFolderById(REPORT_DRIVE_FOLDER_ID));
      console.log('sharedDriveMove=ok');
    } catch (error) {
      console.error('sharedDriveMove=failed; spreadsheet=' + book.getUrl() + '; ' + error);
    }
  }
  let records = book.getSheetByName('records');
  if (!records) records = book.insertSheet('records');
  records.getRange(1, 1, 1, REPORT_HEADERS.length).setValues([REPORT_HEADERS]);
  records.setFrozenRows(1);
  let events = book.getSheetByName('events');
  if (!events) events = book.insertSheet('events');
  events.getRange(1, 1).setValue('event_name');
  if (events.getLastRow() < 2) events.getRange(2, 1).setValue('26-2기 회원 OT');
  events.setFrozenRows(1);
  const views = createDepartmentFilterViews_(book.getId(), records.getSheetId());
  console.log('filterViews=' + views.join(','));
  const forms = applyFormChanges();
  console.log('setupAll=' + JSON.stringify({ spreadsheet: book.getUrl(), filterViews: views, forms: forms }));
}

function createDepartmentFilterViews_(spreadsheetId, sheetId) {
  const ranges = [
    ['총무부', 6, 10], ['홍보부', 10, 13],
    ['기획부', 13, 17], ['회원부', 17, 20]
  ];
  const info = Sheets.Spreadsheets.get(spreadsheetId, { fields: 'sheets(properties(sheetId),filterViews(title))' });
  const target = (info.sheets || []).find(sheet => sheet.properties.sheetId === sheetId);
  const existing = (target && target.filterViews || []).map(view => view.title);
  const requests = ranges.filter(range => !existing.includes(range[0])).map(range => ({
    addFilterView: { filter: {
      title: range[0], range: { sheetId: sheetId, startRowIndex: 0, startColumnIndex: range[1], endColumnIndex: range[2] }
    } }
  }));
  if (requests.length) Sheets.Spreadsheets.batchUpdate({ requests: requests }, spreadsheetId);
  return ranges.map(range => range[0]);
}

function setupStatus_() {
  const properties = PropertiesService.getScriptProperties();
  const id = properties.getProperty('REPORT_SPREADSHEET_ID');
  const book = id ? SpreadsheetApp.openById(id) : null;
  const records = book && book.getSheetByName('records');
  const events = book && book.getSheetByName('events');
  const renewal = findForm_(RENEWAL_QUERY, '기존 회원 정보 갱신');
  const oldJoin = findForm_(OLD_JOIN_QUERY, '26-2기 회원 가입 신청서');
  const titles = renewal.getItems().map(item => item.getTitle());
  return {
    ok: true,
    reportSheetReady: Boolean(records && events && events.getLastRow() >= 2),
    renewalItems: ['소속 단', '가능 언어', '관심 주제'].map(title => ({ title: title, present: titles.includes(title) })),
    renewalConsentHelp: JOIN_CONSENT_DETAILS.map(consent => {
      const item = renewal.getItems().find(candidate => candidate.getTitle().includes('동의 항목 (모두 선택)'));
      return { title: consent.title, present: Boolean(item), hasDetails: Boolean(item && item.getHelpText().includes(consent.details[0])) };
    }),
    renewalResponseRows: Math.max(0, responseSheet_(renewal).getLastRow() - 1),
    oldJoinAcceptingResponses: oldJoin.isAcceptingResponses(),
    oldJoinResponseRows: Math.max(0, responseSheet_(oldJoin).getLastRow() - 1)
  };
}
