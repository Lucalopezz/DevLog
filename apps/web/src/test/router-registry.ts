type DisposableRouter = { dispose: () => void }

const routers = new Set<DisposableRouter>()

export function trackTestRouter(router: DisposableRouter) {
  routers.add(router)
}

export function disposeTestRouters() {
  for (const router of routers) router.dispose()
  routers.clear()
}
