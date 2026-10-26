<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export type NewsListItem = {
  path: string
  title: string
  date: string
  datetime: string
  pinned?: boolean
}

const props = defineProps<{
  items: NewsListItem[]
  listLabel: string
  dateLabel: string
  emptyMessage: string
}>()

const query = ref('')
const page = ref(1)
const pageSize = 10
const ordered = computed(() => [...props.items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.datetime.localeCompare(a.datetime)))
const filtered = computed(() => ordered.value.filter(item => item.title.toLocaleLowerCase('ko').includes(query.value.trim().toLocaleLowerCase('ko'))))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const itemNumber = (item: NewsListItem) => {
  const regular = ordered.value.filter(entry => !entry.pinned)
  return regular.length - regular.findIndex(entry => entry.path === item.path)
}
watch(query, () => { page.value = 1 })
</script>

<template>
  <form class="news-search" role="search" @submit.prevent>
    <label for="news-keyword">제목 검색</label>
    <input id="news-keyword" v-model="query" type="search" placeholder="제목을 입력하세요" />
  </form>

  <div class="news-list" role="list" :aria-label="listLabel">
    <div class="list-head" aria-hidden="true"><span>번호</span><span>제목</span><span>{{ dateLabel }}</span></div>
    <RouterLink v-for="item in visible" :key="item.path" class="news-row" :class="{ 'is-pinned': item.pinned }" role="listitem" :to="item.path">
      <span class="news-number"><span v-if="item.pinned" class="pinned">공지</span><template v-else>{{ itemNumber(item) }}</template></span>
      <span class="news-title">{{ item.title }}</span>
      <time :datetime="item.datetime">{{ item.date }}</time>
    </RouterLink>
    <p v-if="items.length === 0" class="empty-state">{{ emptyMessage }}</p>
    <p v-else-if="visible.length === 0" class="empty-state">검색 결과가 없습니다.</p>
  </div>

  <nav v-if="totalPages > 1" class="pagination" :aria-label="`${listLabel} 페이지`">
    <button type="button" :disabled="page === 1" @click="page--">이전</button>
    <span>{{ page }} / {{ totalPages }}</span>
    <button type="button" :disabled="page === totalPages" @click="page++">다음</button>
  </nav>
</template>

<style scoped>
.news-search { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-bottom: 18px; }
.news-search label { font-weight: 600; white-space: nowrap; }
.news-search input { width: min(100%, 300px); min-height: 42px; padding: 8px 12px; border: 1px solid #ced8e5; border-radius: 8px; font: inherit; }
.news-list { border-top: 2px solid #344052; }
.list-head, .news-row { display: grid; grid-template-columns: 90px minmax(0, 1fr) 130px; align-items: center; gap: 16px; }
.list-head { padding: 14px 20px; border-bottom: 1px solid #dce7f5; font-weight: 700; text-align: center; }
.news-row { min-height: 64px; padding: 15px 20px; border-bottom: 1px solid #e5edf8; color: inherit; text-decoration: none; }
.news-row.is-pinned { background: #f0f5fc; }
.news-row:hover { background: #f5f9ff; }
.news-number, .news-row time { text-align: center; font-size: 14px; color: #526b8a; }
.pinned { display: inline-block; padding: 3px 10px; border-radius: 5px; background: #dceaff; color: #0d47a1; font-weight: 700; }
.news-title { font-weight: 600; line-height: 1.5; word-break: keep-all; }
.empty-state { margin: 0; padding: 56px 16px; text-align: center; border-bottom: 1px solid #e5edf8; color: #697586; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 32px; }
.pagination button { padding: 8px 16px; border: 1px solid #ced8e5; border-radius: 6px; background: #fff; color: #0d47a1; font: inherit; cursor: pointer; }
.pagination button:disabled { color: #9aa6b5; cursor: default; }
.news-row:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid #0d47a1; outline-offset: 3px; }
@media (max-width: 600px) {
  .news-search { justify-content: stretch; }
  .news-search input { flex: 1; width: 0; }
  .list-head, .news-row { grid-template-columns: 52px minmax(0, 1fr) 82px; gap: 8px; }
  .list-head, .news-row { padding-left: 8px; padding-right: 8px; }
  .news-number, .news-row time { font-size: 12px; }
  .news-title { font-size: 14px; }
  .pinned { padding: 3px 5px; }
}
</style>
