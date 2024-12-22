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
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold text-foreground">Not accepting users at the moment</h2>
      <p className="text-muted-foreground">Please join the waiting list to be notified when registrations open again.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="max-w-sm mx-auto"
        />
        <Button type="submit" disabled={isSubmitting} className="w-full max-w-sm">
          {isSubmitting ? "Joining..." : "Join Waitlist"}
        </Button>
      </form>
    </div>
  )
}