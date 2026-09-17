# WYEA 관리직 온보딩 페이지 — 개발 가이드라인

| | |
|---|---|
| **작성** | 2026-09-16 |
| **의뢰** | 이창현 (대표) |
| **개발** | 조우주 (웹 담당) |
| **배포 위치** | `wyea.info/onboarding-<랜덤문자열>` |
| **수신 주소** | wyea@wyea.info |

---

## 0. 이 문서를 먼저 이렇게 읽어라

§1~3으로 **뭘 만드는지** 파악하고, §4~6이 **계약(반드시 이대로)**, §7이 **화면 사양**, §8~9가 **지켜야 할 제약**, §10이 **완료 기준**이다.

§6은 건너뛰지 마라. 인터넷에 도는 Apps Script CORS 해법 중 상당수가 존재하지 않는 API를 쓴다. 거기서 시간을 버리는 사람이 많다.

---

## 1. 왜 만드는가

WYEA는 지금 기획·연락·품질관리가 전부 대표 한 명에게 몰려 있다. 관리직을 임명해도 대표가 일일이 카톡으로 영문 이름, 전화번호, 하고 싶은 일을 묻고 받아적는 구조라 인원이 늘수록 대표가 더 느려진다.

이 페이지는 그 과정을 자동화한다. **임명자가 혼자 읽고 혼자 입력하고 제출하면, 대표는 정리된 메일 한 통을 받아서 계정 생성과 역할 배정만 결정한다.**

성공 기준은 디자인이 아니라 이거다 — **임명자가 대표에게 아무것도 묻지 않고 끝까지 갈 수 있는가.**

---

## 2. 전체 흐름

```
[대표]  임명 수락 → 초대 코드 발급 → 개인 카톡/메일로 링크+코드 전달
                                              │
                                              ▼
[임명자] 페이지 접속 → 코드 입력 ─→ (서버 조회) ─→ "환영해요, OOO님"
                                              │
                                     본문 9개 섹션 읽기
                                              │
                                        폼 작성 → 제출
                                              │
                                              ▼
[서버]  Apps Script 웹앱: 검증 → 시트 기록 → 사진 드라이브 저장
                                              │
                                              ▼
[대표]  wyea@wyea.info 로 정리된 요약 메일 도착
        → Workspace 계정 생성 · 역할 배정 (여기만 사람이 판단)
```

**대표가 손대는 지점은 양 끝 두 곳뿐이다.** 가운데는 전부 자동이어야 한다.

---

## 3. 구성 요소

| # | 요소 | 기술 | 비고 |
|---|---|---|---|
| A | 온보딩 페이지 | 정적 HTML/CSS/JS 1파일 | 빌드 도구·프레임워크 불필요 |
| B | 백엔드 | Google Apps Script 웹앱 | `doGet` + `doPost` |
| C | 초대 코드 DB | Google 스프레드시트 시트 1 | `invites` |
| D | 응답 저장소 | Google 스프레드시트 시트 2 | `responses` |
| E | 사진 저장소 | Google 드라이브 폴더 | 대표 소유 |

서버도, DB도, 월 비용도 없다. 전부 WYEA Workspace 계정 안에서 끝난다.

---

## 4. 데이터 모델

### 4-1. 시트 `invites` — 초대 코드

| 열 | 필드 | 예시 | 설명 |
|---|---|---|---|
| A | `code` | `K7M2QX9BTR4WVZ3H` | 16자 대문자+숫자 난수. **대표가 발급** |
| B | `name_ko` | `김민서` | 환영 인사에 표시 |
| C | `campus` | `인제대학교` | 폼 기본값 프리필 |
| D | `role_note` | `지부장` | 대표 메모. 페이지에 노출 금지 |
| E | `issued_at` | `2026-09-16` | |
| F | `used_at` | (빈칸) | 제출 완료 시 서버가 기록 |
| G | `status` | `active` | `active` / `used` / `revoked` |

### 4-2. 시트 `responses` — 제출 응답

`timestamp`, `code`, `name_ko`, `last_name_en`, `first_name_en`, `desired_id`, `has_passport`, `backup_email`, `phone`, `photo_url`, `campus`, `dept_year`, `referral`, `fields`(콤마 구분), `field_other`, `experience`, `cannot_take`, `hours_per_week`, `contact_time`, `first_30days`, `agree_naming`, `agree_privacy`

