<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let hideTimer: number | null = null
let toastEl: HTMLDivElement | null = null

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

function clickHandler(e: Event) {
  const target = e.target as HTMLElement
  if (!target) return
  // Only act on inline code
  if (!isInlineCode(target)) return

  const text = target.textContent ?? ''
  if (!text) return

  copyText(text).then((ok) => {
    if (ok) {
      // Visual feedback on the code itself
      target.classList.add('inline-code-copied')
      window.setTimeout(() => target.classList.remove('inline-code-copied'), 300)
      showToast('已复制')
    } else {
      showToast('复制失败')
    }
  })
}

onMounted(() => {
  const container = document.querySelector('#VPContent')
  container?.addEventListener('click', clickHandler)
})

onUnmounted(() => {
  const container = document.querySelector('#VPContent')
  container?.removeEventListener('click', clickHandler)
})
</script>

<template></template>

