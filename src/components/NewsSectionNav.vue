<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const section = computed(() => route.path.startsWith('/activities') ? 'activities' : 'notices')
</script>

<template>
  <nav class="section-nav" aria-label="소식 메뉴">
    <RouterLink to="/notices" :aria-current="section === 'notices' ? 'page' : undefined">공지사항</RouterLink>
    <RouterLink to="/activities" :aria-current="section === 'activities' ? 'page' : undefined">활동소식</RouterLink>
  </nav>
</template>

<style scoped>
.section-nav { display: flex; gap: 0; margin-bottom: 58px; border-bottom: 2px solid #0d47a1; }
.section-nav a { flex: 1; padding: 16px; color: #0d47a1; font-weight: 700; text-align: center; text-decoration: none; }
.section-nav a[aria-current="page"] { background: #0d47a1; color: #fff; }
.section-nav a:hover:not([aria-current="page"]) { background: #eaf2ff; }
.section-nav a:focus-visible { outline: 2px solid #0d47a1; outline-offset: 3px; }
@media (max-width: 600px) {
  .section-nav { margin-bottom: 36px; }
  .section-nav a { padding: 13px 5px; font-size: 14px; }
}
</style>
