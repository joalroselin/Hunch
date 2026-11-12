import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { NextWeekScreen } from "@/components/hunch/flow/week"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Next week · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NextWeekPage({ searchParams }: Props) {
  const { demo } = await searchParams
  return (
    <AppShell step="next-week" serverMode={getMode()}>
      <NextWeekScreen demo={demo === "1"} />
    </AppShell>
  )
}
