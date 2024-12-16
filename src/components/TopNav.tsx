import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"

export function TopNav() {
  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold">M</span>
          </div>
          <span className="font-semibold">MediCluster</span>
        </Link>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
            asChild
          >
            <Link to="/settings">
              <UserCircle className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}