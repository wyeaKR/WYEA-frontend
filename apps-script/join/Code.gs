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
  '마산대학교', '경희대학교', '서울대학교', '서울시립대학교', '연세대학교'];
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
// 구버전 화면에서 진행 중인 신청도 허용합니다. 새 일반 가입은 최소 항목만 저장합니다.
var CONSENT_VERSIONS = ['2026-09-25', '2026-10-06', '2026-10-06-v2', '2026-10-06-v3', '2026-10-06-v4'];
var LIMITS = { name: 30, campus: 40, department: 60, student_id: 20, email: 120, other: 60, motivation: 1000, hopes: 1000,
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
  var current = p.consent && ['2026-10-06', '2026-10-06-v2', '2026-10-06-v3', '2026-10-06-v4'].indexOf(p.consent.version) !== -1;
  var simpleStaff = staff && p.consent && ['2026-10-06-v3', '2026-10-06-v4'].indexOf(p.consent.version) !== -1;
  var optionalStaff = staff && p.consent && p.consent.version === '2026-10-06-v4';
  var minimal = !staff && current;
  if (minimal) {
    if (MEMBER_UNITS.indexOf(p.team) === -1) return null;
    r.team = p.team;
    r.team_second = '';
    r.languages = '';
    r.club_topic = '';
  } else if (staff) {
    if (DEPARTMENTS.indexOf(p.team) === -1) return null;
    r.team = p.team;
    if ((r.team_second = simpleStaff ? '' : str_(p.team_second || '', LIMITS.other, false)) === null) return null;
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
  if ((r.birth = str_(p.birth, 10, true)) === null) return null;
  if (r.birth) {
    var age = ageKst_(r.birth);
    if (isNaN(age) || age < MIN_AGE || age > 100) return null;
  }
  if (!minimal && ['남', '여'].indexOf(p.gender) === -1) return null;
  r.gender = minimal ? '' : p.gender;
  if ((r.phone = str_(p.phone, 13, true)) === null || !/^010-\d{4}-\d{4}$/.test(r.phone)) return null;
  // 기존 시트의 주소 열은 보존하되 신규 신청에서는 전달되어도 저장하지 않습니다.
  r.address = '';
  if ((r.occupation = minimal ? '' : str_(p.occupation, LIMITS.other, true)) === null) return null;
  if (typeof p.university_other !== 'boolean') return null;
  if ((r.university = str_(p.university, LIMITS.other, true)) === null) return null;
  if (!p.university_other && UNIVERSITIES.indexOf(r.university) === -1) return null;
  if (p.university_other && !r.university) return null;
  r.university_other = p.university_other;
  if ((r.campus = str_(p.campus, LIMITS.campus, true)) === null) return null;
  if ((r.department = str_(p.department, LIMITS.department, true)) === null) return null;
  if ((r.student_id = minimal || optionalStaff ? '' : str_(p.student_id, LIMITS.student_id, true)) === null || (!minimal && !optionalStaff && !/^\d+$/.test(r.student_id))) return null;
  if ((r.email = str_(current && p.email === undefined ? '' : p.email, LIMITS.email, !current)) === null || (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))) return null;
  // 새 일반 가입에서는 관심 활동과 지원서를 받지 않습니다.
  var interests = simpleStaff && p.interests === undefined ? [] : p.interests;
  if (!minimal && (!Array.isArray(interests) || (!simpleStaff && !interests.length) || interests.some(function (v) { return INTERESTS.indexOf(v) === -1; }))) return null;
  r.interests = minimal ? [] : INTERESTS.filter(function (v) { return interests.indexOf(v) !== -1; });
  r.recommended_dept = recommendDepartments_(r.interests).join(', ');
  if (simpleStaff) {
    if (optionalStaff) {
      if (p.hopes !== undefined && (typeof p.hopes !== 'string' || p.hopes.length > 100)) return null;
      r.hopes = p.hopes === undefined ? '' : p.hopes.trim();
    } else if ((r.hopes = str_(p.hopes, LIMITS.hopes, true)) === null || r.hopes.length < MIN_DETAIL) return null;
    r.competencies = '';
    r.experience = '';
    r.capabilities = '';
  } else if (staff) {
    // 집행부 지원서에는 해 보고 싶은 것 칸이 없고, 역량·해 온 것·할 수 있는 것을 받습니다.
    r.hopes = '';
    if ((r.competencies = str_(p.competencies, LIMITS.competencies, true)) === null || r.competencies.length < MIN_DETAIL) return null;
    if ((r.experience = str_(p.experience || '', LIMITS.experience, false)) === null) return null;
    if ((r.capabilities = str_(p.capabilities, LIMITS.capabilities, true)) === null || r.capabilities.length < MIN_DETAIL) return null;
  } else {
    if ((r.hopes = minimal ? '' : str_(p.hopes || '', LIMITS.hopes, false)) === null) return null;
    r.competencies = '';
    r.experience = '';
    r.capabilities = '';
  }
  if ((r.motivation = minimal || simpleStaff ? '' : str_(p.motivation, LIMITS.motivation, true)) === null || (!minimal && !simpleStaff && r.motivation.length < MIN_MOTIVATION)) return null;
  if ((r.referral = minimal || simpleStaff ? '' : str_(p.referral || '', LIMITS.other, false)) === null) return null;
  var c = p.consent;
  if (!c || c.collect !== true || CONSENT_VERSIONS.indexOf(c.version) === -1) return null;
  var collectOnly = ['2026-10-06-v2', '2026-10-06-v3', '2026-10-06-v4'].indexOf(c.version) !== -1;
  if (!collectOnly && (c.third_party !== true || c.portrait !== true)) return null;
  // 새 가입에서는 받지 않는 동의를 TRUE로 기록하지 않습니다. 기존 행은 변경하지 않습니다.
  r.consent_collect = true;
  r.consent_third_party = collectOnly ? false : c.third_party;
  r.consent_portrait = collectOnly ? false : c.portrait;
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
// 배포할 때만 레포 밖 .notify.env의 32자 값을 임시 사본에 치환합니다.
var NOTIFY_SECRET = 'NOTIFY_SECRET_PLACEHOLDER';

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
      ['이름', data.name || '이름 미입력'],
    ];
    if (data.university) rows.push(['소속', [data.university, data.department, data.occupation].filter(Boolean).join(' ')]);
    if (data.team) rows.push([staff ? '희망 부서' : '소속 단', staff && data.team_second ? data.team + ' (2지망: ' + data.team_second + ')' : data.team]);
    if (data.languages) rows.push(['가능 언어', data.languages]);
    if (data.club_topic) rows.push(['관심 주제', data.club_topic]);
    if (data.interests.length) rows.push(['관심 활동', data.interests.join(', ')]);
    if (data.recommended_dept) rows.push(['추천 부서', data.recommended_dept]);
    if (data.motivation) rows.push(['지원 동기', data.motivation]);
    if (staff && ['2026-10-06-v3', '2026-10-06-v4'].indexOf(data.consent_version) === -1) {
      rows.push(['나의 역량', data.competencies]);
      if (data.experience) rows.push(['해 온 것', data.experience]);
      rows.push(['할 수 있는 것', data.capabilities]);
    }
    if (data.hopes) rows.push([staff && ['2026-10-06-v3', '2026-10-06-v4'].indexOf(data.consent_version) !== -1 ? '활동에서 얻어가고 싶은 것' : '해 보고 싶은 것', data.hopes]);
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
      subject: '[WYEA] 새 회원 가입 신청: ' + (data.name || '이름 미입력') + ' (' + TRACKS[data.track] + (data.team ? ' · ' + data.team : '') + ')',
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
    if (request && request.action === 'notify') {
      if (NOTIFY_SECRET === 'NOTIFY_SECRET_PLACEHOLDER' || request.secret !== NOTIFY_SECRET) {
        return json_({ ok: false, error: 'forbidden' });
      }
      var subject = str_(request.subject, 200, true);
      var text = str_(request.text, 5000, true);
      if (subject === null || text === null) return json_({ ok: false, error: 'validation_failed' });
      MailApp.sendEmail({
        to: 'wyea@wyea.info',
        subject: '[WYEA 작업] ' + subject,
        body: text,
        name: 'WYEA 작업 알림',
      });
      return json_({ ok: true });
    }
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
      data.capabilities, data.consent_collect, data.consent_third_party, data.consent_portrait, data.consent_version, 'homepage',
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

