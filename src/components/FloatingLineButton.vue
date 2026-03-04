<template>
  <button v-if="open" class="fab-backdrop" type="button" aria-label="關閉客服選單" @click="closeMenu"></button>

  <!-- 透明提示（純顯示，不可點） -->
  <div class="order-tip" aria-hidden="true">
    <span class="tip-icon">🧾</span>
    下單完回報訂單編號
  </div>

  <!-- 浮動區 -->
  <div class="fab-wrap" :class="{ 'is-open': open, 'is-switching': switching }">
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
      @click="closeMenu"
    >
      ×
    </button>

    <!-- 主按鈕 -->
    <button
      v-else
      class="fab-main"
      type="button"
      aria-label="LINE客服"
      @click="openMenu"
    >
      <span class="fab-main-icon">LINE</span>
      <span class="fab-main-text">客服</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const switching = ref(false)
let switchTimer: number | null = null

const lineUrl = 'https://lin.ee/jRkTafe'
const telegramUrl = 'https://t.me/Zero777o'

function openMenu() {
  if (switchTimer !== null) window.clearTimeout(switchTimer)
  switching.value = true
  open.value = true
  switchTimer = window.setTimeout(() => {
    switching.value = false
    switchTimer = null
  }, 220)
}

function closeMenu() {
  if (switchTimer !== null) window.clearTimeout(switchTimer)
  switching.value = true
  open.value = false
  switchTimer = window.setTimeout(() => {
    switching.value = false
    switchTimer = null
  }, 220)
}

function goLine() {
  window.open(lineUrl, '_blank', 'noopener,noreferrer')
  closeMenu()
}

function goTelegram() {
  window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  closeMenu()
}
</script>

<style scoped>
.fab-backdrop{
  position: fixed;
  inset: 0;
  z-index: 75;
  border: 0;
  background: transparent;
  -webkit-tap-highlight-color: transparent;
}

/* ===== 下單完回報訂單編號（與 FAB 對齊） ===== */
.order-tip{
  position: fixed;
  right: 18px;
  bottom: calc(18px + 64px + 20px); /* 與 LINE 對齊的關鍵 */
  z-index: 76;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 10px 14px;
  border-radius: 16px;

  background: linear-gradient(140deg, rgba(255,255,255,0.46), rgba(255,255,255,0.2));
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.52);
  box-shadow: 0 12px 24px rgba(0,0,0,.12);

  color: rgba(17,24,39,0.92);
  font-size: 12.5px;
  font-weight: 800;

  pointer-events: none;
  overflow: hidden;
}

/* 燈光波浪 */
.order-tip::before,
.order-tip::after{
  content: "";
  position: absolute;
  inset: -80% -35%;
  border-radius: 999px;
  filter: blur(14px);
  opacity: 0.72;
  mix-blend-mode: screen;
}

.order-tip::before{
  background: radial-gradient(circle at 26% 42%,
    rgba(34,197,94,0.66),
    rgba(34,197,94,0) 60%);
  animation: wave1 2.6s ease-in-out infinite;
}

.order-tip::after{
  background: radial-gradient(circle at 74% 58%,
    rgba(99,102,241,0.5),
    rgba(245,158,11,0) 60%);
  animation: wave2 3.4s ease-in-out infinite;
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
  isolation: isolate;
}

/* 切換瞬間暫停動畫，避免手機重繪殘影 */
.fab-wrap.is-switching .fab-main,
.fab-wrap.is-switching .fab-close,
.fab-wrap.is-switching .fab-item{
  animation: none !important;
  transform: translateZ(0) scale(1) !important;
}
.fab-wrap.is-switching .fab-item::before,
.fab-wrap.is-switching .fab-item::after{
  animation: none !important;
  opacity: .35;
}

/* 主按鈕 */
.fab-main{
  width: 68px;
  height: 68px;
  border-radius: 999px;
  border: 0;
  background: #fff;
  box-shadow: 0 12px 24px rgba(0,0,0,.16);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transform-origin: 50% 62%;
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  contain: paint;
  animation:
    slimeDriftMain 2.43s cubic-bezier(.36,.06,.25,1) infinite;
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
  gap: 12px;
}

