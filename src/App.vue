<template>
  <RouterView />

  <!-- 版本戳記：用來確認你看到的是哪一版 -->
  <div style="position:fixed;left:8px;bottom:8px;font-size:12px;opacity:.6;z-index:9999">
    Build: FINAL-2026-01-26-A
  </div>

  <FloatingLineButton />
</template>

<script setup lang="ts">
import FloatingLineButton from './components/FloatingLineButton.vue'
</script>