// ── 회원 명부 자동 반영 ──
// 관리자가 신청 시트 status를 '입장 완료'로 바꾸면 홈페이지 가입 회원 명부(WYEA_회원명부_홈페이지가입) 맨 아래에 가입 순서대로 한 줄을 추가합니다.
// 홈페이지 개설 이전 회원은 WYEA_회원명부_2026-09_v2에 있습니다. 그 파일은 같은 휴대전화를 확인할 때 읽기만 합니다.
// 편집기에서 setupRoster를 한 번 실행해 명부 머리글·상태 목록·반영 기록 열·편집 트리거를 준비합니다. 절차는 README를 봅니다.
var ROSTER_SPREADSHEET_ID = '1_MMgkFktfF7-zNpQoINdnKiyyOVAC1VjZ7guqK70LPg';
var ROSTER_SHEET_NAME = '회원명부';
var ROSTER_GUIDE_NAME = '안내';
var LEGACY_ROSTER_ID = '1JXf9d5YnNGthBN58_kOoHY6DjDeGRoUHYu2vjrwIY2c';
var LEGACY_ROSTER_NAME = 'WYEA_회원명부_2026-09_v2';
// 명부 열은 이름으로 찾습니다. 순서를 바꾸거나 열을 더해도 되지만, 이 이름이 하나라도 없으면 쓰지 않고 멈춥니다.
var ROSTER_COLUMNS = ['No', '성명', '생년월일', '휴대전화', '이메일', '대학교', '캠퍼스', '학과', '구분', '소속 단·희망 부서', '기수',
  '신청일', '가입일(입장 완료)', '가입 동의', '주소', '직업', '단체 등록 명부 제출 동의', '신청 ID', '비고'];
