import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { ResultsScreen } from "@/components/hunch/flow/results"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Results · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ResultsPage({ searchParams }: Props) {
  const { demo } = await searchParams
  const mode = getMode()
  return (
    <AppShell step="results" serverMode={mode}>
      <ResultsScreen demo={demo === "1"} serverMode={mode} />
    </AppShell>
  )
}
