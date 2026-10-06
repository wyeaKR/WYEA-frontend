# WYEA 운영 스크립트: 참가 기록서·기존 폼

`report.gs`, `forms.gs`, `setup.gs`는 하나의 standalone Apps Script 프로젝트입니다. `.clasp.json`의 스크립트 ID는 `1Cj7qxoUcl2pL2-M5MGO3-9hjyxj2nRyJclZPQRlb-IcI5JcwYrmfJRYq`입니다. `/report` API 주소는 `src/content/report.ts`에 있습니다.

## 초기화와 현재 구성

- `setupAll`은 `WYEA 참가 기록서` 시트를 만들고 WYEA_LCE 공유 드라이브로 옮기며, `records`·`events` 탭과 총무부·홍보부·기획부·회원부 필터 보기 4개를 만듭니다. 행사 목록의 첫 값은 `26-2기 회원 OT`입니다. `REPORT_SPREADSHEET_ID`·`JOIN_SPREADSHEET_ID` 속성을 저장한 뒤 `applyFormChanges`를 실행합니다. 재실행 시 같은 시트를 사용합니다.
- 시트 ID는 `1HBM6gHKqnhn_kSiZbf-7cKPJXd3J7D-YeM37Fr0eOF4`입니다. 가입 시트 ID는 `1mukE06RTlPCI4Xu3_N8u2RKBAA67QZq-hMhn0XKSO8M`입니다.
- 웹 앱 배포 ID는 `AKfycbxqAfHZmTqKh0ZVTW07BXDIJWawe4qMG1-Avcdy2tgTSve0tA9EsFmgtAtBMJenPDVv`이며 현재 v10입니다. 실행: 배포 사용자, 접근: 모든 사용자. 코드를 바꾸면 `clasp push`와 기존 ID를 지정한 `clasp deploy -i ...`로 새 버전을 발행해야 합니다.
- 초기에 Sheets REST API 비활성화 오류가 있어 manifest에 고급 Sheets 서비스(`sheets` v4)를 선언했습니다. 대표의 재실행 로그에서 필터 보기 4개 생성이 확인됐습니다.

## 요청

- `GET ?action=events`: 행사명 배열만 반환합니다.
- `POST {"action":"lookup","name":"...","phone":"..."}`: 아래 순서로 찾아 `{ok:true,university,team}`만 반환합니다. 둘 다 없으면 `not_found`, 시트를 읽지 못하는 등 서버 오류는 `server_error`입니다(회원 없음으로 보지 않음). `report` 제출 때도 같은 규칙으로 다시 확인합니다.
  1. 회원 정보 갱신 폼 응답 시트(`REPORT_RENEWAL_RESPONSE_ID`, 탭 이름에 `응답`/`Response`)에서 성명·휴대전화가 일치하는 응답을 `Timestamp` 최신순으로 보고, 필수 항목을 모두 갖춘 **가장 최근의 유효한 응답**: 대학교(빈 값 불가), 소속 단(5개 중 1개), 통번역단이면 가능 언어, 소모임이면 관심 주제, `[필수] 동의 항목` 3개 모두. 최신 응답이 불완전하면 그 이전의 유효한 응답을 씁니다. `Timestamp` 칸이 날짜 값이 아닌 응답(문자열·빈 칸·잘못된 날짜)은 쓰지 않고, 같은 시각이면 시트 아래쪽 행이 먼저입니다. 기존 응답 2건(`비고=재제출 대상`)은 소속 단·동의가 없어 실패하므로 재제출 대상입니다. `university`는 `대학교`, `team`은 `소속 단` 값입니다.
     - 검사하는 필수 항목 중 대학교는 대표 결정(2026-09-28)이고, 소속 단·가능 언어·관심 주제·동의는 `forms.gs`가 폼에 필수로 설정하는 문항입니다. 성명·생년월일·성별·휴대전화·주소·직업·캠퍼스·학과·학번·이메일이 실제 폼에서 필수인지는 레포로 확인되지 않아 조회 판정에 넣지 않았습니다(성명·휴대전화는 일치 조건으로만 씀).
  2. 유효한 갱신 응답이 없으면 가입 시트 `applications`에서 이름과 휴대전화가 둘 다 일치하고 `status`가 `REPORT_MEMBER_STATUSES`(`검토 대기`·`승인`·`초대 완료`·`입장 완료`, 관리자 시험 회원용 `시험`)인 행. `반려` 등 다른 상태는 실패입니다. `초대 완료`·`입장 완료`는 가입 스크립트의 상태 목록(회원 명부 자동 반영, 2026-10-06)과 맞춘 값입니다.
  - 휴대전화는 숫자만 비교하고, 폼 응답 시트가 숫자로 바꿔 앞자리 0이 빠진 값도 같은 번호로 봅니다. 폼 질문 제목을 바꾸면 조회가 `server_error`로 실패하므로 `reportLookupRenewal_`의 제목도 함께 바꿉니다.
