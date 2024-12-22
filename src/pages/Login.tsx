import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate("/")
      }
      setIsLoading(false)
    }
    checkSession()
  }, [navigate])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          navigate("/")
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  if (isLoading) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 py-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your medical research portal
            </p>
          </div>
        </div>

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
          view="sign_in"
          localization={{
            variables: {
              sign_up: {
                link_text: "",  // This removes the "Don't have an account? Sign up" link
              },
            },
          }}
        />
      </div>
    </div>
  )
}