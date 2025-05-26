"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import WelcomeScreen from "@/components/welcome-screen"
import Editor from "@/components/editor"
import { getDocumentList } from "@/app/actions"

export default function Home() {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [availableDocuments, setAvailableDocuments] = useState<
    Array<{ id: string; title: string; lastModified: number }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  // Prevent scrolling on the body when editor is active
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  // Load available documents on initial render
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const documents = await getDocumentList()
        setAvailableDocuments(documents)
      } catch (error) {
        console.error("Failed to load documents:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const handleCreateNew = () => {
    setDocumentId(null)
    setIsEditorOpen(true)
  }

  const handleOpenDocument = (id: string) => {
    setDocumentId(id)
    setIsEditorOpen(true)
  }

  const handleBackToWelcome = () => {
    setIsEditorOpen(false)
    // Refresh document list when returning to welcome screen
    getDocumentList().then(setAvailableDocuments)
  }

  return (
    <ThemeProvider>
      {isEditorOpen ? (
        <Editor documentId={documentId} onBack={handleBackToWelcome} />
      ) : (
        <WelcomeScreen
          isLoading={isLoading}
          documents={availableDocuments}
          onCreateNew={handleCreateNew}
          onOpenDocument={handleOpenDocument}
        />
      )}
    </ThemeProvider>
  )
}
