<template>
    <div v-if="show" class="toast" role="status" aria-live="polite">
      <span class="dot">●</span>
      <span class="msg">{{ message }}</span>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    show: boolean
    message: string
  }>()
  </script>
  
  <style scoped>
  .toast{
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: min(520px, 92vw);
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 0 10px 24px rgba(0,0,0,.12);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10000;
  }
  
  .dot{
    color: #16a34a;
    font-size: 12px;
    line-height: 1;
  }
  
  .msg{
    font-weight: 700;
    color: #111827;
  }
  </style>
  