<template>
  <!-- 透明提示（純顯示，不可點） -->
  <div class="order-tip" aria-hidden="true">
    <span class="tip-icon">🧾</span>
    下單完回報訂單編號
  </div>

  <!-- 浮動區 -->
  <div class="fab-wrap" :class="{ 'is-open': open }">
    <!-- 展開選單 -->
    <div v-if="open" class="fab-menu">
      <button class="fab-item" type="button" @click="goLine">
        <span class="fab-icon line">LINE</span>
        <span class="fab-text">LINE</span>
      </button>

      <button class="fab-item" type="button" @click="goTelegram">
        <span class="fab-icon tg">✈</span>
        <span class="fab-text">Telegram</span>
      </button>
    </div>

    <!-- 關閉 -->
    <button
      v-if="open"
      class="fab-close"
      type="button"
      aria-label="close"
      @click="open = false"
    >
      ×
    </button>

    <!-- 主按鈕 -->
    <button
      v-else
      class="fab-main"
      type="button"
      aria-label="LINE客服"
      @click="open = true"
    >
      <span class="fab-main-icon">LINE</span>
      <span class="fab-main-text">客服</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)

const lineUrl = 'https://lin.ee/jRkTafe'
const telegramUrl = 'https://t.me/Zero777o'

function goLine() {
  window.open(lineUrl, '_blank', 'noopener,noreferrer')
  open.value = false
}

function goTelegram() {
  window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  open.value = false
}
</script>

<style scoped>
/* ===== 下單完回報訂單編號（與 FAB 對齊） ===== */
.order-tip{
  position: fixed;
  right: 18px;
  bottom: calc(18px + 64px + 20px); /* 與 LINE 對齊的關鍵 */
  z-index: 70;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 10px 14px;
  border-radius: 16px;

  /* 玻璃感強化 */
  background: rgba(255,255,255,0.16);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);

  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 12px 26px rgba(0,0,0,.12);

  color: rgba(17,24,39,0.92);
  font-size: 12.5px;
  font-weight: 800;

  pointer-events: none;
  overflow: hidden;
}

/* 燈光波浪（加速版） */
.order-tip::before,
.order-tip::after{
  content: "";
  position: absolute;
  inset: -60% -30%;
  border-radius: 999px;
  filter: blur(14px);
  opacity: 0.9;
  mix-blend-mode: screen;
}

.order-tip::before{
  background: radial-gradient(circle at 30% 40%,
    rgba(34,197,94,0.7),
    rgba(34,197,94,0) 60%);
  animation: wave1 2.2s ease-in-out infinite;
}

.order-tip::after{
  background: radial-gradient(circle at 70% 60%,
    rgba(245,158,11,0.65),
    rgba(245,158,11,0) 60%);
  animation: wave2 3s ease-in-out infinite;
}

@keyframes wave1{
  0%   { transform: translate(-8%, -8%) rotate(0deg); }
  50%  { transform: translate(12%, 10%) rotate(18deg); }
  100% { transform: translate(-8%, -8%) rotate(0deg); }
}
@keyframes wave2{
  0%   { transform: translate(10%, 12%) rotate(0deg); }
  50%  { transform: translate(-14%, -10%) rotate(-16deg); }
  100% { transform: translate(10%, 12%) rotate(0deg); }
}

.order-tip > *{ position: relative; z-index: 1; }

/* ===== 浮動區 ===== */
.fab-wrap{
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 80;
}

.fab-wrap.is-open{
  transform: scale(0.5);
  transform-origin: right bottom;
}

/* 主按鈕 */
.fab-main{
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 0;
  background: #fff;
  box-shadow: 0 14px 30px rgba(0,0,0,.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.fab-main-icon{
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: #06c755;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
}

.fab-main-text{
  font-size: 12px;
  font-weight: 900;
}

/* ===== 展開選單 ===== */
.fab-menu{
  position: absolute;
  right: 0;
  bottom: 88px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.fab-item{
  width: 220px;
  padding: 14px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 14px 30px rgba(0,0,0,.14);
}

/* ICON +25% */
.fab-icon{
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 900;
  color: #fff;
}

.fab-icon.line{ background:#06c755; }
.fab-icon.tg{
  background:#229ed9;
  font-size: 18px;
}

.fab-text{
  font-size: 16px;
  font-weight: 900;
}

/* 關閉 */
.fab-close{
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 0;
  background:#4b5563;
  color:#fff;
  font-size:28px;
  box-shadow:0 14px 30px rgba(0,0,0,.22);
}
</style>
