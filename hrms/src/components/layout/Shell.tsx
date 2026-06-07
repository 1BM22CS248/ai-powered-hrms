import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUiStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

export function Shell() {
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  const setSidebarOpen = useUiStore(s => s.setSidebarOpen)

  // Start with sidebar closed on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [setSidebarOpen])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      {/* Mobile backdrop — sits below topbar, above main content */}
      {sidebarOpen && (
        <div
          className="fixed top-14 inset-x-0 bottom-0 z-[35] bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main
        className={cn(
          'pt-14 min-h-screen transition-all duration-300',
          // Mobile: no left padding (sidebar overlays content)
          // Desktop: push content by sidebar width
          sidebarOpen ? 'md:pl-[var(--sidebar-width)]' : 'md:pl-16'
        )}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
