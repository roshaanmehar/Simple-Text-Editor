"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Bold,
  Italic,
  Underline,
  Save,
  ArrowLeft,
  Maximize,
  Minimize,
  Code,
  Quote,
  ListOrdered,
  List,
  Heading1,
  Heading2,
  Heading3,
  LinkIcon,
  MoreHorizontal,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"
import ThemeSwitcher from "@/components/theme-switcher"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { saveDocument, getDocument } from "@/app/actions"
import FontSelector from "@/components/font-selector"
// Import FileInfo component
import FileInfo from "@/components/file-info"

interface EditorProps {
  documentId: string | null
  onBack: () => void
}

export default function Editor({ documentId, onBack }: EditorProps) {
  const [title, setTitle] = useState("Untitled Document")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [findReplaceOpen, setFindReplaceOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedStats, setSelectedStats] = useState<{ words: number; chars: number } | null>(null)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [findText, setFindText] = useState("")
  const [replaceText, setReplaceText] = useState("")
  const [documentStats, setDocumentStats] = useState({
    paragraphs: 0,
    sentences: 0,
    avgWordLength: 0,
    avgSentenceLength: 0,
  })
  const editorRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isMobile = useMobile()
  const [currentFont, setCurrentFont] = useState(
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  )

  // Add refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateCountsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load document if documentId is provided
  useEffect(() => {
    const loadDocument = async () => {
      if (documentId) {
        try {
          const doc = await getDocument(documentId)
          if (doc) {
            setTitle(doc.title)
            if (editorRef.current) {
              editorRef.current.innerHTML = doc.content
              updateCountsDebounced()
            }
            setLastSaved(new Date(doc.lastModified))

            // Set the font if it exists in the document
            if (doc.fontFamily) {
              setCurrentFont(doc.fontFamily)
              if (editorRef.current) {
                editorRef.current.style.fontFamily = doc.fontFamily
              }
            }
          }
        } catch (error) {
          console.error("Failed to load document:", error)
        }
      }
    }

    loadDocument()
  }, [documentId])

  // Debounced update counts function
  const updateCountsDebounced = useCallback(() => {
    if (updateCountsTimeoutRef.current) {
      clearTimeout(updateCountsTimeoutRef.current)
    }

    updateCountsTimeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerText || ""
        const words = content.trim() ? content.trim().split(/\s+/).length : 0
        const chars = content.length

        // Calculate reading time (200 words per minute is average reading speed)
        const readingTimeMinutes = Math.max(1, Math.ceil(words / 200))

        setWordCount(words)
        setCharCount(chars)
        setReadingTime(readingTimeMinutes)

        // Only calculate detailed stats when expanded to save performance
        if (statsExpanded) {
          // Count paragraphs (non-empty lines)
          const paragraphs = content.split("\n").filter((line) => line.trim().length > 0).length || 1

          // Count sentences (roughly)
          const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1

          // Calculate average word length
          const avgWordLength = words > 0 ? Math.round(((chars - words + 1) / words) * 10) / 10 : 0

          // Calculate average sentence length
          const avgSentenceLength = sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0

          setDocumentStats({
            paragraphs,
            sentences,
            avgWordLength,
            avgSentenceLength,
          })
        }
      }
    }, 300) // Reduced from 1000ms to 300ms for better responsiveness
  }, [statsExpanded])

  // Optimized autosave
  useEffect(() => {
    // Less frequent autosave - only after 5 seconds of inactivity
    const handleEditorInput = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (editorRef.current && editorRef.current.innerHTML.trim() !== "") {
          handleSave(false)
        }
      }, 5000) // Increased from 1000ms to 5000ms to reduce save frequency
    }

    if (editorRef.current) {
      editorRef.current.addEventListener("input", handleEditorInput)
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener("input", handleEditorInput)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title])

  // Optimized selection tracking
  useEffect(() => {
    const handleSelectionChange = () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }

      selectionTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) {
          const selectedText = selection.toString()
          if (selectedText) {
            const words = selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0
            const chars = selectedText.length
            setSelectedStats({ words, chars })
          } else {
            setSelectedStats(null)
          }
        } else {
          setSelectedStats(null)
        }
      }, 200) // Debounce selection tracking
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [])

  // Handle fullscreen mode
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else if (isFocusMode) {
          setIsFocusMode(false)
        }
      }
    }

    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("keydown", handleEsc)
    }
  }, [isFullscreen, isFocusMode])

  // Update word and character count

  // Save document
  const handleSave = async (showDialog = true) => {
    if (!editorRef.current) return

    if (showDialog && title === "Untitled Document") {
      setSaveDialogOpen(true)
      return
    }

    setIsSaving(true)
    try {
      const content = editorRef.current.innerHTML
      const newDocId = await saveDocument({
        id: documentId || undefined,
        title,
        content,
        fontFamily: currentFont,
      })

      if (!documentId) {
        // If this was a new document, update the URL
        window.history.replaceState(null, "", `?doc=${newDocId}`)
      }

      setLastSaved(new Date())

      // Show a brief "Saved" message
      const saveStatus = document.createElement("div")
      saveStatus.className = "fixed bottom-20 right-6 bg-green-500 text-white px-3 py-2 rounded-lg shadow-sm text-sm"
      saveStatus.textContent = "Document saved"
      document.body.appendChild(saveStatus)

      setTimeout(() => {
        if (document.body.contains(saveStatus)) {
          document.body.removeChild(saveStatus)
        }
      }, 2000)
    } catch (error) {
      console.error("Failed to save document:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Format text with execCommand
  const formatText = (command: string, value = "") => {
    document.execCommand(command, false, value)
    updateCountsDebounced()
  }

  // Insert link
  const insertLink = () => {
    if (!linkUrl.trim()) return

    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${linkText || linkUrl}</a>`
    document.execCommand("insertHTML", false, linkHtml)

    setLinkUrl("")
    setLinkText("")
    setLinkDialogOpen(false)
    updateCountsDebounced()
  }

  // Find and replace functions
  const findNext = () => {
    if (!findText || !editorRef.current) return

    const content = editorRef.current.innerHTML
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)

    if (!range) return

    // Get the current position
    const currentPos = range.startOffset
    const textAfterCursor = editorRef.current.innerText.substring(currentPos)

    // Find the next occurrence
    const nextIndex = textAfterCursor.toLowerCase().indexOf(findText.toLowerCase())

    if (nextIndex >= 0) {
      // Found a match after the cursor
      const newRange = document.createRange()
      const textNode = editorRef.current.firstChild

      if (textNode) {
        newRange.setStart(textNode, currentPos + nextIndex)
        newRange.setEnd(textNode, currentPos + nextIndex + findText.length)

        selection?.removeAllRanges()
        selection?.addRange(newRange)
      }
    } else {
      // Wrap around to the beginning
      const fullText = editorRef.current.innerText
      const firstIndex = fullText.toLowerCase().indexOf(findText.toLowerCase())

      if (firstIndex >= 0) {
        const newRange = document.createRange()
        const textNode = editorRef.current.firstChild

        if (textNode) {
          newRange.setStart(textNode, firstIndex)
          newRange.setEnd(textNode, firstIndex + findText.length)

          selection?.removeAllRanges()
          selection?.addRange(newRange)
        }
      }
    }
  }

  const replaceSelection = () => {
    if (!findText || !replaceText) return

    const selection = window.getSelection()
    const selectedText = selection?.toString()

    if (selectedText && selectedText.toLowerCase() === findText.toLowerCase()) {
      document.execCommand("insertText", false, replaceText)
      findNext()
    } else {
      findNext()
    }
  }

  const replaceAll = () => {
    if (!findText || !replaceText || !editorRef.current) return

    const content = editorRef.current.innerHTML
    // Use case-insensitive replace with regex
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    const newContent = content.replace(regex, replaceText)

    editorRef.current.innerHTML = newContent
    updateCountsDebounced()
  }

  // Process special commands on keydown
  const processKeyDown = (e: React.KeyboardEvent) => {
    // Only update counts on Enter, Space, Backspace, Delete
    if (e.key === "Enter" || e.key === " " || e.key === "Backspace" || e.key === "Delete") {
      updateCountsDebounced()
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault()
          handleSave()
          return
        case "b":
          e.preventDefault()
          formatText("bold")
          return
        case "i":
          e.preventDefault()
          formatText("italic")
          return
        case "u":
          e.preventDefault()
          formatText("underline")
          return
        case "f":
          e.preventDefault()
          setFindReplaceOpen(true)
          return
        case "l":
          e.preventDefault()
          setLinkDialogOpen(true)
          return
        case "e":
          e.preventDefault()
          setIsFocusMode(!isFocusMode)
          return
      }
    }

    if (e.key === "Enter" && editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.anchorNode) {
        const line = selection.anchorNode.textContent || ""

        // Process markdown-like syntax
        if (line.startsWith("\\h1 ")) {
          e.preventDefault()
          const content = line.substring(4)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Replace the current line with an h1 element
            const h1 = document.createElement("h1")
            h1.textContent = content
            h1.className = "text-3xl font-semibold mb-4"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(h1, container)

              // Add a new line
              const div = document.createElement("div")
              div.innerHTML = "<br>"
              editorRef.current.appendChild(div)

              // Set cursor to the new line
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        } else if (line.startsWith("\\h2 ")) {
          e.preventDefault()
          const content = line.substring(4)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Replace with h2
            const h2 = document.createElement("h2")
            h2.textContent = content
            h2.className = "text-2xl font-semibold mb-3"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(h2, container)

              // Add a new line
              const div = document.createElement("div")
              div.innerHTML = "<br>"
              editorRef.current.appendChild(div)

              // Set cursor to the new line
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        } else if (line.startsWith("\\h3 ")) {
          e.preventDefault()
          const content = line.substring(4)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Replace with h3
            const h3 = document.createElement("h3")
            h3.textContent = content
            h3.className = "text-xl font-semibold mb-2"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(h3, container)

              // Add a new line
              const div = document.createElement("div")
              div.innerHTML = "<br>"
              editorRef.current.appendChild(div)

              // Set cursor to the new line
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        } else if (line.startsWith("\\toggle ")) {
          e.preventDefault()
          const content = line.substring(8)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Create toggle element
            const details = document.createElement("details")
            const summary = document.createElement("summary")
            const div = document.createElement("div")

            summary.textContent = content
            summary.className = "cursor-pointer font-medium py-2 hover:bg-muted rounded px-2 -mx-2"
            div.innerHTML = "<br>"
            div.className = "pl-4"

            details.appendChild(summary)
            details.appendChild(div)
            details.className = "my-2"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(details, container)

              // Add a new line
              const newDiv = document.createElement("div")
              newDiv.innerHTML = "<br>"
              editorRef.current.appendChild(newDiv)

              // Set cursor inside the toggle
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        } else if (line.startsWith("\\bulletpoint ")) {
          e.preventDefault()
          const content = line.substring(13)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Create bullet point
            const li = document.createElement("li")
            li.textContent = content
            li.className = "ml-6 list-disc"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(li, container)

              // Add a new line
              const div = document.createElement("div")
              div.innerHTML = "<br>"
              editorRef.current.appendChild(div)

              // Set cursor to the new line
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        } else if (line.startsWith("\\code ")) {
          e.preventDefault()
          const content = line.substring(6)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Create code block
            const pre = document.createElement("pre")
            const code = document.createElement("code")
            code.textContent = content
            code.className = "font-mono text-sm"
            pre.appendChild(code)
            pre.className = "bg-muted p-4 rounded-md my-4 overflow-x-auto font-mono text-sm"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(pre, container)

              // Add a new line
              const div = document.createElement("div")
              div.innerHTML = "<br>"
              editorRef.current.appendChild(div)

              // Set cursor to the new line
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        } else if (line.startsWith("\\quote ")) {
          e.preventDefault()
          const content = line.substring(7)
          const node = selection.anchorNode

          if (node && node.parentElement) {
            // Create blockquote
            const blockquote = document.createElement("blockquote")
            blockquote.textContent = content
            blockquote.className = "border-l-4 border-muted-foreground/30 pl-4 italic my-4"

            // Find the containing block element
            let container = node
            while (container && container.parentElement !== editorRef.current) {
              container = container.parentElement as Node
            }

            if (container) {
              container.parentElement?.replaceChild(blockquote, container)

              // Add a new line
              const div = document.createElement("div")
              div.innerHTML = "<br>"
              editorRef.current.appendChild(div)

              // Set cursor to the new line
              const newRange = document.createRange()
              newRange.setStart(div, 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              updateCountsDebounced()
            }
          }
        }
      }
    }
  }

  // Add this function to change the font
  const changeFont = (fontFamily: string) => {
    setCurrentFont(fontFamily)

    // Apply to selected text if there's a selection
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      document.execCommand("styleWithCSS", false, "true")
      document.execCommand("fontName", false, fontFamily)
    } else {
      // If no selection, apply to the editor container
      if (editorRef.current) {
        editorRef.current.style.fontFamily = fontFamily
      }
    }

    // Save the change - but with a delay
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (editorRef.current && editorRef.current.innerHTML.trim() !== "") {
        handleSave(false)
      }
    }, 2000)
  }

  const saveCurrentContent = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (editorRef.current && editorRef.current.innerHTML.trim() !== "") {
        handleSave(false)
      }
    }, 2000)
  }

  // Add a formatting help dialog
  const [formatHelpOpen, setFormatHelpOpen] = useState(false)

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        isFullscreen && "fixed inset-0 z-50",
        theme === "light" && "bg-white text-gray-800",
        theme === "dark" && "bg-gray-900 text-gray-100",
        theme === "blue" && "bg-blue-950 text-blue-100",
        theme === "green" && "bg-green-950 text-green-100",
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "border-b py-2 px-4 flex items-center justify-between transition-opacity duration-300",
          isFocusMode && "opacity-0 hover:opacity-100",
          theme === "light" && "bg-white border-gray-200",
          theme === "dark" && "bg-gray-800 border-gray-700",
          theme === "blue" && "bg-blue-900 border-blue-800",
          theme === "green" && "bg-green-900 border-green-800",
        )}
      >
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to documents</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "h-9 border-none focus-visible:ring-0 text-lg font-medium bg-transparent max-w-[300px]",
              theme === "light" && "placeholder:text-gray-400",
              theme === "dark" && "placeholder:text-gray-500",
              theme === "blue" && "placeholder:text-blue-400",
              theme === "green" && "placeholder:text-green-400",
            )}
            placeholder="Untitled Document"
          />
        </div>

        {/* Add FileInfo component to the header */}
        {/* Find the header section with ThemeSwitcher and add FileInfo before it */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-2">
            {lastSaved ? <>Last saved: {lastSaved.toLocaleTimeString()}</> : <>Not saved yet</>}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsFocusMode(!isFocusMode)} className="h-9 w-9">
                  {isFocusMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFocusMode ? "Exit focus mode (Ctrl+E)" : "Enter focus mode (Ctrl+E)"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <FileInfo />
          <ThemeSwitcher />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-9 w-9">
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={isSaving} className="h-9">
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div
        className={cn(
          "border-b py-2 px-4 flex flex-wrap items-center gap-1 transition-opacity duration-300",
          isFocusMode && "opacity-0 hover:opacity-100",
          theme === "light" && "bg-gray-50 border-gray-200",
          theme === "dark" && "bg-gray-800 border-gray-700",
          theme === "blue" && "bg-blue-900 border-blue-800",
          theme === "green" && "bg-green-900 border-green-800",
        )}
      >
        <TooltipProvider>
          {/* Basic formatting */}
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => formatText("bold")} className="h-9 w-9 p-0 rounded-md">
                  <Bold className="h-4 w-4" />
                  <span className="sr-only">Bold</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("italic")}
                  className="h-9 w-9 p-0 rounded-md"
                >
                  <Italic className="h-4 w-4" />
                  <span className="sr-only">Italic</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic (Ctrl+I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("underline")}
                  className="h-9 w-9 p-0 rounded-md"
                >
                  <Underline className="h-4 w-4" />
                  <span className="sr-only">Underline</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline (Ctrl+U)</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mr-2"></div>

          {/* Font selector */}
          <FontSelector onSelectFont={changeFont} currentFont={currentFont} />

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mr-2"></div>

          {/* Paragraph formatting */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-2 rounded-md">
                    <Heading1 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Format</span>
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Text formatting options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => formatText("formatBlock", "<h1>")}>
                <Heading1 className="h-4 w-4 mr-2" />
                <span>Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText("formatBlock", "<h2>")}>
                <Heading2 className="h-4 w-4 mr-2" />
                <span>Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText("formatBlock", "<h3>")}>
                <Heading3 className="h-4 w-4 mr-2" />
                <span>Heading 3</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText("formatBlock", "<blockquote>")}>
                <Quote className="h-4 w-4 mr-2" />
                <span>Quote</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText("formatBlock", "<pre>")}>
                <Code className="h-4 w-4 mr-2" />
                <span>Code</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText("insertUnorderedList")}>
                <List className="h-4 w-4 mr-2" />
                <span>Bullet List</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText("insertOrderedList")}>
                <ListOrdered className="h-4 w-4 mr-2" />
                <span>Numbered List</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Link and Find/Replace */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setLinkDialogOpen(true)} className="h-9 px-2 rounded-md">
                <LinkIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">Link</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert link (Ctrl+L)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFindReplaceOpen(true)}
                className="h-9 px-2 rounded-md"
              >
                <Search className="h-4 w-4 mr-1" />
                <span className="text-xs">Find</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Find and replace (Ctrl+F)</TooltipContent>
          </Tooltip>

          {!isMobile && (
            <>
              <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mr-2 ml-auto"></div>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-md">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => document.execCommand("selectAll")}>Select All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.execCommand("removeFormat")}>
                    Clear Formatting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.execCommand("undo")}>Undo</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.execCommand("redo")}>Redo</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </TooltipProvider>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div
          ref={editorRef}
          className={cn(
            "min-h-full outline-none leading-relaxed p-8 max-w-4xl mx-auto",
            theme === "light" && "bg-white",
            theme === "dark" && "bg-gray-900",
            theme === "blue" && "bg-blue-950",
            theme === "green" && "bg-green-950",
            "text-base font-sans antialiased",
          )}
          contentEditable
          onInput={() => {
            // Only update counts, don't save on every keystroke
            if (updateCountsTimeoutRef.current) {
              clearTimeout(updateCountsTimeoutRef.current)
            }
            updateCountsTimeoutRef.current = setTimeout(updateCountsDebounced, 300)
          }}
          onKeyDown={processKeyDown}
          onClick={() => {
            // Don't update or save on every click - this was causing lag
            // Just focus the editor
          }}
          style={{
            fontFamily: currentFont,
          }}
        />
      </div>

      {/* Selection stats popup */}
      {selectedStats && (
        <div
          className={cn(
            "fixed px-3 py-2 rounded-lg shadow-sm border text-xs",
            theme === "light" && "bg-gray-50 border-gray-200 text-gray-500",
            theme === "dark" && "bg-gray-800 border-gray-700 text-gray-300",
            theme === "blue" && "bg-blue-900 border-blue-800 text-blue-200",
            theme === "green" && "bg-green-900 border-green-800 text-green-200",
          )}
          style={{
            top: window.getSelection()?.getRangeAt(0).getBoundingClientRect().top! - 40 + "px",
            left: window.getSelection()?.getRangeAt(0).getBoundingClientRect().left! + "px",
          }}
        >
          Selection: {selectedStats.words} words • {selectedStats.chars} characters
        </div>
      )}

      {/* Word count with expandable stats */}
      <div
        className={cn(
          "fixed bottom-6 right-6 px-3 py-2 rounded-lg shadow-sm border cursor-pointer transition-all",
          statsExpanded && "w-64",
          theme === "light" && "bg-gray-50 border-gray-200 text-gray-500",
          theme === "dark" && "bg-gray-800 border-gray-700 text-gray-300",
          theme === "blue" && "bg-blue-900 border-blue-800 text-blue-200",
          theme === "green" && "bg-green-900 border-green-800 text-green-200",
        )}
        onClick={() => {
          setStatsExpanded(!statsExpanded)
          if (!statsExpanded) {
            // Only calculate detailed stats when expanding
            updateCountsDebounced()
          }
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs">
            {wordCount} words • {charCount} characters • {readingTime} min read
          </span>
          <ChevronUp className={cn("h-3 w-3 ml-1 transition-transform", !statsExpanded && "rotate-180")} />
        </div>

        {statsExpanded && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Paragraphs:</span>
              <span>{documentStats.paragraphs}</span>
            </div>
            <div className="flex justify-between">
              <span>Sentences:</span>
              <span>{documentStats.sentences}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. word length:</span>
              <span>{documentStats.avgWordLength} chars</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. sentence length:</span>
              <span>{documentStats.avgSentenceLength} words</span>
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
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
            <DialogTitle>Save Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(
                  "col-span-3",
                  theme === "light" && "bg-white",
                  theme === "dark" && "bg-gray-700",
                  theme === "blue" && "bg-blue-800",
                  theme === "green" && "bg-green-800",
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                setSaveDialogOpen(false)
                handleSave(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
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
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className={cn(
                  "col-span-3",
                  theme === "light" && "bg-white",
                  theme === "dark" && "bg-gray-700",
                  theme === "blue" && "bg-blue-800",
                  theme === "green" && "bg-green-800",
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="text" className="text-right">
                Text
              </Label>
              <Input
                id="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className={cn(
                  "col-span-3",
                  theme === "light" && "bg-white",
                  theme === "dark" && "bg-gray-700",
                  theme === "blue" && "bg-blue-800",
                  theme === "green" && "bg-green-800",
                )}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={insertLink}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find and Replace Dialog */}
      <Dialog open={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
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
            <DialogTitle>Find and Replace</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="find" className="text-right">
                Find
              </Label>
              <Input
                id="find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className={cn(
                  "col-span-3",
                  theme === "light" && "bg-white",
                  theme === "dark" && "bg-gray-700",
                  theme === "blue" && "bg-blue-800",
                  theme === "green" && "bg-green-800",
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="replace" className="text-right">
                Replace
              </Label>
              <Input
                id="replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className={cn(
                  "col-span-3",
                  theme === "light" && "bg-white",
                  theme === "dark" && "bg-gray-700",
                  theme === "blue" && "bg-blue-800",
                  theme === "green" && "bg-green-800",
                )}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={findNext} className="flex-1">
                Find Next
              </Button>
              <Button onClick={replaceSelection} className="flex-1">
                Replace
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={replaceAll} variant="outline" className="flex-1">
                Replace All
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
