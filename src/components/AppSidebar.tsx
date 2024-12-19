import { Search, List, Download, Star, Settings, LogOut, Presentation, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const menuItems = [
    {
      title: "New Search",
      icon: Search,
      onClick: () => navigate("/"),
    },
    {
      title: "My Lists",
      icon: List,
      onClick: () => navigate("/lists"),
    },
    {
      title: "Downloads",
      icon: Download,
      onClick: () => navigate("/downloads"),
    },
    {
      title: "Liked Papers",
      icon: Star,
      onClick: () => navigate("/liked"),
    },
    {
      title: "Reporting",
      icon: FileText,
      onClick: () => navigate("/reporting"),
    }
  ]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="h-4" /> {/* Added spacing above the menu */}
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/presentation")} tooltip="Create Presentation">
                  <Presentation className="h-4 w-4" />
                  <span>Create Presentation</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/settings")} tooltip="Settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}