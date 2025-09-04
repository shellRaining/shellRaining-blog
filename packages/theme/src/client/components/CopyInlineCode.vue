<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let hideTimer: number | null = null
let toastEl: HTMLDivElement | null = null
let pressedEl: HTMLElement | null = null
let pressReleaseTimer: number | null = null

function ensureToast() {
  if (toastEl) return toastEl
  const el = document.createElement('div')
  el.className = 'inline-copy-toast'
  el.setAttribute('role', 'status')
  el.style.pointerEvents = 'none'
  el.textContent = '已复制'
  document.body.appendChild(el)
  toastEl = el
  return el
}

function showToast(message = '已复制') {
  const el = ensureToast()
  el.textContent = message
  el.classList.add('show')
  if (hideTimer) window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    el.classList.remove('show')
  }, 1200)
}

function isInlineCode(el: HTMLElement) {
  if (el.tagName !== 'CODE') return false
  // Exclude fenced code blocks: pre > code
  let p: HTMLElement | null = el
  while (p) {
    if (p.tagName === 'PRE') return false
    p = p.parentElement
  }
  return true
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.top = '-1000px'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    return true
  } catch {
    return false
  }
}

// CSS-only pulse via class; avoid DOM overlays to prevent layout quirks

function clickHandler(e: Event) {
  const target = e.target as HTMLElement
  if (!target) return
  // Only act on inline code
  if (!isInlineCode(target)) return

  const text = target.textContent ?? ''
  if (!text) return

  // Cancel pending press-release removal to avoid flicker
  if (pressReleaseTimer) {
    window.clearTimeout(pressReleaseTimer)
    pressReleaseTimer = null
  }
  // Add copied highlight and pulse, then remove press state to avoid gap
  target.classList.add('inline-code-copied', 'inline-code-pulse')
  target.classList.remove('inline-code-active')
  pressedEl = null

  copyText(text).then((ok) => {
    if (ok) {
      // Remove copied highlight after a short delay; pulse auto-ends via CSS
      window.setTimeout(() => target.classList.remove('inline-code-copied', 'inline-code-pulse'), 320)
      showToast('已复制')
    } else {
      showToast('复制失败')
    }
  })
}

function mousedownHandler(e: Event) {
  const target = e.target as HTMLElement
  if (!target) return
  if (!isInlineCode(target)) return
  // Immediate visual feedback
  target.classList.add('inline-code-active')
  pressedEl = target
}

function mouseupHandler() {
  if (pressReleaseTimer) window.clearTimeout(pressReleaseTimer)
  // Delay removal slightly so click handler can run first
  pressReleaseTimer = window.setTimeout(() => {
    if (pressedEl) {
      pressedEl.classList.remove('inline-code-active')
      pressedEl = null
    }
  }, 120)
}

onMounted(() => {
  const container = document.querySelector('#VPContent')
  container?.addEventListener('click', clickHandler)
  container?.addEventListener('mousedown', mousedownHandler)
  window.addEventListener('mouseup', mouseupHandler)
})

onUnmounted(() => {
  const container = document.querySelector('#VPContent')
  container?.removeEventListener('click', clickHandler)
  container?.removeEventListener('mousedown', mousedownHandler)
  window.removeEventListener('mouseup', mouseupHandler)
})
</script>

<template></template>
