const RENEWAL_QUERY = "title contains '기존 회원 정보 갱신' and mimeType = 'application/vnd.google-apps.form'";
const OLD_JOIN_QUERY = "title contains '26-2기 회원 가입 신청서' and mimeType = 'application/vnd.google-apps.form'";
const MEMBER_UNITS = ['기록단', '행사지원단', '통번역단', '정책제안단', '소모임'];
const POLICY_LINE = '개인정보 처리방침: https://wyea.info/personalinformationprocessingpolicy · 동의 버전 2026-09-25';
const JOIN_CONSENT_DETAILS = [
  {
    match: '개인정보 수집', title: '개인정보 수집·이용 동의',
    details: [
      '목적: 회원 가입 및 관리, 활동 안내·연락, 비영리민간단체 등록 및 비영리법인 설립허가 신청을 위한 회원명부 작성',
      '항목: 성명, 생년월일, 성별, 휴대전화, 주소(도로명주소까지), 직업, 소속 대학·캠퍼스·학과·학번, 이메일, 지원 동기, 관심 활동, 활동 분야(소속 단 또는 희망 부서 1·2지망), 가능 언어(통번역단 선택 시), 관심 주제(소모임 선택 시), 해 보고 싶은 활동(선택), 가입 경로(선택). 집행부 지원 시 본인의 역량, 해 온 활동(선택), 할 수 있는 일',
      '보유 기간: 회원 탈퇴 시까지 (관계 법령에 보존 의무가 있는 경우 그 기간)'
    ]
  },
  {
    match: '제3자', title: '개인정보 제3자 제공 동의',
    details: [
      '제공받는 자: 비영리민간단체 등록 및 비영리법인 설립허가 관할 행정기관(주무관청, 시·도 등)',
      '제공 목적: 단체 등록·설립허가 신청 및 회원 요건 확인',
      '제공 항목: 성명, 생년월일, 직업, 연락처, 주소, 가입일',
      '보유 기간: 제공받는 기관의 문서 보존 기간'
    ]
  },
  {
    match: '초상권', title: '초상권(사진·영상) 활용 동의',
    details: [
      '목적: 원활한 활동 운영 및 활동 기록·보고',
      '내용: 행사와 활동 중에는 기록을 위해 촬영이 이루어지며, 촬영한 사진·영상을 활동 보고서, 단체 웹사이트·소셜 미디어에 게시·활용합니다.',
      '게시 시 얼굴 가림 요청: 행사 참여 신청 때 또는 활동 후 게시 전까지, 게시물에 본인 얼굴이 나오지 않기를 원하면 거부할 수 있습니다. 거부하면 업로드 전에 본인 얼굴을 블러 등으로 알아볼 수 없게 처리합니다. 거부 시 단체 운영을 위하여 거부 사유 기재를 요청할 수 있습니다.',
      '보유 기간: 게시물 게시 기간'
    ]
  }
];

