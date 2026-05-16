"use client"

import { Radio } from "lucide-react"

interface AdminHeaderProps {
  totalServers: number
  totalPlayers: number
  activeThreats: number
}

export function AdminHeader({
  totalServers,
  totalPlayers,
  activeThreats,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/30">
      <div className="px-4 py-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Admin Panel
          </h1>
          <div className="flex items-center gap-1.5">
            <Radio className="h-2.5 w-2.5 text-neon-green animate-pulse" />
            <span className="text-xs text-neon-green font-medium">LIVE</span>
          </div>
        </div>

        {/* Stats - Clean text only */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Servers:</span>
            <span className="font-mono font-medium text-foreground">{totalServers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Players:</span>
            <span className="font-mono font-medium text-neon-green">{totalPlayers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Active Threats:</span>
            <span className={`font-mono font-medium ${activeThreats > 0 ? "text-neon-red" : "text-foreground"}`}>
              {activeThreats}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
