import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Reports whether the current viewport uses the mobile layout.
 *
 * This hook does not render anything or change the layout on its own. It simply
 * converts the browser media query into a boolean value (`true` or
 * `false`) that React components can read.
 *
 * `Sidebar` uses this value to choose between two behaviors:
 * - desktop: navigation stays fixed on the side;
 * - mobile: navigation becomes a drawer that opens and closes.
 *
 * `matchMedia` is a browser API that tracks a CSS rule in
 * JavaScript. Since the result can change when the window is resized,
 * `useSyncExternalStore` subscribes to the `change` event and asks React
 * to read the value again. It suits data maintained by a source outside React,
 * avoiding copying that value into `useState` inside a `useEffect`.
 */
export function useIsMobile() {
  // useSyncExternalStore models this situation well: matchMedia is
  // external state, so we do not need to update React state
  // synchronously inside a useEffect.
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(MEDIA_QUERY)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(MEDIA_QUERY).matches,
    () => false,
  )
}