function findForm_(query, titlePart) {
  const files = DriveApp.searchFiles(query);
  const matches = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().includes(titlePart)) matches.push(file);
  }
  if (matches.length !== 1) throw new Error('Expected one form for ' + titlePart + ', found ' + matches.length);
  return FormApp.openById(matches[0].getId());
}
function formItemWithTitle_(form, title) {
  return form.getItems().find(item => item.getTitle() === title);
}
function setConsentHelp_(item, text) {
  switch (item.getType()) {
    case FormApp.ItemType.CHECKBOX: (item.asCheckboxItem ? item.asCheckboxItem() : item).setHelpText(text); return;
    case FormApp.ItemType.MULTIPLE_CHOICE: (item.asMultipleChoiceItem ? item.asMultipleChoiceItem() : item).setHelpText(text); return;
    case FormApp.ItemType.PARAGRAPH_TEXT: (item.asParagraphTextItem ? item.asParagraphTextItem() : item).setHelpText(text); return;
    case FormApp.ItemType.TEXT: (item.asTextItem ? item.asTextItem() : item).setHelpText(text); return;
    case FormApp.ItemType.SECTION_HEADER: (item.asSectionHeaderItem ? item.asSectionHeaderItem() : item).setHelpText(text); return;
    default: throw new Error('Unsupported consent item type: ' + item.getType());
  }
}
function ensureConsentHelp_(form) {
  const existing = form.getItems().find(item => item.getTitle().includes('동의 항목 (모두 선택)'));
  if (!existing || existing.getType() !== FormApp.ItemType.CHECKBOX) throw new Error('Existing required consent checkbox not found');
  const help = JOIN_CONSENT_DETAILS.map(consent => consent.title + '\n' + consent.details.join('\n')).join('\n\n');
  setConsentHelp_(existing, help);
  const checkbox = existing.asCheckboxItem ? existing.asCheckboxItem() : existing;
  if (checkbox.getChoices().length !== JOIN_CONSENT_DETAILS.length) throw new Error('Consent choice count differs from /join');
  checkbox.setRequired(true);
  checkbox.setValidation(FormApp.createCheckboxValidation()
    .setHelpText('세 항목에 모두 동의해야 제출할 수 있습니다.')
    .requireSelectExactly(JOIN_CONSENT_DETAILS.length)
    .build());
  JOIN_CONSENT_DETAILS.forEach(consent => {
    const duplicate = form.getItems().find(item => item.getTitle() === consent.title);
    if (duplicate) form.deleteItem(duplicate);
  });
}
function ensureUnitBranch_(form) {
  let unit = formItemWithTitle_(form, '소속 단');
  if (!unit) unit = form.addMultipleChoiceItem().setTitle('소속 단');
  if (unit.getType() !== FormApp.ItemType.MULTIPLE_CHOICE) throw new Error('소속 단 item is not multiple choice');
  const unitItem = (unit.asMultipleChoiceItem ? unit.asMultipleChoiceItem() : unit).setRequired(true);
  let translationPage = formItemWithTitle_(form, '통번역단');
  if (!translationPage) translationPage = form.addPageBreakItem().setTitle('통번역단');
  let language = formItemWithTitle_(form, '가능 언어');
  if (!language) language = form.addTextItem().setTitle('가능 언어');
  if (language.getType() !== FormApp.ItemType.TEXT) throw new Error('가능 언어 item is not text');
  (language.asTextItem ? language.asTextItem() : language).setRequired(true);
  let clubPage = formItemWithTitle_(form, '소모임');
  if (!clubPage) clubPage = form.addPageBreakItem().setTitle('소모임');
  let topic = formItemWithTitle_(form, '관심 주제');
  if (!topic) topic = form.addTextItem().setTitle('관심 주제');
  if (topic.getType() !== FormApp.ItemType.TEXT) throw new Error('관심 주제 item is not text');
  (topic.asTextItem ? topic.asTextItem() : topic).setRequired(true);
  let donePage = formItemWithTitle_(form, '소속 단 입력 완료');
  if (!donePage) donePage = form.addPageBreakItem().setTitle('소속 단 입력 완료');
  const sectionItems = [unit, translationPage, language, clubPage, topic, donePage];
  sectionItems.forEach(item => form.moveItem(item, form.getItems().length - 1));
  const translationBreak = translationPage.asPageBreakItem ? translationPage.asPageBreakItem() : translationPage;
  const clubBreak = clubPage.asPageBreakItem ? clubPage.asPageBreakItem() : clubPage;
  const doneBreak = donePage.asPageBreakItem ? donePage.asPageBreakItem() : donePage;
  clubBreak.setGoToPage(doneBreak);
  unitItem.setChoices(MEMBER_UNITS.map(value => unitItem.createChoice(
    value, value === '통번역단' ? translationBreak :
      value === '소모임' ? clubBreak : doneBreak
  )));
}
function responseSheet_(form) {
  const id = form.getDestinationId();
  if (!id) throw new Error('Form has no response spreadsheet: ' + form.getTitle());
  const book = SpreadsheetApp.openById(id);
  const sheet = book.getSheets().find(candidate => /응답|Response/i.test(candidate.getName()));
  if (!sheet) throw new Error('Response tab not found: ' + book.getUrl());
  return sheet;
}
function markRenewalResponses_(form) {
  const sheet = responseSheet_(form);
  const lastColumn = sheet.getLastColumn();
  const headings = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let noteColumn = headings.indexOf('비고') + 1;
  if (!noteColumn) {
    noteColumn = lastColumn + 1;
    sheet.getRange(1, noteColumn).setValue('비고');
  }
  const count = Math.max(0, sheet.getLastRow() - 1);
  if (count) sheet.getRange(2, noteColumn, count, 1).setValues(Array.from({ length: count }, () => ['재제출 대상']));
  return { sheet: sheet.getParent().getUrl(), existingResponses: count, noteColumn: noteColumn };
}
function removeEmptyConsentColumns_(form) {
  const sheet = responseSheet_(form);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const obsolete = JOIN_CONSENT_DETAILS.map(entry => entry.title);
  for (let column = headers.length; column >= 1; column--) {
    if (!obsolete.includes(headers[column - 1])) continue;
    const dataRows = Math.max(0, sheet.getLastRow() - 1);
    const hasData = dataRows && sheet.getRange(2, column, dataRows, 1).getValues().some(row => row[0] !== '' && row[0] !== null);
    if (!hasData) sheet.deleteColumn(column);
  }
}
function applyFormChanges() {
  const renewal = findForm_(RENEWAL_QUERY, '기존 회원 정보 갱신');
  ensureUnitBranch_(renewal);
  ensureConsentHelp_(renewal);
  removeEmptyConsentColumns_(renewal);
  const description = renewal.getDescription().replace(/\n?개인정보 처리방침: https:\/\/wyea\.info\/personalinformationprocessingpolicy[^\n]*/g, '').trim();
  renewal.setDescription((description ? description + '\n' : '') + POLICY_LINE);
  const renewalResponse = markRenewalResponses_(renewal);
  const oldJoin = findForm_(OLD_JOIN_QUERY, '26-2기 회원 가입 신청서');
  oldJoin.setAcceptingResponses(false);
  oldJoin.setDescription('가입 신청은 wyea.info/join에서');
  const oldSheet = responseSheet_(oldJoin);
  const result = {
    renewal: { id: renewal.getId(), url: renewal.getEditUrl(), responses: renewalResponse },
    oldJoin: { id: oldJoin.getId(), url: oldJoin.getEditUrl(), existingResponses: Math.max(0, oldSheet.getLastRow() - 1), acceptingResponses: oldJoin.isAcceptingResponses() }
  };
  console.log('renewalItems=' + JSON.stringify(renewal.getItems().map(item => ({ title: item.getTitle(), type: String(item.getType()) }))));
  console.log('oldJoinItems=' + JSON.stringify(oldJoin.getItems().map(item => ({ title: item.getTitle(), type: String(item.getType()) }))));
  console.log('forms=' + JSON.stringify(result));
  return result;
}