.fab-item{
  width: min(76vw, 230px);
  min-height: 50px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.56);
  background: linear-gradient(145deg, rgba(255,255,255,0.54), rgba(255,255,255,0.22));
  backdrop-filter: blur(14px) saturate(145%);
  -webkit-backdrop-filter: blur(14px) saturate(145%);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 22px rgba(0,0,0,.13);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
  transform-origin: 52% 60%;
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  contain: paint;
  animation:
    slimeDriftItem var(--drift-dur, 2.08s) cubic-bezier(.36,.06,.25,1) infinite;
}
.fab-item:nth-child(1){
  --sway: -4px;
  --tilt: -1.4deg;
  --drift-dur: 2.21s;
  --breath-dur: 3.73s;
  animation-delay: -0.37s, -1.18s;
}
.fab-item:nth-child(2){
  --sway: 5px;
  --tilt: 1.8deg;
  --drift-dur: 1.93s;
  --breath-dur: 3.19s;
  animation-delay: -1.02s, -0.45s;
}

.fab-item::before,
.fab-item::after{
  content: "";
  position: absolute;
  inset: -95% -40%;
  border-radius: 999px;
  filter: blur(14px);
  opacity: .6;
  pointer-events: none;
}

.fab-item::before{
  background: radial-gradient(circle at 28% 42%, rgba(16,185,129,.58), rgba(16,185,129,0) 62%);
  animation: wave1 2.8s ease-in-out infinite;
}

.fab-item::after{
  background: radial-gradient(circle at 72% 58%, rgba(96,165,250,.52), rgba(96,165,250,0) 62%);
  animation: wave2 3.2s ease-in-out infinite;
}

.fab-icon{
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 900;
  color: #fff;
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
}

.fab-icon.line{ background:#06c755; }
.fab-icon.tg{
  background:#229ed9;
  font-size: 18px;
}

.fab-text{
  font-size: 14px;
  font-weight: 900;
  position: relative;
  z-index: 1;
}

/* 關閉 */
.fab-close{
  width: 68px;
  height: 68px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #fff;
  color:#000;
  font-size:28px;
  box-shadow:0 12px 24px rgba(0,0,0,.2);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.fab-main:active,
.fab-close:active,
.fab-item:active{
  transform: translateZ(0) scale(0.97);
}

@keyframes slimeDriftMain{
  0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1); }
  13% { transform: translate3d(-4px, -1px, 0) rotate(-1deg) scale(1.03, .97); }
  29% { transform: translate3d(3px, -2px, 0) rotate(1deg) scale(.98, 1.03); }
  47% { transform: translate3d(-2px, -1px, 0) rotate(-1deg) scale(1.01, .99); }
  63% { transform: translate3d(4px, -2px, 0) rotate(1deg) scale(1.03, .97); }
  78% { transform: translate3d(-3px, -1px, 0) rotate(-1deg) scale(.99, 1.02); }
  100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1); }
}

@keyframes slimeDriftItem{
  0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1,1); }
  17% { transform: translate3d(var(--sway, 4px), -2px, 0) rotate(var(--tilt, 1deg)) scale(1.03,.97); }
  34% { transform: translate3d(calc(var(--sway, 4px) * -0.5), -1px, 0) rotate(calc(var(--tilt, 1deg) * -0.7)) scale(.98,1.03); }
  52% { transform: translate3d(calc(var(--sway, 4px) * 0.7), -2px, 0) rotate(calc(var(--tilt, 1deg) * 0.8)) scale(1.02,.99); }
  71% { transform: translate3d(calc(var(--sway, 4px) * -0.4), -1px, 0) rotate(calc(var(--tilt, 1deg) * -0.45)) scale(.99,1.02); }
  100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1,1); }
}

