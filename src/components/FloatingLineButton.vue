<template>
  <!-- 透明提示（純顯示，不可點） -->
  <div class="order-tip" :class="{ dimmed: open }" aria-hidden="true">
    <span class="tip-icon">🧾</span>
    下單完回報訂單編號
  </div>

  <!-- 點空白關閉（提升使用邏輯） -->
  <button v-if="open" class="fab-backdrop" type="button" aria-label="關閉客服選單" @click="closeMenu" />

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

    <!-- 主按鈕（開關同一顆，避免視覺跳動） -->
    <button
      class="fab-main"
      :class="{ active: open }"
      type="button"
      aria-label="LINE客服"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggleMenu"
    >
      <template v-if="!open">
        <span class="fab-main-icon">LINE</span>
        <span class="fab-main-text">客服</span>
      </template>
      <span v-else class="fab-close-mark">×</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)

const lineUrl = 'https://lin.ee/9D52QW5K'
const telegramUrl = 'https://t.me/Zero777o'

function toggleMenu() {
  open.value = !open.value
}

function closeMenu() {
  open.value = false
}

function goLine() {
  window.open(lineUrl, '_blank', 'noopener,noreferrer')
  closeMenu()
}

function goTelegram() {
  window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  closeMenu()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMenu()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
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
  border-radius: 999px;

  /* 玻璃流動感 */
  background:
    linear-gradient(120deg, rgba(255,255,255,.28), rgba(255,255,255,.08) 45%, rgba(186,230,253,.2)),
    rgba(255,255,255,.14);
  backdrop-filter: blur(20px) saturate(165%);
  -webkit-backdrop-filter: blur(20px) saturate(165%);

  border: 1px solid rgba(255,255,255,0.42);
  box-shadow:
    0 14px 30px rgba(15,23,42,.16),
    inset 0 1px 0 rgba(255,255,255,.55);

  color: rgba(17,24,39,0.92);
  font-size: 12.5px;
  font-weight: 800;

  pointer-events: none;
  overflow: hidden;
  isolation: isolate;
  clip-path: inset(0 round 999px);
  transition: opacity .2s ease, transform .2s ease;
  animation: glassFlow 6s ease-in-out infinite;
}

.order-tip.dimmed{
  opacity: .42;
  transform: translateY(2px);
}

.fab-backdrop{
  position: fixed;
  inset: 0;
  z-index: 79;
  border: 0;
  background: transparent;
  padding: 0;
}

/* 燈光波浪（加速版） */
.order-tip::before,
.order-tip::after{
  content: "";
  position: absolute;
  inset: -60% -30%;
  border-radius: inherit;
  filter: blur(14px);
  opacity: 0.75;
  mix-blend-mode: screen;
}

.order-tip::before{
  background: radial-gradient(circle at 30% 40%,
    rgba(34,197,94,0.7),
    rgba(34,197,94,0) 60%);
  animation: wave1 2.6s ease-in-out infinite;
}

.order-tip::after{
  background: radial-gradient(circle at 70% 60%,
    rgba(245,158,11,0.65),
    rgba(245,158,11,0) 60%);
  animation: wave2 3.4s ease-in-out infinite;
}

