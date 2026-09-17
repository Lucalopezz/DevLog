/**
 * A small browser media-query store for jsdom.
 *
 * matchMedia must return the same object for a given query. Otherwise a hook
 * that subscribes to one object can read another and miss viewport changes.
 */
export function createMatchMediaController() {
  const queries = new Map<
    string,
    { list: MediaQueryList; listeners: Set<EventListenerOrEventListenerObject> }
  >()

  function matchMedia(media: string): MediaQueryList {
    const existing = queries.get(media)
    if (existing) return existing.list

    const listeners = new Set<EventListenerOrEventListenerObject>()
    const list: MediaQueryList = {
      matches: false,
      media,
      onchange: null,
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
      dispatchEvent(event) {
        for (const listener of listeners) {
          if (typeof listener === 'function') listener(event)
          else listener.handleEvent(event)
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
