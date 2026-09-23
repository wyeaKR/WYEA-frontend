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
  if (!other) showFieldError('interest_other', '')
}
INTERESTS.forEach((value) => {
  const label = document.createElement('label')
  label.className = 'choice'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.name = 'interests'
  input.value = value
  input.addEventListener('change', () => {
    if (input.checked) {
      document.querySelectorAll('[name="interests"]').forEach((choice) => {
        if (choice !== input && (value === '아직 정하지 못함' || choice.value === '아직 정하지 못함')) {
          choice.checked = false
        }
      })
    }
    syncOther()
    showFieldError('interests', fieldError('interests'))
  })
  label.append(input, document.createTextNode(value))
  $('interests').append(label)
})

// 서버 validate_와 동일한 규칙으로 전송 전에 확인합니다. 서버 검증도 유지합니다.
const limits = { name_ko: 30, last_name_en: 50, first_name_en: 50, desired_id: 30,
  expectations: 1000, desired_activities: 1000, interest_other: 200 }
const validationFields = [...Object.keys(limits).filter((key) => key !== 'interest_other'),
  'contact_email', 'interests', 'interest_other', 'agree_privacy']
function fieldError(key) {
  const selected = [...document.querySelectorAll('[name="interests"]:checked')].map((el) => el.value)
  if (key === 'interests') {
    if (!selected.length) return '관심 분야를 1개 이상 선택해 주세요.'
    if (selected.some((value) => !INTERESTS.includes(value))) return '목록에 있는 관심 분야를 선택해 주세요.'
    return selected.includes('아직 정하지 못함') && selected.length > 1
      ? '아직 정하지 못함은 다른 분야와 함께 선택할 수 없습니다.' : ''
  }
  if (key === 'agree_privacy') return $(key).checked ? '' : '개인정보 수집·이용에 동의해 주세요.'
  if (key === 'interest_other' && !selected.includes('기타')) return ''
  const value = $(key).value.trim()
  if (!value) return '이 항목을 입력해 주세요.'
  if (limits[key] && value.length > limits[key]) return `최대 ${limits[key].toLocaleString()}자까지 입력해 주세요.`
  if (['last_name_en', 'first_name_en'].includes(key) && !/^[A-Za-z '-]+$/.test(value)) {
    return "영문, 공백, 하이픈(-), 아포스트로피(')만 사용할 수 있습니다."
  }
  if (key === 'desired_id' && !/^[a-z0-9.]{3,30}$/.test(value)) {
    return '아이디는 영문 소문자·숫자·마침표(.)로 3~30자 입력해 주세요.'
  }
  if (key === 'contact_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return '이메일 주소를 확인해 주세요. 예: name@example.com'
  }
  return ''
}
function showFieldError(key, message) {
  const error = $(`${key}-error`)
  error.textContent = message
  error.hidden = !message
  $(key).setAttribute('aria-invalid', String(Boolean(message)))
}
validationFields.forEach((key) => {
  const element = $(key)
  const error = document.createElement('p')
  error.id = `${key}-error`
  error.className = 'field-error'
  error.hidden = true
  error.setAttribute('aria-live', 'polite')
  const anchor = ['desired_id', 'agree_privacy'].includes(key) ? element.parentElement : element
  anchor.after(error)
  element.setAttribute('aria-describedby', [element.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '))
  if (key === 'interests') return
  element.addEventListener('blur', () => showFieldError(key, fieldError(key)))
  element.addEventListener('input', () => {
    if (element.getAttribute('aria-invalid') === 'true') showFieldError(key, fieldError(key))
  })
})
;['expectations', 'desired_activities', 'interest_other'].forEach((key) => {
  const counter = $(`${key}-count`)
  const update = () => { counter.textContent = `${$(key).value.length.toLocaleString()} / ${limits[key].toLocaleString()}자` }
  $(key).addEventListener('input', update)
  update()
})
$('onboarding-form').noValidate = true

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
  validationFields.forEach((key) => showFieldError(key, fieldError(key)))
  const firstInvalid = event.currentTarget.querySelector('[aria-invalid="true"]')
  if (firstInvalid) {
    status('form-status', '표시된 항목을 확인해 주세요. 작성한 내용은 유지됩니다.', true)
    const target = firstInvalid.id === 'interests' ? firstInvalid.querySelector('input') : firstInvalid
    target.focus()
    return
  }
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
  status('gate-status', '현재 온보딩을 준비 중입니다. 담당자에게 문의해 주세요.')
}
