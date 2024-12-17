import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, User } from "lucide-react"
import { Link } from "react-router-dom"
import { ThemeToggle } from "./ThemeToggle"

export function TopNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-nav">
      <div className="container flex h-14 items-center gap-4 px-4">
        <SidebarTrigger />
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="h-6 w-6 bg-velvet rounded-sm shadow-soft" />
            <span className="hidden font-bold sm:inline-block">
              PaperSearch
            </span>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search papers..."
              className="pl-8 bg-background w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
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