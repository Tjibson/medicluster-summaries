import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function ConnectGithubRepo() {
  const [repoUrl, setRepoUrl] = useState("")
  const [branch, setBranch] = useState("main")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to connect a repository",
          variant: "destructive",
        })
        return
      }

      // Verify repository with Edge Function
      const { data: verificationData, error: verificationError } = await supabase.functions
        .invoke('github-operations', {
          body: { repo_url: repoUrl, branch }
        })

      if (verificationError) throw verificationError

      // Save repository to database
      const { error: saveError } = await supabase
        .from("github_repos")
        .insert({
          user_id: session.user.id,
          repo_url: repoUrl,
          branch,
        })

      if (saveError) throw saveError

      toast({
        title: "Success",
        description: "Repository connected successfully",
      })

      // Reset form
      setRepoUrl("")
      setBranch("main")
    } catch (error) {
      console.error("Error connecting repository:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to connect repository",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Connect GitHub Repository</h2>
      <p className="text-muted-foreground mb-4">
        Connect your PubMed scraping repository to enable automatic data collection.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Repository URL</label>
          <Input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Branch (Optional)</label>
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Repository"
          )}
        </Button>
      </form>
    </Card>
  )
}