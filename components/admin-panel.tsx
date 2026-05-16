"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Server,
  Users,
  AlertTriangle,
  Ban,
  LogOut,
  Search,
  Shield,
  Activity,
  Clock,
  FileWarning,
  Skull,
  Bug,
  MessageSquareWarning,
  HelpCircle,
  UserX,
  Gauge,
  Zap,
  Eye,
  ArrowLeft,
  TrendingUp,
  Flag,
  RefreshCw,
  Loader2,
} from "lucide-react"

// URL вашого Python сервера на Render
const API_BASE_URL = "https://my-roblox-admin-xtql.onrender.com"

// Константи для визначення швидкості
const NORMAL_SPEED = 16
const SUSPICIOUS_SPEED = 25
const CHEAT_SPEED = 40

type ActionType = "ban" | "kick" | "warn" | null
type ReasonType = "speedhack" | "flyhack" | "teleport" | "noclip" | "aimbot" | "bugabuse" | "toxicity" | "other" | ""

interface Player {
  id: string
  username: string
  displayName: string
  totalReports: number
  reportsThisWeek: number
  reportedBy: string[]
  reasons: Record<string, number>
  bans: number
  warnings: number
  avgSpeed: number
  maxSpeed: number
}

interface ServerData {
  serverId: string
  players: {
    id: string
    name: string
    displayName: string
    avgSpeed?: number
    maxSpeed?: number
  }[]
}

interface ReportDB {
  [key: string]: {
    total: number
    reporters: Record<string, number>
    reasons: Record<string, number>
  }
}

