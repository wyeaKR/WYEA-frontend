// Apps Script 웹 앱 배포의 /exec URL을 입력하세요. 시트 ID나 초대코드 목록은 넣지 않습니다.
const API_URL = 'https://script.google.com/macros/s/AKfycbz_pWompOeKDBz6DCKNNMu_BwLzQaSveaw29OJ8ECRGMthuEdgDr8JF6nfGApzM2w2fUA/exec'
const INTERESTS = [
  '행정·문서',
  'SNS·콘텐츠',
  '행사 기획',
  '대외협력',
  '지부 운영·모집',
  '디자인',
  '번역',
  '사진·영상',
  '웹·개발',
  '아직 정하지 못함',
  '기타',
]
const $ = (id) => document.getElementById(id)
let verifiedCode = ''
let busy = false
const invalidMessage =
  '사용할 수 없는 초대코드입니다. 전달받은 코드를 확인하거나 담당자에게 문의해 주세요.'

function status(id, message, error = false) {
  $(id).textContent = message
  $(id).classList.toggle('error', error)
}
function syncOther() {
  const selected = [...document.querySelectorAll('[name="interests"]:checked')].map(
    (input) => input.value,
  )
  const other = selected.includes('기타')
  $('other-field').hidden = !other
  $('interest_other').required = other
  $('interest_other').disabled = !other
}
INTERESTS.forEach((value) => {
  const label = document.createElement('label')
  label.className = 'choice'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.name = 'interests'
  input.value = value
  input.addEventListener('change', syncOther)
  label.append(input, document.createTextNode(value))
  $('interests').append(label)
})

async function request(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'omit',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('http_error')
    const result = await response.json()
    if (!result || typeof result.ok !== 'boolean') throw new Error('invalid_response')
    return result
  } finally {
    clearTimeout(timer)
  }
}

$('verify-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  if (busy || !API_URL) return
  const code = $('code').value.trim()
  if (!code) {
    status('gate-status', '초대코드를 입력해 주세요.', true)
    return
  }
  busy = true
  $('verify-button').disabled = true
  status('gate-status', '초대코드를 확인하고 있습니다.')
  try {
    const url = new URL(API_URL)
    url.searchParams.set('action', 'verify')
    url.searchParams.set('code', code)
    const result = await request(url)
    if (result.ok) {
      verifiedCode = code
      $('gate').hidden = true
      $('details').hidden = false
      $('form-fields').disabled = false
      syncOther()
      $('details-title').focus()
    } else {
      status(
        'gate-status',
        result.error === 'invalid_code'
          ? invalidMessage
          : '서버 설정을 확인할 수 없습니다. 담당자에게 문의해 주세요.',
        true,
      )
    }
  } catch {
    status(
      'gate-status',
      '서버 응답을 확인하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.',
      true,
    )
  } finally {
    busy = false
    $('verify-button').disabled = false
  }
})

$('onboarding-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  if (busy || !verifiedCode) return
  const data = new FormData(event.currentTarget)
  const fields = [
    'name_ko',
    'last_name_en',
    'first_name_en',
    'desired_id',
    'contact_email',
    'expectations',
    'desired_activities',
  ]
  const payload = Object.fromEntries(fields.map((key) => [key, String(data.get(key) || '').trim()]))
  payload.interests = data.getAll('interests')
  payload.interest_other = payload.interests.includes('기타')
    ? String(data.get('interest_other') || '').trim()
    : ''
  payload.agree_privacy = data.get('agree_privacy') === 'on'
  if (
    fields.some((key) => !payload[key]) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contact_email) ||
    !payload.interests.length ||
    (payload.interests.includes('기타') && !payload.interest_other) ||
    !payload.agree_privacy
  ) {
    status('form-status', '필수 항목, 이메일 형식과 관심 분야 선택을 확인해 주세요.', true)
    return
  }
  busy = true
  $('form-fields').disabled = true
  status('form-status', '저장 중입니다. 창을 닫지 말고 잠시 기다려 주세요.')
  try {
    const result = await request(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', code: verifiedCode, payload }),
    })
    if (result.ok && typeof result.response_id === 'string' && result.response_id) {
      verifiedCode = ''
      $('details').hidden = true
      $('complete').hidden = false
      $('receipt').textContent = `접수번호: ${result.response_id}`
      $('onboarding-form').reset()
      $('code').value = ''
      $('complete-title').focus()
    } else if (result.error === 'invalid_code') {
      verifiedCode = ''
      $('gate').hidden = false
      status('gate-status', invalidMessage, true)
      status(
        'form-status',
        '작성한 내용은 유지됩니다. 이미 제출한 경우 담당자에게 저장 여부를 확인해 주세요.',
        true,
      )
      $('code').focus()
    } else {
      status(
        'form-status',
        result.error === 'validation_failed'
          ? '필수 항목과 입력 형식을 다시 확인해 주세요.'
          : '저장 결과를 확인할 수 없습니다. 재시도 전 담당자에게 저장 여부를 확인해 주세요.',
        true,
      )
    }
  } catch {
    status(
      'form-status',
      '서버 응답을 받지 못했습니다. 저장되었을 수도 있으니 재시도 전 담당자에게 확인해 주세요. 작성 내용은 유지됩니다.',
      true,
    )
  } finally {
    busy = false
    $('form-fields').disabled = !verifiedCode
    syncOther()
  }
})

if (API_URL) {
  $('verify-button').disabled = false
} else {
  status('gate-status', '테스트 준비 중입니다. 담당자가 Apps Script 배포 URL을 설정해야 합니다.')
}