// 비영리민간단체 등록 준비 때 받을 항목입니다. 머리글과 빈 칸을 노란색으로 둡니다.
var ROSTER_COLLECT = ['주소', '직업', '단체 등록 명부 제출 동의'];
var ROSTER_DATE_COLUMNS = ['생년월일', '신청일', '가입일(입장 완료)'];
var ROSTER_YELLOW = '#fff1c1';
var ROSTER_HEADER_BG = '#003366';
var ROSTER_WIDTHS = [50, 90, 95, 115, 190, 120, 100, 150, 70, 120, 65, 95, 115, 200, 220, 110, 150, 260, 260];
var ROSTER_NOTES = {
  '기수': '신청일 기준입니다. 9~12월은 그해 2기, 1월은 전년도 2기, 2~8월은 그해 1기입니다.',
  '가입일(입장 완료)': '관리자가 신청 시트 상태를 입장 완료로 바꾼 날입니다.',
  '가입 동의': '홈페이지 신청 때 받은 동의의 범위와 버전입니다. 2026-10-06 이후 버전은 회원 관리·활동 안내 목적의 수집·이용만 포함합니다.',
  '주소': '비영리민간단체 등록 준비 때 받습니다. 값이 없으면 노란색으로 둡니다.',
  '직업': '비영리민간단체 등록 준비 때 받습니다. 집행부 지원자가 고른 직업은 미리 들어갑니다.',
  '단체 등록 명부 제출 동의': '비영리민간단체 등록 준비 때 받습니다(동의/미동의).',
  '신청 ID': 'WYEA 회원 가입 신청(홈페이지) applications 탭의 application_id입니다.',
};
// '입장 완료'가 관리자 승인입니다. 이때 명부에 추가합니다.
var STATUSES = ['검토 대기', '초대 완료', '입장 완료', '반려'];
var JOINED_STATUS = '입장 완료';
var ROSTER_MARK = 'roster_added_at';
// 배포 확인용 시험 신청입니다. deleteDeployTestRows는 이름과 번호가 모두 같은 행만 지웁니다.
var DEPLOY_TEST_NAME = '배포테스트(삭제예정)';
// 1006·1007은 API 직접 호출, 1008·1009는 웹 화면(PC·모바일) 시험입니다.
var DEPLOY_TEST_PHONES = ['010-0000-1006', '010-0000-1007', '010-0000-1008', '010-0000-1009'];

