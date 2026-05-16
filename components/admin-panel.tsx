"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminHeader } from "./admin-header"
import { ServerCard } from "./server-card"
import { BansTab } from "./bans-tab"
import { Shield, Server, Ban, RefreshCw } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "https://rbx-report-bridge.onrender.com"

export type RiskAnalysis = {
  cheating: number
  bugAbusing: number
  bullying: number
  toxicity: number
  inappropriate: number
  other: number
}

export type Player = {
  id: string
  username: string
  joinTime: string
  banHistory: { "1h": number; "6h": number; "1d": number }
  riskAnalysis: RiskAnalysis
  reportCount: number
}

export type ServerData = {
  serverId: string
  players: string[]
  playerCount: number
  updatedAt: number
}

export type BanData = {
  nick: string
  reason: string
  duration_sec: number
  banned_at: number
  banned_by: string
}

export type ReportData = {
  nick: string
  total: number
  reasons: Record<string, number>
  reporters: Record<string, number>
}

// Конвертирует данные репортов в RiskAnalysis для PlayerCard
function toRiskAnalysis(reasons: Record<string, number>, total: number): RiskAnalysis {
  const pct = (key: string) => {
    const found = Object.entries(reasons).find(([k]) =>
      k.toLowerCase().includes(key)
    )
    return found ? Math.round((found[1] / total) * 100) : 0
  }
  return {
    cheating:      pct("чит") || pct("speed") || pct("fly") || pct("телепорт"),
    bugAbusing:    pct("баг"),
    bullying:      pct("буллинг"),
    toxicity:      pct("токсич"),
    inappropriate: pct("неприличн") || pct("спам"),
    other:         pct("другое") || pct("нарушение"),
  }
}

function toPlayer(nick: string, reports: ReportData | undefined, bans: BanData[]): Player {
  const total = reports?.total ?? 0
  const reasons = reports?.reasons ?? {}
  const playerBans = bans.filter(b => b.nick.toLowerCase() === nick.toLowerCase())
  const bans1h = playerBans.filter(b => b.duration_sec === 3600).length
  const bans6h = playerBans.filter(b => b.duration_sec === 21600).length
  const bans1d = playerBans.filter(b => b.duration_sec === 86400).length

  return {
    id: nick,
    username: nick,
    joinTime: `${total} репортов`,
    banHistory: { "1h": bans1h, "6h": bans6h, "1d": bans1d },
    riskAnalysis: toRiskAnalysis(reasons, Math.max(total, 1)),
    reportCount: total,
  }
}

function serverStatus(players: string[], reports: ReportData[]): "clear" | "moderate" | "critical" {
  const reportMap = Object.fromEntries(reports.map(r => [r.nick.toLowerCase(), r.total]))
  let maxReports = 0
  let reported = 0
  for (const p of players) {
    const r = reportMap[p.toLowerCase()] ?? 0
    if (r > 0) reported++
    if (r > maxReports) maxReports = r
  }
  if (maxReports >= 5 || reported >= 3) return "critical"
  if (maxReports >= 2 || reported >= 1) return "moderate"
  return "clear"
}

type Tab = "servers" | "bans"

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("servers")
  const [servers, setServers] = useState<ServerData[]>([])
  const [reports, setReports] = useState<ReportData[]>([])
  const [bans, setBans] = useState<BanData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchAll = useCallback(async () => {
    try {
      const [s, r, b] = await Promise.all([
        fetch(`${API}/get_servers`).then(r => r.json()),
        fetch(`${API}/get_reports`).then(r => r.json()),
        fetch(`${API}/get_bans`).then(r => r.json()),
      ])
      setServers(s)
      setReports(r)
      setBans(b)
      setLastUpdate(new Date())
    } catch (e) {
      console.error("Fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const reportMap = Object.fromEntries(reports.map(r => [r.nick.toLowerCase(), r]))
  const totalPlayers = servers.reduce((s, srv) => s + srv.playerCount, 0)
  const activeThreats = servers.filter(s =>
    serverStatus(s.players, reports) === "critical"
  ).length

  // Отправка команды на сервер
  const sendAction = async (action: string, nick: string, extra?: string[]) => {
    const args = [nick, ...(extra || [])]
    await fetch(`${API}/roblox_cmd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: action, args }),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        totalServers={servers.length}
        totalPlayers={totalPlayers}
        activeThreats={activeThreats}
      />

      {/* Tabs */}
      <div className="flex border-b border-border/30 px-4">
        <button
          onClick={() => setTab("servers")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "servers"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="h-4 w-4" />
          Серверы
        </button>
        <button
          onClick={() => setTab("bans")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "bans"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ban className="h-4 w-4" />
          Баны
          {bans.length > 0 && (
            <span className="font-mono text-xs text-neon-red">[{bans.length}]</span>
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchAll}
          className="ml-auto flex items-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {lastUpdate.toLocaleTimeString("ru")}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <div className="text-center">
              <Shield className="h-10 w-10 mx-auto mb-3 animate-pulse" />
              <div className="text-sm">Загрузка...</div>
            </div>
          </div>
        ) : tab === "servers" ? (
          servers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              Нет активных серверов
            </div>
          ) : (
            servers.map(srv => {
              const players = srv.players.map(nick =>
                toPlayer(nick, reportMap[nick.toLowerCase()], bans)
              )
              return (
                <ServerCard
                  key={srv.serverId}
                  serverId={srv.serverId.slice(0, 12) + "..."}
                  playerCount={srv.playerCount}
                  maxPlayers={12}
                  players={players}
                  status={serverStatus(srv.players, reports)}
                  onAction={sendAction}
                />
              )
            })
          )
        ) : (
          <BansTab bans={bans} onUnban={async (nick) => {
            await sendAction("unban", nick)
            fetchAll()
          }} />
        )}
      </div>
    </div>
  )
}
