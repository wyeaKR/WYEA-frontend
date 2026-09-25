<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { activities, activityCategories } from '@/content/activities'
import {
  JOIN_API_URL,
  CONSENT_VERSION,
  universities,
  occupations,
  interestOptions,
  referralOptions,
  limits,
  MIN_MOTIVATION,
  MIN_AGE,
  MIN_DETAIL,
  memberUnits,
  departments,
  recommendDepartments,
  consents,
  consentNotice,
  about,
  quiz,
  type ConsentKey,
  type Track,
} from '@/content/join'

type Step = 'intro' | 'know' | 'about' | 'quiz' | 'application' | 'info' | 'consent' | 'done'
const formSteps: Step[] = ['application', 'info', 'consent']
const route = useRoute()
const router = useRouter()
// 일반 회원(member)과 집행부(staff) 지원은 같은 페이지에서 ?track=staff 로 나뉩니다.
// 같은 라우트라 페이지를 새로 만들지 않고, 퀴즈 통과·입력한 내용이 그대로 유지됩니다.
const track = computed<Track>(() => (route.query.track === 'staff' ? 'staff' : 'member'))
const isStaff = computed(() => track.value === 'staff')
const stepTitles = computed<Record<string, string>>(() => ({
  application: isStaff.value ? '집행부 지원서' : '지원서',
  info: '정보 입력',
  consent: '동의',
}))
// 각 단계에서 "이전"을 누르면 돌아갈 곳입니다.
const prevStep: Partial<Record<Step, Step>> = {
  know: 'intro',
  about: 'know',
  quiz: 'know',
  application: 'quiz',
  info: 'application',
  consent: 'info',
}

const step = ref<Step>('intro')
const quizAnswers = ref<(number | null)[]>(quiz.map(() => null))
const quizChecked = ref(false)
const quizError = ref('')
const busy = ref(false)
const submitError = ref('')
const startedAt = ref(0)
const openConsent = ref<ConsentKey | null>(null)

const form = reactive({
  name: '',
  birth: '',
  gender: '',
  phone: '',
  address: '',
  occupation: '',
  occupationOther: '',
  university: '',
  universityOther: '',
  campus: '',
  department: '',
  studentId: '',
  email: '',
  interests: [] as string[],
  motivation: '',
  hopes: '',
  referral: '',
  referralOther: '',
  team: '',
  teamSecond: '',
  languages: '',
  clubTopic: '',
  competencies: '',
  experience: '',
  capabilities: '',
  website: '', // 사람에게는 보이지 않는 스팸 방지 칸입니다.
})
const agree = reactive<Record<ConsentKey, boolean>>({ collect: false, thirdParty: false, portrait: false })
const errors = reactive<Record<string, string>>({})

const sortedActivities = computed(() =>
  [...activities].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
)
const allAgreed = computed(() => agree.collect && agree.thirdParty && agree.portrait)
const apiReady = computed(() => JOIN_API_URL.length > 0)
const progressIndex = computed(() => formSteps.indexOf(step.value))

onMounted(() => {
  startedAt.value = Date.now()
})

function formatPhone() {
  const digits = form.phone.replace(/\D/g, '').slice(0, 11)
  form.phone = digits.length > 7
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits
}

