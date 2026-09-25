<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { REPORT_API_URL, orderedReportSections, reportRoles, reportSections } from '@/content/report'

const name = ref('')
const phone = ref('')
const university = ref('')
const team = ref('')
const verified = ref(false)
const busy = ref(false)
const submitted = ref(false)
const message = ref('')
const events = ref<string[]>([])
const values = reactive({
  g_event: '', g_when: '', g_role: '', p_scene: '', p_comment: '', p_photo_link: '',
  k_issue: '', k_improvement: '', k_next: '', k_partner_reaction: '',
  m_club_topic: '', m_companions: '', m_rejoin: '',
})
const confirmed = ref(false)
const sectionKeys = computed(() => orderedReportSections(team.value))

async function request(payload: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(REPORT_API_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('서버에 연결하지 못했습니다.')
  return response.json()
}
onMounted(async () => {
  if (!REPORT_API_URL) return
  try {
    const response = await fetch(`${REPORT_API_URL}?action=events`)
    const data = await response.json()
    if (data.ok && Array.isArray(data.events)) events.value = data.events.filter((event: unknown) => typeof event === 'string')
  } catch {
    message.value = '행사 목록을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.'
  }
})
async function lookup() {
  if (!name.value.trim() || !/^01\d{8,9}$/.test(phone.value.replace(/\D/g, ''))) {
    message.value = '이름과 휴대전화 번호를 확인해 주세요.'
    return
  }
  busy.value = true
  message.value = ''
  try {
    const result = await request({ action: 'lookup', name: name.value.trim(), phone: phone.value })
    verified.value = result.ok === true
    university.value = verified.value ? String(result.university || '') : ''
    team.value = verified.value ? String(result.team || '') : ''
    if (!verified.value) message.value = '가입 신청 기록을 찾지 못했습니다. 먼저 회원 가입을 신청해 주세요.'
  } catch {
    message.value = '회원 확인에 실패했습니다. 잠시 뒤 다시 시도해 주세요.'
  } finally {
    busy.value = false
  }
}
function sectionFilled(key: keyof typeof reportSections): boolean {
  return reportSections[key].fields.some(field => values[field.key]?.trim())
}
async function submit() {
  if (!verified.value) return
  if (!events.value.includes(values.g_event) || !values.g_when || !values.g_role || !confirmed.value) {
    message.value = '참가 사실 4개 항목을 모두 입력해 주세요.'
    return
  }
  if (sectionKeys.value.some(key => !sectionFilled(key))) {
    message.value = '후기·사진, 의견·제안, 소속·재참여에서 각각 한 항목 이상 입력해 주세요.'
    return
  }
  busy.value = true
  message.value = ''
  try {
    const result = await request({ action: 'report', payload: { name: name.value.trim(), phone: phone.value, ...values, g_confirmed: true } })
    if (result.ok) submitted.value = true
    else message.value = result.error === 'not_found' ? '회원 확인이 만료되었습니다. 다시 확인해 주세요.' : '입력 내용을 확인하고 다시 제출해 주세요.'
  } catch {
    message.value = '제출하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="report-page">
    <div class="report-card">
      <p class="eyebrow">WYEA MEMBER RECORD</p>
      <h1>참가 기록서</h1>
      <p class="intro">활동 후 한 장으로 참가 사실과 경험을 남겨 주세요. 각 항목은 담당 부서가 활동 기록과 다음 행사 준비에 활용합니다.</p>
      <p v-if="submitted" class="success" role="status">참가 기록이 접수되었습니다. 감사합니다.</p>
      <template v-else>
        <section class="identity">
          <h2>회원 확인</h2>
          <p>가입 신청 때 적은 이름과 휴대전화 번호가 모두 일치해야 합니다.</p>
          <div class="identity-grid">
            <label>이름<input v-model="name" autocomplete="name" :disabled="verified" maxlength="100" /></label>
            <label>휴대전화<input v-model="phone" autocomplete="tel" inputmode="tel" :disabled="verified" placeholder="01012345678" /></label>
          </div>
          <button v-if="!verified" type="button" :disabled="busy || !REPORT_API_URL" @click="lookup">회원 확인</button>
          <p v-else class="member-summary">확인됨 · {{ university }} · {{ team }}</p>
          <RouterLink v-if="!verified" to="/join">회원 가입 신청하기 →</RouterLink>
        </section>
        <form v-if="verified" @submit.prevent="submit">
          <section>
            <h2>① 참가 사실 · 총무부</h2>
            <p>모두 입력해 주세요.</p>
            <label>행사명<select v-model="values.g_event" required><option value="">행사를 선택해 주세요</option><option v-for="event in events" :key="event" :value="event">{{ event }}</option></select></label>
            <label>일시<input v-model="values.g_when" type="datetime-local" required /></label>
            <label>역할<select v-model="values.g_role" required><option value="">역할을 선택해 주세요</option><option v-for="role in reportRoles" :key="role">{{ role }}</option></select></label>
            <label class="check"><input v-model="confirmed" type="checkbox" required /> 위 행사에 참가한 사실을 확인합니다.</label>
          </section>
          <section v-for="key in sectionKeys" :key="key">
            <h2>{{ reportSections[key].title }}</h2>
            <p>이 섹션에서 한 항목 이상 입력해 주세요.</p>
            <template v-for="field in reportSections[key].fields" :key="field.key">
              <label>{{ field.label }}
                <textarea v-if="field.type === 'textarea'" v-model="values[field.key]" maxlength="2000" rows="3" />
                <select v-else-if="field.type === 'select'" v-model="values[field.key]"><option value="">선택해 주세요</option><option>예</option><option>아니오</option><option>미정</option></select>
                <input v-else v-model="values[field.key]" :type="field.type" maxlength="2000" />
              </label>
            </template>
          </section>
          <p class="photo-notice">타인이 식별되는 사진은 당사자의 동의를 받은 뒤 링크를 제출해 주세요.</p>
          <button type="submit" :disabled="busy">{{ busy ? '제출 중…' : '참가 기록 제출' }}</button>
        </form>
        <p v-if="message" class="error" role="alert">{{ message }}</p>
      </template>
    </div>
  </main>
</template>

<style scoped>
.report-page { min-height: 100vh; padding: 104px 20px 80px; background: #f4f8f6; color: #20362c; font-family: 'PretendardFont', sans-serif; }
.report-card { max-width: 820px; margin: auto; padding: clamp(24px, 5vw, 56px); border: 1px solid #dce7df; border-radius: 22px; background: #fff; box-shadow: 0 10px 32px #183d2810; }
.eyebrow { margin: 0 0 8px; color: #3f8263; font-size: 12px; font-weight: 700; letter-spacing: .14em; }
h1 { margin: 0 0 12px; font-size: clamp(30px, 5vw, 44px); }
.intro { margin: 0; line-height: 1.7; }
section { margin-top: 36px; padding-top: 30px; border-top: 1px solid #dce7df; }
h2 { margin: 0 0 6px; font-size: 22px; }
section > p { margin: 0 0 18px; color: #5d6f64; }
label { display: block; margin: 14px 0; font-weight: 600; }
input, select, textarea { display: block; width: 100%; margin-top: 7px; padding: 12px; border: 1px solid #b7cabc; border-radius: 10px; color: inherit; background: #fff; font: inherit; font-weight: 400; }
textarea { resize: vertical; }
.identity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.check { display: flex; align-items: center; gap: 8px; font-weight: 400; }
.check input { width: auto; margin: 0; }
button { margin-top: 8px; padding: 12px 20px; border: 0; border-radius: 999px; background: #2d6a4f; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
button:disabled { opacity: .55; cursor: wait; }
.identity a { display: inline-block; margin-left: 14px; color: #2d6a4f; }
.member-summary, .success { padding: 12px 16px; border-radius: 10px; background: #e8f4ea; color: #23583a; font-weight: 700; }
.error { margin-top: 20px; color: #a42b2b; }
.photo-notice { margin: 28px 0 8px; color: #5d6f64; font-size: 14px; }
@media (max-width: 600px) { .identity-grid { grid-template-columns: 1fr; gap: 0; } .identity a { display: block; margin: 14px 0 0; } }
</style>