### 4-3. 드라이브

사진은 `WYEA/온보딩/프로필사진/` 에 `{name_ko}_{code앞4자}.{확장자}` 로 저장. 시트에는 파일 URL만 기록.

---

## 5. API 계약

Apps Script 웹앱 URL을 `API_URL` 이라 하자. 엔드포인트는 두 개.

### 5-1. 초대 코드 확인 — `GET`

```
GET  {API_URL}?action=verify&code=K7M2QX9BTR4WVZ3H
```

**성공**
```json
{ "ok": true, "name_ko": "김민서", "campus": "인제대학교" }
```

**실패** — 코드가 없거나 `status`가 `active`가 아닐 때
```json
{ "ok": false, "error": "invalid_code" }
```

> 실패 응답에 이유를 더 쪼개지 말 것. "없는 코드"와 "이미 사용된 코드"를 구분해 알려주면 코드 존재 여부가 새어나간다. 둘 다 `invalid_code`로 통일한다.

### 5-2. 제출 — `POST`

Body는 JSON 문자열 하나. 사진은 base64.

```json
{
  "action": "submit",
  "code": "K7M2QX9BTR4WVZ3H",
  "payload": {
    "name_ko": "김민서",
    "last_name_en": "KIM",
    "first_name_en": "MINSEO",
    "desired_id": "minseo.kim",
    "has_passport": true,
    "backup_email": "...",
    "phone": "010-....",
    "campus": "인제대학교",
    "dept_year": "경영학과 2학년",
    "referral": "에브리타임",
    "fields": ["SNS·콘텐츠", "행사 기획"],
    "field_other": "...",
    "experience": "...",
    "cannot_take": "...",
    "hours_per_week": "3~5시간",
    "contact_time": "평일 저녁",
    "first_30days": "...",
    "agree_naming": true,
    "agree_privacy": true
  },
  "photo": {
    "filename": "profile.jpg",
    "mimeType": "image/jpeg",
    "data": "<base64, 접두사 제외>"
  }
}
```

**응답**
```json
{ "ok": true }
```
```json
{ "ok": false, "error": "invalid_code" | "already_used" | "validation_failed" | "server_error" }
```

### 5-3. 서버가 제출 시 할 일 (순서대로)

1. `code` 재검증 — **클라이언트를 믿지 않는다.** `status == active` 아니면 즉시 거부
2. 필수 항목 검증. 실패 시 `validation_failed`
3. 사진 있으면 드라이브 저장 → URL 확보
4. `responses` 시트에 행 추가
5. `invites` 행을 `status=used`, `used_at=now` 로 갱신
6. `MailApp.sendEmail` 로 wyea@wyea.info 에 요약 메일 발송
7. `{ "ok": true }` 반환

**4번과 6번 사이에서 죽어도 데이터는 남아야 한다.** 메일 발송은 `try/catch`로 감싸고, 실패해도 제출 자체는 성공 처리할 것. 대표가 메일을 못 받는 것보다 임명자가 "제출 실패"를 보고 다시 대표에게 카톡하는 게 더 나쁘다.

### 5-4. 요약 메일 형식

제목: `[WYEA 온보딩] 김민서 (인제대학교)`

본문은 대표가 **스크롤 없이 한 화면에서 판단**할 수 있게 짠다.

```
■ 계정 발급용
  한글명      김민서
  영문        KIM MINSEO
  희망 ID     minseo.kim@wyea.info
  여권        있음
  보조 메일   ...
  전화        ...
  사진        <드라이브 링크>

■ 소속
  인제대학교 / 경영학과 2학년 / 유입: 에브리타임

■ 활동 분야
  희망        SNS·콘텐츠, 행사 기획
  그 외 희망  ...
  경험        ...
  ⚠ 어려운 것 ...
  가용 시간   주 3~5시간 / 평일 저녁
  첫 30일     ...

■ 확인
  표기 규칙 동의 ✅   개인정보 동의 ✅
  초대 코드 K7M2… (발급 2026-09-16)
```

---

## 6. ★ 반드시 지킬 기술 제약

여기서 막히는 사람이 제일 많다.

### 6-1. CORS — preflight를 발생시키지 마라

