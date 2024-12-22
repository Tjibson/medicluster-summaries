import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pill } from "lucide-react"
import { Waitlist } from "@/components/Waitlist"

export default function Login() {
  const navigate = useNavigate()
  const [isEmailSignUpEnabled, setIsEmailSignUpEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkEmailSignUp = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const { data: { config } } = await supabase.auth.getSession()
        setIsEmailSignUpEnabled(config?.config?.auth?.enable_signup || false)
      } catch (error) {
        console.error("Error checking email signup status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkEmailSignUp()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg border border-border">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Pill className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Welcome to MediScrape</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEmailSignUpEnabled 
              ? "Sign in to access your medical research portal"
              : "Join our waitlist for access"}
          </p>
        </div>

        {isEmailSignUpEnabled ? (
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '0.375rem',
                },
                anchor: {
                  color: 'hsl(var(--primary))',
                },
                container: {
                  color: 'hsl(var(--foreground))',
                },
                label: {
                  color: 'hsl(var(--foreground))',
                },
                input: {
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  borderColor: 'hsl(var(--border))',
                },
              },
            }}
            theme="default"
            providers={[]}
            redirectTo={window.location.origin}
          />
        ) : (
          <Waitlist />
        )}
      </div>
    </div>
  )
}