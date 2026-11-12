import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { StartScreen } from "@/components/hunch/flow/start/start-screen"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Start · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function StartPage({ searchParams }: Props) {
  const { demo, d } = await searchParams
  const mode = getMode()
  return (
    <AppShell step="start" serverMode={mode}>
      <StartScreen demo={demo === "1"} prefill={typeof d === "string" ? d : undefined} serverMode={mode} />
    </AppShell>
  )
}