정적 페이지(`wyea.info`)와 Apps Script(`script.google.com`)는 **서로 다른 오리진**이다. 브라우저가 preflight(`OPTIONS`)를 보내면 Apps Script는 제대로 응답하지 못하고 요청이 죽는다.

**존재하지 않는 API를 쓰라는 글을 조심해라.** `ContentService`의 `TextOutput`에 `setHeaders()`로 CORS 헤더를 붙이라는 코드가 블로그·Medium에 널려 있는데, 공식 문서상 `TextOutput`의 메서드는 `append`, `clear`, `downloadAsFile`, `getContent`, `getFileName`, `getMimeType`, `setContent`, `setMimeType` **여덟 개뿐이고 헤더를 설정하는 메서드는 없다.** 그 코드는 실행 즉시 에러다.

**되는 방법은 하나다 — 요청을 "simple request"로 만들어 preflight 자체를 없앤다.**

```js
// ✅ 이렇게
await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 반드시 text/plain
  body: JSON.stringify(payload)
});

// ❌ 이러면 preflight가 발생해서 실패한다
headers: { 'Content-Type': 'application/json' }
headers: { 'X-Custom-Token': '...' }   // 커스텀 헤더 금지
```

서버에서는 `e.postData.contents`를 `JSON.parse` 하면 된다. Content-Type이 text/plain이어도 내용은 JSON 문자열 그대로 온다.

`GET`은 단순 요청이라 그냥 된다.

### 6-2. 배포 설정

Apps Script 편집기 → 배포 → 새 배포 → 유형 **웹 앱**:

- **실행 계정**: 나 (대표 계정) ← 이래야 시트·드라이브 쓰기 권한이 생김
- **액세스 권한**: **모든 사용자** ← 이래야 로그인 없이 제출 가능

액세스를 "모든 사용자"로 하지 않으면 임명자가 구글 로그인 화면을 만난다. 아직 wyea.info 계정이 없는 사람들이라 여기서 전부 막힌다.

### 6-3. 재배포하면 URL이 바뀐다

코드를 고친 뒤 **"새 배포"를 만들면 URL이 새로 생긴다.** 페이지에 박아둔 `API_URL`이 옛날 걸 가리켜서 조용히 죽는다.

수정 후에는 반드시 **배포 관리 → 기존 배포 편집(연필) → 버전 "새 버전" → 배포**. 이러면 URL이 유지된다.

### 6-4. 그 외

- 실행 시간 상한 6분. 이 작업엔 여유롭지만 base64 사진이 크면 느려지니 **클라이언트에서 1MB 이하로 리사이즈해서 보낼 것** (canvas로 긴 변 800px 정도)
- `MailApp` 일일 발송 한도는 Workspace 계정 기준 넉넉하다. 이 규모에선 문제없음
- `LockService`로 시트 쓰기를 감쌀 것. 동시 제출 시 행이 덮어써진다

---

## 7. 페이지 사양

### 7-1. 화면 흐름

**화면 1 — 코드 게이트**

WYEA 로고 + "관리직 온보딩" + 코드 입력칸 하나. 그 외 아무것도 노출하지 않는다.

- 입력 → `verify` 호출 → 성공하면 화면 2로
- 실패하면 "코드를 확인해 주세요" + 대표 연락 안내
- **연속 실패 시 지연을 건다** (3회부터 5초, 6회부터 30초). §9 참조

**화면 2 — 본문**

상단에 `환영해요, {name_ko}님` 을 크게. 아래로 9개 섹션이 이어지고 맨 끝이 폼이다.

진행률 표시(상단 얇은 바)를 넣으면 이탈이 줄어든다. 필수는 아님.

**화면 3 — 완료**

"제출됐어요. 2~3일 안에 보조 이메일로 계정 안내가 갑니다." + 그 사이 할 일 안내.

### 7-2. 본문 섹션 (원고는 대표가 별도 제공)

