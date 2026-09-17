/**
 * A small browser media-query store for jsdom.
 *
 * matchMedia must return the same object for a given query. Otherwise a hook
 * that subscribes to one object can read another and miss viewport changes.
 */
export function createMatchMediaController() {
  // Legacy addListener and EventTarget listeners have different TypeScript
  // callback signatures, but both consume the same change event at runtime.
  const queries = new Map<
    string,
    { list: MediaQueryList; listeners: Set<unknown> }
  >()

  function matchMedia(media: string): MediaQueryList {
    const existing = queries.get(media)
    if (existing) return existing.list

    const listeners = new Set<unknown>()
    const list: MediaQueryList = {
      matches: false,
      media,
      onchange: null,
      addListener: (listener) => {
        if (listener) listeners.add(listener)
      },
      removeListener: (listener) => {
        if (listener) listeners.delete(listener)
      },
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject | null) => {
        if (listener) listeners.add(listener)
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject | null) => {
        if (listener) listeners.delete(listener)
      },
      dispatchEvent(event) {
        for (const listener of listeners) {
          if (typeof listener === 'function') (listener as EventListener)(event)
          else if (listener && typeof listener === 'object' && 'handleEvent' in listener) {
            (listener as EventListenerObject).handleEvent(event)
          }
        }
        this.onchange?.(event as MediaQueryListEvent)
        return !event.defaultPrevented
      },
    }
    queries.set(media, { list, listeners })
    return list
  }

  function setMatches(media: string, matches: boolean) {
    const list = matchMedia(media)
    if (list.matches === matches) return
    Object.defineProperty(list, 'matches', { value: matches, configurable: true })
    const event = Object.assign(new Event('change'), { matches, media })
    list.dispatchEvent(event)
  }

  function listenerCount(media: string) {
    return queries.get(media)?.listeners.size ?? 0
  }

  return { matchMedia, setMatches, listenerCount }
}
