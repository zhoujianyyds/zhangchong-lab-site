<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const bursts = ref([])
const canvasRef = ref(null)
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
let reduceMotion = motionPreference.matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
const cards = '.research-card,.member-group,.output-group,.tool-card,.public-output-card,.member-achievement-item,.mentor-output-panel'
const reveals = '.section-title,.research-card,.pi-panel,.member-group,.output-group,.tool-card,.mentor-output-panel,.public-member-card,.public-output-section,.member-achievements,.hero-copy,.mentor-hero-copy,.tool-page-header,.public-outputs-header,.login-box,.register-box,.tool-form,.password-panel,.chat-panel,.member-table-wrap,.member-stats,.tool-empty'
let id = 0
let frame = 0
let particles = []
let pointer = { x: -1000, y: -1000 }
let revealObserver
let countObserver
let mutationObserver

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  document.documentElement.style.setProperty('--scroll-progress', String(max > 0 ? window.scrollY / max : 0))
}

function pointerMove(event) {
  if (reduceMotion || !finePointer.matches || event.pointerType === 'touch') return
  pointer = { x: event.clientX, y: event.clientY }
  document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`)
  document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`)
  if (reduceMotion) return
  const card = event.target.closest?.(cards)
  document.querySelectorAll('.is-tech-tilting').forEach((node) => node !== card && node.classList.remove('is-tech-tilting'))
  if (card) {
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - .5) * -7}deg`)
    card.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 7}deg`)
    card.style.setProperty('--shine-x', `${((event.clientX - rect.left) / rect.width) * 100}%`)
    card.style.setProperty('--shine-y', `${((event.clientY - rect.top) / rect.height) * 100}%`)
    card.classList.add('is-tech-tilting')
  }
  const button = event.target.closest?.('.button,.icon-button,.icon-btn')
  document.querySelectorAll('.is-tech-magnetic').forEach((node) => node !== button && node.classList.remove('is-tech-magnetic'))
  if (button && !button.disabled) {
    const rect = button.getBoundingClientRect()
    button.style.setProperty('--magnet-x', `${(event.clientX - rect.left - rect.width / 2) * .13}px`)
    button.style.setProperty('--magnet-y', `${(event.clientY - rect.top - rect.height / 2) * .13}px`)
    button.classList.add('is-tech-magnetic')
  }
}

function pointerDown(event) {
  if (event.button !== 0 || reduceMotion) return
  document.documentElement.style.setProperty('--click-x', `${event.clientX}px`)
  document.documentElement.style.setProperty('--click-y', `${event.clientY}px`)
  const burstId = ++id
  bursts.value.push({ id: burstId, x: event.clientX, y: event.clientY })
  setTimeout(() => { bursts.value = bursts.value.filter((item) => item.id !== burstId) }, 850)
}

function animateCount(node) {
  const target = Number(String(node.textContent).replace(/\D/g, ''))
  if (!Number.isFinite(target) || node.dataset.counted) return
  node.dataset.counted = '1'
  if (reduceMotion) return
  const start = performance.now()
  function tick(now) {
    const progress = Math.min(1, (now - start) / 900)
    node.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))))
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)]
}

function observe(root = document) {
  matching(root, reveals).forEach((node, index) => {
    if (node.dataset.revealReady) return
    node.dataset.revealReady = '1'
    node.style.setProperty('--reveal-delay', `${(index % 6) * 55}ms`)
    if (reduceMotion) node.classList.add('is-tech-visible')
    else revealObserver.observe(node)
  })
  matching(root, '.stats-strip strong,.mentor-stats strong').forEach((node) => countObserver.observe(node))
}

function revealHashTarget() {
  if (!location.hash) return
  let target
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))) } catch { return }
  if (!target) return
  if (target.dataset.revealReady) target.classList.add('is-tech-visible')
  target.querySelectorAll?.('[data-reveal-ready="1"]').forEach((node) => node.classList.add('is-tech-visible'))
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ratio = Math.min(devicePixelRatio || 1, 2)
  canvas.width = innerWidth * ratio
  canvas.height = innerHeight * ratio
  particles = Array.from({ length: Math.min(42, Math.max(18, Math.round(innerWidth / 45))) }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
  }))
}