1. 환영 + 이 페이지 사용법
2. WYEA란 — 2025.06.25 설립, 2025.10.15 고유번호증, 한일 청년교류, 연합동아리 + 캠퍼스 지부
3. 지금까지 한 일 — 2025.11 서울교류회 / 2026.04 도쿄·오사카 교류회 / 2026.08 제2회 한일음악교류회
4. 조직이 굴러가는 방식 — 본부 + 지부 약 10곳. 초기 단계라 직책보다 **분야** 중심
5. **대외 표기 규칙** ← 시각적으로 가장 강조할 섹션
6. 도구와 자료 위치
7. Workspace 계정 세팅
8. 첫 30일 체크리스트
9. 제출 폼

### 7-3. 폼 문항

`*` 는 필수.

**계정 발급**

| name | 유형 | 라벨 / 비고 |
|---|---|---|
| `last_name_en` * | text | 성 (영문, 여권식) · `KIM` · 자동 대문자 |
| `first_name_en` * | text | 이름 (영문, 여권식) · `MINSEO` · 자동 대문자 |
| `name_ko` * | text | 한글 성명 · 코드에서 프리필, 수정 가능 |
| `desired_id` * | text | 희망 아이디 · `@wyea.info` 접미사 표시 · `[a-z0-9.]` 만 |
| `has_passport` | radio | 여권 보유 · **"없음" 선택 시 로마자 표기 안내 문구 노출** |
| `backup_email` * | email | 보조 이메일 |
| `phone` * | tel | 전화번호 |
| `photo` | file | 프로필 사진 (선택) · 이미지만 · 클라이언트 리사이즈 |

**소속**

| name | 유형 | 라벨 |
|---|---|---|
| `campus` * | text | 소속 대학 / 지부 · 코드에서 프리필 |
| `dept_year` | text | 학과·학년 |
| `referral` | select | 유입 경로 · 에브리타임 / 지인 / SNS / 기타 |

**활동 분야** — 이 섹션이 이 페이지의 핵심이다. 대충 만들지 말 것.

| name | 유형 | 라벨 |
|---|---|---|
| `fields` * | checkbox 다중 | 행정·문서 / SNS·콘텐츠 / 신문·편집 / 대외협력(한일) / 지부 운영·모집 / 행사 기획 / 디자인 / 번역(일·영) / 사진·영상 / 웹·개발 |
| `field_other` | textarea | 위에 없는데 해보고 싶은 것 |
| `experience` | textarea | 이미 해본 것 / 자신 있는 것 |
| `cannot_take` | textarea | **지금은 맡기 어려운 것** |
| `hours_per_week` * | radio | 1시간 미만 / 1~3 / 3~5 / 5~10 / 10시간 이상 |
| `contact_time` | text | 연락 잘 되는 시간대 |
| `first_30days` * | textarea | **첫 30일 안에 혼자 끝내보고 싶은 것 하나** |

> `cannot_take` 와 `first_30days` 는 대표가 역할을 배정하는 실제 근거다. placeholder에 예시를 넣어서 빈칸으로 넘어가지 않게 할 것. "없음"이라고 쓰는 것도 정보다.

**확인**

| name | 유형 | 라벨 |
|---|---|---|
| `agree_naming` * | checkbox | 대외 표기 규칙을 읽고 이해했습니다 |
| `agree_privacy` * | checkbox | 개인정보 수집·이용에 동의합니다 (전문 펼치기) |

### 7-4. 폼 UX 필수 사항

- **입력값 로컬 저장** — 긴 페이지라 중간에 이탈했다가 돌아오는 경우가 반드시 생긴다. `localStorage`에 자동 저장하고 복귀 시 복원. 제출 성공하면 삭제
- **제출 버튼 중복 클릭 방지** — 누르는 즉시 비활성화. 안 하면 중복 행이 쌓인다
- **모바일 우선** — 대부분 휴대폰으로 연다
- **제출 실패 시 입력값을 날리지 말 것** — 에러를 띄우고 재시도 버튼만 제공

---

## 8. 페이지에 넣으면 안 되는 것

- **초기 비밀번호.** 계정 비밀번호는 이 페이지 어디에도 등장하지 않는다. 계정 생성 후 대표가 보조 이메일로 개별 발송한다
- **회원 수 수치.** 명부 정리 전이라 대외 인용 불가
- `invites` 시트의 `role_note`
- 다른 임명자의 정보

---

## 9. 보안 요구사항

**코드 열거(enumeration) 방지.** `verify` 엔드포인트는 코드를 받아 **사람 이름을 돌려준다.** 인증 없는 엔드포인트가 개인정보를 반환하는 구조라 다음을 반드시 지킨다.

