import { useRef, useLayoutEffect, useEffect, forwardRef, type TextareaHTMLAttributes } from 'react'

export const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AutoGrowTextarea({ value, style, onChange, rows = 2, ...rest }, ref) {
    const innerRef = useRef<HTMLTextAreaElement>(null)
    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
    }
    const resize = () => {
      const el = innerRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    useLayoutEffect(resize, [value])
    useEffect(() => {
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }, [])
    return (
      <textarea
        ref={setRefs}
        value={value}
        rows={rows}
        onChange={(e) => { onChange?.(e); resize() }}
        style={{ resize: 'none', overflow: 'hidden', ...style }}
        {...rest}
      />
    )
  },
)
