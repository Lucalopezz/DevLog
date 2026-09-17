import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      {/* Flex items otherwise keep their min-content width and a wide Markdown
          table can expand the entire mobile page instead of scrolling locally. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          {/* On mobile, SidebarTrigger opens the sidebar as a drawer. */}
          <SidebarTrigger aria-label="Open navigation menu" />
        </header>

        <div className="min-w-0 flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
