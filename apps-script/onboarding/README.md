# WYEA 온보딩 1차 테스트

요구사항 기준: 루트의 `onboarding-requirements.md`. 기존 Vue 앱과 분리된 정적 페이지이며 이메일, 계정 자동 생성, 사진 업로드는 포함하지 않습니다.

## 현재 상태 — 사용자 실연동 확인 완료

2026-09-18 사용자 보고 기준: 테스트 Spreadsheet `onboarding`의 invites/responses 탭 구성, 스크립트 속성 설정, 웹 앱 배포, 프론트 API_URL 연결을 완료했습니다. 편집기에서 코드 생성 및 시트 저장, 로컬 `/onboarding/index.html`에서 코드 검증·가상 정보 제출·responses 저장·used 처리·재사용 차단·새 코드 추가 제출까지 실제 성공했습니다. Codex의 원격 재검증 결과가 아니라 사용자 확인 결과입니다.

아래 설정 절차는 재설정/인수인계용입니다. 기본 연결을 미완료로 취급하지 않습니다. 모바일, 동시 요청, 폐기 코드, 상세 입력 검증, 통신 오류, 운영 도메인 테스트는 추가 확인 대상입니다. Google Sheets 메뉴 발급은 구현했으며 기존 15개와 메뉴 관련 4개 모의 테스트가 통과했습니다. 실제 메뉴 UI는 사용자 확인 대기입니다.

### Sheets 메뉴 사용

1. `onboarding` 시트의 확장 프로그램 → Apps Script에서 기존 웹 앱과 동일한 프로젝트를 열고 최신 Code.gs를 저장합니다. 별도 프로젝트로 복제하지 않습니다.
2. PC 브라우저에서 시트를 새로고침합니다. onOpen은 메뉴만 만들며 코드를 발급하지 않습니다. 설치형 트리거 등록이나 메뉴 추가만을 위한 웹 앱 재배포는 필요하지 않습니다.
3. `WYEA 온보딩 → 초대코드 발급`을 클릭하고, 최초 권한 요청이 있으면 승인합니다.
4. 코드가 기록된 invites의 A열 셀이 자동 선택되고 완료 안내가 표시됩니다. 확인을 누른 후 선택된 셀을 복사합니다.

generateInviteCodeFromMenu는 기존 generateInviteCode를 재사용합니다. 생성·중복 확인·잠금 및 웹 API는 유지합니다. 현재 문서와 설정된 시트 ID가 다르면 발급을 중단합니다. 저장 후 셀 선택만 실패하면 이미 발급되었다고 안내하므로 다시 발급하기 전에 invites를 확인합니다. 메뉴는 신뢰하는 시트 편집자가 사용하는 관리 기능입니다.

## 1. 준비한 테스트 Sheets 확인

시트 이름과 **첫 행**이 아래 순서와 정확하게 같아야 합니다. 파일은 비공개로 유지합니다. 웹 방문자에게 시트 공유 권한을 줄 필요는 없습니다.

`invites` A:E:

```text
code | issued_at | status | used_at | response_id
```

`responses` A:M:

```text
response_id | submitted_at | invite_code | name_ko | last_name_en | first_name_en | desired_id | contact_email | expectations | desired_activities | interests | interest_other | agree_privacy
```

관리자는 Apps Script 편집기에서 `generateInviteCode`를 선택해 실행합니다. UUID 기반 32자 코드를 생성하고 기존 invites/responses와 중복을 검사한 뒤, `invites`에 코드·서버 발급 시각·`active`·빈 used_at·빈 response_id를 한 행 저장합니다. 실행 로그에 표시된 시트 행에서 코드를 확인합니다. 발급 함수는 웹 API에 노출하지 않습니다. 폐기 시 `revoked`로 변경하고, 사용한 코드를 재사용하지 말고 새로 발급합니다.

## 2. Apps Script 설정

1. 테스트 Sheets에서 **확장 프로그램 → Apps Script**를 엽니다.
2. 기본 `Code.gs`를 이 폴더의 `Code.gs` 내용으로 교체합니다.
3. **프로젝트 설정 → 스크립트 속성**에 다음 값을 추가합니다.
   - 이름: `ONBOARDING_SPREADSHEET_ID`
   - 값: 테스트 Sheets URL의 `/d/`와 `/edit` 사이 ID
4. 함수 선택에서 `checkSetup`을 골라 실행하고 필요한 스프레드시트 접근 권한을 승인합니다. 실행 로그에 연결 및 헤더 확인 완료가 표시되는지 확인합니다. 이 함수는 데이터를 변경하지 않습니다.
5. 같은 시트를 사용하는 웹 앱은 이 Apps Script 프로젝트 하나로 운영합니다. 스크립트 잠금은 서로 다른 프로젝트 사이에서 공유되지 않습니다.

