<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  JOIN_API_URL,
  CONSENT_VERSION,
  universities,
  occupations,
  interestOptions,
  limits,
  MIN_AGE,
  memberUnits,
  departments,
  recommendDepartments,
  consents,
  consentNotice,
  type ConsentKey,
  type Track,
} from '@/content/join'

type Step = 'info' | 'consent' | 'done'
const route = useRoute()
const router = useRouter()
// 일반 회원(member)과 집행부(staff) 지원은 같은 페이지에서 ?track=staff 로 나뉩니다.
// 두 트랙 모두 정보 입력 한 페이지와 동의로 구성합니다.
const track = computed<Track>(() => (route.query.track === 'staff' ? 'staff' : 'member'))
const isStaff = computed(() => track.value === 'staff')
const formSteps = computed<Step[]>(() => ['info', 'consent'])
const stepTitles = computed<Record<string, string>>(() => ({
  info: '정보 입력',
  consent: '동의',
}))
const step = ref<Step>('info')
const busy = ref(false)
const submitError = ref('')
const unconfirmedSubmission = '접수 결과를 확인하지 못했습니다. 이미 접수되었을 수 있으니 반복 제출하지 말고 wyea@wyea.info로 문의해 주세요. 입력한 내용은 유지됩니다.'
const startedAt = ref(0)
const openConsent = ref<ConsentKey | null>(null)

const form = reactive({
  name: '',
  birth: '',
  gender: '',
  phone: '',
  occupation: '',
  occupationOther: '',
  university: '',
  universityOther: '',
  campus: '',
  department: '',
  email: '',
  interests: [] as string[],
  hopes: '',
  team: '',
  memberUnit: '',
  website: '', // 사람에게는 보이지 않는 스팸 방지 칸입니다.
})
const agree = reactive<Record<ConsentKey, boolean>>({ collect: false })
const errors = reactive<Record<string, string>>({})

const apiReady = computed(() => JOIN_API_URL.length > 0)
const progressIndex = computed(() => formSteps.value.indexOf(step.value))

onMounted(() => {
  startedAt.value = Date.now()
})

function formatPhone() {
  const digits = form.phone.replace(/\D/g, '').slice(0, 11)
  form.phone = digits.length > 7
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits
}

function formatBirthDate(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 8)
  const birth = digits.length > 6
    ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
    : digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
  input.value = birth
  form.birth = birth
}

function age(birth: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return NaN
  const [y, m, d] = birth.split('-').map(Number)
  if (!y || !m || !d) return NaN
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return NaN
  const now = new Date()
  let years = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) years -= 1
  return years
}

function required(key: keyof typeof form, label = '이 항목을 입력해 주세요.') {
  const value = String(form[key]).trim()
  if (!value) errors[key] = label
  return value
}
function maxLen(key: keyof typeof form, max: number) {
  if (String(form[key]).trim().length > max) errors[key] = `최대 ${max.toLocaleString()}자까지 입력해 주세요.`
}

function validateInfo() {
  required('name')
  maxLen('name', limits.name)
  required('birth')
  if (form.birth) {
    const years = age(form.birth)
    if (Number.isNaN(years) || years > 100) errors.birth = '생년월일을 확인해 주세요.'
    else if (years < MIN_AGE) errors.birth = `만 ${MIN_AGE}세 이상만 신청할 수 있습니다.`
  }
  if (isStaff.value && !form.gender) errors.gender = '성별을 선택해 주세요.'
  required('phone')
  if (form.phone && !/^010-\d{4}-\d{4}$/.test(form.phone)) errors.phone = '010-0000-0000 형식으로 입력해 주세요.'
  if (!form.university) errors.university = '대학교를 선택해 주세요.'
  if (!isStaff.value && !form.memberUnit) errors.memberUnit = '지원할 단을 선택해 주세요.'
  required('campus')
  maxLen('campus', limits.campus)
  required('department')
  maxLen('department', limits.department)
  if (isStaff.value) {
    if (!form.occupation) errors.occupation = '직업을 선택해 주세요.'
    if (form.occupation === '기타') { required('occupationOther'); maxLen('occupationOther', limits.other) }
  }
  if (form.university === '기타') { required('universityOther', '학교 공식 명칭을 입력해 주세요.'); maxLen('universityOther', limits.other) }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = '이메일 형식을 확인해 주세요.'
  maxLen('email', limits.email)
}