function draw() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || reduceMotion) return
  const ratio = Math.min(devicePixelRatio || 1, 2)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles.forEach((p) => {
    const dx = pointer.x * ratio - p.x, dy = pointer.y * ratio - p.y, distance = Math.hypot(dx, dy)
    if (distance < 180 * ratio && distance > 1) { p.vx += dx / distance * .003; p.vy += dy / distance * .003 }
    p.x += p.vx; p.y += p.vy
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    ctx.fillStyle = 'rgba(0,168,143,.34)'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill()
  })
  particles.forEach((a, i) => particles.slice(i + 1).forEach((b) => {
    const distance = Math.hypot(a.x - b.x, a.y - b.y)
    if (distance > 125 * ratio) return
    ctx.strokeStyle = `rgba(37,99,235,${.12 * (1 - distance / (125 * ratio))})`
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
  }))
  frame = requestAnimationFrame(draw)
}

function resetPointer() {
  document.querySelectorAll('.is-tech-tilting,.is-tech-magnetic').forEach((node) => {
    node.classList.remove('is-tech-tilting', 'is-tech-magnetic')
  })
}

function updateMotion() {
  reduceMotion = motionPreference.matches
  cancelAnimationFrame(frame)
  resetPointer()
  if (reduceMotion) {
    document.querySelectorAll('[data-reveal-ready]').forEach((node) => node.classList.add('is-tech-visible'))
  } else if (!document.hidden) draw()
}

onMounted(() => {
  revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-tech-visible'); revealObserver.unobserve(entry.target) }
  }), { threshold: .08 })
  countObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { animateCount(entry.target); countObserver.unobserve(entry.target) }
  }), { threshold: .4 })
  mutationObserver = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => node.nodeType === 1 && observe(node))))
  observe(); revealHashTarget(); mutationObserver.observe(document.body, { childList: true, subtree: true })
  resizeCanvas(); draw(); scrollProgress()
  motionPreference.addEventListener('change', updateMotion)
  document.addEventListener('visibilitychange', updateMotion)
  document.addEventListener('pointerleave', resetPointer)
  window.addEventListener('blur', resetPointer)
  addEventListener('resize', resizeCanvas); addEventListener('scroll', scrollProgress, { passive: true })
  addEventListener('hashchange', revealHashTarget)
  addEventListener('pointermove', pointerMove, { passive: true }); addEventListener('pointerdown', pointerDown, { passive: true })
})

onBeforeUnmount(() => {
  motionPreference.removeEventListener('change', updateMotion)
  document.removeEventListener('visibilitychange', updateMotion)
  document.removeEventListener('pointerleave', resetPointer)
  window.removeEventListener('blur', resetPointer)
  cancelAnimationFrame(frame); revealObserver?.disconnect(); countObserver?.disconnect(); mutationObserver?.disconnect()
  removeEventListener('resize', resizeCanvas); removeEventListener('scroll', scrollProgress)
  removeEventListener('hashchange', revealHashTarget)
  removeEventListener('pointermove', pointerMove); removeEventListener('pointerdown', pointerDown)
})
</script>

<template>
  <div class="tech-ambient" aria-hidden="true">
    <span></span><span></span>
    <i class="tech-orbit tech-orbit-one"></i>
    <i class="tech-orbit tech-orbit-two"></i>
    <i class="tech-grid-sweep"></i>
  </div>
  <div class="tech-atmosphere" aria-hidden="true">
    <canvas ref="canvasRef" class="tech-particle-canvas"></canvas>
    <div class="tech-pointer-glow"></div><div class="tech-scanline"></div><div class="tech-scroll-progress"></div>
    <div v-for="burst in bursts" :key="burst.id" class="tech-click-burst" :style="{ left: `${burst.x}px`, top: `${burst.y}px` }">
      <span class="tech-click-ring"></span><i v-for="index in 8" :key="index" :style="{ '--spark-index': index - 1 }"></i>
    </div>
  </div>
</template>
