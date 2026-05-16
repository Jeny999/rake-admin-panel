"use client"

import { useState } from "react"
import { User, Ban, AlertTriangle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActionModal } from "./action-modal"
import type { Player } from "./admin-panel"

const API = process.env.NEXT_PUBLIC_API_URL || "https://rbx-report-bridge.onrender.com"

const durationMap: Record<string, string> = {
  "1h": "3600",
  "6h": "21600",
  "1d": "86400",
  "7d": "604800",
  "permanent": "0",
}

type ActionType = "warn" | "kick" | "ban"

interface PlayerCardProps {
  player: Player
  onAction?: (action: string, nick: string, extra?: string[]) => Promise<void>
}

interface ReportCategory {
  key: keyof Player["riskAnalysis"]
  label: string
}

const reportCategories: ReportCategory[] = [
  { key: "cheating",      label: "Читы / SpeedHack / Fly" },
  { key: "bugAbusing",    label: "Баг Абьюз" },
  { key: "bullying",      label: "Буллинг / Харасмент" },
  { key: "toxicity",      label: "Токсичность" },
  { key: "inappropriate", label: "Неприличный контент" },
  { key: "other",         label: "Другое" },
]

export function PlayerCard({ player, onAction }: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<ActionType>("warn")
  const [sending, setSending] = useState(false)

  const totalBans = player.banHistory["1h"] + player.banHistory["6h"] + player.banHistory["1d"]
  const maxRisk = Math.max(...Object.values(player.riskAnalysis))
  const highRisk = maxRisk > 50

  const getBarColor = (v: number) => v >= 70 ? "bg-neon-red" : v >= 40 ? "bg-neon-amber" : "bg-neon-green"
  const getTextColor = (v: number) => v >= 70 ? "text-neon-red" : v >= 40 ? "text-neon-amber" : "text-muted-foreground"

  const handleActionClick = (action: ActionType) => {
    setCurrentAction(action)
    setModalOpen(true)
  }

  const handleConfirm = async (reason: string, duration?: string) => {
    setSending(true)
    try {
      if (currentAction === "warn") {
        await fetch(`${API}/roblox_cmd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "warn", args: [player.username, reason] }),
        })
      } else if (currentAction === "kick") {
        await fetch(`${API}/roblox_cmd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "kick", args: [player.username, reason] }),
        })
      } else if (currentAction === "ban") {
        const secs = durationMap[duration || "1h"] || "3600"
        await fetch(`${API}/roblox_cmd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "ban", args: [player.username, secs, reason] }),
        })
      }
    } catch (e) {
      console.error("Action error:", e)
    } finally {
      setSending(false)
      setModalOpen(false)
    }
  }

  return (
    <>
      <div className={`rounded-lg border transition-all duration-300 ${
        isExpanded
          ? "border-border/50 bg-secondary/30"
          : "border-transparent bg-secondary/20 hover:bg-secondary/40"
      }`}>
        {/* Header */}
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 border border-border/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                {highRisk && (
                  <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-neon-red animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{player.username}</span>
                  {totalBans > 0 && (
                    <span className="font-mono text-xs text-neon-red">[{totalBans} банов]</span>
                  )}
                  {player.reportCount > 0 && (
                    <span className="font-mono text-xs text-neon-amber">×{player.reportCount} репортов</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{player.joinTime}</div>
              </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${highRisk ? "bg-neon-red" : "bg-neon-green"}`} />
          </div>
        </button>

        {/* Expanded */}
        {isExpanded && (
          <div className="border-t border-border/30 px-3 pb-3">
            {/* Report Breakdown */}
            <div className="mt-3 mb-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Причины репортов
              </div>
              <div className="space-y-2.5">
                {reportCategories.map((cat) => {
                  const value = player.riskAnalysis[cat.key]
                  if (value === 0) return null
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{cat.label}</span>
                        <span className={`font-mono ${getTextColor(value)}`}>{value}%</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-border/30 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getBarColor(value)}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost" size="sm"
                onClick={() => handleActionClick("warn")}
                disabled={sending}
                className="flex-1 text-neon-amber hover:bg-neon-amber/10 hover:text-neon-amber"
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                ВАРН
              </Button>
              <Button
                variant="ghost" size="sm"
                onClick={() => handleActionClick("kick")}
                disabled={sending}
                className="flex-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                КИК
              </Button>
              <Button
                variant="ghost" size="sm"
                onClick={() => handleActionClick("ban")}
                disabled={sending}
                className="flex-1 text-neon-red hover:bg-neon-red/10 hover:text-neon-red"
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                БАН
              </Button>
            </div>
          </div>
        )}
      </div>

      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        actionType={currentAction}
        playerName={player.username}
        riskAnalysis={player.riskAnalysis}
      />
    </>
  )
}