## 3. 웹 앱 배포와 프론트엔드 연결

1. Apps Script의 **배포 → 새 배포 → 유형: 웹 앱**을 선택합니다.
2. 실행 사용자는 **나(배포 계정)**, 액세스 대상은 로그인하지 않은 사용자도 접근할 수 있는 **모든 사용자**로 설정합니다. 배포 계정에 테스트 시트 편집 권한이 있어야 합니다.
3. 조직 정책 때문에 익명 접근 옵션을 사용할 수 없다면 여기서 운영 관리자에게 확인합니다. 다른 인증 방식이나 CORS 우회로 임의 변경하지 않습니다.
4. 배포한 웹 앱 URL 중 `/exec`로 끝나는 주소를 복사합니다. 편집자용 `/dev` 주소는 사용하지 않습니다.
5. `public/onboarding/onboarding.js` 맨 위의 `API_URL = ''`에 주소를 넣습니다. URL 자체는 공개되며 비밀키가 아닙니다. 시트 ID와 초대코드 목록은 프론트엔드에 넣지 않습니다.
6. 사용자가 기존 방식대로 빌드·커밋·푸시해 GitHub Pages에 배포합니다. Vite가 `public/onboarding`을 `dist/onboarding`으로 복사합니다. Vue 라우터, 메뉴, 공통 헤더/푸터는 변경하지 않습니다.
7. 테스트 주소는 **`https://wyea.info/onboarding/`**입니다. 끝의 `/`를 포함한 주소로 공유합니다. 이는 개발 예시 경로이며 최종 운영 경로는 별도로 정해야 합니다.

Apps Script 코드를 수정한 뒤에는 **배포 관리 → 기존 배포 수정 → 새 버전**으로 갱신해야 `/exec`에 반영됩니다. 기존 배포를 갱신하면 연결 URL을 유지할 수 있습니다.