function phoneKey_(value) {
  var d = String(value || '').replace(/\D/g, '');
  return d.length === 10 && d.charAt(0) === '1' ? '0' + d : d;
}

function isTrue_(value) {
  return value === true || String(value).toUpperCase() === 'TRUE';
}

function kstDate_(value) {
  var d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
}

function ymdDate_(ymd) {
  var p = String(ymd).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

// 신청일 기준 기수입니다. 9~12월은 그해 2기, 1월은 전년도 2기, 2~8월은 그해 1기로 봅니다(26-2기 = 2026 2학기 모집).
function cohort_(ymd) {
  var y = Number(ymd.slice(0, 4));
  var m = Number(ymd.slice(5, 7));
  if (m === 1) return String(y - 1).slice(-2) + '-2기';
  return String(y).slice(-2) + (m >= 9 ? '-2기' : '-1기');
}

function consentLabel_(app) {
  return (isTrue_(app.consent_third_party) ? '수집·이용·제3자 제공·초상권' : '수집·이용') + ' (' + app.consent_version + ')';
}

function columnLetter_(n) {
  return String.fromCharCode(64 + n);
}

// 명부 파일을 엽니다. 회원명부 탭이 비어 있으면 머리글·서식·안내 탭을 만듭니다.
function rosterBook_() {
  var book = SpreadsheetApp.openById(ROSTER_SPREADSHEET_ID);
  var sheet = book.getSheetByName(ROSTER_SHEET_NAME);
  if (!sheet) {
    var sheets = book.getSheets();
    var blank = sheets.length === 1 && sheets[0].getLastRow() === 0 && sheets[0].getLastColumn() === 0;
    sheet = blank ? sheets[0].setName(ROSTER_SHEET_NAME) : book.insertSheet(ROSTER_SHEET_NAME, 0);
  }
  if (sheet.getLastRow() === 0) rosterBuild_(book, sheet);
  if (!book.getSheetByName(ROSTER_GUIDE_NAME)) rosterGuide_(book.insertSheet(ROSTER_GUIDE_NAME));
  return book;
}

function rosterBuild_(book, sheet) {
  var width = ROSTER_COLUMNS.length;
  book.setSpreadsheetTimeZone('Asia/Seoul');
  if (sheet.getMaxRows() < 1000) sheet.insertRowsAfter(sheet.getMaxRows(), 1000 - sheet.getMaxRows());
  if (sheet.getMaxColumns() < width) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  var header = sheet.getRange(1, 1, 1, width);
  header.setValues([ROSTER_COLUMNS]).setFontWeight('bold').setFontColor('#ffffff').setBackground(ROSTER_HEADER_BG)
    .setVerticalAlignment('middle').setWrap(true);
  header.setNotes([ROSTER_COLUMNS.map(function (h) { return ROSTER_NOTES[h] || ''; })]);
  ROSTER_COLLECT.forEach(function (h) {
    sheet.getRange(1, ROSTER_COLUMNS.indexOf(h) + 1).setBackground(ROSTER_YELLOW).setFontColor('#000000');
  });
  var rows = sheet.getMaxRows() - 1;
  ROSTER_COLUMNS.forEach(function (h, c) {
    var format = ROSTER_DATE_COLUMNS.indexOf(h) !== -1 ? 'yyyy-mm-dd' : h === 'No' ? '0' : '@';
    sheet.getRange(2, c + 1, rows, 1).setNumberFormat(format);
    sheet.setColumnWidth(c + 1, ROSTER_WIDTHS[c] || 120);
  });
  sheet.getRange(2, ROSTER_COLUMNS.indexOf('단체 등록 명부 제출 동의') + 1, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['동의', '미동의'], true).setAllowInvalid(false).build());
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), width).createFilter();
}

