// WYEA 회원 가입 신청(/join) 접수 API입니다.
// 스크립트 속성 JOIN_SPREADSHEET_ID에 신청 시트가 있는 스프레드시트 ID를 설정합니다.
// 검증 규칙은 src/content/join.ts와 같아야 합니다. 한쪽을 바꾸면 다른 쪽도 바꿉니다.
var SHEET_NAME = 'applications';
var HEADERS = ['application_id', 'submitted_at', 'status', 'track', 'team', 'name', 'birth', 'gender', 'phone', 'address', 'occupation',
  'university', 'university_other', 'campus', 'department', 'student_id', 'email', 'interests', 'motivation', 'hopes',
  'referral', 'competencies', 'experience', 'capabilities', 'consent_collect', 'consent_third_party', 'consent_portrait', 'consent_version', 'source',
  'team_second', 'languages', 'club_topic', 'recommended_dept'];
// 기존 열은 그대로 두고 2026-09-26에 team_second(2지망)·languages(가능 언어)·club_topic(소모임 주제)·recommended_dept(추천 부서)를 끝에 추가했습니다.
// team은 일반 트랙에서는 소속 단, 집행부 트랙에서는 부서 1지망입니다.
var UNIVERSITIES = ['국립창원대학교', '경상국립대학교', '경남대학교', '인제대학교', '부산대학교', '계명대학교', '대구대학교',
  '마산대학교', '경희대학교', '서울대학교', '서울시립대학교', '연세대학교', '우송정보대학'];
var OCCUPATIONS = ['대학생(재학)', '대학생(휴학)', '대학원생', '졸업생'];
var INTERESTS = ['해외 청년 교류회 참가', '교류회·행사 기획과 현장 운영', '지역사회 봉사활동', '음악·문화 교류', '외국어 회화·언어 교환',
  'SNS·콘텐츠 제작 (사진·영상·글)', '디자인·홍보물 제작', '글쓰기·기사 작성 (단체 신문)', '청년 정책 제안·간담회', '창업·공모전 프로젝트',
  '해외 단체·지역 기관과의 대외협력', '행정·문서 (회의록·서류)', '재무·회계', '대학 지부 운영·회원 모집'];
var REFERRALS = ['에브리타임', '인스타그램', '지인 소개', '홈페이지'];
// 조직도(2026-09-26 확정). src/content/join.ts의 memberUnits·departments·interestMapping과 같아야 합니다.
var MEMBER_UNITS = ['기록단', '행사지원단', '통번역단', '정책제안단', '소모임'];
var DEPARTMENTS = ['총무부', '기획부', '홍보부', '회원부'];
var TRACKS = { member: '일반', staff: '집행부' };
var INTEREST_MAPPING = {
  '행정·문서 (회의록·서류)': '총무부', '재무·회계': '총무부',
  '교류회·행사 기획과 현장 운영': '기획부', '해외 단체·지역 기관과의 대외협력': '기획부', '지역사회 봉사활동': '기획부',
  'SNS·콘텐츠 제작 (사진·영상·글)': '홍보부', '디자인·홍보물 제작': '홍보부', '글쓰기·기사 작성 (단체 신문)': '홍보부',
  '대학 지부 운영·회원 모집': '회원부',
  // '해외 청년 교류회 참가'는 전 회원 공통이라 매핑하지 않습니다.
  '외국어 회화·언어 교환': '통번역단', '청년 정책 제안·간담회': '정책제안단',
  '음악·문화 교류': '소모임', '창업·공모전 프로젝트': '소모임',
};
var CONSENT_VERSIONS = ['2026-09-25'];
var LIMITS = { name: 30, address: 120, campus: 40, department: 60, student_id: 20, email: 120, other: 60, motivation: 1000, hopes: 1000,
  competencies: 1000, experience: 1000, capabilities: 1000, languages: 60, club_topic: 60 };
var MIN_MOTIVATION = 20;
var MIN_DETAIL = 20;
var MIN_AGE = 14;
var MIN_ELAPSED_MS = 3000;

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('JOIN_SPREADSHEET_ID');
  if (!id) throw new Error('Missing spreadsheet configuration');
  var sheet = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Missing sheet');
  var actual = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (HEADERS.some(function (h, i) { return actual[i] !== h; })) throw new Error('Invalid sheet headers');
  return sheet;
}