function age(birth: string) {
  const [y, m, d] = birth.split('-').map(Number)
  if (!y || !m || !d) return NaN
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
  if (required('birth')) {
    const years = age(form.birth)
    if (Number.isNaN(years) || years > 100) errors.birth = '생년월일을 확인해 주세요.'
    else if (years < MIN_AGE) errors.birth = `만 ${MIN_AGE}세 이상만 신청할 수 있습니다.`
  }
  if (!form.gender) errors.gender = '성별을 선택해 주세요.'
  if (required('phone') && !/^010-\d{4}-\d{4}$/.test(form.phone)) errors.phone = '010-0000-0000 형식으로 입력해 주세요.'
  required('address')
  maxLen('address', limits.address)
  if (!form.occupation) errors.occupation = '직업을 선택해 주세요.'
  if (form.occupation === '기타') { required('occupationOther'); maxLen('occupationOther', limits.other) }
  if (!form.university) errors.university = '대학교를 선택해 주세요.'
  if (form.university === '기타') { required('universityOther', '학교 공식 명칭을 입력해 주세요.'); maxLen('universityOther', limits.other) }
  required('campus')
  maxLen('campus', limits.campus)
  required('department')
  maxLen('department', limits.department)
  if (required('studentId') && !/^\d{1,20}$/.test(form.studentId.trim())) errors.studentId = '숫자만 입력해 주세요.'
  if (required('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = '이메일 형식을 확인해 주세요.'
  maxLen('email', limits.email)
}

function validateApplication() {
  if (!form.interests.length) errors.interests = '관심 활동을 1개 이상 선택해 주세요.'
  if (isStaff.value) {
    if (!form.team) errors.team = '희망 부서 1지망을 골라 주세요.'
    if (form.teamSecond && form.teamSecond === form.team) errors.teamSecond = '2지망은 1지망과 다른 부서를 골라 주세요.'
  } else {
    if (!form.team) errors.team = '소속 단을 1개 골라 주세요.'
    if (form.team === '통번역단') { required('languages', '가능한 언어를 적어 주세요.'); maxLen('languages', limits.languages) }
    if (form.team === '소모임') { required('clubTopic', '관심 주제를 적어 주세요.'); maxLen('clubTopic', limits.clubTopic) }
  }
  const motivation = required('motivation', '지원 동기를 적어 주세요.')
  if (motivation && motivation.length < MIN_MOTIVATION) errors.motivation = `${MIN_MOTIVATION}자 이상 적어 주세요.`
  maxLen('motivation', limits.motivation)
  maxLen('hopes', limits.hopes)
  if (form.referral === '기타') maxLen('referralOther', limits.other)
  if (isStaff.value) {
    const competencies = required('competencies', '자신의 역량을 적어 주세요.')
    if (competencies && competencies.length < MIN_DETAIL) errors.competencies = `${MIN_DETAIL}자 이상 적어 주세요.`
    maxLen('competencies', limits.competencies)
    maxLen('experience', limits.experience)
    const capabilities = required('capabilities', 'WYEA에서 할 수 있는 일을 적어 주세요.')
    if (capabilities && capabilities.length < MIN_DETAIL) errors.capabilities = `${MIN_DETAIL}자 이상 적어 주세요.`
    maxLen('capabilities', limits.capabilities)
  }
}

// 트랙을 바꾸면 활동 분야 선택은 초기화합니다. 단과 부서는 다른 목록이라 그대로 가져갈 수 없습니다.
function setTrack(next: Track) {
  clearErrors()
  form.team = ''
  form.teamSecond = ''
  form.languages = ''
  form.clubTopic = ''
  void router.push({ query: next === 'staff' ? { track: 'staff' } : {} })
  scrollTop()
}

function validateConsent() {
  if (!allAgreed.value) errors.consent = '3개 항목에 모두 동의해야 가입을 신청할 수 있습니다.'
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
  delete errors.teamSecond
}

const recommended = computed(() => recommendDepartments(form.interests))
const unitExtra = computed(() => memberUnits.find((u) => u.name === form.team)?.extra ?? null)

function clearConsentError() {
  delete errors.consent
}

function setAll(value: boolean) {
  agree.collect = value
  agree.thirdParty = value
  agree.portrait = value
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
  if (step.value === 'application') validateApplication()
  if (step.value === 'info') validateInfo()
  if (Object.keys(errors).length) { void focusFirstError(); return }
  const order: Step[] = ['application', 'info', 'consent']
  go(order[order.indexOf(step.value) + 1] ?? 'consent')
}

function back() {
  go(prevStep[step.value] ?? 'intro')
}

const quizWrong = computed(() => quiz.map((q, i) => quizAnswers.value[i] !== q.answer))
const quizPassed = computed(() => quizChecked.value && quizWrong.value.every((wrong) => !wrong))

function pickAnswer(index: number, option: number) {
  quizAnswers.value[index] = option
  quizChecked.value = false
  quizError.value = ''
}

function checkQuiz() {
  if (quizAnswers.value.some((a) => a === null)) {
    quizError.value = '모든 문제에 답을 골라 주세요.'
    return
  }
  quizError.value = ''
  quizChecked.value = true
}

function retryQuiz() {
  quizAnswers.value = quizAnswers.value.map((a, i) => (quizWrong.value[i] ? null : a))
  quizChecked.value = false
}

function startQuiz() {
  if (!quizPassed.value) {
    quizAnswers.value = quiz.map(() => null)
    quizChecked.value = false
  }
  go('quiz')
}

function payload() {
  const t = (s: string) => s.trim()
  return {
    track: track.value,
    team: form.team,
    team_second: isStaff.value ? form.teamSecond : '',
    languages: !isStaff.value && form.team === '통번역단' ? t(form.languages) : '',
    club_topic: !isStaff.value && form.team === '소모임' ? t(form.clubTopic) : '',
    recommended_dept: recommended.value.join(', '),
    name: t(form.name),
    birth: form.birth,
    gender: form.gender,
    phone: form.phone,
    address: t(form.address),
    occupation: form.occupation === '기타' ? t(form.occupationOther) : form.occupation,
    university: form.university === '기타' ? t(form.universityOther) : form.university,
    university_other: form.university === '기타',
    campus: t(form.campus),
    department: t(form.department),
    student_id: t(form.studentId),
    email: t(form.email),
    interests: form.interests,
    motivation: t(form.motivation),
    hopes: t(form.hopes),
    referral: form.referral === '기타' ? t(form.referralOther) : form.referral,
    competencies: isStaff.value ? t(form.competencies) : '',
    experience: isStaff.value ? t(form.experience) : '',
    capabilities: isStaff.value ? t(form.capabilities) : '',
    consent: { collect: agree.collect, third_party: agree.thirdParty, portrait: agree.portrait, version: CONSENT_VERSION },
    website: form.website,
    elapsed_ms: Date.now() - startedAt.value,
  }
}

async function submit() {
  clearErrors()
  submitError.value = ''
  validateInfo()
  validateApplication()
  validateConsent()
  if (Object.keys(errors).length) {
    if (errors.consent && Object.keys(errors).length === 1) { void focusFirstError(); return }
    submitError.value = '입력하지 않았거나 형식이 맞지 않는 항목이 있습니다. 이전 단계를 확인해 주세요.'
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
        : '접수 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'
  } catch {
    submitError.value = '네트워크 문제로 접수하지 못했습니다. 작성한 내용은 그대로 있으니 다시 시도해 주세요.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <article class="join-page">
    <!-- 1. 소개 -->
    <template v-if="step === 'intro'">
      <header class="join-heading">
        <p class="eyebrow">{{ isStaff ? 'JOIN WYEA · 집행부 지원' : 'JOIN WYEA' }}</p>
        <h1>국경을 넘어, 청년과 청년을 연결합니다</h1>
        <p class="lead">세계청년교류연합(WYEA)은 서로 다른 언어와 문화를 가진 청년들이 직접 만나 경험을 나누는 비영리단체입니다.</p>
      </header>

      <section class="join-card" aria-labelledby="process-heading">
        <span class="section-label">가입 절차</span>
        <h2 id="process-heading">신청부터 합류까지</h2>
        <ol class="process">
          <li><strong>WYEA 알아보기</strong><span>WYEA가 어떤 단체인지 확인하는 간단한 퀴즈 3문제를 풉니다. 처음이라면 소개를 먼저 읽을 수 있습니다.</span></li>
          <li><strong>신청서 작성</strong><span>지원서, 기본 정보, 동의 순서로 작성합니다. 약 5분 걸립니다.</span></li>
          <li><strong>집행부 검토</strong><span>신청 내용을 확인합니다.</span></li>
          <li><strong>합류 안내</strong><span>승인되면 이메일과 문자로 안내해 드립니다.</span></li>
        </ol>
      </section>

      <div class="actions center">
        <button type="button" class="btn primary" @click="go('know')">가입 신청하기</button>
      </div>
    </template>

    <!-- 2. 알고 있는지 묻기 -->
    <section v-if="step === 'know'" class="join-card know-card" aria-labelledby="know-heading">
      <p class="eyebrow">STEP 1</p>
      <h2 id="know-heading">세계청년교류연합이 어떤 일을 하는 단체인지 알고 계신가요?</h2>
      <p class="hint center-text">알고 있다면 간단한 퀴즈 3문제로 확인하고, 처음이라면 WYEA 소개를 먼저 보여 드립니다.</p>
      <div class="know-choices">
        <button type="button" class="know-choice" @click="startQuiz">
          <strong>알고 있어요</strong>
          <span>퀴즈 3문제 풀고 신청하기</span>
        </button>
        <button type="button" class="know-choice" @click="go('about')">
          <strong>알려 주세요</strong>
          <span>WYEA 소개 먼저 보기</span>
        </button>
      </div>
      <div class="actions">
        <button type="button" class="btn ghost" @click="back">이전</button>
      </div>
    </section>

    <!-- 3. WYEA 소개 -->
    <template v-if="step === 'about'">
      <header class="join-heading">
        <p class="eyebrow">ABOUT WYEA</p>
        <h1>{{ about.vision.title }}</h1>
        <p class="lead">{{ about.vision.body }}</p>
      </header>

      <section class="join-card" aria-labelledby="values-heading">
        <span class="section-label">가치관</span>
        <h2 id="values-heading">WYEA가 일하는 방식</h2>
        <div class="program-grid">
          <div v-for="v in about.values" :key="v.title" class="program value">
            <h3>{{ v.title }}</h3>
            <p v-if="v.body">{{ v.body }}</p>
          </div>
        </div>
      </section>

      <section class="join-card" aria-labelledby="what-heading">
        <span class="section-label">하는 일</span>
        <h2 id="what-heading">직접 만나고, 함께 돕습니다</h2>
        <div class="program-grid">
          <div class="program">
            <h3>국제 청년 교류</h3>
            <p>해외 청년들과 교류회·피크닉·음악교류회를 열어 서로의 문화와 일상을 나눕니다. 지금까지 재일본대한민국청년회와 교류를 이어 왔고, 더 많은 나라의 청년들로 넓혀 갈 계획입니다.</p>
          </div>
          <div class="program">
            <h3>지역사회 봉사·협력</h3>
            <p>지역 기관과 협력해 현장에서 필요한 일을 함께 돕습니다.</p>
          </div>
        </div>
      </section>

      <section class="join-card" aria-labelledby="record-heading">
        <span class="section-label">해 온 일</span>
        <h2 id="record-heading">지금까지의 활동</h2>
        <ul class="activity-list">
          <li v-for="activity in sortedActivities" :key="activity.path">
            <RouterLink :to="activity.path">
              <span class="badge">{{ activityCategories[activity.category] }}</span>
              <span class="activity-title">{{ activity.title }}</span>
              <span class="activity-date">{{ activity.date }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="join-card" aria-labelledby="future-heading">
        <span class="section-label">해 갈 일</span>
        <h2 id="future-heading">앞으로의 계획</h2>
        <ul class="future-list">
          <li v-for="f in about.future" :key="f.what">
            <span class="future-when">{{ f.when }}</span>
            <span class="future-what">{{ f.what }}</span>
          </li>
        </ul>
      </section>

      <div class="actions">
        <button type="button" class="btn ghost" @click="back">이전</button>
        <button type="button" class="btn primary" @click="startQuiz">퀴즈 풀고 신청하기</button>
      </div>
    </template>

    <!-- 4. 확인 퀴즈 -->
    <section v-if="step === 'quiz'" class="join-card form-card" aria-labelledby="quiz-heading">
      <p class="eyebrow">QUIZ</p>
      <h2 id="quiz-heading">WYEA, 얼마나 알고 계신가요?</h2>
      <p class="hint">3문제를 모두 맞히면 신청서를 작성할 수 있습니다.</p>

      <fieldset v-for="(q, i) in quiz" :key="q.question" class="field quiz-item" :class="{ right: quizChecked && !quizWrong[i], wrong: quizChecked && quizWrong[i] }">
        <legend><span class="q-num">Q{{ i + 1 }}.</span> {{ q.question }}</legend>
        <div class="quiz-options">
          <label v-for="(o, j) in q.options" :key="o" class="choice quiz-option" :class="{ picked: quizAnswers[i] === j }">
            <input type="radio" :name="`quiz-${i}`" :checked="quizAnswers[i] === j" :disabled="quizPassed" @change="pickAnswer(i, j)">{{ o }}
          </label>
        </div>
        <p v-if="quizChecked" class="quiz-feedback" role="status">
          <strong>{{ quizWrong[i] ? '다시 생각해 보세요.' : '정답입니다.' }}</strong>
          <template v-if="!quizWrong[i]"> {{ q.explain }}</template>
        </p>
      </fieldset>
      <p v-if="quizError" class="error" role="alert">{{ quizError }}</p>

      <div v-if="quizPassed" class="quiz-pass" role="status">
        <strong>모두 맞혔습니다!</strong> 이제 신청서를 작성해 주세요.
      </div>
      <p v-else-if="quizChecked" class="notice">
        틀린 문제만 다시 풀 수 있습니다. 헷갈린다면 <button type="button" class="more inline" @click="go('about')">WYEA 소개</button>를 먼저 읽어 보세요.
      </p>

      <div class="actions">
        <button type="button" class="btn ghost" @click="back">이전</button>
        <button v-if="quizPassed" type="button" class="btn primary" @click="go('application')">신청서 작성하기</button>
        <button v-else-if="quizChecked" type="button" class="btn primary" @click="retryQuiz">다시 풀기</button>
        <button v-else type="button" class="btn primary" @click="checkQuiz">정답 확인</button>
      </div>
    </section>

    <!-- 진행 표시 -->
    <nav v-if="progressIndex >= 0" class="progress" aria-label="신청 단계">
      <ol>
        <li v-for="(s, i) in formSteps" :key="s" :class="{ active: i === progressIndex, done: i < progressIndex }" :aria-current="i === progressIndex ? 'step' : false">
          <span class="num">{{ i + 1 }}</span>{{ stepTitles[s] }}
        </li>
      </ol>
    </nav>

    <!-- 6. 정보 입력 -->
    <section v-if="step === 'info'" class="join-card form-card" aria-labelledby="info-heading">
      <h2 id="info-heading">정보 입력</h2>
      <p class="hint">회원 관리와 단체 등록 서류 작성에 필요한 정보입니다. 모든 항목이 필수입니다.</p>

      <div class="field">
        <label for="name">성명</label>
        <input id="name" v-model="form.name" type="text" autocomplete="name" :maxlength="limits.name" :aria-invalid="!!errors.name">
        <p v-if="errors.name" class="error">{{ errors.name }}</p>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="birth">생년월일</label>
          <input id="birth" v-model="form.birth" type="date" autocomplete="bday" :aria-invalid="!!errors.birth">
          <p v-if="errors.birth" class="error">{{ errors.birth }}</p>
        </div>
        <fieldset class="field">
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
        <label for="address">주소</label>
        <input id="address" v-model="form.address" type="text" :maxlength="limits.address" :aria-invalid="!!errors.address">
        <p class="help">도로명주소와 건물번호까지만 입력해 주세요. 동·호수는 적지 않습니다. (예: 경상남도 창원시 성산구 대정로 99)</p>
        <p v-if="errors.address" class="error">{{ errors.address }}</p>
      </div>
      <div class="field">
        <label for="email">이메일</label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" :maxlength="limits.email" :aria-invalid="!!errors.email">
        <p class="help">가입 결과와 공지를 보내 드립니다. 대학교에서 발급한 이메일을 권장합니다.</p>
        <p v-if="errors.email" class="error">{{ errors.email }}</p>
      </div>

      <h3 class="sub">소속</h3>
      <fieldset class="field">
        <legend>직업</legend>
        <div class="choices" :aria-invalid="!!errors.occupation" tabindex="-1">
          <label v-for="o in occupations" :key="o" class="choice"><input v-model="form.occupation" type="radio" name="occupation" :value="o">{{ o }}</label>
          <label class="choice"><input v-model="form.occupation" type="radio" name="occupation" value="기타">기타</label>
        </div>
        <input v-if="form.occupation === '기타'" v-model="form.occupationOther" class="other" type="text" placeholder="직업을 적어 주세요" :maxlength="limits.other" :aria-invalid="!!errors.occupationOther" aria-label="기타 직업">
        <p v-if="errors.occupation || errors.occupationOther" class="error">{{ errors.occupation || errors.occupationOther }}</p>
      </fieldset>
      <div class="field">
        <label for="university">대학교</label>
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
      <div class="field">
        <label for="studentId">학번</label>
        <input id="studentId" v-model="form.studentId" type="text" inputmode="numeric" :maxlength="limits.studentId" :aria-invalid="!!errors.studentId">
        <p class="help">재학 여부 확인용입니다. 숫자만 입력해 주세요.</p>
        <p v-if="errors.studentId" class="error">{{ errors.studentId }}</p>
      </div>
      <div class="hp" aria-hidden="true">
        <label for="website">웹사이트</label>
        <input id="website" v-model="form.website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" @click="back">이전</button>
        <button type="button" class="btn primary" @click="next">다음</button>
      </div>
    </section>

    <!-- 5. 지원서 (일반 회원 / 집행부) -->
    <section v-if="step === 'application'" class="join-card form-card" aria-labelledby="app-heading">
      <template v-if="!isStaff">
        <h2 id="app-heading">지원서</h2>
        <p class="hint">WYEA에서 무엇을 하고 싶은지 알려 주세요. 집행부가 가입 검토와 활동 안내에 참고합니다.</p>

        <aside class="staff-hook" aria-labelledby="hook-heading">
          <p id="hook-heading" class="hook-title">참여하는 것만으로는 아쉬운가요?</p>
          <p class="hook-body">대외활동 이력으로 남길 경험을 원하거나, 조직을 직접 키워 보고 싶다면 집행부로 지원하세요. 일반 회원 지원서 대신 집행부 지원서를 작성합니다.</p>
          <button type="button" class="btn primary small" @click="setTrack('staff')">집행부로 지원하기 →</button>
        </aside>
      </template>

      <template v-else>
        <p class="eyebrow">STAFF</p>
        <h2 id="app-heading">집행부 지원서</h2>
        <p class="hint">집행부는 부서에 소속되어 WYEA의 활동을 직접 기획하고 운영합니다. 할 수 있는 것과 해 보고 싶은 것을 구체적으로 적어 주세요.</p>
        <p class="track-switch">단순 참여를 원하시나요? <button type="button" class="more inline" @click="setTrack('member')">일반 회원으로 지원하기</button></p>
      </template>

      <fieldset class="field">
        <legend>관심 있는 활동 <span class="note">(여러 개 선택)</span></legend>
        <div class="choices chips" :aria-invalid="!!errors.interests" tabindex="-1">
          <button v-for="i in interestOptions" :key="i" type="button" class="chip" :class="{ on: form.interests.includes(i) }" :aria-pressed="form.interests.includes(i)" @click="toggleInterest(i)">{{ i }}</button>
        </div>
        <p v-if="errors.interests" class="error">{{ errors.interests }}</p>
      </fieldset>

      <!-- 일반 트랙: 소속 단 1개 -->
      <fieldset v-if="!isStaff" class="field">
        <legend>소속 단 <span class="note">(1개 선택)</span></legend>
        <p class="unit-note">회원은 1개 단에 속하며, 활동 후 참가 기록서를 제출합니다.</p>
        <div class="team-grid" :aria-invalid="!!errors.team" tabindex="-1">
          <label v-for="u in memberUnits" :key="u.name" class="team-option" :class="{ picked: form.team === u.name }">
            <input v-model="form.team" type="radio" name="team" :value="u.name" @change="clearTeamError">
            <span><strong>{{ u.name }}</strong><small>{{ u.desc }}</small></span>
          </label>
        </div>
        <p v-if="errors.team" class="error">{{ errors.team }}</p>
        <div v-if="unitExtra === 'languages'" class="field extra">
          <label for="languages">가능 언어</label>
          <input id="languages" v-model="form.languages" type="text" :maxlength="limits.languages" placeholder="예: 일본어(회화 가능), 영어(읽기·쓰기)" :aria-invalid="!!errors.languages">
          <p v-if="errors.languages" class="error">{{ errors.languages }}</p>
        </div>
        <div v-if="unitExtra === 'clubTopic'" class="field extra">
          <label for="clubTopic">관심 주제</label>
          <input id="clubTopic" v-model="form.clubTopic" type="text" :maxlength="limits.clubTopic" placeholder="예: 음악, 창업 공모전, 일본 문화" :aria-invalid="!!errors.clubTopic">
          <p v-if="errors.clubTopic" class="error">{{ errors.clubTopic }}</p>
        </div>
      </fieldset>

      <!-- 집행부 트랙: 부서 1지망 필수, 2지망 선택 -->
      <template v-else>
        <fieldset class="field">
          <legend>희망 부서 1지망 <span class="note">(필수)</span></legend>
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
          <label for="teamSecond">희망 부서 2지망 <span class="note">(선택, 1지망과 다른 부서)</span></label>
          <select id="teamSecond" v-model="form.teamSecond" :aria-invalid="!!errors.teamSecond" @change="clearTeamError">
            <option value="">없음</option>
            <option v-for="d in departments" :key="d.name" :value="d.name" :disabled="d.name === form.team">{{ d.name }}</option>
          </select>
          <p v-if="errors.teamSecond" class="error">{{ errors.teamSecond }}</p>
        </div>
      </template>

      <div class="field">
        <label for="motivation">지원 동기</label>
        <textarea id="motivation" v-model="form.motivation" rows="6" :maxlength="limits.motivation" :placeholder="isStaff ? '집행부로 활동하려는 이유를 적어 주세요.' : 'WYEA에 가입하려는 이유를 자유롭게 적어 주세요.'" :aria-invalid="!!errors.motivation" />
        <p class="count">{{ form.motivation.trim().length }} / {{ limits.motivation }}자 (최소 {{ MIN_MOTIVATION }}자)</p>
        <p v-if="errors.motivation" class="error">{{ errors.motivation }}</p>
      </div>

      <template v-if="isStaff">
        <div class="field">
          <label for="competencies">내가 생각하는 나의 역량</label>
          <textarea id="competencies" v-model="form.competencies" rows="5" :maxlength="limits.competencies" placeholder="예: 문서 정리, 외국어, 디자인 툴, 사람을 모으는 일, 일정 관리 등 스스로 잘한다고 생각하는 것" :aria-invalid="!!errors.competencies" />
          <p class="count">{{ form.competencies.trim().length }} / {{ limits.competencies }}자 (최소 {{ MIN_DETAIL }}자)</p>
          <p v-if="errors.competencies" class="error">{{ errors.competencies }}</p>
        </div>
        <div class="field">
          <label for="experience">지금까지 해 온 것 <span class="note">(선택, 없어도 됩니다)</span></label>
          <textarea id="experience" v-model="form.experience" rows="4" :maxlength="limits.experience" placeholder="동아리·학생회·대외활동·아르바이트·프로젝트 등" :aria-invalid="!!errors.experience" />
          <p class="count">{{ form.experience.trim().length }} / {{ limits.experience }}자</p>
          <p v-if="errors.experience" class="error">{{ errors.experience }}</p>
        </div>
        <div class="field">
          <label for="capabilities">WYEA에서 할 수 있는 것</label>
          <textarea id="capabilities" v-model="form.capabilities" rows="5" :maxlength="limits.capabilities" placeholder="선택한 부서에서 맡아 볼 수 있는 일, 만들어 보고 싶은 것, 쓸 수 있는 시간 등" :aria-invalid="!!errors.capabilities" />
          <p class="count">{{ form.capabilities.trim().length }} / {{ limits.capabilities }}자 (최소 {{ MIN_DETAIL }}자)</p>
          <p v-if="errors.capabilities" class="error">{{ errors.capabilities }}</p>
        </div>
      </template>
      <div v-else class="field">
        <label for="hopes">WYEA에서 해 보고 싶은 것 <span class="note">(선택)</span></label>
        <textarea id="hopes" v-model="form.hopes" rows="4" :maxlength="limits.hopes" placeholder="해 보고 싶은 활동, 가 보고 싶은 나라, 나의 목표 등" :aria-invalid="!!errors.hopes" />
        <p class="count">{{ form.hopes.trim().length }} / {{ limits.hopes }}자</p>
        <p v-if="errors.hopes" class="error">{{ errors.hopes }}</p>
      </div>

      <fieldset class="field">
        <legend>WYEA를 알게 된 경로 <span class="note">(선택)</span></legend>
        <div class="choices">
          <label v-for="r in referralOptions" :key="r" class="choice"><input v-model="form.referral" type="radio" name="referral" :value="r">{{ r }}</label>
          <label class="choice"><input v-model="form.referral" type="radio" name="referral" value="기타">기타</label>
        </div>
        <input v-if="form.referral === '기타'" v-model="form.referralOther" class="other" type="text" :maxlength="limits.other" placeholder="알게 된 경로" aria-label="기타 경로" :aria-invalid="!!errors.referralOther">
      </fieldset>

      <div class="actions">
        <button type="button" class="btn ghost" @click="back">이전</button>
        <button type="button" class="btn primary" @click="next">다음</button>
      </div>
    </section>

    <!-- 7. 동의 -->
    <section v-if="step === 'consent'" class="join-card form-card" aria-labelledby="consent-heading">
      <h2 id="consent-heading">동의</h2>
      <label class="all-agree">
        <input type="checkbox" :checked="allAgreed" @change="setAll(($event.target as HTMLInputElement).checked)">
        <span>아래 내용에 모두 동의합니다</span>
      </label>
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

    <!-- 8. 완료 -->
    <section v-if="step === 'done'" class="join-card done-card" aria-labelledby="done-heading">
      <p class="eyebrow">THANK YOU</p>
      <h2 id="done-heading">{{ isStaff ? '집행부 지원이 접수되었습니다' : '가입 신청이 접수되었습니다' }}</h2>
      <p>집행부가 신청 내용을 검토한 뒤, 입력하신 이메일과 휴대전화로 결과를 안내해 드립니다.</p>
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
.section-label { display: block; color: #0d47a1; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
h2 { font-size: clamp(20px, 1.6vw, 25px); line-height: 1.5; font-weight: 700; margin: 0 0 18px; word-break: keep-all; }
h3 { color: #0d47a1; font-size: 17px; font-weight: 700; margin: 0 0 8px; }
p { word-break: keep-all; overflow-wrap: anywhere; }
.program-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.program { background: #f5f9ff; border-radius: 12px; padding: 20px; }
.program p { margin: 0; font-size: 15px; line-height: 1.8; }
.program.value h3 { margin: 0; }
.program.value p { margin-top: 8px; }
.activity-list { list-style: none; padding: 0; margin: 0; }
.activity-list li + li { border-top: 1px solid #e5edf8; }
.activity-list a { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 14px 4px; color: inherit; text-decoration: none; }
.activity-list a:hover .activity-title, .activity-list a:focus-visible .activity-title { color: #0d47a1; text-decoration: underline; text-underline-offset: 4px; }
.badge { background: #e3eefb; color: #0d47a1; font-size: 12px; font-weight: 700; border-radius: 999px; padding: 3px 10px; white-space: nowrap; }
.activity-title { font-size: 15px; font-weight: 600; }
.activity-date { font-size: 13px; color: #697586; white-space: nowrap; }
.process { list-style: none; counter-reset: step; padding: 0; margin: 0; display: grid; gap: 14px; }
.process li { counter-increment: step; display: grid; grid-template-columns: 36px 1fr; column-gap: 12px; align-items: start; }
.process li::before { content: counter(step); grid-row: span 2; width: 32px; height: 32px; border-radius: 50%; background: #0d47a1; color: #fff; font-weight: 700; display: grid; place-items: center; }
.process strong { font-size: 16px; }
.process span { font-size: 14px; color: #526b8a; }
.progress ol { list-style: none; display: flex; gap: 8px; padding: 0; margin: 0 0 20px; }
.progress li { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #8a97a8; border-bottom: 3px solid #dce7f5; padding-bottom: 10px; }
.progress li.active { color: #0d47a1; font-weight: 700; border-color: #0d47a1; }
.progress li.done { color: #344052; border-color: #9cbde6; }
.progress .num { width: 22px; height: 22px; border-radius: 50%; background: currentColor; color: #fff; display: inline-grid; place-items: center; font-size: 12px; }
.progress li .num { color: #fff; background: #8a97a8; }
.progress li.active .num { background: #0d47a1; }
.progress li.done .num { background: #9cbde6; }
.hint { font-size: 15px; color: #526b8a; margin: -6px 0 24px; line-height: 1.7; }
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
.all-agree { display: flex; align-items: center; gap: 10px; background: #f5f9ff; border: 1px solid #dce7f5; border-radius: 12px; padding: 14px 16px; font-size: 16px; font-weight: 700; margin-bottom: 14px; cursor: pointer; }
.all-agree input, .consent-check input { width: 20px; height: 20px; accent-color: #0d47a1; flex: none; }
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
.know-card { text-align: center; padding: 48px 36px 32px; }
.know-card h2 { font-size: clamp(21px, 1.9vw, 27px); }
.center-text { margin: 0 auto 28px; max-width: 520px; }
.know-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.know-choice { font: inherit; display: flex; flex-direction: column; gap: 6px; align-items: center; padding: 26px 16px; border: 1px solid #c9d7ea; border-radius: 14px; background: #fff; color: #344052; cursor: pointer; transition: border-color .15s, background .15s; }
.know-choice strong { font-size: 18px; color: #0d47a1; }
.know-choice span { font-size: 14px; color: #697586; }
.know-choice:hover, .know-choice:focus-visible { border-color: #0d47a1; background: #f5f9ff; outline: none; }
.know-card .actions { justify-content: flex-start; }
.future-list { list-style: none; padding: 0; margin: 0; }
.future-list li { display: grid; grid-template-columns: 150px 1fr; gap: 12px; padding: 14px 4px; }
.future-list li + li { border-top: 1px solid #e5edf8; }
.future-when { color: #0d47a1; font-weight: 700; font-size: 15px; }
.future-what { font-size: 15px; line-height: 1.7; word-break: keep-all; }
.quiz-item { background: #f7f9fc; border: 1px solid #e5edf8; border-radius: 12px; padding: 18px 20px; }
.quiz-item legend { float: left; width: 100%; margin-bottom: 12px; line-height: 1.6; word-break: keep-all; }
.quiz-item.right { border-color: #2e7d32; background: #f3faf3; }
.quiz-item.wrong { border-color: #c62828; background: #fdf5f5; }
.q-num { color: #0d47a1; }
.quiz-options { clear: both; display: grid; gap: 8px; }
.quiz-option { background: #fff; border: 1px solid #dce7f5; border-radius: 10px; padding: 10px 14px; }
.quiz-option.picked { border-color: #0d47a1; }
.quiz-feedback { font-size: 14px; line-height: 1.7; margin: 12px 0 0; }
.quiz-feedback strong { margin-right: 6px; }
.quiz-item.right .quiz-feedback strong { color: #2e7d32; }
.quiz-item.wrong .quiz-feedback strong { color: #c62828; }
.quiz-pass { background: #f3faf3; border: 1px solid #2e7d32; border-radius: 12px; padding: 14px 16px; font-size: 15px; }
.quiz-pass strong { color: #2e7d32; }
.more.inline { padding: 0; font-size: inherit; }
.staff-hook { background: linear-gradient(135deg, #0d47a1, #1565c0); color: #fff; border-radius: 14px; padding: 22px 24px; margin: 0 0 28px; }
.hook-title { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
.hook-body { font-size: 14px; line-height: 1.7; margin: 0 0 14px; opacity: .92; }
.staff-hook .btn.primary { background: #fff; color: #0d47a1; border-color: #fff; }
.staff-hook .btn.primary:hover { background: #e3eefb; }
.btn.small { font-size: 15px; padding: 10px 18px; }
.track-switch { font-size: 14px; color: #526b8a; margin: -12px 0 24px; }
.team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-radius: 12px; }
.team-grid[aria-invalid="true"] { outline: 1px solid #c62828; outline-offset: 4px; }
.team-option { display: flex; gap: 10px; align-items: flex-start; border: 1px solid #dce7f5; border-radius: 12px; padding: 14px; margin: 0; cursor: pointer; font-weight: 400; background: #fff; }
.team-option.picked { border-color: #0d47a1; background: #f5f9ff; }
.team-option input { width: 18px; height: 18px; margin-top: 2px; accent-color: #0d47a1; flex: none; }
.team-option strong { display: block; font-size: 15px; color: #0d47a1; margin-bottom: 2px; }
.team-option small { display: block; font-size: 13px; line-height: 1.6; color: #526b8a; }
.unit-note { font-size: 14px; color: #526b8a; margin: -2px 0 12px; line-height: 1.6; }
.field.extra { margin: 14px 0 0; padding: 14px 16px; background: #f5f9ff; border-radius: 12px; }
.recommend { font-size: 14px; line-height: 1.7; margin: -4px 0 12px; padding: 10px 14px; background: #fff8e1; border: 1px solid #f5d77a; border-radius: 10px; color: #5c4a00; }
.recommend strong { color: #0d47a1; }
.done-card { text-align: center; padding: 48px 32px; }
.done-card p { font-size: 16px; line-height: 1.8; }
a { color: #0d47a1; text-underline-offset: 4px; }
@media (max-width: 600px) {
  .join-page { padding: 104px 16px 40px; }
  .join-card { padding: 24px 20px; }
  .program-grid, .field-row { grid-template-columns: 1fr; gap: 0; }
  .program + .program { margin-top: 12px; }
  .activity-list a { grid-template-columns: auto 1fr; }
  .activity-date { grid-column: 2; }
  .actions .btn { flex: 1; padding: 14px 16px; }
  .consent-row { align-items: flex-start; }
  .know-card { padding: 32px 20px 24px; }
  .know-choices { grid-template-columns: 1fr; gap: 12px; }
  .know-choice { padding: 20px 16px; }
  .future-list li { grid-template-columns: 1fr; gap: 2px; }
  .quiz-item { padding: 16px; }
  .team-grid { grid-template-columns: 1fr; }
  .staff-hook { padding: 18px; }
}
</style>
