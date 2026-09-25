# 회원 가입 신청 API (/join)

홈페이지 `/join` 페이지의 가입 신청을 받아 Google Sheets에 한 줄씩 저장합니다.
실무자용 `apps-script/onboarding`과는 별개입니다.

## 현재 배포 (2026-09-26)

- Apps Script 프로젝트: `WYEA 회원 가입 접수 (/join)` (wyea@wyea.info 계정, 스크립트 ID `1af7bzb66TGd7GR0puYKRwXZWigzBPWGxK78AUzBK6YcIBwjpFKIzpBCU`)
- 신청 시트: 공유 드라이브 `WYEA_LCE`의 `WYEA 회원 가입 신청(홈페이지)` (ID `1mukE06RTlPCI4Xu3_N8u2RKBAA67QZq-hMhn0XKSO8M`), 탭 `applications`
- 웹 앱 배포 버전 4(2026-09-26, 기존 배포 ID에 작업 알림 `notify` 추가), 실행: wyea@wyea.info, 액세스: 모든 사용자. `/exec` 주소는 `src/content/join.ts`의 `JOIN_API_URL`
- 알림 메일: `NOTIFY_EMAILS` 미설정 → 기본값 wyea@wyea.info
- `Code.gs`를 고치면 편집기에 붙여 넣고 저장한 뒤 **배포 → 배포 관리 → 새 버전**으로 올려야 반영된다. 주소는 바뀌지 않는다.
- v4 확인: 레포의 `Code.gs`와 v3 원격 `Code.js`가 수정 전 바이트 단위로 같았다. 격리 폴더에서 `clasp push`로 코드·기존 manifest 2개 파일을 올리고 기존 배포 ID를 `@4`로 갱신했다. `notify` 시험 POST는 `{ok:true}`였고 대표가 알림 메일 수신을 보고했다. 별도의 이슈 URL 알림 POST는 HTTP 404가 나와 해당 요청의 처리 여부는 확인되지 않았다. 그 뒤 `doGet`은 HTTP 200을 반환했다.

## 설정

1. WYEA 계정으로 새 Apps Script 프로젝트를 만들고 `Code.gs` 내용을 붙여 넣습니다.
2. 프로젝트 설정 → 스크립트 속성에 `JOIN_SPREADSHEET_ID`(신청 시트가 있는 스프레드시트 ID)를 추가합니다.
3. 편집기에서 `setupSheet`를 한 번 실행해 `applications` 탭과 헤더를 만듭니다.
4. (선택) 스크립트 속성 `NOTIFY_EMAILS`에 알림 받을 주소를 쉼표로 구분해 넣습니다. 비워 두면 `wyea@wyea.info`로 보냅니다. 편집기에서 `testNotify`를 실행해 메일이 오는지 확인합니다. 처음 실행할 때 시트·메일 권한 승인이 필요합니다.
5. 배포 → 새 배포 → 웹 앱, 실행: 나, 액세스: 모든 사용자로 배포합니다.
6. 발급된 `/exec` 주소를 `src/content/join.ts`의 `JOIN_API_URL`에 넣습니다.

## 동작