function str_(value, max, required) {
  if (typeof value !== 'string') return null;
  var v = value.trim();
  if ((required && !v) || v.length > max) return null;
  return v;
}

function ageKst_(birth) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  if (!m) return NaN;
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd').split('-').map(Number);
  var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  var check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return NaN;
  var age = today[0] - y;
  if (today[1] < mo || (today[1] === mo && today[2] < d)) age -= 1;
  return age;
}

function validate_(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  var r = {};
  if (!Object.prototype.hasOwnProperty.call(TRACKS, p.track)) return null;
  r.track = p.track;
  var staff = r.track === 'staff';
  if (staff) {
    if (DEPARTMENTS.indexOf(p.team) === -1) return null;
    r.team = p.team;
    if ((r.team_second = str_(p.team_second || '', LIMITS.other, false)) === null) return null;
    if (r.team_second && (DEPARTMENTS.indexOf(r.team_second) === -1 || r.team_second === r.team)) return null;
    r.languages = '';
    r.club_topic = '';
  } else {
    if (MEMBER_UNITS.indexOf(p.team) === -1) return null;
    r.team = p.team;
    r.team_second = '';
    // 통번역단은 가능 언어, 소모임은 관심 주제가 필수입니다. 다른 단에서는 비웁니다.
    if (r.team === '통번역단') { if ((r.languages = str_(p.languages, LIMITS.languages, true)) === null) return null; } else r.languages = '';
    if (r.team === '소모임') { if ((r.club_topic = str_(p.club_topic, LIMITS.club_topic, true)) === null) return null; } else r.club_topic = '';
  }
  if ((r.name = str_(p.name, LIMITS.name, true)) === null) return null;
  if (typeof p.birth !== 'string') return null;
  var age = ageKst_(p.birth);
  if (isNaN(age) || age < MIN_AGE || age > 100) return null;
  r.birth = p.birth;
  if (['남', '여'].indexOf(p.gender) === -1) return null;
  r.gender = p.gender;
  if (typeof p.phone !== 'string' || !/^010-\d{4}-\d{4}$/.test(p.phone)) return null;
  r.phone = p.phone;
  if ((r.address = str_(p.address, LIMITS.address, true)) === null) return null;
  if ((r.occupation = str_(p.occupation, LIMITS.other, true)) === null) return null;
  if (typeof p.university_other !== 'boolean') return null;
  if ((r.university = str_(p.university, LIMITS.other, true)) === null) return null;
  if (!p.university_other && UNIVERSITIES.indexOf(r.university) === -1) return null;
  r.university_other = p.university_other;
  if ((r.campus = str_(p.campus, LIMITS.campus, true)) === null) return null;
  if ((r.department = str_(p.department, LIMITS.department, true)) === null) return null;
  if ((r.student_id = str_(p.student_id, LIMITS.student_id, true)) === null || !/^\d+$/.test(r.student_id)) return null;
  if ((r.email = str_(p.email, LIMITS.email, true)) === null || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return null;
  // 관심 활동은 두 트랙 모두 1개 이상 필수입니다(부서 추천의 근거).
  if (!Array.isArray(p.interests) || !p.interests.length || p.interests.some(function (v) { return INTERESTS.indexOf(v) === -1; })) return null;
  r.interests = INTERESTS.filter(function (v) { return p.interests.indexOf(v) !== -1; });
  r.recommended_dept = recommendDepartments_(r.interests).join(', ');
  if (staff) {
    // 집행부 지원서에는 해 보고 싶은 것 칸이 없고, 역량·해 온 것·할 수 있는 것을 받습니다.
    r.hopes = '';
    if ((r.competencies = str_(p.competencies, LIMITS.competencies, true)) === null || r.competencies.length < MIN_DETAIL) return null;
    if ((r.experience = str_(p.experience || '', LIMITS.experience, false)) === null) return null;
    if ((r.capabilities = str_(p.capabilities, LIMITS.capabilities, true)) === null || r.capabilities.length < MIN_DETAIL) return null;
  } else {
    if ((r.hopes = str_(p.hopes || '', LIMITS.hopes, false)) === null) return null;
    r.competencies = '';
    r.experience = '';
    r.capabilities = '';
  }
  if ((r.motivation = str_(p.motivation, LIMITS.motivation, true)) === null || r.motivation.length < MIN_MOTIVATION) return null;
  if ((r.referral = str_(p.referral || '', LIMITS.other, false)) === null) return null;
  var c = p.consent;
  if (!c || c.collect !== true || c.third_party !== true || c.portrait !== true || CONSENT_VERSIONS.indexOf(c.version) === -1) return null;
  r.consent_version = c.version;
  // 직업 기타 입력은 허용하되, 목록 밖 값은 검토 때 확인합니다.
  r.occupation_known = OCCUPATIONS.indexOf(r.occupation) !== -1;
  r.referral_known = !r.referral || REFERRALS.indexOf(r.referral) !== -1;
  return r;
}

// 고른 관심 활동 중 부서에 해당하는 것을 세어 가장 많은 부서를 돌려줍니다. 동점이면 모두. src/content/join.ts의 recommendDepartments와 같습니다.
function recommendDepartments_(interests) {
  var counts = {};
  interests.forEach(function (i) {
    var target = INTEREST_MAPPING[i];
    if (target && DEPARTMENTS.indexOf(target) !== -1) counts[target] = (counts[target] || 0) + 1;
  });
  var max = 0;
  DEPARTMENTS.forEach(function (d) { if ((counts[d] || 0) > max) max = counts[d]; });
  return max === 0 ? [] : DEPARTMENTS.filter(function (d) { return counts[d] === max; });
}

// 수식 접두 문자와 선행 공백/제어문자를 방어합니다. 시트에는 일반 텍스트로 저장합니다.
function safeCell_(value) {
  return typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value;
}

// 새 신청이 들어오면 집행부에 알림 메일을 보냅니다.
// 받는 사람은 스크립트 속성 NOTIFY_EMAILS(쉼표로 구분)로 바꿉니다. 비어 있으면 DEFAULT_NOTIFY_EMAIL로 보냅니다.
// 인사 담당 그룹 주소가 정해지면 코드 수정 없이 이 속성만 바꾸면 됩니다.
// 메일에는 연락처·주소·생년월일을 넣지 않습니다. 자세한 내용은 시트에서 확인합니다.
// 메일 발송이 실패해도 신청 접수는 성공으로 처리합니다.
var DEFAULT_NOTIFY_EMAIL = 'wyea@wyea.info';

function notifyRecipients_() {
  var raw = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAILS') || DEFAULT_NOTIFY_EMAIL;
  return raw.split(',').map(function (v) { return v.trim(); }).filter(function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); });
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function notify_(data, sheet) {
  try {
    var to = notifyRecipients_();
    if (!to.length) return;
    var url = sheet.getParent().getUrl() + '#gid=' + sheet.getSheetId();
    var staff = data.track === 'staff';
    var rows = [
      ['구분', TRACKS[data.track]],
      ['이름', data.name],
      ['소속', data.university + ' ' + data.department + ' (' + data.occupation + ')'],
      [staff ? '희망 부서' : '소속 단', staff && data.team_second ? data.team + ' (2지망: ' + data.team_second + ')' : data.team],
    ];
    if (data.languages) rows.push(['가능 언어', data.languages]);
    if (data.club_topic) rows.push(['관심 주제', data.club_topic]);
    rows.push(['관심 활동', data.interests.join(', ')]);
    if (data.recommended_dept) rows.push(['추천 부서', data.recommended_dept]);
    rows.push(['지원 동기', data.motivation]);
    if (staff) {
      rows.push(['나의 역량', data.competencies]);
      if (data.experience) rows.push(['해 온 것', data.experience]);
      rows.push(['할 수 있는 것', data.capabilities]);
    }
    if (data.hopes) rows.push(['해 보고 싶은 것', data.hopes]);
    if (data.referral) rows.push(['알게 된 경로', data.referral]);
    var text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n\n신청 시트: ' + url;
    var intro = staff ? '홈페이지로 새 집행부 지원이 들어왔습니다.' : '홈페이지로 새 회원 가입 신청이 들어왔습니다.';
    var html = '<p>' + intro + '</p><table cellpadding="6" style="border-collapse:collapse">' +
      rows.map(function (r) {
        return '<tr><th align="left" valign="top" style="white-space:nowrap;color:#0d47a1">' + escapeHtml_(r[0]) +
          '</th><td style="white-space:pre-wrap">' + escapeHtml_(r[1]) + '</td></tr>';
      }).join('') +
      '</table><p><a href="' + escapeHtml_(url) + '">신청 시트에서 검토하기</a></p>' +
      '<p style="color:#697586;font-size:12px">연락처·주소 등 개인정보는 시트에서만 확인합니다. 이 메일을 외부로 전달하지 마세요.</p>';
    MailApp.sendEmail({
      to: to.join(','),
      subject: '[WYEA] 새 회원 가입 신청: ' + data.name + ' (' + TRACKS[data.track] + ' · ' + data.team + ')',
      body: intro + '\n\n' + text,
      htmlBody: html,
      name: 'WYEA 가입 신청',
    });
  } catch (err) {
    console.error('notify failed: ' + err);
  }
}

