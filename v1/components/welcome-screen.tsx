"use client"

import type React from "react"

import { useState } from "react"
import { FileText, Plus, Clock, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useTheme } from "@/components/theme-provider"
import ThemeSwitcher from "@/components/theme-switcher"
import { cn } from "@/lib/utils"
import { deleteDocument } from "@/app/actions"

interface WelcomeScreenProps {
  isLoading: boolean
  documents: Array<{ id: string; title: string; lastModified: number }>
  onCreateNew: () => void
  onOpenDocument: (id: string) => void
}

export default function WelcomeScreen({ isLoading, documents, onCreateNew, onOpenDocument }: WelcomeScreenProps) {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDocumentToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      try {
        await deleteDocument(documentToDelete)
        // Filter out the deleted document from the local state
        const updatedDocs = documents.filter((doc) => doc.id !== documentToDelete)
        // This is a bit of a hack since we're not using state properly here,
        // but it works for the demo. In a real app, we'd use a proper state update.
        window.location.reload()
      } catch (error) {
        console.error("Failed to delete document:", error)
      }
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        theme === "light" && "bg-white text-gray-800",
        theme === "dark" && "bg-gray-900 text-gray-100",
        theme === "blue" && "bg-blue-950 text-blue-100",
        theme === "green" && "bg-green-950 text-green-100",
      )}
    >
      <header
        className={cn(
          "border-b py-4 px-6 flex items-center justify-between",
          theme === "light" && "bg-white border-gray-200",
          theme === "dark" && "bg-gray-800 border-gray-700",
          theme === "blue" && "bg-blue-900 border-blue-800",
          theme === "green" && "bg-green-900 border-green-800",
        )}
      >
        <h1 className="text-2xl font-semibold">Notion-like Editor</h1>
        <ThemeSwitcher />
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-medium mb-4">Recent Documents</h2>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className={cn(
                  "pl-10",
                  theme === "light" && "bg-white",
                  theme === "dark" && "bg-gray-800",
                  theme === "blue" && "bg-blue-900",
                  theme === "green" && "bg-green-900",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onOpenDocument(doc.id)}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all",
                        "hover:shadow-md hover:-translate-y-1",
                        theme === "light" && "bg-white border-gray-200 hover:bg-gray-50",
                        theme === "dark" && "bg-gray-800 border-gray-700 hover:bg-gray-700",
                        theme === "blue" && "bg-blue-900 border-blue-800 hover:bg-blue-800",
                        theme === "green" && "bg-green-900 border-green-800 hover:bg-green-800",
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                          <h3 className="font-medium truncate">{doc.title}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                          onClick={(e) => handleDeleteClick(doc.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(doc.lastModified).toLocaleDateString()} at{" "}
                          {new Date(doc.lastModified).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div
                className={cn(
                  "border rounded-lg p-8 text-center",
                  theme === "light" && "border-gray-200",
                  theme === "dark" && "border-gray-700",
                  theme === "blue" && "border-blue-800",
                  theme === "green" && "border-green-800",
                )}
              >
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No documents match your search query." : "You haven't created any documents yet."}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-medium mb-4">Start Writing</h2>
            <div
              className={cn(
                "border rounded-lg p-6",
                theme === "light" && "border-gray-200",
                theme === "dark" && "border-gray-700",
                theme === "blue" && "border-blue-800",
                theme === "green" && "border-green-800",
              )}
            >
              <Button onClick={onCreateNew} className="w-full h-auto py-6 flex flex-col items-center justify-center">
                <Plus className="h-8 w-8 mb-2" />
                <span className="text-lg font-medium">Create New Document</span>
              </Button>

              <div className="mt-6">
                <h3 className="font-medium mb-2">About this editor</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Use <code className="text-xs bg-muted px-1 py-0.5 rounded">\h1</code>,{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">\h2</code>,{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">\h3</code> for headings
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Use <code className="text-xs bg-muted px-1 py-0.5 rounded">\toggle</code> for collapsible sections
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Use <code className="text-xs bg-muted px-1 py-0.5 rounded">\bulletpoint</code> for bullet lists
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Use <code className="text-xs bg-muted px-1 py-0.5 rounded">\code</code> for code blocks
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Use <code className="text-xs bg-muted px-1 py-0.5 rounded">\quote</code> for blockquotes
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-[425px]",
            theme === "light" && "bg-white",
            theme === "dark" && "bg-gray-800",
            theme === "blue" && "bg-blue-900",
            theme === "green" && "bg-green-900",
          )}
        >
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this document? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
