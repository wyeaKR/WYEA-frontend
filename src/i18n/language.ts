import { ref } from 'vue'

export type Language = 'ko' | 'en'
let saved: string | null = null
try { if (typeof window !== 'undefined') saved = window.localStorage.getItem('wyea-language') } catch { /* Private browsing may block storage. */ }
export const language = ref<Language>('ko')
let english: Record<string, string> = {}
let englishReady: Promise<void> | null = null
const loadEnglish = () => englishReady ??= import('./translations').then(module => { english = module.english })

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

function translateEnglish(value: string): string {
  const key = normalize(value)
  if (!key) return value
  let translated = english[key]
  if (!translated) {
    const date = key.match(/^(\d{4})년 (\d{1,2})월 (\d{1,2})(?:~(\d{1,2}))?일$/)
    if (date) {
      const [, year, month, day, last] = date
      translated = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2020, Number(month) - 1, 1))} ${day}${last ? `–${last}` : ''}, ${year}`
    }
    const photo = key.match(/^(.+) 사진 (\d+)$/)
    if (photo) translated = `${english[photo[1]!] ?? photo[1]} photo ${photo[2]}`
    const yearTab = key.match(/^(\d{4}) (수입|지출)$/)
    if (yearTab) translated = `${yearTab[1]} ${yearTab[2] === '수입' ? 'Income' : 'Expenses'}`
    const yearTable = key.match(/^(\d{4}) (수입|지출) 내역$/)
    if (yearTable) translated = `${yearTable[1]} ${yearTable[2] === '수입' ? 'income' : 'expenses'} details`
    const balance = key.match(/^(\d{4})년 수입 − 지출$/)
    if (balance) translated = `${balance[1]} income − expenses`
    const maxLength = key.match(/^최대 ([\d,]+)자까지 입력해 주세요\.$/)
    if (maxLength) translated = `Please enter no more than ${maxLength[1]} characters.`
    const minAge = key.match(/^만 (\d+)세 이상만 신청할 수 있습니다\.$/)
    if (minAge) translated = `You must be at least ${minAge[1]} years old to apply.`
    const page = key.match(/^(.+) 페이지$/)
    if (page) translated = `${english[page[1]!] ?? page[1]} pages`
    const picture = key.match(/^(\d+)번째 사진 보기$/)
    if (picture) translated = `View photo ${picture[1]}`
    const slide = key.match(/^(\d+)번째$/)
    if (slide) translated = `Slide ${slide[1]}`
    const activityTitle = key.match(/^(.+) \| WYEA$/)
    if (activityTitle) translated = `${english[activityTitle[1]!] ?? activityTitle[1]} | WYEA`
    const activityDescription = key.match(/^(\d{4}년 \d{1,2}월 \d{1,2}(?:~\d{1,2})?일) · (.+) \| 세계청년교류연합\(WYEA\) 활동 기록$/)
    if (activityDescription) translated = `${translateEnglish(activityDescription[1]!)} · ${english[activityDescription[2]!] ?? activityDescription[2]} | WYEA activity record`
  }
  if (!translated) return value
  const leading = value.match(/^\s*/)?.[0] ?? ''
  const trailing = value.match(/\s*$/)?.[0] ?? ''
  return leading + translated + trailing
}

export function translate(value: string): string {
  return language.value === 'en' ? translateEnglish(value) : value
}

export async function setLanguage(next: Language) {
  if (next === 'en') await loadEnglish()
  language.value = next
  try { if (typeof window !== 'undefined') window.localStorage.setItem('wyea-language', next) } catch { /* Keep the in-memory choice. */ }
}

export async function restoreLanguage() {
  if (saved === 'en') await setLanguage('en')
}

// Public pages are prerendered in Korean. Translate their rendered text after
// hydration so the Korean HTML and the Vue form values remain authoritative.
export function installPageTranslation() {
  const textSources = new WeakMap<Text, string>()
  const attributeSources = new WeakMap<Element, Map<string, string>>()
  const attributes = ['alt', 'aria-label', 'placeholder', 'title', 'content']

  const updateText = (node: Text) => {
    if (node.parentElement?.closest('script, style, noscript')) return
    if (node.parentElement?.closest('[data-no-translate]')) {
      const original = textSources.get(node)
      if (original !== undefined && node.nodeValue === translateEnglish(original)) node.nodeValue = original
      return
    }
    const current = node.nodeValue ?? ''
    const prior = textSources.get(node)
    if (prior === undefined || (current !== prior && current !== translateEnglish(prior))) textSources.set(node, current)
    const original = textSources.get(node) ?? current
    const desired = translated(original)
    if (current !== desired) node.nodeValue = desired
  }
  const translated = (original: string) => language.value === 'en' ? translate(original) : original
  const updateElement = (element: Element) => {
    let sources = attributeSources.get(element)
    if (!sources) { sources = new Map(); attributeSources.set(element, sources) }
    for (const attribute of attributes) {
      if (attribute === 'content' && !(element instanceof HTMLMetaElement && element.name === 'description')) continue
      const current = element.getAttribute(attribute)
      if (current === null) continue
      const prior = sources.get(attribute)
      if (prior === undefined || (current !== prior && current !== translateEnglish(prior))) sources.set(attribute, current)
      const desired = translated(sources.get(attribute) ?? current)
      if (current !== desired) element.setAttribute(attribute, desired)
    }
  }
  const updateTree = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) { updateText(root as Text); return }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return
    if (root.nodeType === Node.ELEMENT_NODE) updateElement(root as Element)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) updateText(walker.currentNode as Text)
      else updateElement(walker.currentNode as Element)
    }
  }
  const render = () => {
    document.documentElement.lang = language.value
    updateTree(document.documentElement)
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') updateText(record.target as Text)
      else if (record.type === 'attributes') updateElement(record.target as Element)
      else for (const node of record.addedNodes) updateTree(node)
    }
  })
  render()
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributes })
  return { render, disconnect: () => observer.disconnect() }
}
