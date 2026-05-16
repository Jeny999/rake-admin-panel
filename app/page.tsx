"use client"

import { useState } from "react"
import { AccessKeyScreen } from "@/components/access-key-screen"
import { AdminPanel } from "@/components/admin-panel"

const ACCESS_KEY = process.env.NEXT_PUBLIC_ACCESS_KEY || "rake-admin-2025"

export default function Page() {
  const [authed, setAuthed] = useState(false)

  const handleSubmit = (key: string): boolean => {
    if (key === ACCESS_KEY) {
      setAuthed(true)
      return true
    }
    return false
  }

  if (!authed) return <AccessKeyScreen onSubmit={handleSubmit} />
  return <AdminPanel />
}
