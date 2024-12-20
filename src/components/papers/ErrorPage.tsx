import { AlertCircle, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function ErrorPage() {
  const navigate = useNavigate()

  return (
    <Card className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-center">
        We encountered an error while processing your request.
      </p>
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mt-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Button>
    </Card>
  )
}