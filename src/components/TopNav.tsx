import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { User } from "lucide-react"
import { Link } from "react-router-dom"

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-nav">
      <div className="container flex h-14 items-center">
        <SidebarTrigger />
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="h-6 w-6 bg-primary rounded-sm shadow-soft" />
            <span className="hidden font-bold sm:inline-block">
              PaperSearch
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Link to="/settings">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-accent transition-colors duration-200"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Profile Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}