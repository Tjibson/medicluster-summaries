import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, User, Pill } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { ThemeToggle } from "./ThemeToggle"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

export function TopNav() {
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: { 
          disease: searchQuery,
          pages: 1
        }
      })

      if (error) throw error

      navigate('/', { 
        state: { 
          searchResults: data.papers,
          searchCriteria: { disease: searchQuery }
        }
      })

    } catch (error) {
      console.error('Error searching PubMed:', error)
      toast({
        title: "Error",
        description: "Failed to search PubMed papers",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-nav">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger />
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              MediScrape
            </span>
          </Link>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search papers..."
              className="pl-8 bg-background w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

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