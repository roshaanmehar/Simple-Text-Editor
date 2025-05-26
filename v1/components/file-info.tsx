"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { getDocumentsDirectoryPath } from "@/app/actions"

export default function FileInfo() {
  const [open, setOpen] = useState(false)
  const [docsPath, setDocsPath] = useState<string | null>(null)
  const { theme } = useTheme()

  const handleOpen = async () => {
    try {
      const path = await getDocumentsDirectoryPath()
      setDocsPath(path)
      setOpen(true)
    } catch (error) {
      console.error("Failed to get documents path:", error)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleOpen} className="h-9 w-9">
        <Info className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-[600px]",
            theme === "light" && "bg-white",
            theme === "dark" && "bg-gray-800",
            theme === "blue" && "bg-blue-900",
            theme === "green" && "bg-green-900",
          )}
        >
          <DialogHeader>
            <DialogTitle>File Information</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-medium mb-2">Document Storage</h3>
            <p className="mb-4 text-sm">Your documents are saved as JSON files in the following directory:</p>
            <div className="bg-muted p-3 rounded-md font-mono text-xs mb-4 overflow-x-auto">
              {docsPath || "Loading..."}
            </div>

            <h3 className="font-medium mb-2">File Format</h3>
            <p className="mb-2 text-sm">Each document is stored as a JSON file with the following structure:</p>
            <pre className="bg-muted p-3 rounded-md font-mono text-xs mb-4 overflow-x-auto">
              {`{
  "id": "1621234567890",
  "title": "Document Title",
  "content": "HTML content of the document",
  "lastModified": 1621234567890,
  "fontFamily": "Inter, -apple-system, ..."
}`}
            </pre>

            <h3 className="font-medium mb-2">Autosave</h3>
            <p className="text-sm">Your document is automatically saved:</p>
            <ul className="list-disc ml-5 text-sm space-y-1 mt-2">
              <li>After each click in the editor</li>
              <li>1 second after you stop typing</li>
              <li>When you manually click the Save button</li>
              <li>When you switch documents</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