function validateApplication() {
  if (!isStaff.value) return
  if (!form.team) errors.team = '희망 부서를 골라 주세요.'
  if (form.hopes.length > limits.hopes) errors.hopes = `최대 ${limits.hopes}자까지 입력해 주세요.`
}

function setTrack(next: Track) {
  void router.push({ query: next === 'staff' ? { track: 'staff' } : {} })
}

watch(track, () => {
  clearErrors()
  submitError.value = ''
  agree.collect = false
  step.value = 'info'
  scrollTop()
})

function validateConsent() {
  if (!agree.collect) errors.consent = '개인정보 수집 및 이용에 동의해야 가입을 신청할 수 있습니다.'
}

async function focusFirstError() {
  await nextTick()
  const el = document.querySelector('.join-page [aria-invalid="true"]') as HTMLElement | null
  el?.focus()
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function toggleInterest(value: string) {
  form.interests = form.interests.includes(value)
    ? form.interests.filter((v) => v !== value)
    : [...form.interests, value]
  delete errors.interests
}

function clearTeamError() {
  delete errors.team
}

const recommended = computed(() => recommendDepartments(form.interests))

function clearConsentError() {
  delete errors.consent
}

function scrollTop() {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

function go(target: Step) {
  clearErrors()
  step.value = target
  scrollTop()
}

function next() {
  clearErrors()
  if (step.value === 'info') { validateInfo(); validateApplication() }
  if (Object.keys(errors).length) { void focusFirstError(); return }
  const order = formSteps.value
  go(order[order.indexOf(step.value) + 1] ?? 'consent')
}

function back() {
  go(formSteps.value[progressIndex.value - 1] ?? 'info')
}

function payload() {
  const t = (s: string) => s.trim()
  return {
    track: track.value,
    team: isStaff.value ? form.team : form.memberUnit,
    name: t(form.name),
    birth: form.birth,
    phone: form.phone,
    university: form.university === '기타' ? t(form.universityOther) : form.university,
    university_other: form.university === '기타',
    campus: t(form.campus),
    department: t(form.department),
    email: t(form.email),
    ...(isStaff.value ? {
      gender: form.gender,
      occupation: form.occupation === '기타' ? t(form.occupationOther) : form.occupation,
      interests: form.interests,
      hopes: t(form.hopes),
    } : {}),
    consent: { collect: agree.collect, version: CONSENT_VERSION },
    website: form.website,
    elapsed_ms: Date.now() - startedAt.value,
  }
}

async function submit() {
  if (busy.value) return
  clearErrors()
  submitError.value = ''
  validateInfo()
  validateApplication()
  validateConsent()
  if (Object.keys(errors).length) {
    if (errors.consent && Object.keys(errors).length === 1) { void focusFirstError(); return }
    step.value = 'info'
    void focusFirstError()
    return
  }
  if (!apiReady.value) { submitError.value = '가입 신청 접수 준비 중입니다. 잠시 후 다시 시도해 주세요.'; return }
  busy.value = true
  try {
    const res = await fetch(JOIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'join', payload: payload() }),
    })
    const data = await res.json()
    if (data && data.ok) { step.value = 'done'; scrollTop(); return }
    submitError.value = data && data.error === 'validation_failed'
      ? '입력 내용을 다시 확인해 주세요. 계속 안 되면 wyea@wyea.info로 문의해 주세요.'
      : data && data.error === 'duplicate'
        ? '같은 휴대전화 번호로 이미 신청이 접수되어 있습니다. 집행부 연락을 기다려 주세요.'
        : unconfirmedSubmission
  } catch {
    submitError.value = unconfirmedSubmission
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <article class="join-page">
    <header v-if="step !== 'done'" class="join-heading">
      <p class="eyebrow">JOIN WYEA</p>
      <h1>{{ isStaff ? '집행부 지원' : '회원 가입 신청' }}</h1>
      <p class="lead">국경을 넘어, 청년과 청년을 연결합니다.</p>
      <p class="hint"><RouterLink to="/about">WYEA 알아보기</RouterLink></p>
    </header>

    <!-- 진행 표시 -->
    <nav v-if="progressIndex >= 0" class="progress" aria-label="신청 단계">
      <ol>
        <li v-for="(s, i) in formSteps" :key="s" :class="{ active: i === progressIndex, done: i < progressIndex }" :aria-current="i === progressIndex ? 'step' : false">
          <span class="num">{{ i + 1 }}</span>{{ stepTitles[s] }}
        </li>
      </ol>
    </nav>

    <!-- 기본 정보 -->
    <section v-if="step === 'info'" class="join-card form-card" aria-labelledby="info-heading">
      <h2 id="info-heading">정보 입력</h2>
      <button v-if="!isStaff" type="button" class="btn primary staff-apply" @click="setTrack('staff')">집행부 지원하기</button>
      <p class="hint">{{ isStaff ? '집행부 지원에 필요한 정보입니다. 이메일, 관심 활동, 활동에서 얻어가고 싶은 것은 선택 사항입니다.' : '이름, 생년월일, 휴대전화, 학교, 캠퍼스, 학과와 지원할 단은 필수입니다. 이메일은 선택 사항입니다.' }}</p>

      <div class="field">
        <label for="name">이름</label>
        <input id="name" v-model="form.name" type="text" autocomplete="name" :maxlength="limits.name" :aria-invalid="!!errors.name">
        <p v-if="errors.name" class="error">{{ errors.name }}</p>
      </div>
      <div :class="{ 'field-row': isStaff }">
        <div class="field">
          <label for="birth">생년월일</label>
          <input id="birth" v-model="form.birth" type="text" inputmode="numeric" maxlength="10" placeholder="YYYY-MM-DD" autocomplete="bday" :aria-invalid="!!errors.birth" @input="formatBirthDate">
          <p v-if="errors.birth" class="error">{{ errors.birth }}</p>
        </div>
        <fieldset v-if="isStaff" class="field">
          <legend>성별</legend>
          <div class="choices inline" :aria-invalid="!!errors.gender" tabindex="-1">
            <label v-for="g in ['남', '여']" :key="g" class="choice"><input v-model="form.gender" type="radio" name="gender" :value="g">{{ g }}</label>
          </div>
          <p v-if="errors.gender" class="error">{{ errors.gender }}</p>
        </fieldset>
      </div>
      <div class="field">
        <label for="phone">휴대전화</label>
        <input id="phone" v-model="form.phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" :aria-invalid="!!errors.phone" @input="formatPhone">
        <p v-if="errors.phone" class="error">{{ errors.phone }}</p>
      </div>
      <div class="field">
        <label for="email">이메일 <span class="note">(선택)</span></label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" :maxlength="limits.email" :aria-invalid="!!errors.email">
        <p class="help">연락처를 남기시면 가입 결과와 공지를 안내해 드립니다.</p>
        <p v-if="errors.email" class="error">{{ errors.email }}</p>
      </div>

      <h3 v-if="isStaff" class="sub">소속</h3>
      <fieldset v-if="isStaff" class="field">
        <legend>직업</legend>
        <div class="choices" :aria-invalid="!!errors.occupation" tabindex="-1">
          <label v-for="o in occupations" :key="o" class="choice"><input v-model="form.occupation" type="radio" name="occupation" :value="o">{{ o }}</label>
          <label class="choice"><input v-model="form.occupation" type="radio" name="occupation" value="기타">기타</label>
        </div>
        <input v-if="form.occupation === '기타'" v-model="form.occupationOther" class="other" type="text" placeholder="직업을 적어 주세요" :maxlength="limits.other" :aria-invalid="!!errors.occupationOther" aria-label="기타 직업">
        <p v-if="errors.occupation || errors.occupationOther" class="error">{{ errors.occupation || errors.occupationOther }}</p>
      </fieldset>
      <fieldset v-if="!isStaff" class="field">
        <legend>지원할 단 <span class="note">(1개 선택, 나중에 변경 가능)</span></legend>
        <div class="team-grid" :aria-invalid="!!errors.memberUnit" tabindex="-1">
          <label v-for="unit in memberUnits" :key="unit.name" class="team-option" :class="{ picked: form.memberUnit === unit.name }">
            <input v-model="form.memberUnit" type="radio" name="member-unit" :value="unit.name" @change="delete errors.memberUnit">
            <span><strong>{{ unit.name }}</strong><small>{{ unit.desc }}</small></span>
          </label>
        </div>
        <p v-if="errors.memberUnit" class="error">{{ errors.memberUnit }}</p>
      </fieldset>
      <div class="field">
        <label for="university">대학교 <span class="note">(필수)</span></label>
        <select id="university" v-model="form.university" :aria-invalid="!!errors.university">
          <option value="" disabled>선택해 주세요</option>
          <option v-for="u in universities" :key="u" :value="u">{{ u }}</option>
          <option value="기타">기타 (직접 입력)</option>
        </select>
        <input v-if="form.university === '기타'" v-model="form.universityOther" class="other" type="text" placeholder="학교 공식 명칭" :maxlength="limits.other" :aria-invalid="!!errors.universityOther" aria-label="기타 대학교">
        <p v-if="errors.university || errors.universityOther" class="error">{{ errors.university || errors.universityOther }}</p>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="campus">캠퍼스</label>
          <input id="campus" v-model="form.campus" type="text" :maxlength="limits.campus" placeholder="예: 가좌캠퍼스 (하나뿐이면 본캠퍼스)" :aria-invalid="!!errors.campus">
          <p v-if="errors.campus" class="error">{{ errors.campus }}</p>
        </div>
        <div class="field">
          <label for="department">학과</label>
          <input id="department" v-model="form.department" type="text" :maxlength="limits.department" placeholder="예: 기계공학부" :aria-invalid="!!errors.department">
          <p v-if="errors.department" class="error">{{ errors.department }}</p>
        </div>
      </div>
      <div class="hp" aria-hidden="true">
        <label for="website">웹사이트</label>
        <input id="website" v-model="form.website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <template v-if="isStaff">
        <p class="track-switch">단순 참여를 원하시나요? <button type="button" class="more inline" @click="setTrack('member')">일반 회원으로 지원하기</button></p>

        <fieldset class="field">
          <legend>관심 있는 활동 <span class="note">(참고용, 필수 아님, 복수 선택 가능)</span></legend>
          <div class="choices chips" :aria-invalid="!!errors.interests" tabindex="-1">
            <button v-for="i in interestOptions" :key="i" type="button" class="chip" :class="{ on: form.interests.includes(i) }" :aria-pressed="form.interests.includes(i)" @click="toggleInterest(i)">{{ i }}</button>
          </div>
          <p v-if="errors.interests" class="error">{{ errors.interests }}</p>
        </fieldset>

        <fieldset class="field">
          <legend>희망 부서 <span class="note">(필수)</span></legend>
          <p v-if="!form.team && recommended.length" class="recommend" role="status">
            고른 관심 활동을 보면 <strong>{{ recommended.join(' 또는 ') }}</strong>가 맞을 수 있어요. 참고만 하고 원하는 부서를 고르세요.
          </p>
          <div class="team-grid" :aria-invalid="!!errors.team" tabindex="-1">
            <label v-for="d in departments" :key="d.name" class="team-option" :class="{ picked: form.team === d.name }">
              <input v-model="form.team" type="radio" name="team" :value="d.name" @change="clearTeamError">
              <span><strong>{{ d.name }}</strong><small>{{ d.desc }}</small></span>
            </label>
          </div>
          <p v-if="errors.team" class="error">{{ errors.team }}</p>
        </fieldset>
        <div class="field">
          <label for="hopes">활동에서 얻어가고 싶은 것 <span class="note">(선택)</span></label>
          <textarea id="hopes" v-model="form.hopes" rows="5" :maxlength="limits.hopes" placeholder="활동을 통해 배우거나 경험하고 싶은 것을 적어 주세요." :aria-invalid="!!errors.hopes" />
          <p class="count">{{ form.hopes.length }}/{{ limits.hopes }} 자</p>
          <p v-if="errors.hopes" class="error">{{ errors.hopes }}</p>
        </div>
      </template>

      <div class="actions">
        <button v-if="progressIndex > 0" type="button" class="btn ghost" @click="back">이전</button>
        <button type="button" class="btn primary" @click="next">다음</button>
      </div>
    </section>

    <!-- 동의 -->
    <section v-if="step === 'consent'" class="join-card form-card" aria-labelledby="consent-heading">
      <h2 id="consent-heading">동의</h2>
      <ul class="consent-list" :aria-invalid="!!errors.consent" tabindex="-1">
        <li v-for="c in consents" :key="c.key">
          <div class="consent-row">
            <label class="consent-check">
              <input v-model="agree[c.key]" type="checkbox" @change="clearConsentError">
              <span><strong>[필수]</strong> {{ c.title }}에 동의합니다</span>
            </label>
            <button type="button" class="more" :aria-expanded="openConsent === c.key" :aria-controls="`consent-${c.key}`" @click="openConsent = openConsent === c.key ? null : c.key">
              {{ openConsent === c.key ? '접기' : '자세히 보기' }}
            </button>
          </div>
          <p class="consent-summary">{{ c.summary }}</p>
          <ul v-show="openConsent === c.key" :id="`consent-${c.key}`" class="consent-details">
            <li v-for="d in c.details" :key="d">{{ d }}</li>
          </ul>
        </li>
      </ul>
      <p class="notice">{{ consentNotice }}</p>
      <p class="notice">개인정보 처리 전반은 <RouterLink to="/personalinformationprocessingpolicy">개인정보 처리방침</RouterLink>에서 확인할 수 있습니다.</p>
      <p v-if="errors.consent" class="error">{{ errors.consent }}</p>
      <p v-if="submitError" class="error submit-error" role="alert">{{ submitError }}</p>

      <div class="actions">
        <button type="button" class="btn ghost" :disabled="busy" @click="back">이전</button>
        <button type="button" class="btn primary" :disabled="busy" @click="submit">{{ busy ? '접수 중…' : '가입 신청하기' }}</button>
      </div>
    </section>

    <!-- 완료 -->
    <section v-if="step === 'done'" class="join-card done-card" aria-labelledby="done-heading">
      <p class="eyebrow">THANK YOU</p>
      <h2 id="done-heading">{{ isStaff ? '집행부 지원이 접수되었습니다' : '가입 신청이 접수되었습니다' }}</h2>
      <p>집행부가 신청 내용을 검토한 뒤, 입력하신 연락처로 결과를 안내해 드립니다.</p>
      <p>그동안 <RouterLink to="/activities">활동소식</RouterLink>에서 WYEA가 해 온 일을 둘러보세요.</p>
      <div class="actions center">
        <RouterLink class="btn ghost" to="/">홈으로</RouterLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.join-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 140px 32px 64px;
  font-family: 'PretendardFont', sans-serif;
  color: #344052;
}
.join-heading { text-align: center; margin-bottom: 44px; }
.eyebrow { color: #0d47a1; letter-spacing: .18em; font-size: 13px; font-weight: 700; margin: 0 0 14px; }
h1 { font-size: clamp(28px, 3vw, 42px); line-height: 1.35; font-weight: 700; margin: 0 0 16px; word-break: keep-all; }
.lead { font-size: clamp(16px, 1.3vw, 19px); line-height: 1.8; margin: 0; word-break: keep-all; }
.join-card { background: #fff; border: 1px solid #dce7f5; border-radius: 16px; padding: 32px 36px; margin-bottom: 20px; box-shadow: 0 5px 20px rgba(35, 53, 70, .04); }
h2 { font-size: clamp(20px, 1.6vw, 25px); line-height: 1.5; font-weight: 700; margin: 0 0 18px; word-break: keep-all; }
h3 { color: #0d47a1; font-size: 17px; font-weight: 700; margin: 0 0 8px; }
p { word-break: keep-all; overflow-wrap: anywhere; }
.progress ol { list-style: none; display: flex; gap: 8px; padding: 0; margin: 0 0 20px; }
.progress li { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #8a97a8; border-bottom: 3px solid #dce7f5; padding-bottom: 10px; }
.progress li.active { color: #0d47a1; font-weight: 700; border-color: #0d47a1; }
.progress li.done { color: #344052; border-color: #9cbde6; }
.progress .num { width: 22px; height: 22px; border-radius: 50%; background: currentColor; color: #fff; display: inline-grid; place-items: center; font-size: 12px; }
.progress li .num { color: #fff; background: #8a97a8; }
.progress li.active .num { background: #0d47a1; }
.progress li.done .num { background: #9cbde6; }
.hint { font-size: 15px; color: #526b8a; margin: -6px 0 24px; line-height: 1.7; }
.staff-apply { margin: 0 0 24px; }
.sub { margin: 32px 0 14px; padding-top: 22px; border-top: 1px solid #e5edf8; }
.field { margin: 0 0 20px; border: 0; padding: 0; min-width: 0; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
label, legend { display: block; font-size: 15px; font-weight: 600; margin-bottom: 8px; padding: 0; }
.note { font-weight: 400; color: #697586; font-size: 13px; }
input[type="text"], input[type="tel"], input[type="email"], input[type="date"], select, textarea {
  width: 100%; box-sizing: border-box; font: inherit; font-size: 16px; color: inherit;
  border: 1px solid #c9d7ea; border-radius: 10px; padding: 12px 14px; background: #fff;
}
textarea { resize: vertical; line-height: 1.7; }
input:focus, select:focus, textarea:focus, .chip:focus-visible, .btn:focus-visible, .more:focus-visible { outline: 2px solid #0d47a1; outline-offset: 2px; border-color: #0d47a1; }
[aria-invalid="true"] { border-color: #c62828 !important; }
.other { margin-top: 10px; }
.help, .count { font-size: 13px; color: #697586; margin: 6px 0 0; line-height: 1.6; }
.count { text-align: right; }
.error { color: #c62828; font-size: 13px; margin: 6px 0 0; }
.submit-error { font-size: 14px; margin-top: 14px; }
.choices { display: flex; flex-wrap: wrap; gap: 8px 18px; border-radius: 10px; }
.choices[aria-invalid="true"] { outline: 1px solid #c62828; outline-offset: 4px; }
.choice { display: inline-flex; align-items: center; gap: 6px; font-weight: 400; margin: 0; cursor: pointer; }
.choice input { width: 18px; height: 18px; accent-color: #0d47a1; }
.chips { gap: 8px; }
.chip { font: inherit; font-size: 14px; border: 1px solid #c9d7ea; background: #fff; color: #344052; border-radius: 999px; padding: 8px 14px; cursor: pointer; }
.chip.on { background: #0d47a1; border-color: #0d47a1; color: #fff; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.consent-check input { width: 20px; height: 20px; accent-color: #0d47a1; flex: none; }
.consent-list { list-style: none; padding: 0; margin: 0 0 16px; }
.consent-list > li { border-bottom: 1px solid #e5edf8; padding: 14px 4px; }
.consent-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.consent-check { display: flex; align-items: center; gap: 10px; font-weight: 500; margin: 0; cursor: pointer; }
.more { font: inherit; font-size: 13px; color: #0d47a1; background: none; border: 0; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; white-space: nowrap; padding: 4px; }
.consent-summary { font-size: 13px; color: #697586; margin: 6px 0 0 30px; line-height: 1.6; }
.consent-details { margin: 10px 0 0 30px; padding: 12px 16px 12px 28px; background: #f7f9fc; border-radius: 10px; font-size: 13px; line-height: 1.8; color: #445066; }
.notice { font-size: 13px; color: #697586; line-height: 1.7; margin: 8px 0 0; }
.actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 28px; }
.actions.center { justify-content: center; }
.btn { font: inherit; font-size: 16px; font-weight: 700; border-radius: 12px; padding: 14px 28px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
.btn.primary { background: #0d47a1; color: #fff; border: 1px solid #0d47a1; }
.btn.primary:hover { background: #0b3c88; }
.btn.ghost { background: #fff; color: #0d47a1; border: 1px solid #c9d7ea; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.more.inline { padding: 0; font-size: inherit; }
.track-switch { font-size: 14px; color: #526b8a; margin: -12px 0 24px; }
.team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-radius: 12px; }
.team-grid[aria-invalid="true"] { outline: 1px solid #c62828; outline-offset: 4px; }
.team-option { display: flex; gap: 10px; align-items: flex-start; border: 1px solid #dce7f5; border-radius: 12px; padding: 14px; margin: 0; cursor: pointer; font-weight: 400; background: #fff; }
.team-option.picked { border-color: #0d47a1; background: #f5f9ff; }
.team-option input { width: 18px; height: 18px; margin-top: 2px; accent-color: #0d47a1; flex: none; }
.team-option strong { display: block; font-size: 15px; color: #0d47a1; margin-bottom: 2px; }
.team-option small { display: block; font-size: 13px; line-height: 1.6; color: #526b8a; }
.recommend { font-size: 14px; line-height: 1.7; margin: -4px 0 12px; padding: 10px 14px; background: #fff8e1; border: 1px solid #f5d77a; border-radius: 10px; color: #5c4a00; }
.recommend strong { color: #0d47a1; }
.done-card { text-align: center; padding: 48px 32px; }
.done-card p { font-size: 16px; line-height: 1.8; }
a { color: #0d47a1; text-underline-offset: 4px; }
@media (max-width: 600px) {
  .join-page { padding: 104px 16px 40px; }
  .join-card { padding: 24px 20px; }
  .field-row { grid-template-columns: 1fr; gap: 0; }
  .actions .btn { flex: 1; padding: 14px 16px; }
  .consent-row { align-items: flex-start; }
  .team-grid { grid-template-columns: 1fr; }
}
</style>
