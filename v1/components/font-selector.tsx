"use client"

import { useState } from "react"
import { Check, ChevronDown, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

const FONTS = [
  { name: "Inter", value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: "Serif", value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: "Mono", value: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
  { name: "Nunito", value: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: "Merriweather", value: 'Merriweather, Georgia, Cambria, "Times New Roman", Times, serif' },
]

interface FontSelectorProps {
  onSelectFont: (fontFamily: string) => void
  currentFont: string
}

export default function FontSelector({ onSelectFont, currentFont }: FontSelectorProps) {
  const [open, setOpen] = useState(false)
  const { theme } = useTheme()

  // Find the current font name for display
  const currentFontName = FONTS.find((font) => currentFont.includes(font.name))?.name || "Inter"

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-2 rounded-md">
          <Type className="h-4 w-4 mr-1" />
          <span className="text-xs">{currentFontName}</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "min-w-[180px]",
          theme === "light" && "bg-white",
          theme === "dark" && "bg-gray-800",
          theme === "blue" && "bg-blue-900",
          theme === "green" && "bg-green-900",
        )}
      >
        {FONTS.map((font) => (
          <DropdownMenuItem
            key={font.name}
            onClick={() => {
              onSelectFont(font.value)
              setOpen(false)
            }}
            className="flex items-center justify-between"
          >
            <span style={{ fontFamily: font.value }}>{font.name}</span>
            {currentFont.includes(font.name) && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            document.execCommand("formatBlock", false, "<p>")
            document.execCommand("removeFormat")
            setOpen(false)
          }}
        >
          Reset formatting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