// 안내 탭의 A1:B14를 최신 문구로 씁니다. setupRoster를 실행할 때마다 다시 씁니다.
function rosterGuide_(guide) {
  var ref = function (h) {
    var col = columnLetter_(ROSTER_COLUMNS.indexOf(h) + 1);
    return "'" + ROSTER_SHEET_NAME + "'!" + col + '2:' + col;
  };
  var lines = [
    ['WYEA 회원명부 (홈페이지 가입, 2026-09-26 /join 개설 이후)', ''],
    ['홈페이지 개설 이전 회원은 ' + LEGACY_ROSTER_NAME + '에 있습니다. 같은 휴대전화가 있으면 비고에 적습니다.', ''],
    ['', ''],
    ['추가 방식', '가입 신청 시트에서 상태를 입장 완료로 바꾸면 회원명부 탭 맨 아래에 가입 순서대로 자동으로 추가됩니다.'],
    ['노란색', '비영리민간단체 등록 준비 때 받을 항목(주소·직업·단체 등록 명부 제출 동의)입니다. 값이 없으면 노란색으로 둡니다.'],
    ['가입 동의', '홈페이지 신청 당시 동의입니다. 2026-10-06 이후 버전은 회원 관리·활동 안내 목적의 수집·이용만 포함합니다.'],
    ['기수', '신청일 기준입니다. 9~12월은 그해 2기, 1월은 전년도 2기, 2~8월은 그해 1기입니다.'],
    ['', ''],
    ['현황 (자동 계산)', ''],
    ['총 회원', '=COUNTA(' + ref('성명') + ')'],
    ['집행부', '=COUNTIF(' + ref('구분') + ',"집행부")'],
    ['주소 확보', '=COUNTA(' + ref('주소') + ')'],
    ['직업 확보', '=COUNTA(' + ref('직업') + ')'],
    ['단체 등록 명부 제출 동의', '=COUNTIF(' + ref('단체 등록 명부 제출 동의') + ',"동의")'],
  ];
  guide.getRange(1, 1, lines.length, 2).setValues(lines).setFontWeight('normal').setBackground(null);
  guide.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  guide.getRange(5, 1, 1, 2).setBackground(ROSTER_YELLOW);
  guide.setColumnWidth(1, 190);
  guide.setColumnWidth(2, 640);
}

function rosterOpen_() {
  var sheet = rosterBook_().getSheetByName(ROSTER_SHEET_NAME);
  var values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), Math.max(sheet.getLastColumn(), 1)).getValues();
  var headers = values[0].map(function (v) { return String(v).trim(); });
  var cols = {};
  ROSTER_COLUMNS.forEach(function (h) {
    if (headers.indexOf(h) === -1) throw new Error('회원 명부 열이 없습니다: ' + h);
    cols[h] = headers.indexOf(h);
  });
  // last는 마지막 회원 행의 0부터 센 위치입니다. No와 성명이 모두 빈 행은 회원 행으로 보지 않습니다.
  var roster = { sheet: sheet, values: values, headers: headers, cols: cols, last: 0, phones: {}, maxNo: 0, count: 0 };
  for (var i = 1; i < values.length; i++) {
    var no = values[i][cols['No']];
    if (no === '' && !String(values[i][cols['성명']]).trim()) continue;
    roster.last = i;
    roster.count++;
    if (no !== '' && !isNaN(Number(no))) roster.maxNo = Math.max(roster.maxNo, Number(no));
    var key = phoneKey_(values[i][cols['휴대전화']]);
    if (key) roster.phones[key] = no === '' ? '?' : no;
  }
  return roster;
}

// 홈페이지 이전 명부의 휴대전화별 No입니다. 읽지 못하면 빈 목록으로 두고 반영은 계속합니다.
function legacyPhones_() {
  try {
    var values = SpreadsheetApp.openById(LEGACY_ROSTER_ID).getSheetByName('회원명부').getDataRange().getValues();
    for (var r = 0; r < Math.min(values.length, 5); r++) {
      var cells = values[r].map(function (v) { return String(v).trim(); });
      if (cells.indexOf('성명') === -1 || cells.indexOf('휴대전화') === -1) continue;
      var map = {};
      for (var i = r + 1; i < values.length; i++) {
        var key = phoneKey_(values[i][cells.indexOf('휴대전화')]);
        if (key) map[key] = cells.indexOf('No') === -1 ? '?' : values[i][cells.indexOf('No')];
      }
      return map;
    }
  } catch (err) {
    console.error('legacy roster read failed: ' + err);
  }
  return {};
}

