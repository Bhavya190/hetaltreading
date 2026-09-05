'use client'

import { useEffect } from 'react'

export default function AutoCapitalizeInputs() {
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement
      if (!target) return

      const tagName = target.tagName.toLowerCase()
      if (tagName !== 'input' && tagName !== 'textarea') return

      const type = (target.getAttribute('type') || 'text').toLowerCase()
      if (
        ['email', 'password', 'number', 'date', 'time', 'checkbox', 'radio', 'file', 'hidden'].includes(type)
      ) {
        return
      }

      if (
        target.classList.contains('normal-case') ||
        target.classList.contains('font-mono') ||
        target.classList.contains('no-capitalize')
      ) {
        return
      }

      const val = target.value
      if (!val) return

      // Capitalize first letter of each word
      const capitalized = val.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())

      if (val !== capitalized) {
        const start = target.selectionStart
        const end = target.selectionEnd

        target.value = capitalized

        // Preserve cursor selection position
        if (start !== null && end !== null && typeof target.setSelectionRange === 'function') {
          try {
            target.setSelectionRange(start, end)
          } catch (_) {}
        }
      }
    }

    document.addEventListener('input', handleInput, true)
    return () => {
      document.removeEventListener('input', handleInput, true)
    }
  }, [])

  return null
}
