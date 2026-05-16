"use client"

import { useState } from "react"
import { X, AlertTriangle, LogOut, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"

type ActionType = "warn" | "kick" | "ban"

interface ActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, duration?: string) => void
  actionType: ActionType
  playerName: string
  riskAnalysis: {
    cheating: number
    bugAbusing: number
    bullying: number
    toxicity: number
    inappropriate: number
    other: number
  }
}

const reasons = [
  { key: "cheating", label: "Cheating" },
  { key: "bugAbusing", label: "Bug Abusing" },
  { key: "toxicity", label: "Toxic Behavior" },
  { key: "bullying", label: "Bullying" },
  { key: "inappropriate", label: "Inappropriate Content" },
]

const banDurations = [
  { value: "1h", label: "1 Hour" },
  { value: "6h", label: "6 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "permanent", label: "Permanent" },
]

const actionConfig = {
  warn: {
    icon: AlertTriangle,
    title: "Issue Warning",
    color: "text-neon-amber",
    bgColor: "bg-neon-amber",
    borderColor: "border-neon-amber/30",
  },
  kick: {
    icon: LogOut,
    title: "Kick Player",
    color: "text-foreground",
    bgColor: "bg-foreground",
    borderColor: "border-border",
  },
  ban: {
    icon: Ban,
    title: "Ban Player",
    color: "text-neon-red",
    bgColor: "bg-neon-red",
    borderColor: "border-neon-red/30",
  },
}

export function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  playerName,
  riskAnalysis,
}: ActionModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<string>("1h")

  if (!isOpen) return null

  const config = actionConfig[actionType]
  const Icon = config.icon

  const getReasonPercentage = (key: string): number => {
    const keyMap: Record<string, keyof typeof riskAnalysis> = {
      cheating: "cheating",
      bugAbusing: "bugAbusing",
      toxicity: "toxicity",
      bullying: "bullying",
      inappropriate: "inappropriate",
    }
    return riskAnalysis[keyMap[key]] || 0
  }

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason, actionType === "ban" ? selectedDuration : undefined)
      setSelectedReason(null)
      setSelectedDuration("1h")
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setSelectedDuration("1h")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-[90%] max-w-sm rounded-xl border ${config.borderColor} bg-background/95 backdrop-blur-md shadow-2xl`}
      >
        {/* Neon glow effect */}
        <div
          className={`absolute inset-0 rounded-xl opacity-20 blur-xl ${config.bgColor}`}
          style={{ transform: "scale(0.95)" }}
        />

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}/10`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${config.color}`}>
                  {config.title}
                </h3>
                <p className="text-xs text-muted-foreground">{playerName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Reason Selection */}
          <div className="p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Select Reason
            </div>
            <div className="space-y-2">
              {reasons.map((reason) => {
                const percentage = getReasonPercentage(reason.key)
                const isSelected = selectedReason === reason.key
                return (
                  <button
                    key={reason.key}
                    onClick={() => setSelectedReason(reason.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isSelected
                        ? `${config.borderColor} ${config.bgColor}/10`
                        : "border-border/30 hover:border-border/50 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full border-2 transition-all ${
                          isSelected
                            ? `${config.borderColor} ${config.bgColor}`
                            : "border-border/50"
                        }`}
                      >
                        {isSelected && (
                          <div className={`h-full w-full rounded-full ${config.bgColor} scale-50`} />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isSelected ? config.color : "text-foreground"
                        }`}
                      >
                        {reason.label}
                      </span>
                    </div>
                    {percentage > 0 && (
                      <span
                        className={`font-mono text-xs ${
                          percentage >= 70
                            ? "text-neon-red"
                            : percentage >= 40
                            ? "text-neon-amber"
                            : "text-muted-foreground"
                        }`}
                      >
                        {percentage}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ban Duration (only for ban action) */}
          {actionType === "ban" && (
            <div className="px-4 pb-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Ban Duration
              </div>
              <div className="grid grid-cols-4 gap-2">
                {banDurations.map((duration) => {
                  const isSelected = selectedDuration === duration.value
                  return (
                    <button
                      key={duration.value}
                      onClick={() => setSelectedDuration(duration.value)}
                      className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-neon-red/50 bg-neon-red/10 text-neon-red"
                          : "border-border/30 text-muted-foreground hover:border-border/50 hover:text-foreground"
                      }`}
                    >
                      {duration.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 border-t border-border/30 p-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1 border border-border/30 hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedReason}
              className={`flex-1 ${config.bgColor} text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
