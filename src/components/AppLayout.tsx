import { AppSidebar } from "./AppSidebar"
import { TopNav } from "./TopNav"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1 h-[calc(100vh-3.5rem)]">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-6 w-full max-w-[100vw]">
          {children}
        </main>
      </div>
    </div>
  )
}