// 편집기에서 실행해 알림 메일이 도착하는지 확인합니다. 시트에는 아무것도 저장하지 않습니다.
function testNotify() {
  notify_({
    track: 'member', team: MEMBER_UNITS[0], team_second: '', languages: '', club_topic: '', recommended_dept: '',
    competencies: '', experience: '', capabilities: '',
    name: '테스트', university: '국립창원대학교', department: '테스트학과', occupation: '대학생(재학)',
    interests: [INTERESTS[0]], motivation: '알림 메일 확인용 테스트입니다.', hopes: '', referral: '',
  }, sheet_());
  console.log('보낸 곳: ' + notifyRecipients_().join(', '));
}

function doGet() {
  return json_({ ok: true, service: 'wyea-join' });
}

function doPost(e) {
  var lock;
  var acquired = false;
  try {
    var request;
    try { request = JSON.parse(e && e.postData && e.postData.contents || ''); }
    catch (err) { return json_({ ok: false, error: 'validation_failed' }); }
    if (!request || request.action !== 'join' || !request.payload) return json_({ ok: false, error: 'validation_failed' });
    var p = request.payload;
    // 사람에게 보이지 않는 칸이 채워졌으면 저장하지 않고 성공처럼 응답합니다.
    if (typeof p.website === 'string' && p.website.trim()) return json_({ ok: true });
    if (typeof p.elapsed_ms !== 'number' || p.elapsed_ms < MIN_ELAPSED_MS) return json_({ ok: false, error: 'validation_failed' });
    var data = validate_(p);
    if (!data) return json_({ ok: false, error: 'validation_failed' });

    lock = LockService.getScriptLock();
    acquired = lock.tryLock(10000);
    if (!acquired) return json_({ ok: false, error: 'server_error' });
    var sheet = sheet_();
    var count = sheet.getLastRow() - 1;
    var phones = count > 0 ? sheet.getRange(2, HEADERS.indexOf('phone') + 1, count, 1).getValues().map(function (row) { return String(row[0]); }) : [];
    if (phones.indexOf(data.phone) !== -1) return json_({ ok: false, error: 'duplicate' });

    var id = Utilities.getUuid();
    var time = new Date().toISOString();
    var row = [id, time, '검토 대기', data.track, data.team, data.name, data.birth, data.gender, data.phone, data.address,
      data.occupation, data.university, data.university_other, data.campus, data.department, data.student_id, data.email,
      data.interests.join(', '), data.motivation, data.hopes, data.referral, data.competencies, data.experience,
      data.capabilities, true, true, true, data.consent_version, 'homepage',
      data.team_second, data.languages, data.club_topic, data.recommended_dept];
    if (row.length !== HEADERS.length) throw new Error('Row and header length differ');
    var range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row.map(safeCell_)]);
    SpreadsheetApp.flush();
    notify_(data, sheet);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  } finally {
    if (acquired) lock.releaseLock();
  }
}

// 편집기에서 한 번 실행해 applications 시트와 헤더를 만듭니다. 기존 데이터가 있으면 멈춥니다.
function setupSheet() {
  var id = PropertiesService.getScriptProperties().getProperty('JOIN_SPREADSHEET_ID');
  if (!id) throw new Error('스크립트 속성 JOIN_SPREADSHEET_ID를 먼저 설정하세요.');
  var book = SpreadsheetApp.openById(id);
  var sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() > 1) throw new Error('이미 데이터가 있는 시트입니다. 헤더를 덮어쓰지 않습니다.');
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  console.log('applications 시트 준비 완료');
}
