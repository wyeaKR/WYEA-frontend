# WYEA 운영 스크립트: 참가 기록서·기존 폼

`report.gs`, `forms.gs`, `setup.gs`는 하나의 standalone Apps Script 프로젝트입니다. `.clasp.json`의 스크립트 ID는 `1Cj7qxoUcl2pL2-M5MGO3-9hjyxj2nRyJclZPQRlb-IcI5JcwYrmfJRYq`입니다. `/report` API 주소는 `src/content/report.ts`에 있습니다.

## 초기화와 현재 구성

- `setupAll`은 `WYEA 참가 기록서` 시트를 만들고 WYEA_LCE 공유 드라이브로 옮기며, `records`·`events` 탭과 총무부·홍보부·기획부·회원부 필터 보기 4개를 만듭니다. 행사 목록의 첫 값은 `26-2기 회원 OT`입니다. `REPORT_SPREADSHEET_ID`·`JOIN_SPREADSHEET_ID` 속성을 저장한 뒤 `applyFormChanges`를 실행합니다. 재실행 시 같은 시트를 사용합니다.
- 시트 ID는 `1HBM6gHKqnhn_kSiZbf-7cKPJXd3J7D-YeM37Fr0eOF4`입니다. 가입 시트 ID는 `1mukE06RTlPCI4Xu3_N8u2RKBAA67QZq-hMhn0XKSO8M`입니다.
- 웹 앱 배포 ID는 `AKfycbxqAfHZmTqKh0ZVTW07BXDIJWawe4qMG1-Avcdy2tgTSve0tA9EsFmgtAtBMJenPDVv`입니다. 실행: 배포 사용자, 접근: 모든 사용자. 코드를 바꾸면 `clasp push`와 기존 ID를 지정한 `clasp deploy -i ...`로 새 버전을 발행해야 합니다.
- 초기에 Sheets REST API 비활성화 오류가 있어 manifest에 고급 Sheets 서비스(`sheets` v4)를 선언했습니다. 대표의 재실행 로그에서 필터 보기 4개 생성이 확인됐습니다.

## 요청

- `GET ?action=events`: 행사명 배열만 반환합니다.
- `POST {"action":"lookup","name":"...","phone":"..."}`: 가입 시트의 이름과 휴대전화가 둘 다 일치할 때만 `{ok:true,university,team}`을 반환합니다. 그 외에는 `not_found`입니다.
- `POST {"action":"report","payload":{...}}`: 서버에서 회원·행사·필수 항목을 재검증한 뒤 `records`에 기록하고 알림 메일을 보냅니다. ① 참가 사실은 전부 필수, ②③④는 각 섹션에서 한 항목 이상 필수입니다. 사진 링크는 HTTPS만 허용합니다. 메일 제목은 `[WYEA] 참가 기록서: 이름 (대학 · 단 · 행사명)`입니다.
- 웹 앱 요청은 `Content-Type: text/plain;charset=utf-8` JSON 본문입니다. `REPORT_HEADERS` 순서가 시트 열 순서입니다.
- `POST action=admin`은 64자리 난수 비밀값으로 보호합니다. 초기화 재시도·폼 상태 조회·시험 회원 준비·시험 행 확인·삭제에만 씁니다. 레포에는 `OPS_SECRET_PLACEHOLDER`만 보관합니다. 실제 값은 레포 밖 `D:\10_Projects\Coding\WYEA\.ops.env`에 있습니다. 배포할 때 격리된 임시 폴더의 `report.gs`에만 치환하고, 푸시 직후 임시 파일을 placeholder 버전으로 복원합니다. 비밀값을 Git·이슈·로그에 기록하지 않습니다.

## 폼

- `applyFormChanges`는 기존 회원 정보 갱신 폼의 필수 소속 단과 통번역단·소모임 섹션 분기, 기존 필수 동의 항목의 도움말, 처리방침 링크·동의 버전을 설정합니다. 기존 응답 2건은 `비고=재제출 대상`으로 표시합니다.
- 옛 26-2기 가입 폼은 응답을 중지하고 설명을 `/join` 안내 한 줄로 바꿉니다. 기존 응답은 삭제하지 않습니다.
- `inspectFormDetails_`는 항목 목록·선택지 분기·응답 시트 헤더와 기존 응답 개수만 확인합니다. 응답자의 값은 반환하지 않습니다.

## 검증

`node apps-script/ops/mock-test.cjs`는 이름+전화 조회, 응답 최소화, 참가 기록서 검증·저장, 관리자 비밀값 거절을 가짜 시트로 확인합니다. 실제 배포 검증 결과와 시험 행 삭제 결과는 `ADGRANTS_HANDOFF.md`에 별도로 기록합니다.
