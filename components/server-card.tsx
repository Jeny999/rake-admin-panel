"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlayerCard } from "./player-card"

interface Player {
  id: string
  username: string
  joinTime: string
  banHistory: { "1h": number; "6h": number; "1d": number }
  riskAnalysis: {
    cheating: number
    bugAbusing: number
    bullying: number
    toxicity: number
    inappropriate: number
    other: number
  }
  avatarUrl?: string
}

interface ServerCardProps {
  serverId: string
  playerCount: number
  maxPlayers: number
  players: Player[]
  status: "clear" | "moderate" | "critical"
}

export function ServerCard({
  serverId,
  playerCount,
  maxPlayers,
  players,
  status,
}: ServerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusColor = {
    clear: "bg-neon-green",
    moderate: "bg-neon-amber",
    critical: "bg-neon-red",
  }

  const statusGlow = {
    clear: "shadow-[0_0_8px_rgba(34,197,94,0.5)]",
    moderate: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    critical: "shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Server Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-base font-semibold text-foreground">
              {serverId}
            </span>
            <div className="mt-1 font-mono text-sm text-muted-foreground">
              {playerCount}/{maxPlayers} players
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          >
            {isExpanded ? (
              <>
                Close
                <ChevronUp className="ml-1.5 h-4 w-4" />
              </>
            ) : (
              <>
                Manage
                <ChevronDown className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Ultra-thin neon light-strip */}
        <div className="mt-3 h-[2px] w-full rounded-full bg-border/30 overflow-hidden">
          <div
            className={`h-full w-full ${statusColor[status]} ${statusGlow[status]} transition-all duration-500`}
          />
        </div>
      </div>

      {/* Expanded Player List */}
      {isExpanded && (
        <div className="border-t border-border/30 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Players Online
          </div>
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
