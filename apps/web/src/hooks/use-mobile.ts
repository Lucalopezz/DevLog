import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Informa se a viewport atual está no modo mobile.
 *
 * Este hook não renderiza nada e não altera o layout sozinho. Ele apenas
 * transforma a media query do navegador em um valor booleano (`true` ou
 * `false`) que componentes React podem consultar.
 *
 * O `Sidebar` usa esse valor para escolher entre dois comportamentos:
 * - desktop: a navegação fica fixa na lateral;
 * - mobile: a navegação vira um drawer que abre e fecha.
 *
 * `matchMedia` é uma API do navegador que acompanha uma regra CSS em
 * JavaScript. Como o resultado pode mudar quando a janela é redimensionada,
 * `useSyncExternalStore` assina o evento `change` e solicita uma nova leitura
 * ao React. Ele é adequado para dados mantidos por uma fonte externa ao React,
 * em vez de copiar esse valor para um `useState` dentro de um `useEffect`.
 */
export function useIsMobile() {
  // useSyncExternalStore descreve melhor esta situação: matchMedia é um
  // estado externo ao React, então não precisamos atualizar estado
  // sincronamente dentro de um useEffect.
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