@keyframes glassFlow{
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
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


/* 主按鈕 */
.fab-main{
  width: 66px;
  height: 66px;
  border-radius: 999px;
  border: 0;
  background: #fff;
  box-shadow: 0 12px 26px rgba(0,0,0,.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.fab-main:not(.active){
  animation: fabMorphHop 1s cubic-bezier(.38,.08,.24,1) infinite;
}

.fab-main::after{
  content: "";
  position: absolute;
  inset: -18%;
  border-radius: 999px;
  background: conic-gradient(
    from 0deg,
    rgba(59,130,246,.08),
    rgba(16,185,129,.12),
    rgba(59,130,246,.08)
  );
  opacity: .7;
  animation: fabLightSpin 3.4s linear infinite;
}

.fab-main > *{
  position: relative;
  z-index: 1;
}

.fab-main:active{
  transform: scale(.97);
}

.fab-main.active{
  background:
    radial-gradient(circle at 32% 26%, rgba(255,255,255,.34), rgba(255,255,255,0) 46%),
    linear-gradient(145deg, #5b6f86, #3f546b 58%, #31475d);
  color: #fff;
  box-shadow:
    0 14px 28px rgba(15,23,42,.34),
    inset 0 1px 0 rgba(255,255,255,.24);
  animation: slimeXHop 1s cubic-bezier(.39,.08,.22,1) infinite;
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

.fab-close-mark{
  font-size: 29px;
  font-weight: 600;
  line-height: 1;
  animation: xBreath 1s ease-in-out infinite;
}

@keyframes fabMorphHop{
  0%, 100% {
    transform: translateY(0) scale(1, 1);
    border-radius: 999px;
  }
  16% {
    transform: translateY(0) scale(1.06, .93);
    border-radius: 28px 28px 24px 24px;
  }
  34% {
    transform: translateY(-6px) scale(.95, 1.05);
    border-radius: 999px;
  }
  52% {
    transform: translateY(0) scale(1.03, .96);
    border-radius: 26px 26px 30px 30px;
  }
  70% {
    transform: translateY(-2px) scale(.99, 1.01);
    border-radius: 999px;
  }
}

@keyframes fabLightSpin{
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slimeXHop{
  0%, 100% {
    transform: translateY(0) scale(1, 1);
    border-radius: 999px;
  }
  18% {
    transform: translateY(0) scale(1.12, .88);
    border-radius: 28px 28px 22px 22px;
  }
  36% {
    transform: translateY(-7px) scale(.9, 1.1);
    border-radius: 999px;
  }
  56% {
    transform: translateY(0) scale(1.08, .92);
    border-radius: 20px 20px 30px 30px;
  }
  78% {
    transform: translateY(-2px) scale(.98, 1.02);
    border-radius: 999px;
  }
}

@keyframes xBreath{
  0%, 100% { transform: scale(1); opacity: .96; }
  50% { transform: scale(1.08); opacity: 1; }
}

/* ===== 展開選單 ===== */
.fab-menu{
  position: absolute;
  right: 0;
  bottom: 76px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fab-item{
  width: 168px;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.5);
  background:
    linear-gradient(120deg, rgba(255,255,255,.7), rgba(255,255,255,.32) 45%, rgba(191,219,254,.45)),
    rgba(255,255,255,.28);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow:
    0 10px 22px rgba(15,23,42,.17),
    inset 0 1px 0 rgba(255,255,255,.52);
  cursor: pointer;
  transition: transform .16s ease, box-shadow .16s ease;
  position: relative;
  overflow: hidden;
}

.fab-item::before{
  content: "";
  position: absolute;
  inset: -45% -28%;
  border-radius: 999px;
  background: linear-gradient(
    110deg,
    rgba(255,255,255,0) 10%,
    rgba(255,255,255,.52) 46%,
    rgba(255,255,255,0) 85%
  );
  transform: translateX(-62%) rotate(5deg);
  animation: menuGlassSweep 2.8s ease-in-out infinite;
}

.fab-item > *{
  position: relative;
  z-index: 1;
}

.fab-item:hover{
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15,23,42,.22);
}

.fab-item:active{
  transform: scale(.98);
}

.fab-icon{
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #fff;
  flex: 0 0 32px;
}

.fab-icon.line{ background:#06c755; }
.fab-icon.tg{
  background:#229ed9;
  font-size: 14px;
}

.fab-text{
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

@keyframes menuGlassSweep{
  0%, 100% {
    transform: translateX(-62%) rotate(5deg);
    opacity: .72;
  }
  50% {
    transform: translateX(58%) rotate(5deg);
    opacity: .98;
  }
}

@media (prefers-reduced-motion: reduce){
  .order-tip,
  .order-tip::before,
  .order-tip::after,
  .fab-main:not(.active),
  .fab-main.active,
  .fab-main::after,
  .fab-close-mark,
  .fab-item::before{
    animation: none !important;
  }
}

@media (max-width: 520px){
  .fab-main{
    border-radius: 50%;
    animation: none !important;
    transform: none !important;
  }
}

</style>