- 요청: `POST`, `Content-Type: text/plain;charset=utf-8`, 본문 `{ action: 'join', payload: {...} }`
- 응답: `{ ok: true }` 또는 `{ ok: false, error: 'validation_failed' | 'duplicate' | 'server_error' }`
- 작업 알림: `{ action: 'notify', secret, subject, text }` 요청은 고정 수신처 `wyea@wyea.info`로 일반 텍스트 메일을 보냅니다. `subject`는 1~200자, `text`는 1~5000자입니다. 잘못된 비밀값은 `forbidden`, 길이 위반은 `validation_failed`를 반환합니다. 이 경로는 신청 시트를 읽거나 쓰지 않습니다. 본문에는 신청자 개인정보를 넣지 않습니다.
- 서버에서 모든 항목을 다시 검증합니다. 규칙은 `src/content/join.ts`와 같아야 합니다.
- 같은 휴대전화 번호로 이미 신청이 있으면 `duplicate`로 거절합니다.
- 만 14세 미만, 3개 동의 중 하나라도 없는 경우, 알 수 없는 동의문 버전은 거절합니다.
- 스팸 방지: 숨김 칸(`website`)이 채워지면 저장하지 않고 성공처럼 응답합니다. 페이지를 연 뒤 3초 안에 제출하면 거절합니다.
- 수식으로 시작하는 입력은 앞에 `'`를 붙여 일반 텍스트로 저장합니다.
- 저장이 끝나면 `NOTIFY_EMAILS`(없으면 `wyea@wyea.info`)로 알림 메일을 보냅니다. 제목은 `[WYEA] 새 회원 가입 신청: 이름 (일반 · 기록단)` / `(집행부 · 홍보부)` 형식입니다. 메일에는 이름·소속·관심 활동·지원 동기·해 보고 싶은 것·가입 경로와 시트 링크만 넣고, 연락처·주소·생년월일은 넣지 않습니다. 메일 발송이 실패해도 신청은 접수됩니다. 인사 담당 그룹 주소가 정해지면 이 속성만 바꿉니다.
- `track`은 `member`(일반) 또는 `staff`(집행부)입니다. 두 트랙 모두 관심 활동(`interests`) 1개 이상이 필수입니다.
- `team`은 트랙에 따라 뜻이 다릅니다. 일반 트랙은 소속 단(`MEMBER_UNITS`: 기록단·행사지원단·통번역단·정책제안단·소모임) 1개 필수(회원은 반드시 1개 단에 속함)이고, 통번역단이면 `languages`(가능 언어), 소모임이면 `club_topic`(관심 주제)이 필수입니다. 집행부 트랙은 부서(`DEPARTMENTS`: 총무부·기획부·홍보부·회원부) 1지망 필수, `team_second`(2지망)는 선택이며 1지망과 달라야 합니다. 집행부는 `competencies`·`capabilities` 20자 이상 필수, `experience` 선택.
- `recommended_dept`는 관심 활동을 `INTEREST_MAPPING`으로 부서에 대응시켜 가장 많이 겹치는 부서(동점이면 모두)를 적은 것입니다. 참고용이며 강제하지 않습니다. '해외 청년 교류회 참가'는 전 회원 공통이라 매핑하지 않습니다.
- 조직도(부서·단·매핑)를 바꾸면 `Code.gs`의 `MEMBER_UNITS`·`DEPARTMENTS`·`INTEREST_MAPPING`과 `src/content/join.ts`의 `memberUnits`·`departments`·`interestMapping`을 같이 바꾸고 웹 앱을 새 버전으로 배포합니다.
- 시트 열(33개, 순서대로): application_id, submitted_at, status, track, team, name, birth, gender, phone, address, occupation, university, university_other, campus, department, student_id, email, interests, motivation, hopes, referral, competencies, experience, capabilities, consent_collect, consent_third_party, consent_portrait, consent_version, source, team_second, languages, club_topic, recommended_dept. 마지막 4개는 2026-09-26에 끝에 추가했습니다.
- 새 신청의 `status`는 `검토 대기`입니다. `university_other`가 TRUE인 신청은 목록 밖 학교라 검토 때 확인합니다.

## 동의문을 바꿀 때

`src/content/join.ts`의 `CONSENT_VERSION`을 새 날짜로 바꾸고, `Code.gs`의 `CONSENT_VERSIONS`에 같은 값을 추가한 뒤 웹 앱을 새 버전으로 배포합니다.

## 모의 테스트

`node apps-script/join/mock-test.cjs` — 시트·메일·잠금을 가짜 객체로 바꿔 `doPost`의 검증·중복·스팸 방지·메일 알림(실패 포함)과 작업 알림의 인증·길이 제한·시트 미기록을 확인합니다. 실제 시트나 메일에는 아무것도 보내지 않습니다. `Code.gs`를 고치면 실행합니다.

## 작업 알림 배포

- `.clasp.json`은 기존 `/join` Apps Script 프로젝트를 가리킵니다. `clasp clone`을 실행하지 않습니다. `clasp pull`은 레포 밖 빈 폴더에서 실행해 원격 코드와 manifest를 확인합니다. `clasp push`는 원격 프로젝트 파일 전체를 교체하므로 레포의 `apps-script/join`에서 직접 실행하지 않습니다.
- 레포의 `Code.gs`에는 `NOTIFY_SECRET_PLACEHOLDER`만 둡니다. 실제 32자 비밀값은 레포 밖 `D:\10_Projects\Coding\WYEA\.notify.env`의 `NOTIFY_SECRET`에 저장합니다. 원격에서 받은 manifest와 레포 코드를 임시 폴더에 복사해 해당 임시 코드의 placeholder만 치환하여 `clasp push`합니다. 비밀값을 콘솔·로그·Git·이슈에 출력하지 않습니다.
- 기존 웹 앱 배포 ID에 새 버전을 적용할 때는 `clasp deploy -i AKfycbw8Td0GHKezuBM2Xdrafk0tqf8dPTfpv7UxeEA72wLnn1UzGhfGRldDqdALvBicV0n7aw -d "v4 notify 추가"`를 사용합니다. 저장만으로 기존 `/exec`에는 반영되지 않습니다.
