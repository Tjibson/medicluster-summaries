import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Pill } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg border border-border">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Pill className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Welcome to PaperSearch</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access your medical research portal</p>
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
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;