공식 문서: [Apps Script 웹 앱](https://developers.google.com/apps-script/guides/web), [Content Service](https://developers.google.com/apps-script/guides/content), [Lock](https://developers.google.com/apps-script/reference/lock/lock).

## 4. API 계약

### Verify

`GET {API_URL}?action=verify&code={URL로 인코딩한 코드}`

- 정상: `{"ok":true}`
- 없음/사용/폐기/중복 등록된 코드: `{"ok":false,"error":"invalid_code"}`
- 설정·시트 접근 오류: `{"ok":false,"error":"server_error"}`

### Submit

POST `Content-Type: text/plain;charset=utf-8`로 아래 객체를 JSON 문자열로 전송합니다.

```json
{
  "action": "submit",
  "code": "전달받은 개인별 코드",
  "payload": {
    "name_ko": "테스트사용자",
    "last_name_en": "Test",
    "first_name_en": "User",
    "desired_id": "test.user",
    "contact_email": "test@example.com",
    "expectations": "가상 테스트: 국제 교류 경험",
    "desired_activities": "가상 테스트: 행사 운영",
    "interests": ["행사 기획", "기타"],
    "interest_other": "가상 테스트 분야",
    "agree_privacy": true
  }
}
```

- 정상: `{"ok":true,"response_id":"서버 생성 ID"}`
- 코드 불가: `{"ok":false,"error":"invalid_code"}`
- 형식/필수값 오류: `{"ok":false,"error":"validation_failed"}`
- 저장/잠금/설정 오류: `{"ok":false,"error":"server_error"}`

응답 본문의 `ok`를 확인합니다. HTTP 성공만으로 저장 완료를 판단하지 않습니다. 불필요한 헤더, `application/json`, `no-cors`, 지원되지 않는 `setHeaders()`는 사용하지 않습니다. 실제 배포 URL의 JSON을 브라우저에서 읽을 수 있는지는 아래 실연동 테스트가 필요합니다.

서버는 필수 문자열, 이메일 형식, 허용된 관심 분야, 기타 선택 시 상세값, 실제 boolean `true` 동의를 검증합니다. 추가 확정 규칙은 한글 성명 최대 30자, 영문 성/이름 각각 `[A-Za-z '-]` 최대 50자, 희망 아이디 `[a-z0-9.]` 3~30자, 기대/활동 각각 최대 1000자, 기타 최대 200자입니다. 문자열은 양끝 공백을 제거한 뒤 검사합니다. `아직 정하지 못함`과 다른 관심 분야의 동시 선택은 거부합니다. 시각은 서버 UTC ISO 문자열이며, 관심 분야는 쉼표로 연결합니다. 입력 문자열은 일반 텍스트 형식 및 수식 시작 문자 이스케이프로 저장합니다.

상세 검증 및 발급 함수에 대한 사용자 확정 규칙은 requirements에도 현행화했습니다. 프론트엔드의 상세 검증 안내 보완은 남아 있으며 서버가 규칙 위반을 거부합니다.

동시 제출은 스크립트 잠금 안에서 재검증합니다. 응답 저장 후 코드 상태 변경만 실패했다면 같은 코드로 재제출해도 새 행을 만들지 않고 기존 기록으로 `used` 상태를 정리한 뒤 `invalid_code`를 반환합니다. 이를 성공 응답 재전송 기능으로 확장하지는 않았습니다. 네트워크 오류가 나면 대표가 `responses`의 코드로 저장 여부부터 확인합니다. 시트 행을 수동 삭제하거나 수정하는 동안에는 이 중복 방지 전제를 보장할 수 없습니다.

## 5. 실제 테스트 순서

반드시 **가상 정보**를 사용합니다. 코드별 결과는 `invites`와 `responses`를 함께 확인합니다.

1. 별도 테스트 코드 A/B/C를 만듭니다. A/B는 `active`, C는 `revoked`로 두고 D/E를 비웁니다.
2. 배포된 `/onboarding/`을 열어 존재하지 않는 코드와 C가 동일한 오류를 보이고 폼을 열지 못하는지 확인합니다.
3. A로 폼을 엽니다. 이름/이메일/관심 분야/동의를 비우거나 기타만 고른 상태에서 제출이 차단되는지 확인합니다.
4. 가상 정보를 모두 입력해 제출합니다. 제출 버튼 잠금, 완료 화면, 접수번호를 확인합니다. 개발자 도구 Network에서 verify 및 POST 응답 JSON을 읽을 수 있는지 확인합니다.
5. `responses`에 정확히 한 행, `invites` A행에 `used`, UTC 사용 시각, 동일 접수번호가 들어갔는지 확인합니다. 열 밀림이 없는지 확인합니다.
6. 새 탭에서 A로 다시 진입하면 실패해야 합니다. 새 코드 B를 두 탭에서 **제출 전에 각각 확인**한 뒤 거의 동시에 제출합니다. 성공은 한 번이며 B 응답도 한 행이어야 합니다.
7. 새 active 코드를 하나 더 만들어 별도 응답을 정상 제출할 수 있는지 확인합니다.
8. 새 코드의 자유입력에 `=1+1`, `+1`, `@test`, `-1` 등을 넣어 저장합니다. 시트에서 수식으로 실행되지 않고 텍스트로 남는지 확인합니다.
9. 입력 중 브라우저 Network를 Offline으로 바꿔 제출합니다. 오류 후 입력값이 유지되고 버튼이 복원되는지 확인합니다. 다시 Online으로 바꾼 뒤 **대표가 저장 여부를 먼저 확인**하고 재시도합니다.
10. 모바일 폭 375px 및 실제 휴대폰에서 코드 입력, 복수 선택, 기타 입력, 제출·완료 화면을 확인합니다. 기존 홈/단체소개/활동소식/재정보고도 정상인지 확인합니다.

CORS/로그인 HTML/리디렉션 문제가 생기면 배포의 접근 권한, 실행 계정, `/exec` 주소, 새 버전 반영 여부와 브라우저 Network/Apps Script 실행 내역을 확인합니다. 실패 시 코드·개인정보를 가린 오류 내용으로 원인을 조사하며 `no-cors`로 바꾸지 않습니다.

## 6. 로컬 검증 및 운영 전 남은 결정

```text
node --test apps-script/onboarding/onboarding.test.mjs
node --check public/onboarding/onboarding.js
npm run build
```

자동 테스트는 Apps Script 서비스를 대체한 로컬 모의 테스트입니다. 실제 Google 권한, CORS, Sheets 기록, 모바일 브라우저 검증을 대체하지 않습니다. 로컬 개발 서버 실행과 배포는 사용자가 진행합니다.

운영 전 확정할 항목: 최종 URL, 최종 개인정보 동의문과 보유 기간, 최종 관심 분야. 편집기용 초대코드 발급 함수는 추가 요청으로 포함했습니다. 현재 화면은 가상 데이터용 테스트 동의 안내입니다. 최종 동의문 확정 없이 실제 개인정보 수집용으로 사용하지 않습니다. 브라우저 저장소에 작성 내용을 보관하지 않으므로 새로고침하면 입력 내용이 사라집니다.
