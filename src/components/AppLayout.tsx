import { TopNav } from "@/components/TopNav"
import { AppSidebar } from "@/components/AppSidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNav />
      <div className="flex flex-1 pt-24">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}