interface AdminPanelProps {
  onLogout: () => void
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [servers, setServers] = useState<ServerData[]>([])
  const [reportsDB, setReportsDB] = useState<ReportDB>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [actionType, setActionType] = useState<ActionType>(null)
  const [reason, setReason] = useState<ReasonType>("")
  const [customReason, setCustomReason] = useState("")
  const [banDuration, setBanDuration] = useState("3600")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPlayerDetailOpen, setIsPlayerDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLog, setActionLog] = useState<{ action: string; target: string; reason: string; duration?: string; time: string }[]>([])

  // Telegram WebApp integration
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
    }
  }, [])

  // Завантажити дані з API
  const fetchData = useCallback(async () => {
    try {
      const [serversRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/get_servers`),
        fetch(`${API_BASE_URL}/get_reports`)
      ])
      
      if (serversRes.ok) {
        const serversData = await serversRes.json()
        setServers(serversData)
      }
      
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReportsDB(reportsData)
      }
    } catch (error) {
      console.log("[v0] Error fetching data:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Оновлювати кожні 10 секунд
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const getSpeedStatus = (avgSpeed: number) => {
    if (avgSpeed >= CHEAT_SPEED) return { label: "CHEAT", color: "bg-red-500 text-white", textColor: "text-red-500" }
    if (avgSpeed >= SUSPICIOUS_SPEED) return { label: "SUSPICIOUS", color: "bg-yellow-500 text-black", textColor: "text-yellow-500" }
    return { label: "NORMAL", color: "bg-green-500/20 text-green-500", textColor: "text-green-500" }
  }

  const getReportRating = (totalReports: number) => {
    if (totalReports >= 50) return { label: "CRITICAL", color: "bg-red-600 text-white", stars: 5 }
    if (totalReports >= 30) return { label: "HIGH", color: "bg-red-500 text-white", stars: 4 }
    if (totalReports >= 15) return { label: "MEDIUM", color: "bg-orange-500 text-white", stars: 3 }
    if (totalReports >= 5) return { label: "LOW", color: "bg-yellow-500 text-black", stars: 2 }
    if (totalReports >= 1) return { label: "MINIMAL", color: "bg-blue-500/20 text-blue-500", stars: 1 }
    return { label: "CLEAN", color: "bg-green-500/20 text-green-500", stars: 0 }
  }

  // Перетворити дані сервера в гравців з репортами
  const getPlayersForServer = (serverId: string): Player[] => {
    const server = servers.find(s => s.serverId === serverId)
    if (!server) return []

    return server.players.map(p => {
      const reportInfo = reportsDB[p.name] || { total: 0, reporters: {}, reasons: {} }
      return {
        id: p.id,
        username: p.name,
        displayName: p.displayName || p.name,
        totalReports: reportInfo.total,
        reportsThisWeek: 0, // Можна додати пізніше
        reportedBy: Object.keys(reportInfo.reporters),
        reasons: reportInfo.reasons,
        bans: 0,
        warnings: 0,
        avgSpeed: p.avgSpeed || 15,
        maxSpeed: p.maxSpeed || 18,
      }
    }).sort((a, b) => b.totalReports - a.totalReports)
  }

  const serverPlayers = selectedServer ? getPlayersForServer(selectedServer) : []

  const filteredServerPlayers = serverPlayers.filter(
    (player) =>
      player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAction = (player: Player, action: ActionType) => {
    setSelectedPlayer(player)
    setActionType(action)
    setReason("")
    setCustomReason("")
    setBanDuration("3600")
    setIsDialogOpen(true)
  }

  const openPlayerDetail = (player: Player) => {
    setSelectedPlayer(player)
    setIsPlayerDetailOpen(true)
  }

  const getDurationText = (duration: string) => {
    switch (duration) {
      case "3600": return "1 hour"
      case "21600": return "6 hours"
      case "43200": return "12 hours"
      case "86400": return "1 day"
      case "604800": return "7 days"
      case "2592000": return "30 days"
      case "0": return "Permanent"
      default: return duration
    }
  }

  const executeAction = async () => {
    if (!selectedPlayer || !actionType || !reason) return

    const finalReason = reason === "other" ? customReason : reason
    const actionText = actionType === "ban" ? "BAN" : actionType === "kick" ? "KICK" : "WARN"
    
    try {
      if (actionType === "ban") {
        await fetch(`${API_BASE_URL}/ban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: selectedPlayer.username,
            duration: banDuration,
            reason: finalReason,
            adminId: "5108846687" // Ваш CHAT_ID
          })
        })
      } else if (actionType === "kick") {
        await fetch(`${API_BASE_URL}/kick`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: selectedPlayer.username,
            reason: finalReason,
            adminId: "5108846687"
          })
        })
      } else if (actionType === "warn") {
        await fetch(`${API_BASE_URL}/warn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: selectedPlayer.username,
            reason: finalReason,
            adminId: "5108846687"
          })
        })
      }
    } catch (error) {
      console.log("[v0] Error executing action:", error)
    }
    
    const logEntry = {
      action: actionText,
      target: selectedPlayer.username,
      reason: finalReason,
      duration: actionType === "ban" ? getDurationText(banDuration) : undefined,
      time: new Date().toLocaleTimeString(),
    }
    
    setActionLog((prev) => [logEntry, ...prev])
    setIsDialogOpen(false)
    setSelectedPlayer(null)
    setActionType(null)
    setReason("")
    setCustomReason("")
    
    // Оновити дані
    fetchData()
  }

  const getReasonIcon = (reasonType: string) => {
    switch (reasonType) {
      case "speedhack": return <Zap className="w-4 h-4" />
      case "flyhack": return <Activity className="w-4 h-4" />
      case "teleport": return <Zap className="w-4 h-4" />
      case "noclip": return <Eye className="w-4 h-4" />
      case "aimbot": return <Skull className="w-4 h-4" />
      case "toxicity": return <MessageSquareWarning className="w-4 h-4" />
      case "bugabuse": return <Bug className="w-4 h-4" />
      default: return <HelpCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (playerCount: number, maxPlayers: number = 30) => {
    if (playerCount === 0) return "bg-gray-500"
    if (playerCount >= maxPlayers) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Статистика
  const totalOnline = servers.reduce((acc, s) => acc + s.players.length, 0)
  const allPlayers = servers.flatMap(s => getPlayersForServer(s.serverId))
  const cheaterCount = allPlayers.filter(p => p.avgSpeed >= CHEAT_SPEED).length
  const highReportPlayers = allPlayers.filter(p => p.totalReports >= 30).length

  const reasons = [
    { value: "speedhack", label: "Speed Hack" },
    { value: "flyhack", label: "Fly Hack" },
    { value: "teleport", label: "Teleport Hack" },
    { value: "noclip", label: "NoClip / Wall Hack" },
    { value: "aimbot", label: "Aimbot" },
    { value: "bugabuse", label: "Bug Abuse" },
    { value: "toxicity", label: "Toxicity" },
    { value: "other", label: "Other" },
  ]

  const selectedServerData = servers.find(s => s.serverId === selectedServer)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading servers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedServer !== null && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSelectedServer(null); setSearchQuery(""); }}
                  className="mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Anti-Cheat Panel</h1>
                <p className="text-xs text-muted-foreground">
                  {selectedServer !== null ? `Server ${selectedServer}` : "Select a server"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Badge variant="outline" className="border-red-500 text-red-500 hidden sm:flex">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {cheaterCount} cheaters
              </Badge>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{totalOnline}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{cheaterCount}</p>
                  <p className="text-xs text-muted-foreground">Cheaters</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{highReportPlayers}</p>
                  <p className="text-xs text-muted-foreground">High Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server List or Player List */}
        {selectedServer === null ? (
          // Server List
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Select Server ({servers.length} active)
            </h2>
            
            {servers.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active servers</p>
                  <p className="text-xs text-muted-foreground mt-1">Servers will appear when players join your game</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {servers.map((server) => {
                  const serverPlayersList = getPlayersForServer(server.serverId)
                  const serverCheaters = serverPlayersList.filter(p => p.avgSpeed >= CHEAT_SPEED).length
                  const serverHighReports = serverPlayersList.filter(p => p.totalReports >= 30).length
                  
                  return (
                    <Card 
                      key={server.serverId} 
                      className="bg-card border-border cursor-pointer transition-all hover:border-primary/50"
                      onClick={() => setSelectedServer(server.serverId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                                <Server className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(server.players.length)}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Server #{server.serverId.slice(-4)}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {server.players.length} players
                                </span>
                                {serverCheaters > 0 && (
                                  <span className="flex items-center gap-1 text-red-500">
                                    <Zap className="w-3 h-3" />
                                    {serverCheaters}
                                  </span>
                                )}
                                {serverHighReports > 0 && (
                                  <span className="flex items-center gap-1 text-orange-500">
                                    <Flag className="w-3 h-3" />
                                    {serverHighReports}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-500/20 text-green-500">
                              ONLINE
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Action Log Preview */}
            {actionLog.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Actions</h2>
                <div className="space-y-2">
                  {actionLog.slice(0, 5).map((log, index) => (
                    <Card key={index} className="bg-card border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={log.action === "BAN" ? "bg-red-500" : log.action === "KICK" ? "bg-orange-500" : "bg-yellow-500"}>
                              {log.action}
                            </Badge>
                            <span className="text-sm text-foreground">{log.target}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{log.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.reason} {log.duration && `• ${log.duration}`}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Player List for Selected Server
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filteredServerPlayers.length} players</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Sorted by reports
              </span>
            </div>

            {filteredServerPlayers.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No players on this server</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredServerPlayers.map((player) => {
                  const speedStatus = getSpeedStatus(player.avgSpeed)
                  const reportRating = getReportRating(player.totalReports)
                  
                  return (
                    <Card 
                      key={player.id} 
                      className="bg-card border-border cursor-pointer transition-all hover:border-primary/50"
                      onClick={() => openPlayerDetail(player)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                              <span className="text-sm font-bold text-foreground">
                                {player.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-sm">@{player.username}</span>
                                {player.totalReports > 0 && (
                                  <Badge className={reportRating.color} variant="secondary">
                                    {reportRating.label}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Flag className="w-3 h-3" />
                                  {player.totalReports} reports
                                </span>
                                <span className={`flex items-center gap-1 ${speedStatus.textColor}`}>
                                  <Gauge className="w-3 h-3" />
                                  {player.avgSpeed.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={(e) => { e.stopPropagation(); handleAction(player, "ban"); }}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                              onClick={(e) => { e.stopPropagation(); handleAction(player, "kick"); }}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                              onClick={(e) => { e.stopPropagation(); handleAction(player, "warn"); }}
                            >
                              <FileWarning className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Player Detail Dialog */}
      <Dialog open={isPlayerDetailOpen} onOpenChange={setIsPlayerDetailOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {selectedPlayer.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p>@{selectedPlayer.username}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedPlayer.displayName}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Report Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold text-foreground">{selectedPlayer.totalReports}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <Badge className={getReportRating(selectedPlayer.totalReports).color}>
                      {getReportRating(selectedPlayer.totalReports).label}
                    </Badge>
                  </div>
                </div>

                {/* Speed Stats */}
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Speed Analysis</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className={`text-lg font-bold ${getSpeedStatus(selectedPlayer.avgSpeed).textColor}`}>
                        {selectedPlayer.avgSpeed.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maximum</p>
                      <p className={`text-lg font-bold ${getSpeedStatus(selectedPlayer.maxSpeed).textColor}`}>
                        {selectedPlayer.maxSpeed.toFixed(1)}
                      </p>
                    </div>
                    <Badge className={getSpeedStatus(selectedPlayer.avgSpeed).color}>
                      {getSpeedStatus(selectedPlayer.avgSpeed).label}
                    </Badge>
                  </div>
                </div>

                {/* Report Reasons */}
                {Object.keys(selectedPlayer.reasons).length > 0 && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Report Reasons</p>
                    <div className="space-y-1">
                      {Object.entries(selectedPlayer.reasons)
                        .sort(([,a], [,b]) => b - a)
                        .map(([reasonName, count]) => {
                          const percentage = Math.round((count / selectedPlayer.totalReports) * 100)
                          return (
                            <div key={reasonName} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{reasonName}</span>
                              <span className="text-foreground">{percentage}% ({count})</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Reporters */}
                {selectedPlayer.reportedBy.length > 0 && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Reported By ({selectedPlayer.reportedBy.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlayer.reportedBy.slice(0, 10).map((reporter, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {reporter}
                        </Badge>
                      ))}
                      {selectedPlayer.reportedBy.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedPlayer.reportedBy.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    onClick={() => { setIsPlayerDetailOpen(false); handleAction(selectedPlayer, "ban"); }}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban
                  </Button>
                  <Button 
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={() => { setIsPlayerDetailOpen(false); handleAction(selectedPlayer, "kick"); }}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Kick
                  </Button>
                  <Button 
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => { setIsPlayerDetailOpen(false); handleAction(selectedPlayer, "warn"); }}
                  >
                    <FileWarning className="w-4 h-4 mr-2" />
                    Warn
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {actionType === "ban" && <Ban className="w-5 h-5 text-red-500" />}
              {actionType === "kick" && <UserX className="w-5 h-5 text-orange-500" />}
              {actionType === "warn" && <FileWarning className="w-5 h-5 text-yellow-500" />}
              {actionType === "ban" ? "Ban Player" : actionType === "kick" ? "Kick Player" : "Warn Player"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-lg font-semibold text-foreground">@{selectedPlayer.username}</p>
              </div>

              {actionType === "ban" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Duration</label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="21600">6 hours</SelectItem>
                      <SelectItem value="43200">12 hours</SelectItem>
                      <SelectItem value="86400">1 day</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                      <SelectItem value="2592000">30 days</SelectItem>
                      <SelectItem value="0">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Reason</label>
                <Select value={reason} onValueChange={(v) => setReason(v as ReasonType)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {reasons.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="flex items-center gap-2">
                          {getReasonIcon(r.value)}
                          {r.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reason === "other" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Custom Reason</label>
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="bg-secondary border-border"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={
                actionType === "ban" ? "bg-red-500 hover:bg-red-600" :
                actionType === "kick" ? "bg-orange-500 hover:bg-orange-600" :
                "bg-yellow-500 hover:bg-yellow-600 text-black"
              }
              onClick={executeAction}
              disabled={!reason || (reason === "other" && !customReason)}
            >
              {actionType === "ban" ? "Ban" : actionType === "kick" ? "Kick" : "Warn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
