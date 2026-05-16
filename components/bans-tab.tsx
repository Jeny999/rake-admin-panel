"use client"

import { Ban, Clock, User, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BanData } from "./admin-panel"

interface BansTabProps {
  bans: BanData[]
  onUnban: (nick: string) => void
}

function formatDuration(sec: number): string {
  if (sec === 0) return "Навсегда"
  if (sec < 3600) return `${Math.round(sec / 60)} мин`
  if (sec < 86400) return `${Math.round(sec / 3600)} ч`
  return `${Math.round(sec / 86400)} д`
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("ru", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  })
}

export function BansTab({ bans, onUnban }: BansTabProps) {
  if (bans.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Ban className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <div className="text-sm">Список банов пуст</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Активные баны — {bans.length}
      </div>
      {bans.map((ban, i) => {
        const isPerm = ban.duration_sec === 0
        return (
          <div
            key={i}
            className="rounded-lg border border-border/50 bg-card p-3 flex items-center gap-3"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-red/10 border border-neon-red/20 flex-shrink-0">
              <User className="h-4 w-4 text-neon-red" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  @{ban.nick}
                </span>
                <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                  isPerm
                    ? "bg-neon-red/10 text-neon-red border border-neon-red/20"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {formatDuration(ban.duration_sec)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{ban.reason || "—"}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(ban.banned_at)}
                </span>
              </div>
            </div>

            {/* Unban */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnban(ban.nick)}
              className="text-neon-green hover:bg-neon-green/10 hover:text-neon-green flex-shrink-0"
            >
              <Unlock className="h-3.5 w-3.5 mr-1" />
              Разбан
            </Button>
          </div>
        )
      })}
    </div>
  )
}
