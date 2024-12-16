import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DownloadedPaper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  downloaded_at: string
}

export default function Downloads() {
  const [downloads, setDownloads] = useState<DownloadedPaper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDownloads = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from("saved_papers")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching downloads:", error)
        return
      }

      setDownloads(data || [])
      setLoading(false)
    }

    fetchDownloads()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          {downloads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No downloads yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Authors</TableHead>
                  <TableHead>Journal</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downloads.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell className="font-medium">{paper.title}</TableCell>
                    <TableCell>{paper.authors.join(", ")}</TableCell>
                    <TableCell>{paper.journal}</TableCell>
                    <TableCell>{paper.year}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Re-download functionality would go here
                          console.log("Re-downloading paper:", paper.id)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}