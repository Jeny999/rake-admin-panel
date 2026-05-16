"use client"

import { useState } from "react"
import { User, Ban, AlertTriangle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActionModal } from "./action-modal"

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

interface PlayerCardProps {
  player: Player
}

interface ReportCategory {
  key: keyof Player["riskAnalysis"]
  label: string
}

const reportCategories: ReportCategory[] = [
  { key: "cheating", label: "Cheating" },
  { key: "bugAbusing", label: "Bug Abusing" },
  { key: "bullying", label: "Bullying / Harassment" },
  { key: "toxicity", label: "Toxicity / Verbal Abuse" },
  { key: "inappropriate", label: "Inappropriate Content" },
  { key: "other", label: "Other" },
]

type ActionType = "warn" | "kick" | "ban"

export function PlayerCard({ player }: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<ActionType>("warn")

  const totalBans =
    player.banHistory["1h"] + player.banHistory["6h"] + player.banHistory["1d"]
  
  const maxRisk = Math.max(
    player.riskAnalysis.cheating,
    player.riskAnalysis.bugAbusing,
    player.riskAnalysis.bullying,
    player.riskAnalysis.toxicity,
    player.riskAnalysis.inappropriate,
    player.riskAnalysis.other
  )
  const highRisk = maxRisk > 50

  const getBarColor = (value: number) => {
    if (value >= 70) return "bg-neon-red"
    if (value >= 40) return "bg-neon-amber"
    return "bg-neon-green"
  }

  const getTextColor = (value: number) => {
    if (value >= 70) return "text-neon-red"
    if (value >= 40) return "text-neon-amber"
    return "text-muted-foreground"
  }

  const handleActionClick = (action: ActionType) => {
    setCurrentAction(action)
    setModalOpen(true)
  }

  const handleConfirm = (reason: string, duration?: string) => {
    // Handle the action confirmation
    console.log(`Action: ${currentAction}, Reason: ${reason}, Duration: ${duration || "N/A"}, Player: ${player.username}`)
    setModalOpen(false)
  }

  return (
    <>
      <div
        className={`rounded-lg border transition-all duration-300 ${
          isExpanded
            ? "border-border/50 bg-secondary/30"
            : "border-transparent bg-secondary/20 hover:bg-secondary/40"
        }`}
      >
        {/* Player Header - Clickable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar Placeholder */}
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 border border-border/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                {highRisk && (
                  <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-neon-red" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {player.username}
                  </span>
                  {totalBans > 0 && (
                    <span className="font-mono text-xs text-neon-red">
                      [{totalBans}]
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {player.joinTime}
                </div>
              </div>
            </div>

            {/* Risk Indicator */}
            <div
              className={`h-2 w-2 rounded-full ${
                highRisk ? "bg-neon-red" : "bg-neon-green"
              }`}
            />
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border/30 px-3 pb-3">
            {/* Ban History */}
            <div className="mt-3 mb-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Ban History
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">1h:</span>
                  <span className={`font-mono ${player.banHistory["1h"] > 0 ? "text-neon-red" : "text-foreground"}`}>
                    {player.banHistory["1h"]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">6h:</span>
                  <span className={`font-mono ${player.banHistory["6h"] > 0 ? "text-neon-red" : "text-foreground"}`}>
                    {player.banHistory["6h"]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">1d:</span>
                  <span className={`font-mono ${player.banHistory["1d"] > 0 ? "text-neon-red" : "text-foreground"}`}>
                    {player.banHistory["1d"]}
                  </span>
                </div>
              </div>
            </div>

            {/* Report Breakdown */}
            <div className="mb-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Report Breakdown
              </div>
              <div className="space-y-2.5">
                {reportCategories.map((category) => {
                  const value = player.riskAnalysis[category.key]
                  return (
                    <div key={category.key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{category.label}</span>
                        <span className={`font-mono ${getTextColor(value)}`}>
                          {value}%
                        </span>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActionClick("warn")}
                className="flex-1 text-neon-amber hover:bg-neon-amber/10 hover:text-neon-amber"
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                WARN
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActionClick("kick")}
                className="flex-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                KICK
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActionClick("ban")}
                className="flex-1 text-neon-red hover:bg-neon-red/10 hover:text-neon-red"
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                BAN
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
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
