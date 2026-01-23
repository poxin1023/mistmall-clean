<template>
    <HeaderBar />
  
    <div class="container">
      <h2 style="margin: 16px 0;">公告</h2>
  
      <div class="panel panel-pad">
        <div style="font-weight: 800; font-size: 16px;">最新公告</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 13px;">
          下單完回傳訂單編號
          代理批發團購合購LINE+0669883。
        </div>
  
        <button class="btn" style="margin-top: 12px;" @click="goBack">
          立即返回
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import HeaderBar from '../components/HeaderBar.vue'
  
  const router = useRouter()
  
  function goBack() {
    router.replace('/products')
  }
  
  onMounted(() => {
    window.setTimeout(() => {
      router.replace('/products')
    }, 3000)
  })
  </script>
  