1. 코드는 **16자 이상 난수**. 순번·이름 기반·짧은 코드 금지
2. `verify` 응답에 `name_ko`, `campus` **외 어떤 필드도 넣지 않는다**
3. 실패 사유를 구분하지 않는다 (§5-1)
4. 클라이언트에서 연속 실패 시 지연. 서버에서도 동일 코드 반복 실패를 시트에 로깅
5. 코드 1개 = 1회 제출. 사용 후 `status=used`

**클라이언트 검증을 신뢰하지 않는다.** 코드 유효성, 필수값, 사용 여부는 전부 서버에서 다시 본다.

**`noindex`.** `<meta name="robots" content="noindex, nofollow">` + `robots.txt` 차단. wyea.info 메뉴·사이트맵에 링크를 걸지 않는다.

**HTTPS 강제.**

---

## 10. 개인정보 처리

여권 영문명·전화번호·보조 이메일·사진을 수집하므로 개인정보보호법 적용 대상이다. 동의 항목(`agree_privacy`)에 다음 네 가지가 **명시**되어야 한다. 전문은 대표가 제공한다.

1. 수집 항목
2. 이용 목적 (계정 발급, 역할 배정, 비상 연락)
3. 보유 기간
4. 동의 거부 권리와 그에 따른 불이익

시트와 드라이브 폴더는 **대표 계정 소유로 두고 공유 범위를 최소화**한다. 개발·테스트 중에도 실제 개인정보를 넣지 않는다.

---

## 11. 완료 기준 (DoD)

아래가 전부 통과해야 완료다.

- [ ] 유효한 코드 → 이름이 표시되고 본문이 열린다
- [ ] 잘못된 코드 → `invalid_code`. 존재 여부가 드러나지 않는다
- [ ] 이미 사용된 코드 → 잘못된 코드와 **구분 불가능한** 동일 메시지
- [ ] 전체 폼 제출 → `responses` 시트에 행 1개 생성
- [ ] 같은 제출 → wyea@wyea.info 에 §5-4 형식 메일 도착
- [ ] 사진 포함 제출 → 드라이브 저장 + 시트에 URL
- [ ] 사진 없이 제출 → 정상 처리
- [ ] 같은 코드로 재제출 시도 → 거부
- [ ] 제출 버튼 연타 → 행이 1개만 생긴다
- [ ] 브라우저 콘솔에 **CORS 에러 없음**
- [ ] 휴대폰(iOS Safari / Android Chrome)에서 처음부터 끝까지 완주
- [ ] 중간 이탈 후 재접속 → 입력값 복원
- [ ] 페이지 소스에 비밀번호·회원 수·`role_note` 없음
- [ ] `noindex` 적용 확인

---

## 12. 범위 밖 (하지 말 것)

- 로그인·회원가입 시스템
- 관리자 대시보드 — 시트로 충분하다
- 계정 자동 생성 — **Workspace 계정 생성은 대표가 직접 한다.** 자동화하지 않는다
- 외부 DB·서버·유료 서비스
- 프레임워크 도입 (React 등). 정적 HTML 1파일로 끝낼 것

---

## 13. 대표에게 받아야 할 것

개발 착수 전에 요청:

1. 본문 9개 섹션 **원고**
2. 개인정보 동의 **전문**
3. 로고 파일, 브랜드 컬러
4. Apps Script 프로젝트와 스프레드시트 **편집 권한**
5. `wyea.info` 배포 방법 (FTP / Git / 관리자 패널 중 무엇인지)
6. 최종 URL 경로 문자열

---

## 부록. 참고 자료

- [Apps Script — ContentService TextOutput 메서드 목록](https://developers.google.com/apps-script/reference/content/text-output) — `setHeaders`가 없다는 근거
- [File upload using doPost on Google Web Apps (tanaike)](https://tanaikech.github.io/2017/02/05/file-upload-using-dopost-on-google-web-apps/)
- [외부 HTML에서 인증 없이 드라이브 업로드 (tanaike)](https://gist.github.com/tanaikech/d3e62002e522f9e3f2b35bc56c64b2c9)
- [Gmail 차단 파일 형식](https://support.google.com/mail/answer/6590?hl=en)
