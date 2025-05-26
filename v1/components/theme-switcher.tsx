"use client"

import { useState } from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {theme === "light" && <Sun className="h-5 w-5" />}
          {theme === "dark" && <Moon className="h-5 w-5" />}
          {(theme === "blue" || theme === "green") && <Palette className="h-5 w-5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTheme("light")
              setOpen(false)
            }}
            className={cn("justify-start", theme === "light" && "border-2 border-primary")}
          >
            <Sun className="h-4 w-4 mr-2" />
            Light
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTheme("dark")
              setOpen(false)
            }}
            className={cn("justify-start", theme === "dark" && "border-2 border-primary")}
          >
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTheme("blue")
              setOpen(false)
            }}
            className={cn("justify-start", theme === "blue" && "border-2 border-primary")}
          >
            <div className="h-4 w-4 mr-2 rounded-full bg-blue-500" />
            Blue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTheme("green")
              setOpen(false)
            }}
            className={cn("justify-start", theme === "green" && "border-2 border-primary")}
          >
            <div className="h-4 w-4 mr-2 rounded-full bg-green-500" />
            Green
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