- `POST {"action":"report","payload":{...}}`: 서버에서 회원·행사·필수 항목을 재검증한 뒤 `records`에 기록하고 알림 메일을 보냅니다. ① 참가 사실은 전부 필수, ②③④는 각 섹션에서 한 항목 이상 필수입니다. 사진 링크는 HTTPS만 허용합니다. 메일 제목은 `[WYEA] 참가 기록서: 이름 (대학 · 단 · 행사명)`입니다. `payload.submission_id`(UUID)는 선택 항목이며 `records`의 마지막 열 `submission_id`에 저장합니다. 값이 있으면 같은 `submission_id`가 이미 있을 때 새 행과 메일 없이 `{ok:true,duplicate:true}`를 돌려줍니다(응답만 유실된 뒤의 재전송 대비). 값이 없는 요청(이전 화면)은 거절하지 않고 서버가 만든 UUID로 접수하므로, 그 재전송 중복까지는 막지 못합니다. 형식이 틀린 값은 `validation_failed`입니다. 중복 확인·기록은 스크립트 잠금 안에서 하고 `SpreadsheetApp.flush()` 뒤에 잠금을 풀어, 거의 동시에 온 같은 ID 요청도 1건·메일 1회가 됩니다(잠금을 30초 안에 못 잡은 요청은 `server_error`, 저장 없음). 화면은 제출하는 순간의 입력 내용을 고정해 보내고, 직전 시도와 내용이 같으면 같은 ID, 다르면 새 ID를 씁니다. 제출 중에는 입력칸 전체가 잠깁니다. ID는 메모리에만 있어 새로고침·창 닫기 뒤의 재전송은 보장하지 않으며, 화면 안내도 그 범위로 적습니다. `submission_id` 열이 없던 기존 `records` 시트는 첫 제출 때 1행 21번째 칸에 헤더만 채우고 기존 행은 건드리지 않습니다(앞 20개 헤더가 다르면 저장하지 않고 `server_error`).
- 휴대전화는 가입·기록 시트의 쓰기 범위를 일반 텍스트로 지정해 앞자리 0을 보존합니다.
- 웹 앱 요청은 `Content-Type: text/plain;charset=utf-8` JSON 본문입니다. `REPORT_HEADERS` 순서가 시트 열 순서입니다.
- `POST action=admin`은 64자리 난수 비밀값으로 보호합니다. 초기화 재시도·폼 상태 조회·시험 회원 준비·시험 행 확인·삭제에만 씁니다. 레포에는 `OPS_SECRET_PLACEHOLDER`만 보관합니다. 실제 값은 레포 밖 `D:\10_Projects\Coding\WYEA\.ops.env`에 있습니다. 배포할 때 격리된 임시 폴더의 `report.gs`에만 치환하고, 푸시 직후 임시 파일을 placeholder 버전으로 복원합니다. 비밀값을 Git·이슈·로그에 기록하지 않습니다.

## 폼

- `applyFormChanges`는 기존 회원 정보 갱신 폼의 필수 소속 단과 통번역단·소모임 섹션 분기, 기존 필수 동의 항목의 도움말, 처리방침 링크·동의 버전을 설정합니다. 기존 응답 2건은 `비고=재제출 대상`으로 표시합니다.
- 옛 26-2기 가입 폼은 응답을 중지하고 설명을 `/join` 안내 한 줄로 바꿉니다. 기존 응답은 삭제하지 않습니다.
- `inspectFormDetails_`는 항목 목록·선택지 분기·응답 시트 헤더와 기존 응답 개수만 확인합니다. 응답자의 값은 반환하지 않습니다.
- 갱신 폼 동의 도움말의 수집 항목은 폼이 실제로 받는 것만 적습니다(`RENEWAL_CONSENT_DETAILS`: 성명·생년월일·성별·휴대전화·주소·직업·소속 대학·캠퍼스·학과·학번·이메일·소속 단·가능 언어·관심 주제). 목적·보유 기간·제3자 제공·초상권 문구는 `/join`과 같고, `join.ts` 동의문·동의 버전은 바꾸지 않습니다(대표 결정 C-3, 2026-09-28).
- `POST action=admin, operation=applyConsentHelp`는 갱신 폼 `[필수] 동의 항목` 문항의 **도움말만** 바꿉니다. 문항 생성·삭제·순서, 필수 여부, 검증 규칙, 응답은 바꾸지 않습니다. 중복 동의 문항 정리·필수·검증 설정은 `applyFormChanges`(`ensureConsentHelp_`) 몫인데, 이 함수는 실행할 때마다 갱신 응답 전 행에 `비고=재제출 대상`을 다시 쓰고 빈 동의 열을 지우며 옛 가입 폼 설정도 다시 걸기 때문에 도움말 변경에는 쓰지 않습니다. `inspectForms` 결과의 `consentHelpMatchesRenewal`로 반영을 확인합니다.

## 검증

`node apps-script/ops/forms-mock-test.cjs`는 `applyConsentHelp` 실행 전후로 문항 수·ID·순서·필수 여부·검증·응답이 같고 동의 도움말만 바뀌는지, 폼에 없는 항목(지원 동기 등)이 빠지고 나머지 동의 문구는 `/join`과 같은지 확인합니다.

`node apps-script/ops/mock-test.cjs`는 가입 시트 조회(검토 대기 통과·반려 실패·이름만 일치 실패), 갱신 폼 조회(여러 유효 응답 중 최신, 최신이 불완전하면 이전 유효 응답, 대학·언어·동의 누락 실패, 잘못된 Timestamp 무시, 갱신 우선·가입 기록 대체, 앞자리 0 빠진 전화), 조회 서버 오류와 not_found 구분, 응답 최소화, 참가 기록서 검증·저장, `submission_id` 중복 방지(같은 ID 재전송 1건·메일 1회, 다른 ID 각각 저장)와 기존 시트 헤더 보강, 관리자 비밀값 거절을 가짜 시트로 확인합니다. `node scripts/check-report-client.mjs`는 화면의 응답 분류 문구와 제출 ID 재사용 규칙을 확인합니다. 실제 배포 검증 결과와 시험 행 삭제 결과는 `ADGRANTS_HANDOFF.md`에 별도로 기록합니다.