@keyframes slimeMobileMain{
  0% { transform: translate3d(0,0,0) rotate(0deg) skew(0deg,0deg) scale(1,1); }
  11% { transform: translate3d(-3px,-1px,0) rotate(-1.2deg) skew(-0.8deg,0.4deg) scale(1.02,.98); }
  26% { transform: translate3d(2px,-2px,0) rotate(1deg) skew(0.7deg,-0.3deg) scale(.99,1.02); }
  44% { transform: translate3d(-1px,-1px,0) rotate(-0.8deg) skew(-0.5deg,0.2deg) scale(1.01,.99); }
  63% { transform: translate3d(4px,-2px,0) rotate(1.3deg) skew(0.9deg,-0.4deg) scale(1.02,.98); }
  79% { transform: translate3d(-2px,-1px,0) rotate(-1deg) skew(-0.7deg,0.3deg) scale(.99,1.01); }
  100% { transform: translate3d(0,0,0) rotate(0deg) skew(0deg,0deg) scale(1,1); }
}

@keyframes slimeMobileItem{
  0% { transform: translate3d(0,0,0) rotate(0deg) skew(0deg,0deg) scale(1,1); }
  14% { transform: translate3d(var(--sway, 3px),-1px,0) rotate(var(--tilt,1deg)) skew(0.9deg,-0.3deg) scale(1.02,.98); }
  33% { transform: translate3d(calc(var(--sway, 3px) * -0.45),-1px,0) rotate(calc(var(--tilt,1deg) * -0.65)) skew(-0.8deg,0.35deg) scale(.99,1.02); }
  51% { transform: translate3d(calc(var(--sway, 3px) * 0.78),-2px,0) rotate(calc(var(--tilt,1deg) * 0.85)) skew(0.7deg,-0.25deg) scale(1.01,.99); }
  74% { transform: translate3d(calc(var(--sway, 3px) * -0.32),0,0) rotate(calc(var(--tilt,1deg) * -0.4)) skew(-0.5deg,0.2deg) scale(1,.999); }
  100% { transform: translate3d(0,0,0) rotate(0deg) skew(0deg,0deg) scale(1,1); }
}

@media (max-width: 640px){
  .order-tip{
    right: 12px;
    bottom: calc(12px + 72px + 14px);
    padding: 9px 12px;
    font-size: 12px;
  }

  .fab-wrap{
    right: 12px;
    bottom: 12px;
  }

  .fab-main,
  .fab-close{
    width: 70px;
    height: 70px;
  }

  .fab-close{
    background: #fff;
  }

  .fab-item{
    width: min(70vw, 198px);
    min-height: 52px;
    padding: 10px 11px;
    gap: 9px;
  }

  .fab-icon{
    width: 33px;
    height: 33px;
    border-radius: 10px;
  }

  .fab-text{
    font-size: 13px;
  }

  /* 手機端：不規則扭曲節奏，避免機械式重複 */
  .fab-main{
    animation: slimeMobileMain 2.79s cubic-bezier(.36,.06,.25,1) infinite;
  }

  .fab-item{
    animation: slimeMobileItem var(--m-drift, 2.43s) cubic-bezier(.36,.06,.25,1) infinite;
  }

  .fab-item:nth-child(1){
    --m-drift: 2.57s;
    --sway: -3.5px;
    --tilt: -1.3deg;
    animation-delay: -0.92s;
  }

  .fab-item:nth-child(2){
    --m-drift: 2.17s;
    --sway: 4.2px;
    --tilt: 1.6deg;
    animation-delay: -0.38s;
  }

  /* 手機效能優化：保留玻璃感，降低大範圍流光重繪 */
  .fab-item::before,
  .fab-item::after{
    opacity: .42;
    filter: blur(10px);
  }

  .order-tip::before,
  .order-tip::after{
    opacity: .52;
    filter: blur(10px);
  }
}

@media (prefers-reduced-motion: reduce){
  .fab-main,
  .fab-item,
  .order-tip::before,
  .order-tip::after,
  .fab-item::before,
  .fab-item::after{
    animation: none !important;
  }
}
</style>
