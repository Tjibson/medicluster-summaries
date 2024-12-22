import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useToast } from "./ui/use-toast"

export function Waitlist() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }])

      if (error) throw error

      toast({
        title: "Successfully joined waitlist",
        description: "We'll notify you when registrations open again.",
      })
      setEmail("")
    } catch (error: any) {
      toast({
        title: "Error joining waitlist",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 text-center max-w-sm mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Sign Up</h2>
        <p className="text-muted-foreground">
          Enter your email address below to join our waiting list.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-background border-border"
        />
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Joining..." : "Join Waitlist"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline hover:text-foreground">
          Terms and Conditions
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
      </p>
    </div>
  )
}