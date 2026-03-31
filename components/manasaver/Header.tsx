"use client"

import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/40">
            {/* Mana drop SVG */}
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-primary" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 5 10.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 10.5 12 2 12 2Z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Mana<span className="text-primary">Saver</span>
          </span>
          <Badge variant="outline" className="hidden border-primary/30 text-[10px] text-primary sm:flex">
            BETA
          </Badge>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <User className="h-4 w-4" />
            <span className="sr-only">Profile</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