// 신청 행 하나를 명부 마지막 회원 아래에 추가하고 새 No를 돌려줍니다. 받은 값은 흰색, 비어 있는 수집 항목은 노란색입니다.
function rosterAppend_(roster, app, stamp, legacyNo) {
  var sheet = roster.sheet;
  var target = roster.last + 2;
  if (target > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
  var no = roster.maxNo + 1;
  var applied = kstDate_(app.submitted_at);
  var birth = app.birth instanceof Date ? Utilities.formatDate(app.birth, 'Asia/Seoul', 'yyyy-MM-dd') : String(app.birth);
  var memo = [];
  if (legacyNo) memo.push('홈페이지 이전 명부 No.' + legacyNo + '와 같은 휴대전화');
  if (isTrue_(app.university_other)) memo.push('목록 밖 학교(신청자 직접 입력)');
  var data = {
    'No': no, '성명': app.name, '생년월일': /^\d{4}-\d{2}-\d{2}$/.test(birth) ? ymdDate_(birth) : birth, '휴대전화': app.phone,
    '이메일': app.email, '대학교': app.university, '캠퍼스': app.campus, '학과': app.department, '구분': TRACKS[app.track] || app.track,
    '소속 단·희망 부서': app.team, '기수': cohort_(applied), '신청일': ymdDate_(applied), '가입일(입장 완료)': ymdDate_(stamp.slice(0, 10)),
    '가입 동의': consentLabel_(app), '주소': '', '직업': app.occupation, '단체 등록 명부 제출 동의': '', '신청 ID': app.application_id,
    '비고': memo.join(' / '),
  };
  var row = [];
  var formats = [];
  var backgrounds = [];
  roster.headers.forEach(function (h) {
    var v = Object.prototype.hasOwnProperty.call(data, h) && data[h] !== null && data[h] !== undefined ? data[h] : '';
    row.push(safeCell_(v));
    formats.push(v instanceof Date ? 'yyyy-mm-dd' : typeof v === 'number' ? '0' : '@');
    backgrounds.push(ROSTER_COLLECT.indexOf(h) !== -1 && v === '' ? ROSTER_YELLOW : null);
  });
  var range = sheet.getRange(target, 1, 1, roster.headers.length);
  range.setNumberFormats([formats]);
  range.setValues([row]);
  range.setBackgrounds([backgrounds]);
  roster.values[target - 1] = row;
  roster.last = target - 1;
  roster.maxNo = no;
  roster.count++;
  return no;
}

// '입장 완료'이고 roster_added_at이 빈 신청을 명부에 반영합니다. 같은 휴대전화가 이미 명부에 있으면 추가하지 않고 기록만 남깁니다.
function syncRoster_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('잠금을 얻지 못했습니다. 잠시 뒤 편집기에서 syncRoster를 실행하세요.');
  try {
    var sheet = sheet_();
    var values = sheet.getDataRange().getValues();
    var markCol = values[0].map(String).indexOf(ROSTER_MARK);
    if (markCol === -1) throw new Error(ROSTER_MARK + ' 열이 없습니다. 편집기에서 setupRoster를 먼저 실행하세요.');
    var statusCol = HEADERS.indexOf('status');
    var joined = JOINED_STATUS.replace(/\s/g, '');
    var targets = [];
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][statusCol]).replace(/\s/g, '') === joined && String(values[i][markCol]).trim() === '') targets.push(i);
    }
    if (!targets.length) return { added: 0, existing: 0 };
    var roster = rosterOpen_();
    var legacy = legacyPhones_();
    var stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    var result = { added: 0, existing: 0 };
    targets.forEach(function (i) {
      var app = {};
      HEADERS.forEach(function (h, c) { app[h] = values[i][c]; });
      var key = phoneKey_(app.phone);
      var mark;
      if (key && Object.prototype.hasOwnProperty.call(roster.phones, key)) {
        result.existing++;
        mark = stamp + ' 기존 명부 No.' + roster.phones[key];
      } else {
        var no = rosterAppend_(roster, app, stamp, key ? legacy[key] : '');
        if (key) roster.phones[key] = no;
        result.added++;
        mark = stamp + ' 명부 No.' + no;
      }
      var cell = sheet.getRange(i + 1, markCol + 1);
      cell.setNumberFormat('@');
      cell.setValue(mark);
    });
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