function inspectFormDetails_() {
  const renewal = findForm_(RENEWAL_QUERY, '기존 회원 정보 갱신');
  const oldJoin = findForm_(OLD_JOIN_QUERY, '26-2기 회원 가입 신청서');
  const sheet = responseSheet_(renewal);
  const headings = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const noteCol = headings.indexOf('비고') + 1;
  const notes = noteCol && sheet.getLastRow() > 1 ? sheet.getRange(2, noteCol, sheet.getLastRow() - 1, 1).getValues().filter(row => row[0] === '재제출 대상').length : 0;
  const unit = formItemWithTitle_(renewal, '소속 단');
  const multiple = unit && (unit.asMultipleChoiceItem ? unit.asMultipleChoiceItem() : unit);
  const consent = renewal.getItems().find(item => item.getTitle().includes('동의 항목 (모두 선택)'));
  const consentCheckbox = consent && (consent.asCheckboxItem ? consent.asCheckboxItem() : consent);
  return {
    ok: true,
    renewal: {
      items: renewal.getItems().map(item => ({ title: item.getTitle(), type: String(item.getType()) })),
      unitChoices: multiple ? multiple.getChoices().map(choice => ({ value: choice.getValue(), navigation: String(choice.getPageNavigationType()) })) : [],
      consentChoices: consentCheckbox ? consentCheckbox.getChoices().map(choice => choice.getValue()) : [],
      consentHelpContainsAll: Boolean(consent && JOIN_CONSENT_DETAILS.every(entry => consent.getHelpText().includes(entry.details[0]))),
      policyLine: renewal.getDescription().includes(POLICY_LINE),
      responseHeaders: headings,
      responseRows: Math.max(0, sheet.getLastRow() - 1),
      markedForResubmission: notes
    },
    oldJoin: {
      acceptingResponses: oldJoin.isAcceptingResponses(),
      description: oldJoin.getDescription(),
      responseRows: Math.max(0, responseSheet_(oldJoin).getLastRow() - 1)
    }
  };
}