// setupRoster가 설치하는 편집 트리거입니다. status 칸이 바뀐 편집만 반영하며, 실패하면 알림 메일로 알립니다.
function onApplicationsEdit(e) {
  var range = e && e.range;
  if (!range || range.getSheet().getName() !== SHEET_NAME) return;
  var statusCol = HEADERS.indexOf('status') + 1;
  if (range.getColumn() > statusCol || range.getLastColumn() < statusCol || range.getLastRow() < 2) return;
  try {
    syncRoster_();
  } catch (err) {
    console.error('roster sync failed: ' + err);
    try {
      MailApp.sendEmail({
        to: notifyRecipients_().join(','),
        subject: '[WYEA] 회원 명부 자동 반영 실패',
        body: '신청 시트의 입장 완료를 회원 명부에 반영하지 못했습니다.\n\n오류: ' + (err && err.message || err) +
          '\n\nApps Script 편집기에서 syncRoster를 실행하면 남은 신청을 다시 반영합니다.',
        name: 'WYEA 회원 명부',
      });
    } catch (mailErr) {
      console.error('roster failure mail failed: ' + mailErr);
    }
  }
}

// 편집기에서 실행합니다. 놓친 '입장 완료' 신청을 다시 반영합니다.
function syncRoster() {
  console.log('회원 명부 반영: ' + JSON.stringify(syncRoster_()));
}

// 편집기에서 한 번 실행합니다. 반영 기록 열과 상태 목록을 만들고, 명부를 준비한 뒤 편집 트리거를 설치합니다. 다시 실행해도 됩니다.
function setupRoster() {
  var sheet = sheet_();
  var lastCol = sheet.getLastColumn();
  if (sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String).indexOf(ROSTER_MARK) === -1) {
    sheet.getRange(1, lastCol + 1).setValue(ROSTER_MARK).setFontWeight('bold');
  }
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false)
    .setHelpText('입장 완료로 바꾸면 홈페이지 가입 회원 명부에 자동으로 추가됩니다.').build();
  sheet.getRange(2, HEADERS.indexOf('status') + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  var roster = rosterOpen_();
  rosterGuide_(roster.sheet.getParent().getSheetByName(ROSTER_GUIDE_NAME));
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onApplicationsEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onApplicationsEdit').forSpreadsheet(sheet.getParent().getId()).onEdit().create();
  var result = syncRoster_();
  console.log('회원 명부 연결: ' + roster.sheet.getParent().getName() + ' (회원 ' + roster.count + '명) · 트리거 설치 · 이번 반영 ' + JSON.stringify(result));
}

// 편집기에서 실행합니다. 배포 확인용 시험 신청(DEPLOY_TEST_NAME과 DEPLOY_TEST_PHONES가 모두 같은 행)만 신청 시트와 회원 명부에서 지웁니다.
function deleteDeployTestRows() {
  var phones = DEPLOY_TEST_PHONES.map(phoneKey_);
  var isTest = function (name, phone) { return String(name).trim() === DEPLOY_TEST_NAME && phones.indexOf(phoneKey_(phone)) !== -1; };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('잠금을 얻지 못했습니다. 잠시 뒤 다시 실행하세요.');
  try {
    var sheet = sheet_();
    var values = sheet.getDataRange().getValues();
    var removed = 0;
    for (var r = values.length - 1; r >= 1; r--) {
      if (isTest(values[r][HEADERS.indexOf('name')], values[r][HEADERS.indexOf('phone')])) { sheet.deleteRow(r + 1); removed++; }
    }
    var roster = rosterOpen_();
    var rosterRemoved = 0;
    for (var i = roster.last; i >= 1; i--) {
      if (isTest(roster.values[i][roster.cols['성명']], roster.values[i][roster.cols['휴대전화']])) { roster.sheet.deleteRow(i + 1); rosterRemoved++; }
    }
    SpreadsheetApp.flush();
    console.log('시험 행 삭제: 신청 시트 ' + removed + '행, 회원 명부 ' + rosterRemoved + '행');
  } finally {
    lock.releaseLock();
  }
}
